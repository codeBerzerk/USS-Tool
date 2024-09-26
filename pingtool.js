// pingtool.js
(function() {
    let pingToolInitialized = false;

    window.initPingTool = function() {
        if (pingToolInitialized) return;
        pingToolInitialized = true;

        const sites = [
            { name: "DMSU", url: "https://dmsu.gov.ua/" },
            { name: "MAIL DMSU", url: "https://mail.dmsu.gov.ua/mail/" },
            { name: "MAIL DMSU", url: "https://rtg.dmsu.gov.ua" },
            { name: "NGU", url: "https://ngu.gov.ua/" },
            { name: "USS", url: "https://uss.gov.ua/" },
            { name: "RESTORATION", url: "https://restoration.gov.ua/" },
            { name: "PROMETHEUS", url: "https://prometheus.io/" },
            { name: "NKAU", url: "https://www.nkau.gov.ua/ua/" },
        ];

        let interval = localStorage.getItem('checkInterval') ? parseInt(localStorage.getItem('checkInterval'), 10) : 30000;
        document.getElementById("intervalSelect").value = interval.toString();

        let siteFailures = {};

        sites.forEach((site) => {
            siteFailures[site.name] = {
                failures: 0,
                firstFailureTime: null,
                lastSuccessTime: null,
                element: null,
                notified: false // Додаємо прапорець для сповіщення
            };
        });

        const checkSiteFailureThreshold = (failures) => {
            return failures >= 3;
        }

        const isValidUrl = (string) => {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }

        const checkSite = (site, index) => {
            const siteBlock = document.getElementById(`site_${index}`);
            const statusElement = document.getElementById(`status_${index}`);
            statusElement.textContent = "Перевіряю...";
            siteBlock.className = "site-block checking";

            if (!isValidUrl(site.url)) {
                statusElement.textContent = 'Недоступний (некоректний URL)';
                siteBlock.className = "site-block unavailable";
                handleSiteStatus(site.name, false);
                return;
            }

            // Використовуємо серверний API для перевірки доступності сайту
            fetch(`http://localhost:3000/checksite?url=${encodeURIComponent(site.url)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 200) {
                        statusElement.textContent = `Доступний (${data.status})`;
                        siteBlock.className = "site-block available";
                        handleSiteStatus(site.name, true);
                    } else {
                        statusElement.textContent = `Недоступний (${data.status})`;
                        siteBlock.className = "site-block unavailable";
                        handleSiteStatus(site.name, false);
                    }
                })
                .catch((error) => {
                    console.error(`Помилка при перевірці сайту ${site.name}:`, error);
                    statusElement.textContent = 'Недоступний (помилка запиту)';
                    siteBlock.className = "site-block unavailable";
                    handleSiteStatus(site.name, false);
                });
        };

        const handleSiteStatus = (siteName, isSuccess) => {
            const siteFailure = siteFailures[siteName];
            const currentTime = new Date();

            if (!isSuccess) {
                if (siteFailure.failures === 0) {
                    siteFailure.firstFailureTime = currentTime;
                    siteFailure.element = addErrorHistory(siteName, currentTime, 'дотепер', 'red');
                }
                siteFailure.failures += 1;

                if (checkSiteFailureThreshold(siteFailure.failures)) {
                    updateErrorHistory(siteFailure.element, siteFailure.firstFailureTime, 'дотепер', 'red');
                    triggerNotification(siteName);
                }
            } else {
                if (siteFailure.failures >= 3) {
                    updateErrorHistory(siteFailure.element, siteFailure.firstFailureTime, currentTime, 'green');
                }
                siteFailure.failures = 0;
                siteFailure.firstFailureTime = null;
                siteFailure.element = null;
                siteFailure.notified = false; // Скидаємо прапорець сповіщення
            }
        };

        const addErrorHistory = (siteName, startTime, endTime, color) => {
            const errorList = document.getElementById("errorList");
            const item = document.createElement("li");
            item.style.color = color;
            item.textContent = `${siteName} : ${startTime.toLocaleTimeString()} - ${endTime}`;
            errorList.appendChild(item);
            return item;
        };

        const updateErrorHistory = (element, startTime, endTime, color) => {
            if (color === 'green') {
                element.textContent = `${element.textContent.split(':')[0]} : ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()} (був недоступний ${((endTime - startTime) / 60000).toFixed(0)} хв)`;
            } else {
                element.textContent = `${element.textContent.split(':')[0]} : ${startTime.toLocaleTimeString()} - ${endTime}`;
            }
            element.style.color = color;
        };

        const triggerNotification = (siteName) => {
            // Перевірка дозволу на сповіщення
            if (Notification.permission === 'granted') {
                showNotification(siteName);
                playAlertSound();
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showNotification(siteName);
                        playAlertSound();
                    }
                });
            }
        };

        const showNotification = (siteName) => {
            const notification = new Notification('Увага!', {
                body: `Сайт "${siteName}" недоступний.`,
                icon: 'favicon.ico', // Шлях до іконки (опційно)
                // Ви можете додати більше параметрів за потребою
            });

            // Можна додати обробник подій, наприклад, відкриття сайту при кліку на сповіщення
            notification.onclick = () => {
                window.focus();
                window.open(sites.find(site => site.name === siteName).url, '_blank');
                notification.close();
            };
        };

        const playAlertSound = () => {
            const audio = document.getElementById('alert-sound');
            if (audio) {
                audio.play().catch(error => {
                    console.error('Не вдалося відтворити звуковий сигнал:', error);
                });
            }
        };

        document.getElementById("intervalSelect").addEventListener("change", (e) => {
            interval = parseInt(e.target.value, 10);
            localStorage.setItem('checkInterval', interval.toString());
            clearInterval(window.checkInterval);
            window.checkInterval = setInterval(updateStatus, interval);
        });

        const updateStatus = () => {
            sites.forEach((site, index) => {
                checkSite(site, index);
            });
        };

        function renderSites() {
            const container = document.getElementById("sitesList");
            container.innerHTML = "";
            sites.forEach((site, index) => {
                const block = document.createElement("div");
                block.id = `site_${index}`;
                block.className = "site-block checking";
                block.innerHTML = `<strong>${site.name}</strong><br>${site.url}<br> <span id="status_${index}">Перевіряю...</span>`;
                const checkButton = document.createElement("button");
                checkButton.textContent = "Перевірити зараз";
                checkButton.onclick = () => checkSite(site, index);
                block.appendChild(checkButton);
                container.appendChild(block);
            });
        }

        const clearErrorHistory = () => {
            const errorList = document.getElementById("errorList");
            errorList.innerHTML = "";
            Object.keys(siteFailures).forEach(siteName => {
                siteFailures[siteName].failures = 0;
                siteFailures[siteName].firstFailureTime = null;
                siteFailures[siteName].lastSuccessTime = null;
                siteFailures[siteName].element = null;
                siteFailures[siteName].notified = false;
            });
        };

        document.getElementById("clearHistoryBtn").addEventListener("click", clearErrorHistory);

        renderSites();
        updateStatus();
        window.checkInterval = setInterval(updateStatus, interval);
    }
})();
