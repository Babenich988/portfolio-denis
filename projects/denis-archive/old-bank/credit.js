(() => {
  const fields = {
    amount: [document.querySelector('#loanAmount'), document.querySelector('#loanAmountRange')],
    term: [document.querySelector('#loanTerm'), document.querySelector('#loanTermRange')],
    rate: [document.querySelector('#annualRate'), document.querySelector('#annualRateRange')],
    income: [document.querySelector('#monthlyIncome')],
  };
  if (!fields.amount[0]) return;

  const rubles = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const monthly = document.querySelector('#monthlyPayment');
  const principal = document.querySelector('#resultPrincipal');
  const total = document.querySelector('#resultTotal');
  const share = document.querySelector('#resultShare');
  const message = document.querySelector('#incomeMessage');

  function bounded(field, raw) {
    const number = Number(raw);
    if (!Number.isFinite(number)) return Number(field.min || 0);
    return Math.min(Number(field.max || Infinity), Math.max(Number(field.min || 0), number));
  }

  function calculate() {
    const amount = bounded(fields.amount[0], fields.amount[0].value);
    const months = bounded(fields.term[0], fields.term[0].value);
    const annualRate = bounded(fields.rate[0], fields.rate[0].value);
    const income = Math.max(0, Number(fields.income[0].value) || 0);
    const monthlyRate = annualRate / 100 / 12;
    const payment = monthlyRate === 0 ? amount / months : amount * monthlyRate / (1 - (1 + monthlyRate) ** -months);

    [fields.amount, fields.term, fields.rate].forEach(([number, range]) => {
      if (range) range.value = String(bounded(number, number.value));
    });
    monthly.value = `${rubles.format(payment)} ₽`;
    monthly.textContent = monthly.value;
    principal.textContent = `${rubles.format(amount)} ₽`;
    total.textContent = `${rubles.format(payment * months)} ₽`;
    const ratio = income > 0 ? payment / income * 100 : null;
    share.textContent = ratio === null ? '—' : `${Math.round(ratio)}%`;
    message.textContent = ratio === null
      ? 'Укажите доход, чтобы увидеть долю платежа для сравнения.'
      : `Доля платежа от указанного дохода — ${ratio.toFixed(1).replace('.', ',')}%. Это только ориентир в макете.`;
  }

  Object.entries(fields).forEach(([key, [number, range]]) => {
    number.addEventListener('input', () => {
      if (number.value !== '') calculate();
    });
    number.addEventListener('change', () => {
      number.value = String(bounded(number, number.value));
      calculate();
    });
    if (range) range.addEventListener('input', () => {
      number.value = range.value;
      calculate();
    });
  });

  document.querySelectorAll('.loan-offer').forEach((card) => {
    card.querySelector('.offer-select').addEventListener('click', () => {
      fields.rate[0].value = card.dataset.rate;
      fields.term[0].value = card.dataset.term;
      calculate();
      document.querySelector('#calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
      fields.amount[0].focus({ preventScroll: true });
    });
  });
  calculate();
})();
