let entries = [];
let savedResults = JSON.parse(localStorage.getItem('savedResults')) || [];
let inputMode = 'single';

// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Запит на дозвіл сповіщень
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Дозвіл на сповіщення надано.');
            }
        });
    }
});

/* Перемикання між режимами вводу */
function toggleInputMode() {
    const singleInputSection = document.getElementById('single-input');
    const bulkInputSection = document.getElementById('bulk-input');
    const toggleButton = document.querySelector('.toggle-btn');

    if (inputMode === 'single') {
        singleInputSection.style.display = 'none';
        bulkInputSection.style.display = 'flex';
        inputMode = 'bulk';
        toggleButton.textContent = 'Перемкнути на рядковий ввід';
    } else {
        singleInputSection.style.display = 'flex';
        bulkInputSection.style.display = 'none';
        inputMode = 'single';
        toggleButton.textContent = 'Перемкнути на масовий ввід';
    }
}

/* Додавання нових рядків */
function addEntry() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    processEntry(startTime, endTime);
}

function addBulkEntries() {
    const bulkText = document.getElementById('bulk-text').value;
    const lines = bulkText.split('\n');
    lines.forEach(line => {
        const times = line.split('-').map(time => time.trim());
        if (times.length === 2) {
            processEntry(times[0], times[1]);
        }
    });
    document.getElementById('bulk-text').value = ''; // очищення текстового поля
}

function processEntry(startTime, endTime) {
    if (startTime && endTime && validateTimes(startTime, endTime)) {
        entries.push({ startTime, endTime });
        displayEntries();
        document.getElementById('start-time').value = '';
        document.getElementById('end-time').value = '';
    } else {
        alert("Будь ласка, введіть коректні часи початку та закінчення.");
    }
}

function validateTimes(startTime, endTime) {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    return start.length === 2 && end.length === 2;
}

function displayEntries() {
    const list = document.getElementById('entries-list');
    list.innerHTML = '';
    entries.forEach((entry, index) => {
        const duration = calculateDuration(entry.startTime, entry.endTime);
        list.innerHTML += `
        <div class="entry" id="entry-${index}">
            <div>Рядок ${index + 1}: ${entry.startTime} - ${entry.endTime}</div>
            <div>
                <span>Тривалість: ${duration.hours} годин ${duration.minutes} хвилин</span>
            </div>
        </div>`;
    });
}

function calculateDuration(startTime, endTime) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    let startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    let durationMinutes;

    if (startMinutes <= endMinutes) {
        durationMinutes = endMinutes - startMinutes;
    } else {
        durationMinutes = (1440 - startMinutes) + endMinutes;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return { hours, minutes };
}

function calculateTotal() {
    let totalMinutes = 0;
    entries.forEach(entry => {
        const duration = calculateDuration(entry.startTime, entry.endTime);
        totalMinutes += duration.hours * 60 + duration.minutes;
    });
    const totalHours = Math.floor(totalMinutes / 60);
    const totalRemainingMinutes = totalMinutes % 60;
    document.getElementById('total-time').innerText = `Загальний час: ${totalHours} годин ${totalRemainingMinutes} хвилин`;
}

function saveResult() {
    const resultName = prompt("Назвіть цей результат:");
    if (resultName && entries.length > 0) {
        const totalTime = document.getElementById('total-time').innerText;
        const newResult = {
            name: resultName,
            entries: [...entries],
            totalTime: totalTime
        };
        savedResults.push(newResult);
        localStorage.setItem('savedResults', JSON.stringify(savedResults));
        loadSavedResults();
        entries = [];
        document.getElementById('entries-list').innerHTML = '';
        document.getElementById('total-time').innerText = '';
    } else {
        alert("Неможливо зберегти результат. Переконайтеся, що є дані для збереження.");
    }
}

function loadSavedResults() {
    const savedList = document.getElementById('saved-list');
    savedList.innerHTML = '';
    savedResults.forEach((result, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${result.name}</span>
        `;
        li.onclick = () => openModal(index);
        savedList.appendChild(li);
    });
}

function openModal(index) {
    const result = savedResults[index];
    const modalContent = document.getElementById('modal-content-details');
    modalContent.innerHTML = `
        <h3>${result.name}</h3>
        ${result.entries.map((entry, idx) => `
            <div>Рядок ${idx + 1}: ${entry.startTime} - ${entry.endTime}</div>
        `).join('')}
        <div class="total-time">${result.totalTime}</div>
    `;
    document.getElementById('modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function exportToExcel() {
    const worksheetData = savedResults.map(result => ({
        'Назва': result.name,
        'Загальний час': result.totalTime,
        'Деталі': result.entries.map(entry => `${entry.startTime} - ${entry.endTime}`).join('; ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Збережені результати");
    XLSX.writeFile(workbook, "збережені_результати.xlsx");
}

/* Перемикач теми */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const themeIcon = document.getElementById('theme-switcher');
    themeIcon.textContent = document.body.classList.contains('dark-theme') ? '🌙' : '🌞';
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

/* Відслідковування системної теми користувача */
function detectSystemTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-switcher').textContent = '🌙';
        }
    } else {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkScheme) {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-switcher').textContent = '🌙';
        } else {
            document.body.classList.remove('dark-theme');
            document.getElementById('theme-switcher').textContent = '🌞';
        }
    }
}

window.onload = () => {
    loadSavedResults();
    detectSystemTheme();
};

/* Код для перемикання вкладок та ініціалізації пінгувалки */
document.addEventListener('DOMContentLoaded', () => {
    const calculatorTab = document.getElementById('calculatorTab');
    const pingToolTab = document.getElementById('pingToolTab');
    const calculatorSection = document.getElementById('calculatorSection');
    const pingToolSection = document.getElementById('pingToolSection');

    calculatorTab.addEventListener('click', (e) => {
        e.preventDefault();
        calculatorTab.classList.add('active');
        pingToolTab.classList.remove('active');
        calculatorSection.style.display = 'block';
        pingToolSection.style.display = 'none';
    });

    pingToolTab.addEventListener('click', (e) => {
        e.preventDefault();
        calculatorTab.classList.remove('active');
        pingToolTab.classList.add('active');
        calculatorSection.style.display = 'none';
        pingToolSection.style.display = 'block';

        // Ініціалізація пінгувалки
        initPingTool();
    });
});
