// app.js – полная клиентская логика
const STORAGE_KEYS = {
  cart: "antichniistore.cart.v1",
  aiHistory: "antichniistore.aiHistory.v1",
  orders: "antichniistore.orders.v1",
  sellerApplications: "antichniistore.sellerApplications.v1"
};

const deliveryRates = [
  { source: "Poizon", country: "Китай", ratePerKg: 680, minWeight: 0.2, maxWeight: 25, days: "14-21 день" },
  { source: "Taobao", country: "Китай", ratePerKg: 590, minWeight: 0.2, maxWeight: 30, days: "12-20 дней" },
  { source: "Seoul Supply", country: "Южная Корея", ratePerKg: 840, minWeight: 0.2, maxWeight: 20, days: "9-16 дней" },
  { source: "Tokyo Buyer", country: "Япония", ratePerKg: 920, minWeight: 0.2, maxWeight: 18, days: "7-14 дней" },
  { source: "EU Outlet", country: "Европа", ratePerKg: 1180, minWeight: 0.2, maxWeight: 20, days: "10-18 дней" },
  { source: "US Stock", country: "США", ratePerKg: 1350, minWeight: 0.2, maxWeight: 20, days: "12-22 дня" },
  { source: "Local Partner", country: "Россия", ratePerKg: 390, minWeight: 0.1, maxWeight: 30, days: "1-5 дней" }
];

const workSteps = [
  { name: "Проверяем источники", status: "прозрачно", description: "Показываем доступные источники из каталога и заявки: официальный продавец, маркетплейс, локальный магазин или менеджер." },
  { name: "Считаем доставку", status: "предварительно", description: "Для физических товаров считаем базовую цену, доставку, срок и итог. Для подписок показываем срок ручной обработки." },
  { name: "Передаем менеджеру", status: "без имитации оплаты", description: "Если backend, AI или платежный провайдер не настроены, сайт честно создает заявку и сохраняет ее локально." }
];

const orderStatuses = ["найден", "ожидает оплаты", "оплачен", "выкуплен", "доставляется", "прибыл на склад", "отправлен клиенту", "завершен", "возврат"];

const catalogViews = {
  "/popular": { sort: "popular" },
  "/official": { plugOnly: true },
  "/digital": { category: "digital-goods" },
  "/ai": { category: "ai-subscriptions" },
  "/music": { category: "music-video" },
  "/video": { category: "music-video" },
  "/games": { category: "games" }
};

const state = {
  catalog: { brand: {}, categories: [], products: [], services: [], sources: [] },
  filters: defaultFilters(),
  draftFilters: defaultFilters(),
  currentPage: "home",
  selectedProduct: null,
  selectedPlan: null,
  selectedSourceByProduct: {},
  searchMode: "regular",
  profileTab: "home",
  cart: readStorage(STORAGE_KEYS.cart, []),
  aiHistory: readStorage(STORAGE_KEYS.aiHistory, []),
  orders: readStorage(STORAGE_KEYS.orders, []),
  sellerApplications: readStorage(STORAGE_KEYS.sellerApplications, []),
  supportMessages: [
    { role: "assistant", text: "Здравствуйте. Это поддержка antichniistore. Помогу найти товар, объяснить оплату, доставку или подключить менеджера." }
  ],
  detailProductId: null
};

// DOM-ссылки (все существующие из HTML)
const els = {
  brandName: document.querySelector("#brandName"),
  brandTagline: document.querySelector("#brandTagline"),
  brandNotice: document.querySelector("#brandNotice"),
  supportLink: document.querySelector("#supportLink"),
  catalogMenuButton: document.querySelector("#catalogMenuButton"),
  megaMenu: document.querySelector("#megaMenu"),
  megaCategoryGrid: document.querySelector("#megaCategoryGrid"),
  searchInput: document.querySelector("#searchInput"),
  regularSearchTab: document.querySelector("#regularSearchTab"),
  aiSearchTab: document.querySelector("#aiSearchTab"),
  supportButton: document.querySelector("#supportButton"),
  cartButton: document.querySelector("#cartButton"),
  profileButton: document.querySelector("#profileButton"),
  cartCount: document.querySelector("#cartCount"),
  catalogFilterForm: document.querySelector("#catalogFilterForm"),
  categoryGrid: document.querySelector("#categoryGrid"),
  aiSearchForm: document.querySelector("#aiSearchForm"),
  aiProductName: document.querySelector("#aiProductName"),
  aiSourceUrl: document.querySelector("#aiSourceUrl"),
  aiRegion: document.querySelector("#aiRegion"),
  aiWeight: document.querySelector("#aiWeight"),
  aiPhoto: document.querySelector("#aiPhoto"),
  aiNotes: document.querySelector("#aiNotes"),
  aiLoading: document.querySelector("#aiLoading"),
  aiLoadingStep: document.querySelector("#aiLoadingStep"),
  aiResultGrid: document.querySelector("#aiResultGrid"),
  categoryFilter: document.querySelector("#categoryFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  minPriceFilter: document.querySelector("#minPriceFilter"),
  maxPriceFilter: document.querySelector("#maxPriceFilter"),
  ratingFilter: document.querySelector("#ratingFilter"),
  sellerFilter: document.querySelector("#sellerFilter"),
  plugOnlyFilter: document.querySelector("#plugOnlyFilter"),
  stockFilter: document.querySelector("#stockFilter"),
  receiveFilter: document.querySelector("#receiveFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  applyFilters: document.querySelector("#applyFilters"),
  resetFilters: document.querySelector("#resetFilters"),
  serviceCount: document.querySelector("#serviceCount"),
  categoryCount: document.querySelector("#categoryCount"),
  minPrice: document.querySelector("#minPrice"),
  resultCount: document.querySelector("#resultCount"),
  catalogGrid: document.querySelector("#productGrid") || document.querySelector("#catalogGrid"),
  detailView: document.querySelector("#detailView"),
  supportMessages: document.querySelector("#supportMessages"),
  supportForm: document.querySelector("#supportForm"),
  supportInput: document.querySelector("#supportInput"),
  managerLink: document.querySelector("#managerLink"),
  profileMenu: document.querySelector("#profileMenu"),
  profileContent: document.querySelector("#profileContent"),
  agentGrid: document.querySelector("#agentGrid"),
  sellerForm: document.querySelector("#sellerForm"),
  sellerCategory: document.querySelector("#sellerCategory"),
  sellerResult: document.querySelector("#sellerResult"),
  cartDrawer: document.querySelector("#cartDrawer"),
  cartList: document.querySelector("#cartList"),
  cartSummary: document.querySelector("#cartSummary"),
  closeCart: document.querySelector("#closeCart"),
  bottomCartButton: document.querySelector("#bottomCartButton"),
  checkoutDrawer: document.querySelector("#checkoutDrawer"),
  closeDrawer: document.querySelector("#closeDrawer"),
  bottomOrderButton: document.querySelector("#bottomOrderButton"),
  selectedService: document.querySelector("#selectedService"),
  requirementBox: document.querySelector("#requirementBox"),
  accountLabel: document.querySelector("#accountLabel"),
  accountInput: document.querySelector("#accountInput"),
  orderForm: document.querySelector("#orderForm"),
  submitButton: document.querySelector("#submitButton"),
  orderResult: document.querySelector("#orderResult")
};

// Вспомогательные утилиты
function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function writeStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatPrice(price, currency = "RUB") {
  if (currency === "RUB") return `${Math.round(price)} ₽`;
  return `${Math.round(price)} ${currency}`;
}

function displayPrice(product) {
  const base = product.plans?.[0]?.price || product.price || 0;
  const best = bestProductSource(product);
  return best?.finalPrice || base;
}

function formatRating(rating) {
  return (Math.round(rating * 10) / 10).toFixed(1);
}

function plural(n, forms) {
  const abs = Math.abs(n);
  if (abs % 10 === 1 && abs % 100 !== 11) return forms[0];
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20)) return forms[1];
  return forms[2];
}

function safeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setPage(page, updateHistory = true) {
  state.currentPage = page;
  document.body.dataset.page = page;
  if (updateHistory && page !== "home") {
    history.pushState(null, "", `/${page}`);
  } else if (updateHistory && page === "home") {
    history.pushState(null, "", "/");
  }
  renderAll();
}

function navigateToPage(page) {
  setPage(page, true);
  scrollToId(page === "home" ? "home" : page);
}

function navigateToCatalogPath(categoryId) {
  if (categoryId && categoryId !== "all") {
    history.pushState(null, "", `#catalog?cat=${encodeURIComponent(categoryId)}`);
  } else {
    history.pushState(null, "", "#catalog");
  }
}

function defaultFilters() {
  return {
    category: "all",
    type: "all",
    minPrice: "",
    maxPrice: "",
    rating: "0",
    seller: "",
    plugOnly: false,
    stockOnly: false,
    receiveMethod: "all",
    sort: "catalog",
    search: ""
  };
}

