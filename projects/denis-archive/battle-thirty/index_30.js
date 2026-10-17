// index_30.js — полностью автономная генерация данных + карта

let map;
let currentLayerGroup = null;
let animationInterval = null;
let currentFrame = 0;
let totalFrames = 18;
let battleData = null;

const slider = document.getElementById('timelineSlider');
const timeLabel = document.getElementById('timeLabel');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');

// ------------------------------------------------------------------
// Генерация полного battleData с timeline (18 кадров, 6 часов)
// ------------------------------------------------------------------
function generateBattleData() {
    const center = [47.958, -2.133];
    const unitTypes = [
        { id: "english", name: "Английский рыцарь/латник", shape: "circle" },
        { id: "mercenary", name: "Наёмник (немецкий/фламандский/бретонский)", shape: "square" },
        { id: "french_knight", name: "Французский рыцарь", shape: "triangle" },
        { id: "french_squire", name: "Французский оруженосец", shape: "diamond" }
    ];

    // --- Создание списка воинов ---
    let warriors = [];
    let idCounter = 0;
    const alliedCenter = [center[0] + 0.0015, center[1] - 0.012];
    const enemyCenter = [center[0] - 0.0005, center[1] + 0.011];

    function randomOffset(baseLat, baseLng, rangeLat = 0.002, rangeLng = 0.003) {
        return [baseLat + (Math.random() - 0.5) * rangeLat, baseLng + (Math.random() - 0.5) * rangeLng];
    }

    // 8 англичан
    for (let i = 0; i < 8; i++) {
        warriors.push({
            id: idCounter++, typeId: "english", side: "allied",
            initialPos: randomOffset(alliedCenter[0], alliedCenter[1], 0.002, 0.003),
            status: "alive", deathFrame: null
        });
    }
    // 22 наёмника
    for (let i = 0; i < 22; i++) {
        warriors.push({
            id: idCounter++, typeId: "mercenary", side: "allied",
            initialPos: randomOffset(alliedCenter[0], alliedCenter[1], 0.0025, 0.0032),
            status: "alive", deathFrame: null
        });
    }
    // 9 французских рыцарей
    for (let i = 0; i < 9; i++) {
        warriors.push({
            id: idCounter++, typeId: "french_knight", side: "enemy",
            initialPos: randomOffset(enemyCenter[0], enemyCenter[1], 0.0022, 0.003),
            status: "alive", deathFrame: null
        });
    }
    // 21 оруженосец
    for (let i = 0; i < 21; i++) {
        warriors.push({
            id: idCounter++, typeId: "french_squire", side: "enemy",
            initialPos: randomOffset(enemyCenter[0], enemyCenter[1], 0.0028, 0.0035),
            status: "alive", deathFrame: null
        });
    }

    // --- Потери ---
    const englishIds = warriors.filter(w => w.typeId === "english").map(w => w.id);
    const knightIds = warriors.filter(w => w.typeId === "french_knight").map(w => w.id);
    const squireIds = warriors.filter(w => w.typeId === "french_squire").map(w => w.id);

    // Первый акт (кадр 3): гибнут 2 англичанина, 3 рыцаря, 2 оруженосца
    const deadEnglish1 = englishIds.slice(0, 2);
    const deadKnights = knightIds.slice(0, 3);
    const deadSquires1 = squireIds.slice(0, 2);
    deadEnglish1.forEach(id => { const w = warriors.find(w => w.id === id); if (w) { w.status = "dead"; w.deathFrame = 3; } });
    deadKnights.forEach(id => { const w = warriors.find(w => w.id === id); if (w) { w.status = "dead"; w.deathFrame = 3; } });
    deadSquires1.forEach(id => { const w = warriors.find(w => w.id === id); if (w) { w.status = "dead"; w.deathFrame = 3; } });

    // Второй акт (кадр 10): гибнут ещё 3 англичанина и 4 наёмника
    const aliveAfterFirst = warriors.filter(w => w.status === "alive");
    const remainingEnglish = aliveAfterFirst.filter(w => w.typeId === "english").map(w => w.id);
    const remainingMercs = aliveAfterFirst.filter(w => w.typeId === "mercenary").map(w => w.id);
    const deadEnglish2 = remainingEnglish.slice(0, 3);
    const deadMercs = remainingMercs.slice(0, 4);
    deadEnglish2.forEach(id => { const w = warriors.find(w => w.id === id); if (w) { w.status = "dead"; w.deathFrame = 10; } });
    deadMercs.forEach(id => { const w = warriors.find(w => w.id === id); if (w) { w.status = "dead"; w.deathFrame = 10; } });

    // --- Целевые позиции для живых (финал) ---
    warriors.forEach(w => {
        if (w.status === "alive") {
            if (w.side === "allied") {
                w.targetPos = randomOffset(center[0] - 0.001, center[1] + 0.008, 0.002, 0.003);
            } else {
                w.targetPos = randomOffset(center[0], center[1], 0.003, 0.004);
            }
        } else {
            // Позиция смерти: интерполируем от начальной до центра схватки
            const clashCenter = randomOffset(center[0], center[1], 0.002, 0.003);
            const t = w.deathFrame / totalFrames;
            const lat = w.initialPos[0] + (clashCenter[0] - w.initialPos[0]) * t;
            const lng = w.initialPos[1] + (clashCenter[1] - w.initialPos[1]) * t;
            w.deathPos = [lat, lng];
        }
    });

    function getPositionAtFrame(warrior, frame) {
        if (warrior.status === "dead") {
            if (frame >= warrior.deathFrame) return warrior.deathPos;
            const t = frame / warrior.deathFrame;
            const lat = warrior.initialPos[0] + (warrior.deathPos[0] - warrior.initialPos[0]) * t;
            const lng = warrior.initialPos[1] + (warrior.deathPos[1] - warrior.initialPos[1]) * t;
            return [lat, lng];
        } else {
            const t = frame / totalFrames;
            const lat = warrior.initialPos[0] + (warrior.targetPos[0] - warrior.initialPos[0]) * t;
            const lng = warrior.initialPos[1] + (warrior.targetPos[1] - warrior.initialPos[1]) * t;
            return [lat, lng];
        }
    }

    // --- Построение timeline (18 кадров) ---
    const timeline = [];
    for (let frame = 0; frame < totalFrames; frame++) {
        const minutesTotal = frame * 20; // 20 минут на кадр
        const hours = Math.floor(minutesTotal / 60);
        const minutes = minutesTotal % 60;
        const timeStr = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`;
        const frameData = { time: timeStr, english: [], mercenary: [], french_knight: [], french_squire: [] };
        warriors.forEach(w => {
            const pos = getPositionAtFrame(w, frame);
            const status = (w.status === "dead" && frame >= w.deathFrame) ? "dead" : "alive";
            frameData[w.typeId].push([pos[0], pos[1], status]);
        });
        timeline.push(frameData);
    }
    return { battle: { name: "Битва тридцати", author: "Генератор", center: center }, unit_types: unitTypes, timeline: timeline };
}

// ------------------------------------------------------------------
// Инициализация карты и отрисовка
// ------------------------------------------------------------------
function initMap() {
    map = L.map('battleMap').setView(battleData.battle.center, 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB',
        subdomains: 'abcd',
        maxZoom: 18,
        minZoom: 12
    }).addTo(map);

    L.marker(battleData.battle.center, {
        icon: L.divIcon({ className: 'battle-marker', html: '🏰', iconSize: [24,24] })
    }).bindTooltip("Поле битвы (около замка Жослен)", { sticky: true }).addTo(map);

    // Легенда поверх карты
    const legendDiv = document.createElement('div');
    legendDiv.className = 'custom-map-legend';
    legendDiv.innerHTML = `
        <div><span style="color:#00FF00">●</span> Англичане &nbsp; <span style="color:#00FF00">■</span> Наёмники</div>
        <div><span style="color:#FF0000">▲</span> Франц. рыцари &nbsp; <span style="color:#FF0000">◆</span> Оруженосцы</div>
        <div><span style="color:#898989">⚫</span> Погибшие (серый)</div>
        <div style="font-size:9px; margin-top:4px;">⏱ Каждый кадр = 20 мин. 18 кадров (6ч)</div>
    `;
    document.querySelector('.map-container').appendChild(legendDiv);

    // Инфопанель
    const infoControl = L.control({ position: 'topright' });
    infoControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'info-panel');
        div.innerHTML = `<div style="background: #1e2e1ccc; padding: 5px 10px; border-radius: 14px; font-size: 12px; max-width: 210px; backdrop-filter: blur(8px);">
            <b>⚔️ Ход битвы</b><br>
            • 1-й акт (01:00): гибель 2 англичан и 5 французов<br>
            • Предательство (03:20): опрокинуты 7 союзников<br>
            • Финальный натиск: победа французов<br>
            🕒 <i>Наведите на отряд → информация</i>
        </div>`;
        return div;
    };
    infoControl.addTo(map);
}

function getColor(side, status) {
    if (status === "dead") return "#898989";
    return side === "allied" ? "#00FF00" : "#FF0000";
}

function createIcon(shape, color) {
    const size = 20;
    let html = '';
    switch(shape) {
        case 'circle':
            html = `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border-radius: 50%; border: 1px solid rgba(0,0,0,0.3); box-shadow: 0 0 2px black;"></div>`;
            break;
        case 'square':
            html = `<div style="width: ${size-2}px; height: ${size-2}px; background-color: ${color}; border: 1px solid #222;"></div>`;
            break;
        case 'triangle':
            html = `<div style="width: 0; height: 0; border-left: ${size/1.6}px solid transparent; border-right: ${size/1.6}px solid transparent; border-bottom: ${size}px solid ${color}; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));"></div>`;
            break;
        case 'diamond':
            html = `<div style="width: ${size-4}px; height: ${size-4}px; background-color: ${color}; transform: rotate(45deg); border: 1px solid #111;"></div>`;
            break;
        default:
            html = `<div style="width: 14px; height: 14px; background: ${color}; border-radius: 2px;"></div>`;
    }
    return L.divIcon({ className: 'custom-unit-icon', html: html, iconSize: [size, size], popupAnchor: [0, -8], tooltipAnchor: [8, -6] });
}

