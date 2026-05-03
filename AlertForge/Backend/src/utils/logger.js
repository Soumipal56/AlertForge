import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;

const consoleLogFormat = printf(({ level, message, timestamp, stack, requestId }) => {
    return `${timestamp} ${level}: ${stack || message} ${requestId ? `(RequestID: ${requestId})` : ''}`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    defaultMeta: { service: 'alertforge-backend' },
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                consoleLogFormat
            )
        }),
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});

export default logger;
