import winston from 'winston';

const transports: Array<winston.transports.FileTransportInstance | winston.transports.ConsoleTransportInstance> = [
  new winston.transports.File({ filename: 'combined.log', dirname: 'logs' }),
  new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    dirname: 'logs',
  }),
];

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  transports.push(new winston.transports.Console());
}

const Logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  transports,
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({ format: 'HH:mm:ss DD-MM-YYYY' }),
    winston.format.printf(info => `[${info.level.toUpperCase()}]: ${info.message} - ${info.timestamp}`),
  ),
});

export default Logger;