function syncFilterControls(filters) {
  els.categoryFilter.value = filters.category || "all";
  els.typeFilter.value = filters.type || "all";
  els.minPriceFilter.value = filters.minPrice || "";
  els.maxPriceFilter.value = filters.maxPrice || "";
  els.ratingFilter.value = filters.rating || "0";
  els.sellerFilter.value = filters.seller || "";
  els.plugOnlyFilter.checked = !!filters.plugOnly;
  els.stockFilter.checked = !!filters.stockOnly;
  els.receiveFilter.value = filters.receiveMethod || "all";
  els.sortSelect.value = filters.sort || "catalog";
}

function applyFilters(e) {
  e.preventDefault();
  state.filters = { ...state.draftFilters };
  renderCatalog();
  renderCategoryTiles();
}

function resetFilters() {
  state.draftFilters = defaultFilters();
  state.filters = { ...state.draftFilters };
  syncFilterControls(state.draftFilters);
  renderCatalog();
  renderCategoryTiles();
}

function setLoading(loading) {
  // можно добавить индикатор загрузки
}

function setSearchMode(mode) {
  state.searchMode = mode;
  els.regularSearchTab.setAttribute("aria-selected", String(mode === "regular"));
  els.aiSearchTab.setAttribute("aria-selected", String(mode === "ai"));
  if (mode === "ai") {
    els.searchInput.placeholder = "Найти через AI: введите запрос";
  } else {
    els.searchInput.placeholder = "Найти товар, подписку или услугу";
  }
}

function handleSearchInput() {
  const query = els.searchInput.value.trim();
  state.draftFilters.search = query;
  if (state.searchMode === "regular") {
    // поиск в каталоге
    applyFilters(new Event("submit"));
  }
  // для AI поиск запускается по Enter через обработчик
}

function toggleMegaMenu() {
  const hidden = els.megaMenu.hidden;
  els.megaMenu.hidden = !hidden;
  els.catalogMenuButton.setAttribute("aria-expanded", String(!hidden));
}

function closeMegaMenu() {
  els.megaMenu.hidden = true;
  els.catalogMenuButton.setAttribute("aria-expanded", "false");
}

function closeMegaOnOutside(e) {
  if (!els.megaMenu.contains(e.target) && e.target !== els.catalogMenuButton) {
    closeMegaMenu();
  }
}

// ====== Загрузка каталога ======
async function loadCatalog() {
  setLoading(true);
  try {
    const response = await fetch("/api/services");
    if (!response.ok) throw new Error("Catalog request failed");
    const catalog = await response.json();
    state.catalog = normalizeCatalog(catalog);
    renderBrand();
    renderFilterOptions();
    renderAll();
  } catch (error) {
    els.catalogGrid.innerHTML = `<div class="empty-state"><strong>Каталог не загрузился</strong><span>${escapeHtml(error.message)}</span></div>`;
  } finally {
    setLoading(false);
  }
}

function normalizeCatalog(catalog) {
  const rawCategories = Array.isArray(catalog.categories) ? catalog.categories : [];
  const rawProducts = Array.isArray(catalog.products) ? catalog.products : Array.isArray(catalog.services) ? catalog.services : [];
  const globalSources = Array.isArray(catalog.sources) ? catalog.sources : [];
  const categoryLabels = Object.fromEntries(rawCategories.map(c => [c.id, c.label]));
  const seen = new Set();

  // --- 1. Основные товары (уникальные, исключая авто-категории) ---
  const products = rawProducts
    .filter(p => p && p.category !== "plug-offers")
    .filter(p => !/настройка\s+telegram-?бота/i.test(String(p.title || "")))
    .filter(p => p.category !== "auto-parts" && p.category !== "tires") // исключаем авто
    .filter(p => {
      const key = p.id || `${p.category}:${String(p.title || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(p => {
      const normalized = {
        type: "товар",
        seller: "antichniistore partners",
        rating: 4.7,
        reviews: 0,
        stock: "В наличии",
        receiveMethod: "После оплаты",
        deliveryTime: "30-180 минут",
        sales: 0,
        createdAt: "2026-06-01",
        official: false,
        collections: [],
        specs: [],
        warranty: "Гарантия действует по правилам продавца и условиям карточки.",
        badge: categoryLabels[p.category] || p.badge || "official",
        ...p,
        categoryLabel: categoryLabels[p.category] || p.category || "Каталог",
        plans: Array.isArray(p.plans) && p.plans.length ? p.plans : [{ id: `${p.id}-base`, label: "Базовый", price: Number(p.price || 0), currency: "RUB", stars: 1 }]
      };
      normalized.sources = buildSources(normalized, globalSources);
      return normalized;
    });

  // Сохраняем уникальные товары (без дубликатов) для счётчиков и отображения по умолчанию
  const uniqueProducts = products;

  // --- 2. Дублирование для категории "Цифровые услуги и подписки" ---
  const digitalDuplicates = products
    .filter(p => ['ai-subscriptions', 'telegram', 'music-video'].includes(p.category))
    .map(p => ({
      ...p,
      id: p.id + '-digital',    // уникальный id, чтобы не конфликтовать
      category: 'digital-goods',
      categoryLabel: 'Цифровые услуги и подписки'
    }));

  const allProducts = [...products, ...digitalDuplicates];

  // --- 3. Обновление списка категорий ---
  const activeCategoryIds = new Set(allProducts.map(p => p.category));
  let categories = rawCategories.filter(c => {
    if (!c || c.id === "plug-offers") return false;
    return c.id === "all" || activeCategoryIds.has(c.id);
  });
  if (!categories.some(c => c.id === "all")) {
    categories.unshift({ id: "all", label: "Все", icon: "grid" });
  }
  // Переименовываем digital-goods
  const digitalCat = categories.find(c => c.id === "digital-goods");
  if (digitalCat) {
    digitalCat.label = "Цифровые услуги и подписки";
  }

  // --- 4. Возвращаем объект каталога с разделением на дублированные и уникальные ---
  return {
    brand: catalog.brand || {},
    categories,
    products: allProducts,         // для отображения (с дубликатами)
    services: allProducts,         // для обратной совместимости
    uniqueServices: uniqueProducts, // для счётчиков и отображения по умолчанию
    sources: globalSources
  };
}

function buildSources(product, globalSources) {
  if (Array.isArray(product.sourceOffers) && product.sourceOffers.length) {
    return product.sourceOffers.map(offer => {
      const src = globalSources.find(s => s.id === offer.sourceId) || {};
      return {
        id: offer.sourceId + "-" + safeId(),
        source: src.name || offer.sourceId,
        country: src.country || "—",
        itemPrice: offer.itemPrice || 0,
        deliveryCost: offer.deliveryCost || 0,
        markup: offer.markup || 0,
        finalPrice: offer.finalPrice || offer.itemPrice || 0,
        days: src.days || "по запросу",
        tag: offer.tag || "",
        stock: src.receiveMethod || product.stock
      };
    });
  }
  // если нет sourceOffers, генерируем из глобальных источников
  return globalSources.slice(0, 2).map(src => ({
    id: src.id + "-" + safeId(),
    source: src.name,
    country: src.country,
    itemPrice: product.plans?.[0]?.price || 0,
    deliveryCost: 0,
    markup: 0,
    finalPrice: product.plans?.[0]?.price || 0,
    days: src.days || "по запросу",
    tag: src.id === "antichnii" ? "official" : "",
    stock: src.receiveMethod || product.stock
  }));
}

function bestProductSource(product) {
  return product.sources?.[0] || { source: "—", country: "—", finalPrice: 0, days: "—", id: "none" };
}

function selectedSource(product) {
  const id = state.selectedSourceByProduct[product.id];
  const found = product.sources.find(s => s.id === id);
  return found || bestProductSource(product);
}

function categoryGlyph(category) {
  const icons = {
    "all": "⊞",
    "ai-subscriptions": "✦",
    "music-video": "▶",
    "telegram": "✧",
    "games": "◈",
    "digital-goods": "⊡",
    "clothing-resale": "⧗",
    "sneakers": "⨁",
    "perfume": "⊹",
    "cosmetics": "◉",
    "auto-parts": "⚙",
    "tires": "⏣",
    "accessories": "⌚"
  };
  return icons[category.id] || "▣";
}

function uniqueProductsById(products) {
  const seen = new Set();
  return products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function filteredProducts() {
  const { category, type, minPrice, maxPrice, rating, seller, plugOnly, stockOnly, receiveMethod, search } = state.filters;
  
  // Определяем, какой массив использовать: уникальные или дублированные
  let list;
  if (category === 'digital-goods') {
    // Для digital-goods используем дублированные товары
    list = state.catalog.services || [];
  } else {
    // Для всех остальных категорий используем уникальные товары
    list = state.catalog.uniqueServices || [];
  }

  // Применяем фильтр по категории, если она задана и не 'all'
  if (category && category !== "all") {
    if (category === 'digital-goods') {
      // для digital-goods уже выбраны дубликаты, фильтруем по категории digital-goods
      list = list.filter(p => p.category === 'digital-goods');
    } else {
      list = list.filter(p => p.category === category);
    }
  }

  // Применяем остальные фильтры (тип, цена, рейтинг, продавец, official, наличие, способ получения, поиск)
  if (type && type !== "all") {
    list = list.filter(p => p.type === type);
  }
  if (minPrice !== "") {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) list = list.filter(p => displayPrice(p) >= min);
  }
  if (maxPrice !== "") {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) list = list.filter(p => displayPrice(p) <= max);
  }
  if (rating && rating !== "0") {
    const minRating = parseFloat(rating);
    if (!isNaN(minRating)) list = list.filter(p => p.rating >= minRating);
  }
  if (seller) {
    list = list.filter(p => p.seller.toLowerCase().includes(seller));
  }
  if (plugOnly) {
    list = list.filter(p => p.official === true);
  }
  if (stockOnly) {
    list = list.filter(p => p.stock && p.stock.toLowerCase().includes("наличие"));
  }
  if (receiveMethod && receiveMethod !== "all") {
    list = list.filter(p => p.receiveMethod === receiveMethod);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }
  // Сортировка
  const sort = state.filters.sort || "catalog";
  if (sort === "cheap") list.sort((a, b) => displayPrice(a) - displayPrice(b));
  else if (sort === "expensive") list.sort((a, b) => displayPrice(b) - displayPrice(a));
  else if (sort === "popular") list.sort((a, b) => (b.sales || 0) - (a.sales || 0));
  else if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sort === "new") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list;
}

function filteredProductsUnique() {
  const { category, type, minPrice, maxPrice, rating, seller, plugOnly, stockOnly, receiveMethod, search } = state.filters;
  let list = state.catalog.uniqueServices || [];
  
  if (category && category !== "all") {
    if (category === 'digital-goods') {
      // Показываем уникальные товары из трёх категорий (и original digital-goods)
      const cats = ['ai-subscriptions', 'telegram', 'music-video', 'digital-goods'];
      list = list.filter(p => cats.includes(p.category));
    } else {
      list = list.filter(p => p.category === category);
    }
  }
  // Применяем остальные фильтры (тип, цена, рейтинг, продавец, official, наличие, способ получения, поиск)
  if (type && type !== "all") {
    list = list.filter(p => p.type === type);
  }
  if (minPrice !== "") {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) list = list.filter(p => displayPrice(p) >= min);
  }
  if (maxPrice !== "") {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) list = list.filter(p => displayPrice(p) <= max);
  }
  if (rating && rating !== "0") {
    const minRating = parseFloat(rating);
    if (!isNaN(minRating)) list = list.filter(p => p.rating >= minRating);
  }
  if (seller) {
    list = list.filter(p => p.seller.toLowerCase().includes(seller));
  }
  if (plugOnly) {
    list = list.filter(p => p.official === true);
  }
  if (stockOnly) {
    list = list.filter(p => p.stock && p.stock.toLowerCase().includes("наличие"));
  }
  if (receiveMethod && receiveMethod !== "all") {
    list = list.filter(p => p.receiveMethod === receiveMethod);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }
  // Сортировка для подсчёта не важна, но можно применить для единообразия
  const sort = state.filters.sort || "catalog";
  if (sort === "cheap") list.sort((a, b) => displayPrice(a) - displayPrice(b));
  else if (sort === "expensive") list.sort((a, b) => displayPrice(b) - displayPrice(a));
  else if (sort === "popular") list.sort((a, b) => (b.sales || 0) - (a.sales || 0));
  else if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sort === "new") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list;
}

// ====== Рендер ======
function renderAll() {
  renderStats();
  renderCategoryTiles();
  renderMegaMenu();
  renderCatalog();
  renderAgents();
  renderSupport();
  renderProfile();
}

function renderBrand() {
  const brand = state.catalog.brand || {};
  els.brandName.textContent = brand.name || "antichniistore";
  els.brandTagline.textContent = brand.tagline || "закрытая витрина товаров, услуг и подписок";
  els.brandNotice.textContent = brand.notice || "Итоговые условия подтверждаются менеджером.";
  const support = brand.support || "@your_support";
  els.supportLink.textContent = support;
  els.supportLink.href = `https://t.me/${String(support).replace("@", "")}`;
  if (els.managerLink) {
    els.managerLink.href = `https://t.me/${String(support).replace("@", "")}`;
  }
}

function renderStats() {
  const uniqueServices = state.catalog.uniqueServices || [];
  const prices = uniqueServices.map(displayPrice).filter(p => p > 0);
  els.serviceCount.textContent = String(uniqueServices.length);
  els.categoryCount.textContent = String(Math.max(0, state.catalog.categories.filter(c => c.id !== 'all').length));
  els.minPrice.textContent = prices.length ? formatPrice(Math.min(...prices)) : "по запросу";
}

function renderFilterOptions() {
  els.categoryFilter.innerHTML = state.catalog.categories
    .map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`)
    .join("");
  if (els.sellerCategory) {
    els.sellerCategory.innerHTML = state.catalog.categories
      .filter(c => c.id !== "all")
      .map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`)
      .join("");
  }
  const methods = Array.from(new Set(state.catalog.services.map(p => p.receiveMethod).filter(Boolean)));
  els.receiveFilter.innerHTML = [
    `<option value="all">Любой способ</option>`,
    ...methods.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
  ].join("");
  syncFilterControls(state.draftFilters);
}

