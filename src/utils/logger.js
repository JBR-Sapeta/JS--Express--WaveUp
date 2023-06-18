const { createLogger, transports, format } = require('winston');

format.colorize();

const customFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    return `${info.timestamp} [${info.level.toUpperCase().padEnd(7)}] : ${
      info.message
    }`;
  })
);

const destinations = [new transports.Console()];
if (process.env.NODE_ENV === 'production') {
  destinations.push(new transports.File({ filename: 'app.log' }));
}

const logger = createLogger({
  transports: [
    new transports.File({ level: 'info', filename: 'app-info.log' }),
    new transports.File({ level: 'error', filename: 'app-error.log' }),
    new transports.File({ level: 'warn', filename: 'app-warn.log' }),
  ],
  format: customFormat,
  statusLevel: true,
  silent: process.env.NODE_ENV === 'test',
});

module.exports = logger;
