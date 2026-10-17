const products = [...document.querySelectorAll('[data-product]')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const countOutput = document.querySelector('[data-visible-count]');
const filterStatus = document.querySelector('[data-filter-status]');
const noResults = document.querySelector('[data-no-results]');
const cartDialog = document.querySelector('#cart-dialog');
const cartCount = document.querySelector('[data-cart-count]');
const cartItems = document.querySelector('[data-cart-items]');
const cartEmpty = document.querySelector('[data-cart-empty]');
const cartTotal = document.querySelector('[data-cart-total]');
const announcement = document.querySelector('[data-announcement]');
const cart = new Map();
let lastCartTrigger = null;
let announcementTimer;

const filterNames = { all: 'все растения', bright: 'растения для яркого рассеянного света', medium: 'растения для среднего освещения', low: 'растения для менее освещённого места' };
const formatMoney = amount => `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`;

function setupPlantGallery() {
  const image = document.querySelector('.hero-photo > img');
  const caption = document.querySelector('.hero-photo figcaption a');
  const counter = document.querySelector('[data-plant-count]');
  const progressCurrent = document.querySelector('[data-plant-current]');
  const progressTotal = document.querySelector('[data-plant-total]');
  const buttons = [...document.querySelectorAll('[data-plant-step]')];
  if (!image || !caption || !counter || !products.length) return;
  const original = { src: image.getAttribute('src'), alt: image.alt, href: caption.href, credit: caption.textContent.replace(/^Фото:\s*/, ''), name: 'Сансевиерия' };
  const slides = [original, ...products.map(product => {
    const photo = product.querySelector('.product-photo');
    const productImage = photo?.querySelector('img');
    const credit = photo?.querySelector('.photo-credit');
    return { src: productImage?.getAttribute('src'), alt: productImage?.alt, href: photo?.href, credit: credit?.textContent.replace(/\s*↗\s*$/, ''), name: product.dataset.name };
  }).filter(slide => slide.src && slide.href)];
  let index = 0;
  const show = () => {
    const slide = slides[index];
    image.src = slide.src;
    image.alt = slide.alt;
    caption.href = slide.href;
    caption.textContent = `Фото: ${slide.credit}`;
    counter.value = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    counter.setAttribute('aria-label', `Фото ${index + 1} из ${slides.length}: ${slide.name}`);
    if (progressCurrent) progressCurrent.textContent = String(index + 1).padStart(2, '0');
    if (progressTotal) progressTotal.textContent = String(slides.length).padStart(2, '0');
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    index = (index + Number(button.dataset.plantStep) + slides.length) % slides.length;
    show();
  }));
}

function setFilter(value) {
  let visible = 0;
  for (const product of products) {
    const matches = value === 'all' || product.dataset.lights.split(' ').includes(value);
    product.hidden = !matches;
    if (matches) visible += 1;
  }
  for (const button of filterButtons) {
    const active = button.dataset.filter === value;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  countOutput.textContent = String(visible).padStart(2, '0');
  filterStatus.textContent = `Показаны ${filterNames[value]}`;
  noResults.hidden = visible !== 0;
}

function announce(message) {
  announcement.textContent = message;
  announcement.classList.add('is-visible');
  window.clearTimeout(announcementTimer);
  announcementTimer = window.setTimeout(() => announcement.classList.remove('is-visible'), 2100);
}

function renderCart() {
  let itemCount = 0;
  let total = 0;
  cartItems.replaceChildren();
  for (const [id, quantity] of cart) {
    const product = products.find(item => item.dataset.id === id);
    if (!product || quantity < 1) continue;
    const price = Number(product.dataset.price);
    itemCount += quantity;
    total += price * quantity;
    const row = document.createElement('div');
    row.className = 'cart-line';
    const name = document.createElement('p');
    name.className = 'cart-line-name';
    name.textContent = product.dataset.name;
    const subtotal = document.createElement('p');
    subtotal.className = 'cart-line-price';
    subtotal.textContent = `${formatMoney(price)} × ${quantity} · ${formatMoney(price * quantity)}`;
    const controls = document.createElement('div');
    controls.className = 'quantity-controls';
    controls.setAttribute('aria-label', `Количество: ${product.dataset.name}`);
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.dataset.quantity = '-1';
    minus.dataset.id = id;
    minus.setAttribute('aria-label', `Уменьшить количество: ${product.dataset.name}`);
    minus.textContent = '−';
    const quantityText = document.createElement('span');
    quantityText.textContent = String(quantity);
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.dataset.quantity = '1';
    plus.dataset.id = id;
    plus.setAttribute('aria-label', `Увеличить количество: ${product.dataset.name}`);
    plus.textContent = '+';
    controls.append(minus, quantityText, plus);
    row.append(name, subtotal, controls);
    cartItems.append(row);
  }
  cartCount.textContent = String(itemCount);
  cartCount.setAttribute('aria-label', `Товаров в корзине: ${itemCount}`);
  cartTotal.textContent = formatMoney(total);
  cartEmpty.hidden = itemCount !== 0;
  cartItems.hidden = itemCount === 0;
}

for (const button of filterButtons) button.addEventListener('click', () => setFilter(button.dataset.filter));

for (const button of document.querySelectorAll('[data-add]')) {
  button.addEventListener('click', () => {
    const card = button.closest('[data-product]');
    cart.set(card.dataset.id, (cart.get(card.dataset.id) ?? 0) + 1);
    renderCart();
    announce(`Добавлено в корзину: ${card.dataset.name}`);
  });
}

document.querySelector('[data-open-cart]').addEventListener('click', event => {
  lastCartTrigger = event.currentTarget;
  renderCart();
  cartDialog.showModal();
  document.querySelector('[data-close-cart]').focus();
});
document.querySelector('[data-close-cart]').addEventListener('click', () => cartDialog.close());
cartDialog.addEventListener('click', event => {
  if (event.target === cartDialog) cartDialog.close();
});
cartDialog.addEventListener('close', () => lastCartTrigger?.focus());
cartItems.addEventListener('click', event => {
  const button = event.target.closest('[data-quantity]');
  if (!button) return;
  const id = button.dataset.id;
  const quantity = (cart.get(id) ?? 0) + Number(button.dataset.quantity);
  if (quantity <= 0) cart.delete(id);
  else cart.set(id, quantity);
  renderCart();
});

setupPlantGallery();
renderCart();
