import winston from 'winston';

// Logger central de la aplicación. Usa un nivel configurable y
// serializa los eventos en JSON para facilitar su análisis.
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    // Agrega la fecha a cada registro y conserva el stack en errores.
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  // Etiqueta común para identificar de qué servicio proviene cada log.
  defaultMeta: { service: 'acquisitions-api' },
  transports: [
    // Guarda únicamente errores en un archivo separado para revisión rápida.
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Guarda todos los eventos permitidos por el nivel configurado.
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  // En desarrollo también imprime en consola con colores para lectura humana.
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