function renderFrame(frameIndex) {
    if (currentLayerGroup) map.removeLayer(currentLayerGroup);
    currentLayerGroup = L.layerGroup().addTo(map);
    const frameData = battleData.timeline[frameIndex];
    if (!frameData) return;

    for (const unitType of battleData.unit_types) {
        const typeId = unitType.id;
        const shape = unitType.shape;
        const units = frameData[typeId] || [];
        units.forEach(unit => {
            if (!unit || unit.length < 2) return;
            const lat = unit[0];
            const lng = unit[1];
            const status = unit[2] === "dead" ? "dead" : "alive";
            // Защита от некорректных координат
            if (isNaN(lat) || isNaN(lng)) return;
            const side = (typeId === "english" || typeId === "mercenary") ? "allied" : "enemy";
            const color = getColor(side, status);
            let unitName = unitType.name;
            if (typeId === "english") unitName = "Английский боец";
            if (typeId === "mercenary") unitName = "Наёмник";
            if (typeId === "french_knight") unitName = "Французский рыцарь";
            if (typeId === "french_squire") unitName = "Французский оруженосец";
            const sideText = side === "allied" ? "Союзник" : "Враг";
            const statusText = status === "dead" ? "⚰️ Погиб" : "⚔️ В строю";
            const tooltipContent = `<b>${unitName}</b><br>${sideText} | ${statusText}`;
            const icon = createIcon(shape, color);
            const marker = L.marker([lat, lng], { icon: icon });
            marker.bindTooltip(tooltipContent, { sticky: true, className: 'custom-tooltip' });
            marker.addTo(currentLayerGroup);
        });
    }
    slider.value = frameIndex;
    timeLabel.innerText = frameData.time;
    currentFrame = frameIndex;
}

