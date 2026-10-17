document.getElementById('student-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const studentId = document.getElementById('studentId').value.trim();
  const timestamp = new Date().toISOString();
  
  if (!name || !studentId) {
    alert('Заполните все поля!');
    return;
  }

  const data = {
    name,
    studentId,
    timestamp
  };
  
  // Очищаем предыдущий QR, если есть
  document.getElementById("qrcode").innerHTML = "";
  
  // Генерация QR-кода
  new QRCode(document.getElementById("qrcode"), {
    text: JSON.stringify(data),
    width: 256,
    height: 256
  });
});
