// sendSignal.js

require('dotenv').config();
const { execFile } = require('child_process');
const winston = require('winston');

// Налаштування логування
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'signal.log' })
    ],
});

// Вкажіть абсолютний шлях до signal-cli
const pathToSignalCli = 'E:\\Users\\Lenovo\\Desktop\\signal-cli-0.13.7\\bin\\signal-cli.bat'; // Замініть на ваш шлях

/**
 * Функція для надсилання повідомлення через Signal
 * @param {string} message - Текст повідомлення
 */
function sendSignalMessage(message) {
    const sender = process.env.SIGNAL_PHONE_NUMBER;
    const users = process.env.SIGNAL_RECIPIENT_USERS ? process.env.SIGNAL_RECIPIENT_USERS.split(',').map(num => num.trim()) : [];
    const groups = process.env.SIGNAL_RECIPIENT_GROUPS ? process.env.SIGNAL_RECIPIENT_GROUPS.split(',').map(id => id.trim()) : [];

    // Логування змінних для діагностики
    logger.info(`SIGNAL_PHONE_NUMBER: ${sender}`);
    logger.info(`SIGNAL_RECIPIENT_USERS: ${users}`);
    logger.info(`SIGNAL_RECIPIENT_GROUPS: ${groups}`);

    if (!sender) {
        logger.error('SIGNAL_PHONE_NUMBER не встановлено в .env файлі.');
        return;
    }

    if (users.length === 0 && groups.length === 0) {
        logger.error('SIGNAL_RECIPIENT_USERS та SIGNAL_RECIPIENT_GROUPS не встановлено в .env файлі.');
        return;
    }

    // Екранування спеціальних символів у повідомленні
    const escapedMessage = message.replace(/(["$`\\])/g, '\\$1');

    // Функція для запуску команди
    const runCommand = (args, recipient) => {
        execFile(pathToSignalCli, args, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Помилка при надсиланні повідомлення до ${recipient}: ${error.message}`);
                return;
            }
            if (stderr) {
                logger.error(`Помилка Signal CLI при надсиланні до ${recipient}: ${stderr}`);
                return;
            }
            logger.info(`Повідомлення надіслано до ${recipient}: ${stdout.trim()}`);
        });
    };

// Надсилання повідомлень користувачам
    users.forEach(user => {
        if (user) {
            const args = ['-a', sender, 'send', '-m', escapedMessage, user, '--text-style', '0:5:BOLD'];
            runCommand(args, user);
        }
    });


    // Надсилання повідомлень групам
    groups.forEach(group => {
        if (group) {
            const args = ['-a', sender, 'send', '-m', escapedMessage, '-g', group, '--text-style', '0:5:BOLD'];
            runCommand(args, group);
        }
    });
}

module.exports = sendSignalMessage;
