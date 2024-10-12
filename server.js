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
    console.log('Received URL:', url);

    if (!url) {
        console.error('URL parameter is missing');
        return res.status(400).json({ error: 'Відсутній параметр URL' });
    }

    try {
        new URL(url);
    } catch (err) {
        console.error('Invalid URL:', url);
        return res.status(400).json({ error: 'Некоректний URL' });
    }

    try {
        const response = await axios.get(url, {
            timeout: 5000,
            maxRedirects: 0,
            validateStatus: function (status) {
                return true;
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        console.log(`Response status for ${url}:`, response.status);

        if (response.status < 200 || response.status >= 300) {
            return res.json({ status: response.status });
        }

        const bodyContent = typeof response.data === 'string' ? response.data.toLowerCase() : JSON.stringify(response.data).toLowerCase();
        if (bodyContent.includes('403 forbidden') || bodyContent.includes('access denied')) {
            return res.json({ status: 403 });
        }

        return res.json({ status: response.status });
    } catch (error) {
        console.error('Error fetching URL:', error.message);

        let status;
        if (error.response) {
            status = error.response.status;
        } else if (error.request) {
            status = 'No Response';
        } else {
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
