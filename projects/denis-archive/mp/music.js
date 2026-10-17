(() => {
  const list = document.querySelector(".music_proektor_1");
  const search = document.querySelector("#song-search");
  if (!list || !search) return;

  const covers = [...list.querySelectorAll("img")];
  const labels = [...list.querySelectorAll("a")];
  const count = Math.min(covers.length, Math.floor(labels.length / 2));
  if (!count) return;

  const albums = Array.from({ length: count }, (_, index) => ({
    index,
    cover: covers[index].getAttribute("src"),
    artist: labels[index]?.textContent.trim() || "Artist",
    title: labels[index + count]?.textContent.trim() || "Album"
  }));
  const favoriteKey = "mp.music-player.favorites.v1";
  const slider = document.querySelector("#album-range");
  const sliderOutput = document.querySelector("#album-range-value");
  let favorites = [];
  try { favorites = JSON.parse(localStorage.getItem(favoriteKey) || "[]"); } catch { favorites = []; }
  let mode = "albums";
  let selectedIndex = 0;
  let activeAlbum = null;
  let visibleAlbums = albums;
  let isDemoOn = false;

  const albumKey = album => `${album.artist}::${album.title}`;
  const artistItems = () => [...new Map(albums.map(album => [album.artist, album])).values()];
  const setTab = active => {
    document.querySelectorAll(".catalog_1, .catalog_2, .catalog_3, .catalog_4, .catalog_5, .catalog_6, .top").forEach(button => {
      button.setAttribute("aria-pressed", String(button === active));
    });
  };
  const render = () => {
    const term = search.value.trim().toLocaleLowerCase();
    let source = mode === "artists" ? artistItems() : albums;
    if (mode === "favorites") source = albums.filter(album => favorites.includes(albumKey(album)));
    if (mode === "top") source = albums.slice(0, 10);
    visibleAlbums = source.filter(album => `${album.artist} ${album.title}`.toLocaleLowerCase().includes(term));
    list.innerHTML = visibleAlbums.map(album => `
      <button class="track-card" type="button" data-index="${album.index}" aria-label="Открыть альбом ${album.title}, ${album.artist}">
        <img src="${album.cover}" alt="Обложка альбома ${album.title}" loading="lazy">
        <strong title="${album.artist}">${album.artist}</strong>
        <span title="${mode === "artists" ? "Артист — открыть подборку" : album.title}">${mode === "artists" ? "Открыть артиста　↗" : album.title}</span>
      </button>`).join("") || `<p class="no-results">${mode === "favorites" && !favorites.length ? "Здесь будут ваши любимые альбомы." : "Ничего не найдено. Попробуйте изменить запрос."}</p>`;
    list.classList.toggle("top-list", mode === "top");
    if (slider) {
      slider.max = String(Math.max(0, visibleAlbums.length - 1));
      slider.value = "0";
      slider.disabled = visibleAlbums.length < 2;
    }
    if (sliderOutput) sliderOutput.value = `01 / ${String(visibleAlbums.length).padStart(2, "0")}`;
    list.scrollLeft = 0;
  };
  const scrollToSlide = () => {
    const position = Number(slider?.value || 0);
    const album = visibleAlbums[position];
    if (!album) return;
    const card = list.querySelector(`[data-index="${album.index}"]`);
    if (card) list.scrollTo({ left: card.offsetLeft - list.offsetLeft, behavior: "smooth" });
    if (sliderOutput) sliderOutput.value = `${String(position + 1).padStart(2, "0")} / ${String(visibleAlbums.length).padStart(2, "0")}`;
  };
  const updateTrack = (index, status = "Выбран") => {
    selectedIndex = (index + albums.length) % albums.length;
    const album = albums[selectedIndex];
    const label = document.querySelector("#current-track");
    if (label) label.textContent = `${status}: ${album.artist} · ${album.title} — аудио не подключено`;
  };
  const openAlbum = album => {
    activeAlbum = album;
    updateTrack(album.index);
    const dialog = document.querySelector("#album-dialog");
    const cover = document.querySelector("#album-dialog-cover");
    const title = document.querySelector("#album-dialog-title");
    const artist = document.querySelector("#album-dialog-artist");
    const favoriteButton = document.querySelector("#favorite-toggle");
    if (!dialog || !cover || !title || !artist || !favoriteButton) return;
    cover.src = album.cover;
    cover.alt = `Обложка ${album.title}`;
    title.textContent = album.title;
    artist.textContent = album.artist;
    favoriteButton.textContent = favorites.includes(albumKey(album)) ? "★ В избранном" : "☆ В избранное";
    if (!dialog.open) dialog.showModal();
  };
  const switchMode = (nextMode, button) => {
    mode = nextMode;
    setTab(button);
    render();
  };

  search.type = "search";
  search.setAttribute("aria-label", "Поиск по артистам и альбомам");
  search.addEventListener("input", render);
  slider?.addEventListener("input", scrollToSlide);
  document.querySelector(".catalog_1")?.addEventListener("click", event => { search.value = ""; switchMode("albums", event.currentTarget); });
  document.querySelector(".catalog_2")?.addEventListener("click", event => switchMode("albums", event.currentTarget));
  document.querySelector(".catalog_3")?.addEventListener("click", event => switchMode("artists", event.currentTarget));
  document.querySelector(".catalog_4")?.addEventListener("click", event => switchMode("albums", event.currentTarget));
  document.querySelector(".catalog_6")?.addEventListener("click", event => switchMode("favorites", event.currentTarget));
  document.querySelector(".catalog_5")?.addEventListener("click", () => document.querySelector(".need")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  document.querySelector(".top")?.addEventListener("click", event => { search.value = ""; switchMode(mode === "top" ? "albums" : "top", event.currentTarget); });
  document.querySelector(".scroll")?.addEventListener("click", () => {
    document.querySelector("#store")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => search.focus({ preventScroll: true }), 350);
  });
  document.querySelectorAll(".song").forEach(button => button.addEventListener("click", () => {
    document.querySelector("#store")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => search.focus({ preventScroll: true }), 350);
  }));
  let isMiniDemoOn = false;
  const listenButton = document.querySelector(".listen");
  const listenLabel = document.querySelector(".listen-label");
  const musicFeedback = document.querySelector("#music-feedback");
  listenButton?.addEventListener("click", () => {
    isMiniDemoOn = !isMiniDemoOn;
    listenButton.setAttribute("aria-pressed", String(isMiniDemoOn));
    document.querySelector(".dekstop-2")?.classList.toggle("is-playing", isMiniDemoOn);
    if (listenLabel) listenLabel.textContent = isMiniDemoOn ? "Pause demo" : "Listen now";
    if (musicFeedback) musicFeedback.textContent = isMiniDemoOn
      ? "Демо-режим включён · аудиозапись в макете не подключена."
      : "Демо-режим остановлен · аудиозапись в макете не подключена.";
  });
  const aboutToggle = document.querySelector(".about-toggle");
  const aboutExtra = document.querySelector("#about-extra");
  aboutToggle?.addEventListener("click", () => {
    const expanded = aboutToggle.getAttribute("aria-expanded") !== "true";
    aboutToggle.setAttribute("aria-expanded", String(expanded));
    if (aboutExtra) aboutExtra.hidden = !expanded;
    const icon = aboutToggle.querySelector("span");
    if (icon) icon.textContent = expanded ? "−" : "＋";
  });
  list.addEventListener("click", event => {
    const card = event.target.closest(".track-card");
    if (!card) return;
    const album = albums[Number(card.dataset.index)];
    if (!album) return;
    if (mode === "artists") {
      search.value = album.artist;
      switchMode("albums", document.querySelector(".catalog_4"));
      return;
    }
    openAlbum(album);
  });
  document.querySelector("#favorite-toggle")?.addEventListener("click", event => {
    if (!activeAlbum) return;
    const key = albumKey(activeAlbum);
    favorites = favorites.includes(key) ? favorites.filter(item => item !== key) : [...favorites, key];
    try { localStorage.setItem(favoriteKey, JSON.stringify(favorites)); } catch { /* keep this session's selection */ }
    event.currentTarget.textContent = favorites.includes(key) ? "★ В избранном" : "☆ В избранное";
    if (mode === "favorites") render();
  });
  document.querySelector("#album-close")?.addEventListener("click", () => document.querySelector("#album-dialog")?.close());
  document.querySelector("#album-dialog")?.addEventListener("click", event => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
  document.querySelector(".back")?.addEventListener("click", () => updateTrack(selectedIndex - 1));
  document.querySelector(".up")?.addEventListener("click", () => updateTrack(selectedIndex + 1));
  document.querySelector(".pause")?.addEventListener("click", event => {
    isDemoOn = !isDemoOn;
    event.currentTarget.setAttribute("aria-pressed", String(isDemoOn));
    event.currentTarget.classList.toggle("is-demo-on", isDemoOn);
    const album = albums[selectedIndex];
    const label = document.querySelector("#current-track");
    if (label) label.textContent = isDemoOn ? `Демо-плеер включён: ${album.artist} · ${album.title} — аудио не подключено` : "Демо-плеер остановлен · аудио не подключено";
  });
  document.querySelectorAll(".win, .mac").forEach(button => button.addEventListener("click", () => {
    const notice = document.querySelector("#download-feedback");
    if (!notice) return;
    notice.hidden = false;
    notice.textContent = "Установочный файл пока не приложен к макету.";
  }));
  render();
})();
