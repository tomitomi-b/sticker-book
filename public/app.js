// ==========================================
// sticker-book - public/app.js (Mobile-first)
// ==========================================

// --- State Variables ---
let map;
let currentPage = 0; // 0: page1, 1: page2
let unlockedStickers = []; // List of unlocked sticker IDs
let pageStickers = [[], []]; // Stickers placed on board per page: [{ id, x, y }]

// --- Sample Sticker Definitions ---
const STICKERS = [
  { id: 'spot-1', name: 'フルチェン', description: 'スポットチェックインで獲得できるシール', icon: '👤', lat: 35.681236, lng: 139.767125 },
  { id: 'spot-2', name: 'ペンギン', description: 'ペンギンシール', icon: '🐧', lat: 35.685236, lng: 139.757125 },
  { id: 'spot-3', name: '星のシール', description: 'きらきら星シール', icon: '⭐', lat: 35.675236, lng: 139.777125 }
];

// --- LocalStorage ---
function loadData() {
  try {
    const savedUnlocked = localStorage.getItem('unlockedStickers');
    if (savedUnlocked) unlockedStickers = JSON.parse(savedUnlocked);

    const savedBoard = localStorage.getItem('pageStickers');
    if (savedBoard) pageStickers = JSON.parse(savedBoard);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

function saveData() {
  try {
    localStorage.setItem('unlockedStickers', JSON.stringify(unlockedStickers));
    localStorage.setItem('pageStickers', JSON.stringify(pageStickers));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

// --- Map Initialization ---
function initMap() {
  if (map) {
    map.invalidateSize();
    return;
  }

  if (typeof L === 'undefined') return;

  map = L.map('map').setView([35.681236, 139.767125], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  STICKERS.forEach(sticker => {
    const isUnlocked = unlockedStickers.includes(sticker.id);
    const marker = L.marker([sticker.lat, sticker.lng]).addTo(map);

    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
      <b>${sticker.name}</b><br>
      <p style="margin: 4px 0;">${sticker.description}</p>
      ${isUnlocked ? '<span style="color: green;">✓ 獲得済み</span>' : `<button class="get-btn" id="btn-${sticker.id}">シールをゲット！</button>`}
    `;

    marker.bindPopup(popupContent);

    marker.on('popupopen', () => {
      const btn = document.getElementById(`btn-${sticker.id}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (!unlockedStickers.includes(sticker.id)) {
            unlockedStickers.push(sticker.id);
            saveData();
            renderTray();
            alert(`「${sticker.name}」を獲得しました！`);
            map.closePopup();
          }
        });
      }
    });
  });
}

// --- UI Navigation ---
function initNavigation() {
  const tabMap = document.getElementById('tab-map');
  const tabCollection = document.getElementById('tab-collection');
  const viewMap = document.getElementById('view-map');
  const viewCollection = document.getElementById('view-collection');

  if (tabMap && tabCollection) {
    tabMap.addEventListener('click', () => {
      tabMap.classList.add('active');
      tabCollection.classList.remove('active');
      if (viewMap) viewMap.style.display = 'block';
      if (viewCollection) viewCollection.style.display = 'none';
      initMap();
    });

    tabCollection.addEventListener('click', () => {
      tabCollection.classList.add('active');
      tabMap.classList.remove('active');
      if (viewCollection) viewCollection.style.display = 'block';
      if (viewMap) viewMap.style.display = 'none';
      renderBoard();
    });
  }

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        renderBoard();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < 1) {
        currentPage++;
        renderBoard();
      }
    });
  }
}

// --- Helper: Return Sticker to Tray ---
function returnStickerToTray(stickerData) {
  const idx = pageStickers[currentPage].indexOf(stickerData);
  if (idx !== -1) {
    pageStickers[currentPage].splice(idx, 1);
  }

  if (!unlockedStickers.includes(stickerData.id)) {
    unlockedStickers.push(stickerData.id);
  }

  saveData();
  renderBoard();
  renderTray();
}

