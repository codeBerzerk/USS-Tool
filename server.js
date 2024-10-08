// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sendSignalMessage = require('./sendSignal'); // Імпортуємо sendSignal.js
const app = express();
const port = 3000;

// Налаштування CORS: дозволяємо всі домени
app.use(cors());
app.use(express.json()); // Для парсингу JSON-тіл POST-запитів

// Маршрут для перевірки доступності сайту
app.get('/api/checksite', async (req, res) => {
    const { url } = req.query;

    // Перевірка наявності параметра url
    if (!url) {
        return res.status(400).json({ error: 'Відсутній параметр URL' });
    }

    // Перевірка валідності URL
    try {
        new URL(url);
    } catch (err) {
        return res.status(400).json({ error: 'Некоректний URL' });
    }

    try {
        const response = await axios.get(url, {
            timeout: 5000, // Таймаут запиту
            maxRedirects: 0, // Забороняємо слідувати за редиректами
            validateStatus: function (status) {
                return true; // Дозволяємо обробляти всі статус-коди
            }
        });

        // Якщо статус-код не в діапазоні 200-299, повертаємо його
        if (response.status < 200 || response.status >= 300) {
            return res.json({ status: response.status });
        }

        // Перевіряємо вміст відповіді на наявність типових повідомлень про помилки
        const bodyContent = typeof response.data === 'string' ? response.data.toLowerCase() : JSON.stringify(response.data).toLowerCase();
        if (bodyContent.includes('403 forbidden') || bodyContent.includes('access denied')) {
            return res.json({ status: 403 });
        }

        // Якщо все гаразд
        return res.json({ status: response.status });
    } catch (error) {
        // Обробка помилок запиту
        let status;
        if (error.response) {
            // Сервер відповів з кодом статусу, який не є 2xx
            status = error.response.status;
        } else if (error.request) {
            // Запит був зроблений, але відповіді не отримано
            status = 'No Response';
        } else {
            // Виникла помилка при налаштуванні запиту
            status = 'Error';
        }

        res.json({ status: status, message: error.message });
    }
});

// Додатковий маршрут для надсилання сповіщень
app.post('/api/sendMessage', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Повідомлення не вказане' });
    }

    sendSignalMessage(message);
    res.json({ success: true });
});

// Запуск серверу
app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});