function renderCategoryTiles() {
  els.categoryGrid.innerHTML = "";
  for (const category of state.catalog.categories) {
    const count = categoryCount(category.id);
    const button = document.createElement("button");
    button.className = "category-tile";
    button.type = "button";
    button.dataset.active = String(category.id === state.filters.category);
    button.innerHTML = `<span>${escapeHtml(categoryGlyph(category))}</span><strong>${escapeHtml(category.label)}</strong><small>${count} предложений</small>`;
    button.addEventListener("click", () => {
      state.filters = { ...defaultFilters(), search: state.filters.search, category: category.id };
      state.draftFilters = { ...state.filters };
      syncFilterControls(state.draftFilters);
      renderCategoryTiles();
      renderCatalog();
      navigateToCatalogPath(category.id);
      scrollToId("catalog");
    });
    els.categoryGrid.append(button);
  }
}

function renderMegaMenu() {
  if (!els.megaCategoryGrid) return;
  els.megaCategoryGrid.innerHTML = state.catalog.categories
    .filter(c => c.id !== "all")
    .map(c => `<a href="#catalog" data-mega-category="${escapeHtml(c.id)}"><strong>${escapeHtml(c.label)}</strong><span>${categoryCount(c.id)} предложений</span></a>`)
    .join("");
  els.megaCategoryGrid.querySelectorAll("[data-mega-category]").forEach(link => {
    link.addEventListener("click", () => {
      state.filters = { ...defaultFilters(), search: state.filters.search, category: link.dataset.megaCategory };
      state.draftFilters = { ...state.filters };
      syncFilterControls(state.draftFilters);
      renderCategoryTiles();
      renderCatalog();
      closeMegaMenu();
      setPage("home", false);
      history.pushState(null, "", "/#catalog");
      scrollToId("catalog");
    });
  });
}

function categoryCount(categoryId) {
  const unique = state.catalog.uniqueServices || [];
  if (categoryId === 'all') return unique.length;
  if (categoryId === 'digital-goods') {
    // Суммируем уникальные товары из трёх категорий (и, если есть, оригинальные digital-goods)
    const categories = ['ai-subscriptions', 'telegram', 'music-video', 'digital-goods'];
    return unique.filter(p => categories.includes(p.category)).length;
  }
  return unique.filter(p => p.category === categoryId).length;
}

function renderCatalog() {
  const productsDisplay = uniqueProductsById(filteredProducts()); // с дубликатами для отображения
  const productsUnique = filteredProductsUnique(); // уникальные для счётчика
  els.catalogGrid.innerHTML = "";
  els.resultCount.textContent = plural(productsUnique.length, ["карточка", "карточки", "карточек"]);
  for (const product of productsDisplay) {
    els.catalogGrid.append(renderProductCard(product));
  }
}

function productInitials(product) {
  return product.title.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";
}

