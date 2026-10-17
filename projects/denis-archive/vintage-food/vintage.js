(() => {
  const submit = document.querySelector(".subscribe");
  const email = document.querySelector(".email");
  const consent = document.querySelector(".okey");
  const feedback = document.querySelector(".newsletter-feedback");
  if (!submit || !email || !consent || !feedback) return;

  submit.addEventListener("click", () => {
    if (!email.value.trim() || !email.checkValidity()) {
      email.focus();
      email.reportValidity();
      return;
    }
    feedback.hidden = false;
    feedback.textContent = consent.checked
      ? "Форма заполнена. Для отправки новостей нужно подключить сервис рассылки."
      : "Поставьте отметку согласия на обработку персональных данных.";
    if (!consent.checked) consent.focus();
  });
})();
