import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

// Middleware que aplica validaciones de seguridad y rate limiting
// usando reglas dinámicas según el rol del usuario.
const securityMiddleware = async (req, res, next) => {
  try {
    // Si la petición no tiene usuario autenticado, se trata como invitado.
    const role = req.user?.role || 'guest';

    let limit;

    // Define cuántas solicitudes por minuto puede hacer cada tipo de usuario.
    switch (role) {
      case 'admin':
        limit = 20;
        break;
      case 'user':
        limit = 10;
        break;
      case 'guest':
        limit = 5;
        break;
    }

    // Crea una regla de ventana deslizante para evaluar la petición actual.
    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    // Bloquea tráfico automatizado identificado como bot.
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }

    // Bloquea peticiones que violan reglas generales del escudo de seguridad.
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield Blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
    }

    // Bloquea al cliente cuando supera el límite de solicitudes permitido.
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Too many requests' });
    }

    // Si no hubo bloqueos, la petición continúa hacia el siguiente middleware.
    next();
  } catch (e) {
    // Si Arcjet falla, responde con error para no dejar la petición en estado incierto.
    console.error('Arcjet middleware error:', e);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong with security middleware',
    });
  }
};
export default securityMiddleware;