// --- Render Tray (獲得済みシール一覧) ---
function renderTray() {
  const trayList = document.querySelector('.tray-list') || document.querySelector('#tray-list') || document.querySelector('.sticker-tray');
  const countEl = document.querySelector('.tray-count') || document.querySelector('#sticker-count');

  if (countEl) {
    countEl.textContent = `${unlockedStickers.length}枚`;
  }

  if (!trayList) return;
  trayList.innerHTML = '';

  if (unlockedStickers.length === 0) {
    trayList.innerHTML = '<p class="empty-msg" style="color: #888; font-size: 0.9rem;">シールがありません</p>';
    return;
  }

  unlockedStickers.forEach(stickerId => {
    const stickerDef = STICKERS.find(s => s.id === stickerId) || { name: stickerId, icon: '🏷️' };
    
    const item = document.createElement('div');
    item.className = 'tray-sticker-item';
    item.style.cursor = 'pointer';
    item.style.userSelect = 'none';
    item.style.touchAction = 'manipulation';
    item.innerHTML = `
      <div class="sticker-icon" style="font-size: 2.2rem;">${stickerDef.icon}</div>
      <div class="sticker-name" style="font-size: 0.8rem;">${stickerDef.name}</div>
    `;

    item.addEventListener('click', () => {
      pageStickers[currentPage].push({
        id: stickerId,
        x: 50 + (Math.random() * 20 - 10),
        y: 50 + (Math.random() * 20 - 10)
      });
      const indexInUnlocked = unlockedStickers.indexOf(stickerId);
      if (indexInUnlocked !== -1) {
        unlockedStickers.splice(indexInUnlocked, 1);
      }
      saveData();
      renderBoard();
      renderTray();
    });

    trayList.appendChild(item);
  });
}

// --- Render Board (シール帳) ---
function renderBoard() {
  const canvas = document.querySelector('.board-canvas') || document.querySelector('#album-board') || document.querySelector('.album-board') || document.querySelector('.board');
  if (!canvas) return;

  canvas.innerHTML = '';

  const stickersOnPage = pageStickers[currentPage] || [];

  stickersOnPage.forEach((st) => {
    const stickerDef = STICKERS.find(s => s.id === st.id) || { name: st.id, icon: '🏷️' };

    const el = document.createElement('div');
    el.className = 'placed-sticker';
    el.style.position = 'absolute';
    el.style.left = `${st.x}%`;
    el.style.top = `${st.y}%`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.touchAction = 'none';
    el.style.zIndex = '10';
    
    el.innerHTML = `
      <div style="position: relative; display: inline-block;">
        <div style="font-size: 2.8rem; user-select: none; pointer-events: none;">${stickerDef.icon}</div>
        <div style="font-size: 0.75rem; text-align: center; background: rgba(255,255,255,0.95); padding: 2px 6px; border-radius: 4px; pointer-events: none; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${stickerDef.name}</div>
        <button class="remove-sticker-btn" style="position: absolute; top: -10px; right: -10px; background: #ff4d4f; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; font-size: 14px; font-weight: bold; line-height: 22px; text-align: center; cursor: pointer; padding: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 20; touch-action: manipulation;">×</button>
      </div>
    `;

    const removeBtn = el.querySelector('.remove-sticker-btn');
    if (removeBtn) {
      const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        returnStickerToTray(st);
      };
      removeBtn.addEventListener('click', handleRemove);
      removeBtn.addEventListener('touchstart', handleRemove);
    }

    makeDraggable(el, st, canvas);
    canvas.appendChild(el);
  });
}

// --- Make Placed Sticker Draggable ---
function makeDraggable(el, stickerData, canvas) {
  let isDragging = false;
  let startX, startY, startLeftPercent, startTopPercent;

  const onPointerDown = (e) => {
    if (e.target.classList.contains('remove-sticker-btn')) return;

    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    el.style.zIndex = '1000';
    try { el.setPointerCapture(e.pointerId); } catch (err) {}

    startX = e.clientX;
    startY = e.clientY;

    startLeftPercent = stickerData.x;
    startTopPercent = stickerData.y;
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const canvasRect = canvas.getBoundingClientRect();

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = startLeftPercent + (dx / canvasRect.width) * 100;
    let newY = startTopPercent + (dy / canvasRect.height) * 100;

    stickerData.x = newX;
    stickerData.y = newY;

    el.style.left = `${newX}%`;
    el.style.top = `${newY}%`;
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    el.style.zIndex = '10';
    try { el.releasePointerCapture(e.pointerId); } catch (err) {}

    const canvasRect = canvas.getBoundingClientRect();

    // 枠外またはトレー方向へドラッグして離した判定
    const isOutside = (
      e.clientX < canvasRect.left ||
      e.clientX > canvasRect.right ||
      e.clientY < canvasRect.top ||
      e.clientY > canvasRect.bottom ||
      stickerData.x < 0 || stickerData.x > 100 ||
      stickerData.y < 0 || stickerData.y > 100
    );

    if (isOutside) {
      returnStickerToTray(stickerData);
    } else {
      saveData();
    }
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initNavigation();
  renderTray();
  renderBoard();
});