const visualToneByProduct = {
  spotify: "audio", "apple-music": "apple", soundcloud: "sound", "apple-gift": "gift",
  netflix: "cinema", chatgpt: "ai", "telegram-premium": "telegram", "telegram-stars": "telegram",
  supercell: "game"
};
const visualToneByCategory = {
  "ai-subscriptions": "ai", "music-video": "audio", telegram: "telegram", games: "game",
  "digital-goods": "gift", "clothing-resale": "fashion", sneakers: "fashion",
  perfume: "perfume", cosmetics: "perfume", "auto-parts": "auto", tires: "auto", accessories: "accessory"
};
const kupikodLikeIconCodes = Object.freeze({
  chatgpt: "CG", "claude-pro": "CL", "perplexity-pro": "PX", "midjourney-basic": "MJ",
  "youtube-premium": "YP", spotify: "SP", "apple-music": "AM", "soundcloud-go": "SC",
  netflix: "NF", "apple-gift-card": "AG", "telegram-premium": "TP", "telegram-stars": "TS",
  supercell: "SC"
});
const kupikodLikeIconAssets = Object.freeze({
  chatgpt: "/assets/kupi-chatgpt.svg", "claude-pro": "/assets/kupi-claude.svg",
  "perplexity-pro": "/assets/kupi-perplexity.svg", "midjourney-basic": "/assets/kupi-midjourney.svg",
  "youtube-premium": "/assets/kupi-youtube.svg", spotify: "/assets/kupi-spotify.svg",
  "apple-music": "/assets/kupi-apple-music.svg", "soundcloud-go": "/assets/kupi-soundcloud.svg",
  netflix: "/assets/kupi-netflix.svg", "apple-gift-card": "/assets/kupi-apple-gift.svg",
  "telegram-premium": "/assets/kupi-telegram-premium.svg", "telegram-stars": "/assets/kupi-telegram-stars.svg",
  supercell: "/assets/kupi-supercell.svg"
});

function kupikodLikeIconCode(product) { return kupikodLikeIconCodes[product.id] || ""; }
function kupikodLikeIconAsset(product) { return kupikodLikeIconAssets[product.id] || ""; }
function productVisualCode(product) { return kupikodLikeIconCode(product) || productInitials(product); }
function visualTone(product) { return visualToneByProduct[product.id] || visualToneByCategory[product.category] || "market"; }
function visualKicker(product) { if (product.official) return "verified"; if (product.type) return "market item"; return "listing"; }

function renderVisualMedia(product) {
  const code = productVisualCode(product);
  const asset = kupikodLikeIconAsset(product);
  if (asset) return `<img class="kupikod-color-icon" src="${escapeHtml(asset)}" alt="" loading="eager">`;
  if (kupikodLikeIconCode(product)) return `<span class="visual-initials kupikod-code">${escapeHtml(code)}</span>`;
  return product.asset ? `<img src="${escapeHtml(product.asset)}" alt="" loading="lazy">` : `<span class="visual-initials">${escapeHtml(code)}</span>`;
}

function renderVisualShell(product, variant = "card") {
  const shellClass = variant === "detail" ? "detail-visual" : variant === "selected" ? "selected-visual" : "product-visual";
  const coverLabel = product.official ? "official" : product.type;
  const visualCode = productVisualCode(product);
  const hasPhotoStyle = product.visualMode === "photo" && Boolean(product.asset);
  const hasKupikodStyle = Boolean(kupikodLikeIconCode(product));
  const tileStyleClass = hasPhotoStyle ? " visual-tile--photo" : hasKupikodStyle ? " visual-tile--kupikod" : "";
  const markStyleClass = hasKupikodStyle ? " visual-mark--kupikod" : "";
  const coverCopy = variant === "card" ? `
    <b class="visual-bg-word" aria-hidden="true">${escapeHtml(visualCode)}</b>
    <div class="visual-copy"><span>${escapeHtml(visualKicker(product))}</span><strong>${escapeHtml(product.title)}</strong></div>
    <small>${escapeHtml(coverLabel)}</small>
  ` : "";
  if (hasPhotoStyle) {
    return `<div class="${shellClass} visual-tile tone-${visualTone(product)}${tileStyleClass}">
      <img class="visual-photo" src="${escapeHtml(product.asset)}" alt="" loading="eager">
      <i class="visual-rim" aria-hidden="true"></i><i class="visual-sheen" aria-hidden="true"></i>
      ${coverCopy}
    </div>`;
  }
  return `<div class="${shellClass} visual-tile tone-${visualTone(product)}${tileStyleClass}">
    <i class="visual-rim" aria-hidden="true"></i><i class="visual-sheen" aria-hidden="true"></i>
    <div class="visual-mark${markStyleClass}">${renderVisualMedia(product)}</div>
    ${coverCopy}
  </div>`;
}

function renderProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.productId = product.id;
  const isService = product.type === "услуга";
  const actionLabel = isService ? "Заказать" : "В корзину";
  const bestSource = bestProductSource(product);

  card.innerHTML = `
    ${renderVisualShell(product, "card")}
    <div class="card-badges">
      ${product.official ? `<span class="badge plug">official</span>` : ""}
      <span class="badge">${escapeHtml(product.categoryLabel)}</span>
      <span class="badge">${escapeHtml(product.type)}</span>
    </div>
    <h3>${escapeHtml(product.title)}</h3>
    <p class="product-description">${escapeHtml(product.subtitle || product.description || product.categoryLabel)}</p>
    <div class="product-meta">
      <span>${escapeHtml(product.subtitle || product.categoryLabel)}</span>
      <span>★ ${formatRating(product.rating)} · ${escapeHtml(product.reviews)} отзывов</span>
    </div>
    <div class="seller-row">
      <span>${escapeHtml(product.seller)}</span>
      <span>${escapeHtml(bestSource.source)} · ${escapeHtml(bestSource.country)}</span>
    </div>
    <div class="stock-row">
      <span>${escapeHtml(product.stock)}</span>
      <span>${escapeHtml(bestSource.days || product.deliveryTime)}</span>
    </div>
    <div class="price-line">
      <strong>${formatPrice(displayPrice(product))}</strong>
      <span>${product.sources.length} источника</span>
    </div>
    <div class="card-buttons">
      <button class="card-action" type="button" data-detail="${escapeHtml(product.id)}">Подробнее</button>
      <button class="card-action primary" type="button" data-primary="${escapeHtml(product.id)}">${actionLabel}</button>
    </div>
  `;

  card.querySelector("[data-detail]").addEventListener("click", () => openDetail(product.id));
  card.querySelector("[data-primary]").addEventListener("click", () => {
    if (isService) {
      selectPlan(product.id, product.plans[0]?.id, true);
    } else {
      addToCart(product.id, product.plans[0]?.id, bestSource.id);
      openCart();
    }
  });
  attachImageFallback(card, product);
  return card;
}

function attachImageFallback(root, product) {
  const img = root.querySelector("img");
  if (!img) return;
  img.addEventListener("error", () => {
    const visual = img.closest(".product-visual, .detail-visual, .selected-visual");
    if (!visual) return;
    const fallback = document.createElement("span");
    fallback.className = "visual-initials";
    fallback.textContent = productInitials(product);
    img.replaceWith(fallback);
  }, { once: true });
}

