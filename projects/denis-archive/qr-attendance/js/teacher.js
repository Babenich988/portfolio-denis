let scannedData = null;
const statusEl = document.getElementById('status');
const scannedDataEl = document.getElementById('scanned-data');
const markBtn = document.getElementById('mark-attendance');

// Функция, вызываемая при успешном сканировании
function onScanSuccess(decodedText, decodedResult) {
  try {
    scannedData = JSON.parse(decodedText);
    scannedDataEl.innerHTML = `
      <p><strong>Имя студента:</strong> ${scannedData.name}</p>
      <p><strong>ID:</strong> ${scannedData.studentId}</p>
      <p><strong>Время генерации:</strong> ${scannedData.timestamp}</p>
    `;
    markBtn.style.display = "block"; // показать кнопку для отметки присутствия
    statusEl.textContent = "Студент найден. Нажмите 'Отметить присутствие'.";
  } catch (error) {
    console.error("Ошибка обработки QR:", error);
    statusEl.textContent = "Неверный QR-код.";
  }
}

// Функция при неудачном сканировании (можно оставить пустой)
function onScanFailure(error) {
  // Можно выводить сообщения об ошибках, если нужно
}

const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", 
  { fps: 10, qrbox: 250 },
  false
);
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

// Обработчик кнопки "Отметить присутствие"
markBtn.addEventListener('click', function() {
  if (!scannedData) {
    alert("Нет данных о студенте.");
    return;
  }
  // Дополнительно можно добавить подтверждение преподавателя, например, спросить имя преподавателя.
  // Здесь отправляем данные в Google Таблицу через fetch:
  const payload = {
    lessonId: prompt("Введите ID занятия (например, IT101):"), // преподаватель вводит ID занятия
    student: scannedData.name,
    studentId: scannedData.studentId,
    studentGeneratedAt: scannedData.timestamp,
    markedAt: new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })
  };

  // Вставьте сюда свой URL веб-приложения Google Apps Script
  fetch("https://script.google.com/macros/s/AKfycbxGmQ2VBl4OzczegbA5Bzvh2vvRE-gQZEvAjCiogajUs2M_DscjrrGA1VVaOmZsTOHoFQ/exec", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => res.text())
  .then(msg => {
    statusEl.textContent = "Данные успешно отправлены. Ответ сервера: " + msg;
    // Можно скрыть кнопку или сбросить данные для следующего сканирования
    markBtn.style.display = "none";
    scannedDataEl.innerHTML = "";
    scannedData = null;
  })
  .catch(err => {
    statusEl.textContent = "Ошибка отправки данных: " + err;
    console.error("Ошибка:", err);
  });
});