function startAnimation() {
    if (animationInterval) clearInterval(animationInterval);
    animationInterval = setInterval(() => {
        let nextFrame = currentFrame + 1;
        if (nextFrame >= totalFrames) {
            clearInterval(animationInterval);
            animationInterval = null;
            playBtn.innerText = '▶ Воспроизвести';
            return;
        }
        renderFrame(nextFrame);
    }, 500);
    playBtn.innerText = '⏸ Пауза';
}

function stopAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    playBtn.innerText = '▶ Воспроизвести';
}

function resetTimeline() {
    stopAnimation();
    renderFrame(0);
}

// ------------------------------------------------------------------
// Загрузка или генерация данных
// ------------------------------------------------------------------
fetch('battle_30.json')
    .then(response => response.json())
    .then(data => {
        if (data.timeline && data.timeline.length > 0) {
            battleData = data;
            totalFrames = battleData.timeline.length;
        } else {
            console.log("JSON не содержит timeline, генерируем данные автоматически");
            battleData = generateBattleData();
            totalFrames = battleData.timeline.length;
        }
        slider.max = totalFrames-1;
        initMap();
        renderFrame(0);

        slider.addEventListener('input', (e) => {
            stopAnimation();
            renderFrame(parseInt(e.target.value, 10));
        });
        playBtn.addEventListener('click', () => {
            if (animationInterval) stopAnimation();
            else {
                if (currentFrame >= totalFrames-1) renderFrame(0);
                startAnimation();
            }
        });
        resetBtn.addEventListener('click', () => {
            stopAnimation();
            renderFrame(0);
        });
    })
    .catch(err => {
        console.warn("Ошибка загрузки JSON, генерируем данные:", err);
        battleData = generateBattleData();
        totalFrames = battleData.timeline.length;
        slider.max = totalFrames-1;
        initMap();
        renderFrame(0);
        slider.addEventListener('input', (e) => { stopAnimation(); renderFrame(parseInt(e.target.value, 10)); });
        playBtn.addEventListener('click', () => {
            if (animationInterval) stopAnimation();
            else { if (currentFrame >= totalFrames-1) renderFrame(0); startAnimation(); }
        });
        resetBtn.addEventListener('click', () => { stopAnimation(); renderFrame(0); });
    });