// ====== Детальный просмотр ======
function openDetail(productId, updateHash = true) {
  const product = state.catalog.services.find(p => p.id === productId);
  if (!product) return;
  state.detailProductId = productId;
  const activePlan = state.selectedProduct?.id === product.id ? state.selectedPlan : product.plans[0];
  const activeSource = selectedSource(product);
  const related = state.catalog.services.filter(p => p.id !== product.id && (p.category === product.category || p.collections?.includes(product.category))).slice(0, 4);

  els.detailView.hidden = false;
  els.detailView.innerHTML = `
    <div class="detail-layout">
      <button class="circle-action compact detail-close" type="button" data-close-detail aria-label="Закрыть">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      ${renderVisualShell(product, "detail")}
      <div class="detail-content">
        <div class="card-badges">
          ${product.official ? `<span class="badge plug">official</span>` : ""}
          <span class="badge">${escapeHtml(product.categoryLabel)}</span>
          <span class="badge">${escapeHtml(product.type)}</span>
        </div>
        <h2>${escapeHtml(product.title)}</h2>
        <p>${escapeHtml(product.description)}</p>
        <div class="detail-grid">
          <div class="detail-spec"><small>Цена от</small><strong>${formatPrice(displayPrice(product))}</strong></div>
          <div class="detail-spec"><small>Продавец</small><strong>${escapeHtml(product.seller)}</strong></div>
          <div class="detail-spec"><small>Рейтинг</small><strong>★ ${formatRating(product.rating)} / ${escapeHtml(product.reviews)} отзывов</strong></div>
          <div class="detail-spec"><small>Лучший источник</small><strong>${escapeHtml(activeSource.source)} · ${escapeHtml(activeSource.country)}</strong></div>
        </div>
        <div>
          <span class="eyebrow">Где купить</span>
          <div class="supplier-grid">
            ${product.sources.map(s => renderSourceCard(s, product, s.id === activeSource.id)).join("")}
          </div>
        </div>
        <div>
          <span class="eyebrow">Характеристики</span>
          <div class="detail-grid">
            ${product.specs.map(s => `<div class="detail-spec"><span>${escapeHtml(s)}</span></div>`).join("")}
          </div>
        </div>
        <div>
          <span class="eyebrow">Условия получения</span>
          <p>${escapeHtml(product.requirements)}</p>
        </div>
        <div>
          <span class="eyebrow">Гарантия / правила</span>
          <p>${escapeHtml(product.warranty)}</p>
        </div>
        <div class="plan-options">
          ${product.plans.map(plan => `
            <button class="plan-button" type="button" data-plan="${escapeHtml(plan.id)}" data-active="${String(activePlan?.id === plan.id)}">
              <span>${escapeHtml(plan.label)}</span>
              <strong>${formatPrice(plan.price, plan.currency)}</strong>
              <small>${escapeHtml(plan.stars)} Stars</small>
            </button>
          `).join("")}
        </div>
        <div class="detail-actions">
          <button class="primary-button" type="button" data-buy-detail>${product.type === "услуга" ? "Купить / заказать" : "Добавить в корзину"}</button>
          <button class="secondary-button" type="button" data-manager-question>Задать вопрос менеджеру</button>
          <button class="ghost-button" type="button" data-close-detail>Закрыть</button>
        </div>
      </div>
    </div>
    ${related.length ? `
      <div class="market-section">
        <div class="section-heading">
          <span>Похожие</span>
          <h2>Похожие предложения</h2>
        </div>
        <div class="rail-grid" id="relatedGrid"></div>
      </div>
    ` : ""}
  `;

  document.body.classList.add("detail-open");
  els.detailView.querySelectorAll("[data-close-detail]").forEach(b => b.addEventListener("click", closeDetail));
  els.detailView.querySelectorAll("[data-source-id]").forEach(b => {
    b.addEventListener("click", () => {
      state.selectedSourceByProduct[product.id] = b.dataset.sourceId;
      openDetail(product.id, false);
    });
  });
  els.detailView.querySelectorAll("[data-plan]").forEach(b => {
    b.addEventListener("click", () => {
      state.selectedProduct = product;
      state.selectedPlan = product.plans.find(p => p.id === b.dataset.plan) || product.plans[0];
      els.detailView.querySelectorAll("[data-plan]").forEach(n => n.dataset.active = String(n === b));
    });
  });
  els.detailView.querySelector("[data-buy-detail]").addEventListener("click", () => {
    const planId = state.selectedProduct?.id === product.id ? state.selectedPlan?.id : product.plans[0]?.id;
    if (product.type === "услуга") {
      selectPlan(product.id, planId, true);
    } else {
      addToCart(product.id, planId, selectedSource(product).id);
      openCart();
    }
  });
  els.detailView.querySelector("[data-manager-question]")?.addEventListener("click", () => {
    closeDetail();
    state.supportMessages.push({ role: "assistant", text: `Опишите вопрос по "${product.title}": срок, размер, регион, оплату или источник. Я подготовлю заявку менеджеру.` });
    renderSupport();
    scrollToId("support");
  });

  const relatedGrid = els.detailView.querySelector("#relatedGrid");
  if (relatedGrid) {
    for (const item of related) relatedGrid.append(renderProductCard(item));
  }
  attachImageFallback(els.detailView, product);
  if (updateHash) {
    history.pushState(null, "", `#product=${encodeURIComponent(product.id)}`);
  }
}

function closeDetail() {
  els.detailView.hidden = true;
  els.detailView.innerHTML = "";
  document.body.classList.remove("detail-open");
  if (location.hash.startsWith("#product=")) history.replaceState(null, "", "#catalog");
}

function renderSourceCard(source, product, isActive) {
  const tag = source.tag ? `<span class="badge best">${escapeHtml(source.tag)}</span>` : "";
  const action = product.type === "услуга"
    ? `<button class="card-action" type="button" data-source-id="${escapeHtml(source.id)}">Выбрать</button>`
    : `<button class="card-action primary" type="button" data-source-id="${escapeHtml(source.id)}">Выбрать</button>`;
  return `
    <article class="source-card" data-best="${String(isActive)}">
      <div class="card-badges">${tag}<span class="badge">${escapeHtml(source.country)}</span></div>
      <h3>${escapeHtml(source.source)}</h3>
      <div class="source-meta">
        <span>${escapeHtml(source.country)}</span>
        <span>${escapeHtml(source.days)}</span>
        <span>${escapeHtml(source.stock || product.stock)}</span>
      </div>
      <div class="source-breakdown">
        <span><i>Товар</i><b>${formatPrice(source.itemPrice)}</b></span>
        <span><i>Доставка</i><b>${formatPrice(source.deliveryCost)}</b></span>
        <span><i>Наценка</i><b>${formatPrice(source.markup)}</b></span>
      </div>
      <div class="source-price-row"><strong>${formatPrice(source.finalPrice)}</strong></div>
      ${action}
    </article>
  `;
}

// ====== Корзина ======
function addToCart(productId, planId, sourceId) {
  const product = state.catalog.services.find(p => p.id === productId);
  if (!product) return;
  const plan = product.plans.find(p => p.id === planId) || product.plans[0];
  const source = product.sources.find(s => s.id === sourceId) || bestProductSource(product);
  const id = `${product.id}:${plan.id}:${source.id}`;
  const current = state.cart.find(item => item.id === id);
  if (current) {
    current.quantity += 1;
    current.productSnapshot ||= snapshotProduct(product);
    current.planSnapshot ||= snapshotPlan(plan);
    current.sourceSnapshot ||= snapshotSource(source);
  } else {
    state.cart.push({
      id,
      productId: product.id,
      planId: plan.id,
      sourceId: source.id,
      quantity: 1,
      productSnapshot: snapshotProduct(product),
      planSnapshot: snapshotPlan(plan),
      sourceSnapshot: snapshotSource(source)
    });
  }
  persistCart();
  renderCart();
  renderProfile();
}

function snapshotProduct(p) { return { id: p.id, title: p.title, type: p.type, category: p.category, categoryLabel: p.categoryLabel, seller: p.seller, asset: p.asset || "", plans: [], sources: [] }; }
function snapshotPlan(p) { return { id: p.id, label: p.label, price: Number(p.price || 0), currency: p.currency || "RUB", stars: Number(p.stars || 1) }; }
function snapshotSource(s) { return { id: s.id, source: s.source, country: s.country, itemPrice: Number(s.itemPrice || 0), deliveryCost: Number(s.deliveryCost || 0), markup: Number(s.markup || 0), finalPrice: Number(s.finalPrice || 0), days: s.days, tag: s.tag || "" }; }

function persistCart() { writeStorage(STORAGE_KEYS.cart, state.cart); }

function renderCart() {
  const rows = state.cart.map(resolveCartItem).filter(Boolean);
  const total = rows.reduce((sum, r) => sum + r.source.finalPrice * r.quantity, 0);
  const delivery = rows.reduce((sum, r) => sum + r.source.deliveryCost * r.quantity, 0);
  const markup = rows.reduce((sum, r) => sum + r.source.markup * r.quantity, 0);
  els.cartCount.textContent = String(rows.reduce((sum, r) => sum + r.quantity, 0));

  if (!rows.length) {
    els.cartList.innerHTML = `<article class="empty-card"><strong>Корзина пустая</strong><span>Добавьте товар из каталога или результата AI-поиска.</span></article>`;
    els.cartSummary.innerHTML = `<span>Итог: 0 ₽</span>`;
    return;
  }

  els.cartList.innerHTML = rows.map(row => `
    <article class="cart-item">
      <h3>${escapeHtml(row.product.title)}</h3>
      <div class="cart-line">
        <span>${escapeHtml(row.source.source)}</span>
        <span>${escapeHtml(row.source.country)}</span>
        <span>${escapeHtml(row.source.days)}</span>
      </div>
      <div class="source-breakdown">
        <span><i>Товар</i><b>${formatPrice(row.source.itemPrice)}</b></span>
        <span><i>Доставка</i><b>${formatPrice(row.source.deliveryCost)}</b></span>
        <span><i>Наценка</i><b>${formatPrice(row.source.markup)}</b></span>
        <span><i>Итог за шт.</i><b>${formatPrice(row.source.finalPrice)}</b></span>
      </div>
      <div class="cart-controls">
        <button class="qty-button" type="button" data-cart-dec="${escapeHtml(row.id)}">−</button>
        <strong>${row.quantity}</strong>
        <button class="qty-button" type="button" data-cart-inc="${escapeHtml(row.id)}">+</button>
        <button class="danger-button" type="button" data-cart-remove="${escapeHtml(row.id)}">Удалить</button>
      </div>
    </article>
  `).join("");

  els.cartSummary.innerHTML = `
    <div class="source-breakdown">
      <span><i>Доставка</i><b>${formatPrice(delivery)}</b></span>
      <span><i>Наценка</i><b>${formatPrice(markup)}</b></span>
    </div>
    <strong>Итого: ${formatPrice(total)}</strong>
    <button class="primary-button full" type="button" id="checkoutCartButton">Оформить через заявку</button>
  `;

  els.cartList.querySelectorAll("[data-cart-inc]").forEach(b => b.addEventListener("click", () => updateCartQty(b.dataset.cartInc, 1)));
  els.cartList.querySelectorAll("[data-cart-dec]").forEach(b => b.addEventListener("click", () => updateCartQty(b.dataset.cartDec, -1)));
  els.cartList.querySelectorAll("[data-cart-remove]").forEach(b => b.addEventListener("click", () => removeCartItem(b.dataset.cartRemove)));
  document.querySelector("#checkoutCartButton")?.addEventListener("click", checkoutCart);
}

function resolveCartItem(item) {
  const product = state.catalog.services.find(p => p.id === item.productId) || item.productSnapshot;
  if (!product) return null;
  const plans = Array.isArray(product.plans) ? product.plans : [item.planSnapshot].filter(Boolean);
  const sources = Array.isArray(product.sources) ? product.sources : [item.sourceSnapshot].filter(Boolean);
  const plan = plans.find(p => p.id === item.planId) || item.planSnapshot || plans[0];
  const source = sources.find(s => s.id === item.sourceId) || item.sourceSnapshot || bestProductSource(product);
  return { ...item, product, plan, source };
}

function updateCartQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) state.cart = state.cart.filter(i => i.id !== id);
  persistCart();
  renderCart();
  renderProfile();
}

function removeCartItem(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  persistCart();
  renderCart();
  renderProfile();
}

function openCart() {
  els.cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  els.cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function checkoutCart() {
  const first = state.cart.map(resolveCartItem).find(Boolean);
  if (!first) return;
  closeCart();
  closeDetail();
  selectPlan(first.product.id, first.plan.id, true);
  const rows = state.cart.map(resolveCartItem).filter(Boolean);
  const summary = rows.map(r => `${r.product.title} · ${r.source.source}, ${r.source.country}, ${r.quantity} шт., итог ${formatPrice(r.source.finalPrice * r.quantity)}`).join("; ");
  els.orderForm.comment.value = `Корзина: ${summary}`;
  els.requirementBox.textContent = "Корзина передается менеджеру в комментарии. Итоговая цена по источникам указана в корзине.";
  els.submitButton.disabled = false;
}

// ====== AI-поиск ======
async function submitAiSearch(event) {
  event.preventDefault();
  const name = els.aiProductName.value.trim();
  if (!name) return;
  const request = {
    id: safeId(),
    name,
    source: els.aiSourceUrl.value.trim(),
    region: els.aiRegion.value,
    weight: Number(els.aiWeight.value || 1),
    photo: els.aiPhoto.files?.[0]?.name || "",
    notes: els.aiNotes.value.trim(),
    createdAt: new Date().toISOString()
  };
  await runAiSearch(request);
}

async function runAiSearch(request) {
  const steps = [
    "Готовим предварительный расчет по данным формы...",
    "Подбираем 3 сценария из доступных источников...",
    "Считаем доставку, прозрачную наценку и итог...",
    "Формируем черновик заявки менеджеру..."
  ];
  els.aiLoading.hidden = false;
  els.aiResultGrid.innerHTML = "";
  for (const step of steps) {
    els.aiLoadingStep.textContent = step;
    await delay(220);
  }

  const matches = state.catalog.services.filter(p => {
    const text = `${p.title} ${p.subtitle} ${p.description} ${p.categoryLabel}`.toLowerCase();
    return text.includes(request.name.toLowerCase()) || request.name.toLowerCase().split(/\s+/).some(part => part.length > 2 && text.includes(part));
  });
  const baseProduct = matches[0] || createAiProduct(request);
  const variants = buildAiVariants(baseProduct, request);
  request.results = variants;
  state.aiHistory.unshift(request);
  state.aiHistory = state.aiHistory.slice(0, 12);
  writeStorage(STORAGE_KEYS.aiHistory, state.aiHistory);

  els.aiLoading.hidden = true;
  els.aiResultGrid.innerHTML = variants.map(source => renderAiVariant(source, baseProduct)).join("");
  els.aiResultGrid.querySelectorAll("[data-ai-cart]").forEach(b => {
    b.addEventListener("click", () => {
      addAiResultToCart(baseProduct, variants.find(s => s.id === b.dataset.aiCart));
      openCart();
    });
  });
  els.aiResultGrid.querySelectorAll("[data-ai-manager]").forEach(b => {
    b.addEventListener("click", () => {
      const source = variants.find(s => s.id === b.dataset.aiManager);
      state.supportMessages.push({
        role: "assistant",
        text: `Черновик заявки менеджеру: ${baseProduct.title}, вариант "${source?.tag}", итог ${formatPrice(source?.finalPrice || 0)}, источник ${source?.source}. Добавьте контакт и детали в checkout или поддержке.`
      });
      renderSupport();
      scrollToId("support");
    });
  });
  renderProfile();
}

function createAiProduct(request) {
  return {
    id: `ai-${safeId()}`,
    title: request.name,
    subtitle: "Найден через AI",
    description: `Запрос: ${request.name}. Источники подобраны автоматически.`,
    category: "ai-subscriptions",
    categoryLabel: "AI-подбор",
    type: "услуга",
    seller: "antichniistore AI",
    rating: 4.5,
    reviews: 0,
    official: false,
    stock: "По запросу",
    receiveMethod: "Менеджер",
    deliveryTime: "по запросу",
    sales: 0,
    createdAt: new Date().toISOString(),
    specs: ["AI-подбор", "Ручное подтверждение"],
    warranty: "Финальные условия подтверждает менеджер.",
    plans: [{ id: "ai-plan", label: "Заявка", price: 0, currency: "RUB", stars: 0 }],
    sources: [],
    requirements: request.notes || "Укажите детали в комментарии."
  };
}

function buildAiVariants(baseProduct, request) {
  const weight = request.weight || 1;
  const regions = {
    china: { source: "Poizon", country: "Китай", rate: 680, days: "14-21 день" },
    korea: { source: "Seoul Supply", country: "Южная Корея", rate: 840, days: "9-16 дней" },
    japan: { source: "Tokyo Buyer", country: "Япония", rate: 920, days: "7-14 дней" },
    europe: { source: "EU Outlet", country: "Европа", rate: 1180, days: "10-18 дней" },
    usa: { source: "US Stock", country: "США", rate: 1350, days: "12-22 дня" },
    auto: { source: "Local Partner", country: "Россия", rate: 390, days: "1-5 дней" }
  };
  const region = regions[request.region] || regions.auto;
  const basePrice = 1000 + Math.random() * 5000;
  const variants = [];
  const tags = ["дешевле", "оптимальный", "премиум"];
  for (let i = 0; i < 3; i++) {
    const itemPrice = basePrice * (0.8 + i * 0.2);
    const deliveryCost = region.rate * weight * (0.9 + i * 0.1);
    const markup = itemPrice * (0.1 + i * 0.1);
    const finalPrice = itemPrice + deliveryCost + markup;
    variants.push({
      id: `ai-${safeId()}`,
      source: region.source,
      country: region.country,
      itemPrice: Math.round(itemPrice),
      deliveryCost: Math.round(deliveryCost),
      markup: Math.round(markup),
      finalPrice: Math.round(finalPrice),
      days: region.days,
      tag: tags[i],
      explanation: `Предварительный расчет для ${request.name}. Цена может измениться.`
    });
  }
  return variants;
}

function renderAiVariant(source, product) {
  return `
    <article class="source-card" data-best="${["оптимальный", "Оптимально"].includes(source.tag)}">
      <div class="card-badges"><span class="badge best">${escapeHtml(source.tag)}</span><span class="badge">${escapeHtml(source.country)}</span></div>
      <h3>${escapeHtml(product.title)}</h3>
      <p>${escapeHtml(source.source)} · ${escapeHtml(source.days)}</p>
      <div class="source-breakdown">
        <span><i>Товар</i><b>${formatPrice(source.itemPrice)}</b></span>
        <span><i>Доставка</i><b>${formatPrice(source.deliveryCost)}</b></span>
        <span><i>Наценка</i><b>${formatPrice(source.markup)}</b></span>
      </div>
      <p>${escapeHtml(source.explanation || "Предварительный расчет. Финальную цену и наличие подтверждает менеджер.")}</p>
      <div class="source-price-row"><strong>${formatPrice(source.finalPrice)}</strong></div>
      <div class="source-actions">
        <button class="card-action primary" type="button" data-ai-cart="${escapeHtml(source.id)}">Добавить в корзину</button>
        <button class="card-action" type="button" data-ai-manager="${escapeHtml(source.id)}">Отправить менеджеру</button>
      </div>
    </article>
  `;
}

function addAiResultToCart(product, source) {
  if (!source) return;
  const existing = state.catalog.services.find(p => p.id === product.id);
  if (!existing) {
    state.catalog.services.push(product);
    renderFilterOptions();
    renderAll();
  }
  addToCart(product.id, product.plans[0].id, source.id);
}

function prefillAiSearchFromHeader() {
  els.aiProductName.value = els.searchInput.value.trim();
  scrollToId("ai-search");
  if (els.aiProductName.value) els.aiProductName.focus();
}

// ====== Поддержка ======
function renderSupport() {
  els.supportMessages.innerHTML = state.supportMessages.map(msg => `
    <div class="chat-message ${msg.role === 'assistant' ? 'compact' : ''}">
      <strong>${msg.role === 'assistant' ? 'Поддержка' : 'Вы'}:</strong>
      <span>${escapeHtml(msg.text)}</span>
    </div>
  `).join("");
  els.supportMessages.scrollTop = els.supportMessages.scrollHeight;
}

function submitSupportQuestion(e) {
  e.preventDefault();
  const text = els.supportInput.value.trim();
  if (!text) return;
  state.supportMessages.push({ role: "user", text });
  const lower = text.toLowerCase();
  const wantsManager = ["менеджер", "человек", "оператор", "свяжи", "лично"].some(w => lower.includes(w));
  const response = wantsManager
    ? "Понял. Я подготовил запрос менеджеру: тема, текст обращения и ссылка на диалог. В боевой версии это уйдет в Telegram владельцу."
    : supportAnswer(text);
  state.supportMessages.push({ role: "assistant", text: response });
  els.supportInput.value = "";
  renderSupport();
}

function supportAnswer(text) {
  const lower = text.toLowerCase();
  if (lower.includes("оплат")) return "Оплата на сайте сохраняет основной вариант: Карта РФ / СБП. Для отдельных заказов можно выбрать crypto, Tribute, Stars или менеджера.";
  if (lower.includes("достав")) return "Для физических товаров карточка показывает страну, источник, срок доставки, стоимость доставки, наценку и финальную цену.";
  if (lower.includes("возврат")) return "Возвраты обрабатываются через менеджера. В профиле предусмотрен статус заказа «возврат».";
  if (lower.includes("каталог")) return "Откройте каталог в шапке или выберите категорию на главной. AI-поиск поможет, если товара еще нет в каталоге.";
  return "Я могу помочь с поиском товара, оплатой, доставкой, возвратом или подключить менеджера.";
}

// ====== Профиль ======
function renderProfile() {
  const content = els.profileContent;
  const tab = state.profileTab || "home";
  switch (tab) {
    case "home": {
      const orders = state.orders;
      const favorites = state.cart.length;
      content.innerHTML = `
        <div class="profile-head"><div class="profile-avatar">👤</div><div><strong>Покупатель</strong><span>${orders.length} заказов</span></div></div>
        <div class="profile-metrics">
          <div><strong>${orders.length}</strong><span>Заказов</span></div>
          <div><strong>${favorites}</strong><span>В корзине</span></div>
          <div><strong>${state.sellerApplications.length}</strong><span>Заявок продавца</span></div>
        </div>
        <div class="profile-section"><h3>Последние заказы</h3>${orders.slice(0, 3).map(o => `<div class="status-row"><span>${escapeHtml(o.productTitle)}</span><span>${escapeHtml(o.status)}</span><span>${formatPrice(o.price)}</span></div>`).join("") || "<p>Нет заказов</p>"}</div>
      `;
      break;
    }
    case "orders": {
      content.innerHTML = `<h3>Все заказы</h3>${state.orders.map(o => `<div class="status-row"><span>${escapeHtml(o.id)}</span><span>${escapeHtml(o.productTitle)}</span><span>${escapeHtml(o.status)}</span><span>${formatPrice(o.price)}</span></div>`).join("") || "<p>Нет заказов</p>"}`;
      break;
    }
    case "favorites": {
      content.innerHTML = `<h3>Избранное</h3><p>Функция в разработке. Пока используйте корзину.</p>`;
      break;
    }
    case "ai": {
      content.innerHTML = `<h3>История AI-поиска</h3>${state.aiHistory.map(h => `<div class="status-row"><span>${escapeHtml(h.name)}</span><span>${new Date(h.createdAt).toLocaleDateString()}</span></div>`).join("") || "<p>Нет запросов</p>"}`;
      break;
    }
    case "notifications": {
      content.innerHTML = `<h3>Уведомления</h3><p>У вас нет новых уведомлений.</p>`;
      break;
    }
    case "addresses": {
      content.innerHTML = `<h3>Адреса доставки</h3><p>Добавьте адрес в форме заказа.</p>`;
      break;
    }
    case "settings": {
      content.innerHTML = `<h3>Настройки</h3><p>Здесь будут настройки профиля.</p>`;
      break;
    }
    case "seller": {
  // Форма подачи заявки
  const formHtml = `
    <h3>Стать продавцом</h3>
    <form class="seller-form" id="sellerForm">
      <label>
        Контакт
        <input name="contact" type="text" placeholder="@telegram или email" required>
      </label>
      <label>
        Имя магазина
        <input name="store" type="text" placeholder="Название магазина или ник" required>
      </label>
      <label>
        Категория
        <select name="category" id="sellerCategorySelect"></select>
      </label>
      <label>
        Что хотите продавать
        <textarea name="goods" rows="3" placeholder="Опишите товары, услуги, подписки или источники" required></textarea>
      </label>
      <label>
        Ссылки / примеры
        <input name="links" type="text" placeholder="сайт, Telegram, фото, каталог">
      </label>
      <label>
        Город / страна
        <input name="location" type="text" placeholder="Москва, РФ">
      </label>
      <label>
        Комментарий
        <textarea name="comment" rows="3" placeholder="Условия, сроки, документы, формат работы"></textarea>
      </label>
      <button class="primary-button full" type="submit">Отправить заявку продавца</button>
    </form>
    <div class="seller-result" id="sellerResult"></div>
  `;

  // Список поданных заявок
  const listHtml = `
    <h4>Ваши заявки</h4>
    ${state.sellerApplications.length
      ? state.sellerApplications.map(a => `
          <div class="status-row">
            <span>${escapeHtml(a.store)}</span>
            <span>${escapeHtml(a.status)}</span>
            <span>${new Date(a.createdAt).toLocaleDateString()}</span>
          </div>
        `).join('')
      : '<p>Нет заявок</p>'
    }
  `;

  content.innerHTML = formHtml + listHtml;

  // Заполняем выпадающий список категорий
  const catSelect = document.getElementById('sellerCategorySelect');
  if (catSelect) {
    catSelect.innerHTML = state.catalog.categories
      .filter(c => c.id !== 'all')
      .map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`)
      .join('');
  }

  // Привязываем обработчик отправки формы
  const form = document.getElementById('sellerForm');
  if (form) {
    form.addEventListener('submit', submitSellerApplication);
  }
  break;
}
    default: content.innerHTML = "<p>Раздел в разработке</p>";
  }
}

function handleProfileMenu(e) {
  const button = e.target.closest("[data-profile-tab]");
  if (!button) return;
  state.profileTab = button.dataset.profileTab;
  document.querySelectorAll("[data-profile-tab]").forEach(b => b.setAttribute("aria-selected", String(b === button)));
  renderProfile();
}

// ====== Заявка продавца ======
function submitSellerApplication(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  const application = {
    id: `SELL-${String(state.sellerApplications.length + 1).padStart(4, "0")}`,
    contact: String(formData.get("contact") || "").trim(),
    store: String(formData.get("store") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    goods: String(formData.get("goods") || "").trim(),
    links: String(formData.get("links") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    comment: String(formData.get("comment") || "").trim(),
    status: "new",
    createdAt: new Date().toISOString()
  };

  if (!application.contact || !application.store || !application.goods) {
    const resultEl = document.getElementById('sellerResult');
    if (resultEl) {
      resultEl.innerHTML = `<strong>Заполните контакт, магазин и описание</strong><span>Эти поля нужны менеджеру для первичной проверки.</span>`;
    }
    return;
  }

  state.sellerApplications.unshift(application);
  writeStorage(STORAGE_KEYS.sellerApplications, state.sellerApplications);

  const resultEl = document.getElementById('sellerResult');
  if (resultEl) {
    resultEl.innerHTML = `<strong>Заявка отправлена!</strong><span>Номер: ${application.id}. Менеджер свяжется с вами в ближайшее время.</span>`;
  }
  form.reset();
  renderProfile();
}

// ====== Оформление заказа ======
function selectPlan(productId, planId, openDrawerFlag = false) {
  const product = state.catalog.services.find(p => p.id === productId);
  if (!product) return;
  const plan = product.plans.find(p => p.id === planId) || product.plans[0];
  const source = selectedSource(product);
  state.selectedProduct = product;
  state.selectedPlan = plan;
  els.selectedService.innerHTML = `
    <strong>${escapeHtml(product.title)}</strong>
    <span>${escapeHtml(plan.label)} — ${formatPrice(plan.price, plan.currency)}</span>
    <span>${escapeHtml(source.source)} · ${escapeHtml(source.country)}</span>
  `;
  els.requirementBox.textContent = product.requirements || "Данные для заказа: укажите контакт и детали.";
  els.accountLabel.textContent = product.accountPlaceholder || "Данные для заказа";
  els.accountInput.placeholder = product.accountPlaceholder || "логин, email, ID, размер или регион";
  els.accountInput.value = "";
  els.orderForm.comment.value = "";
  els.submitButton.disabled = false;
  if (openDrawerFlag) openDrawer();
}

function openDrawer() {
  els.checkoutDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  els.checkoutDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
}

function submitOrder(e) {
  e.preventDefault();
  const form = els.orderForm;
  const contact = form.contact.value.trim();
  const account = els.accountInput.value.trim();
  const paymentMethod = form.paymentMethod?.value || "manual";
  const comment = form.comment.value.trim();
  if (!contact || !account) {
    els.orderResult.innerHTML = `<strong>Ошибка</strong><span>Заполните контакт и данные для заказа.</span>`;
    els.orderResult.hidden = false;
    return;
  }
  const product = state.selectedProduct;
  const plan = state.selectedPlan;
  if (!product || !plan) {
    els.orderResult.innerHTML = `<strong>Ошибка</strong><span>Выберите товар из каталога.</span>`;
    els.orderResult.hidden = false;
    return;
  }
  const order = {
    id: `ORD-${safeId().toUpperCase()}`,
    productId: product.id,
    productTitle: product.title,
    planLabel: plan.label,
    price: plan.price,
    currency: plan.currency,
    contact,
    account,
    paymentMethod,
    comment,
    status: "найден",
    createdAt: new Date().toISOString(),
    source: state.selectedSourceByProduct[product.id] || "manual"
  };
  state.orders.unshift(order);
  writeStorage(STORAGE_KEYS.orders, state.orders);
  els.orderResult.innerHTML = `
    <strong>Заявка создана!</strong>
    <span>Номер: ${order.id}. Менеджер свяжется с вами по указанному контакту.</span>
    <span>Статус: ${order.status}</span>
    <span>Сумма: ${formatPrice(order.price, order.currency)}</span>
  `;
  els.orderResult.hidden = false;
  els.submitButton.disabled = true;
  renderProfile();
  // Отправить на сервер (опционально)
  fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  }).catch(() => {});
}

// ====== Рендер агентов (шаги) ======
function renderAgents() {
  if (!els.agentGrid) return;
  els.agentGrid.innerHTML = workSteps.map(step => `
    <article class="agent-card">
      <h3>${escapeHtml(step.name)}</h3>
      <div class="agent-meta">${escapeHtml(step.status)}</div>
      <p>${escapeHtml(step.description)}</p>
    </article>
  `).join("");
}

// ====== Навигация и роутинг ======
function handleRoute(popstate) {
  const hash = location.hash;
  if (hash.startsWith("#product=")) {
    const id = decodeURIComponent(hash.replace("#product=", ""));
    openDetail(id, false);
    return;
  }
  if (hash.startsWith("#catalog")) {
    const params = new URLSearchParams(hash.replace("#catalog", ""));
    const cat = params.get("cat");
    if (cat && cat !== "all") {
      state.filters = { ...defaultFilters(), category: cat };
      state.draftFilters = { ...state.filters };
      syncFilterControls(state.draftFilters);
      renderCategoryTiles();
      renderCatalog();
    }
    scrollToId("catalog");
    return;
  }
  const path = location.pathname.replace(/^\/+/, "") || "home";
  const pageMap = { "": "home", "support": "support", "profile": "profile", "popular": "home", "official": "home", "digital": "home", "ai": "home", "music": "home", "video": "home", "games": "home" };
  const page = pageMap[path] || "home";
  if (page === "home" && path !== "home" && path !== "") {
    // quick view
    if (catalogViews[`/${path}`]) {
      applyCatalogView(path, true);
    }
  }
  if (page !== state.currentPage) {
    setPage(page, false);
  }
  if (page === "support" || page === "profile") {
    scrollToId(page);
  } else {
    scrollToId("home");
  }
}

function applyCatalogView(viewKey, updateHistory = false) {
  const view = catalogViews[`/${viewKey}`] || {};
  if (view.category) {
    state.filters = { ...defaultFilters(), category: view.category };
  } else if (view.sort) {
    state.filters = { ...defaultFilters(), sort: view.sort };
  } else if (view.plugOnly) {
    state.filters = { ...defaultFilters(), plugOnly: true };
  }
  state.draftFilters = { ...state.filters };
  syncFilterControls(state.draftFilters);
  renderCategoryTiles();
  renderCatalog();
  if (updateHistory) {
    history.pushState(null, "", `/${viewKey}`);
  }
  scrollToId("catalog");
}

// ====== Инициализация ======
function initTelegramMiniApp() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  document.body.dataset.telegramMiniApp = "true";
  tg.ready();
  tg.expand();
  if (tg.themeParams?.bg_color) {
    document.documentElement.style.setProperty("--bg", tg.themeParams.bg_color);
  }
  const user = tg.initDataUnsafe?.user;
  if (user && els.orderForm?.contact && !els.orderForm.contact.value) {
    els.orderForm.contact.value = user.username ? `@${user.username}` : [user.first_name, user.last_name].filter(Boolean).join(" ");
  }
}

function bindEvents() {
  on(els.searchInput, "input", handleSearchInput);
  on(els.searchInput, "keydown", e => {
    if (e.key === "Enter" && state.searchMode === "ai") {
      e.preventDefault();
      prefillAiSearchFromHeader();
    }
    // УДАЛИТЬ ВЛОЖЕННЫЙ КОД ДЛЯ becomeSellerBtn
  });
  on(els.regularSearchTab, "click", () => setSearchMode("regular"));
  on(els.aiSearchTab, "click", () => setSearchMode("ai"));
  on(els.catalogMenuButton, "click", toggleMegaMenu);
  on(document, "click", closeMegaOnOutside);
  on(els.supportButton, "click", () => navigateToPage("support"));
  on(els.cartButton, "click", openCart);
  on(els.bottomCartButton, "click", openCart);
  on(els.profileButton, "click", () => navigateToPage("profile"));
  on(els.catalogFilterForm, "submit", applyFilters);
  on(els.categoryFilter, "change", e => { state.draftFilters.category = e.target.value; });
  on(els.typeFilter, "change", e => { state.draftFilters.type = e.target.value; });
  on(els.minPriceFilter, "input", e => { state.draftFilters.minPrice = e.target.value; });
  on(els.maxPriceFilter, "input", e => { state.draftFilters.maxPrice = e.target.value; });
  on(els.ratingFilter, "change", e => { state.draftFilters.rating = e.target.value; });
  on(els.sellerFilter, "input", e => { state.draftFilters.seller = e.target.value.trim().toLowerCase(); });
  on(els.plugOnlyFilter, "change", e => { state.draftFilters.plugOnly = e.target.checked; });
  on(els.stockFilter, "change", e => { state.draftFilters.stockOnly = e.target.checked; });
  on(els.receiveFilter, "change", e => { state.draftFilters.receiveMethod = e.target.value; });
  on(els.sortSelect, "change", e => { state.draftFilters.sort = e.target.value; });
  on(els.resetFilters, "click", resetFilters);
  on(els.aiSearchForm, "submit", submitAiSearch);
  on(els.supportForm, "submit", submitSupportQuestion);
  // on(els.sellerForm, "submit", submitSellerApplication); // больше не нужно, привязываем динамически

  document.querySelectorAll("[data-close-cart]").forEach(el => el.addEventListener("click", closeCart));
  document.querySelectorAll("[data-close-drawer]").forEach(el => el.addEventListener("click", closeDrawer));
  on(els.closeCart, "click", closeCart);
  on(els.closeDrawer, "click", closeDrawer);
  on(els.bottomOrderButton, "click", openDrawer);
  on(els.orderForm, "submit", submitOrder);
  on(els.profileMenu, "click", handleProfileMenu);
  on(document, "click", e => {
    const btn = e.target.closest("#checkoutCartButton");
    if (btn) checkoutCart();
  });
  on(window, "hashchange", () => handleRoute(true));
  on(window, "popstate", () => handleRoute(true));
  document.querySelectorAll("[data-catalog-view]").forEach(node => {
    node.addEventListener("click", e => {
      e.preventDefault();
      applyCatalogView(node.dataset.catalogView, true);
    });
  });

  // ===== НОВЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ "СТАТЬ ПРОДАВЦОМ" =====
  const becomeSellerBtn = document.getElementById('becomeSellerBtn');
  if (becomeSellerBtn) {
    becomeSellerBtn.addEventListener('click', function() {
      navigateToPage('profile');
      state.profileTab = 'seller';
      document.querySelectorAll('[data-profile-tab]').forEach(b => {
        b.setAttribute('aria-selected', String(b.dataset.profileTab === 'seller'));
      });
      renderProfile();
    });
  }
}

function on(target, event, handler) {
  if (target) target.addEventListener(event, handler);
}

const brandLink = document.querySelector('.brand');
if (brandLink) {
  brandLink.addEventListener('click', function(e) {
    e.preventDefault(); // предотвращаем переход по ссылке
    navigateToPage('home'); // переключаемся на главную страницу
    // опционально: обновить URL
    history.pushState(null, '', '/');
    // прокрутить к началу
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ====== Старт ======
(async function boot() {
  initTelegramMiniApp();
  bindEvents();
  await loadCatalog();
  renderSupport();
  renderProfile();
  renderAgents();
  renderCart();
  handleRoute(false);
})();