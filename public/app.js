// シールデータ定義
const STICKERS = [
  {
    id: 'tokyo-station',
    name: '東京駅限定シール',
    emoji: '🏯',
    lat: 35.681236,
    lng: 139.767125,
    description: '東京駅周辺でゲットできる限定シール！'
  },
  {
    id: 'shinjuku-tower',
    name: '新宿タワーシール',
    emoji: '🗼',
    lat: 35.6895,
    lng: 139.6917,
    description: '新宿エリア限定のタワーシール！'
  },
  {
    id: 'shibuya-dog',
    name: '渋谷ハチ公シール',
    emoji: '🐕',
    lat: 35.6591,
    lng: 139.7006,
    description: '渋谷エリア限定のハチ公シール！'
  },
  {
    id: 'skytree',
    name: 'スカイツリーシール',
    emoji: '🏙️',
    lat: 35.7101,
    lng: 139.8107,
    description: 'スカイツリー限定シール！'
  }
];

const TOTAL_PAGES = 3;
let currentPage = 1;

const STORAGE_KEY_UNLOCKED = 'sticker_book_unlocked';
const STORAGE_KEY_PLACED_PAGE = 'sticker_book_placed_page_';

let unlockedStickers = [];
let pageStickers = {}; // ページごとのシールデータ { 1: [], 2: [], 3: [] }
let map = null;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEvents();
  renderTray();
  renderCanvas();
  updatePageDisplay();
});

function loadData() {
  const savedUnlocked = localStorage.getItem(STORAGE_KEY_UNLOCKED);
  if (savedUnlocked) {
    unlockedStickers = JSON.parse(savedUnlocked);
  } else {
    unlockedStickers = ['tokyo-station', 'shinjuku-tower'];
    saveData();
  }

  for (let p = 1; p <= TOTAL_PAGES; p++) {
    const saved = localStorage.getItem(STORAGE_KEY_PLACED_PAGE + p);
    if (saved) {
      pageStickers[p] = JSON.parse(saved);
    } else {
      pageStickers[p] = (p === 1) ? [
        { id: 'shinjuku-tower', x: 25, y: 35 },
        { id: 'tokyo-station', x: 65, y: 42 }
      ] : [];
    }
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedStickers));
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    localStorage.setItem(STORAGE_KEY_PLACED_PAGE + p, JSON.stringify(pageStickers[p]));
  }
}

function setupEvents() {
  const bookCover = document.getElementById('book-cover');
  const stickerBook = document.getElementById('sticker-book');
  const openBtn = document.getElementById('open-book-btn');
  const closeBtn = document.getElementById('close-book-btn');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  const mapToggleBtn = document.getElementById('map-toggle-btn');
  const mapModal = document.getElementById('map-modal');
  const closeMapBtn = document.getElementById('close-map-btn');

  // 表紙を開く
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      bookCover.classList.add('opened');
      setTimeout(() => {
        bookCover.classList.add('hidden');
        stickerBook.classList.remove('hidden');
      }, 500);
    });
  }

  // 表紙へ閉じる
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      bookCover.classList.remove('hidden');
      setTimeout(() => {
        bookCover.classList.remove('opened');
        stickerBook.classList.add('hidden');
      }, 50);
    });
  }

  // ページ切り替え
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        changePage(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < TOTAL_PAGES) {
        changePage(currentPage + 1);
      }
    });
  }

  if (mapToggleBtn) {
    mapToggleBtn.addEventListener('click', () => {
      mapModal.classList.remove('hidden');
      initMap();
    });
  }

  if (closeMapBtn) {
    closeMapBtn.addEventListener('click', () => {
      mapModal.classList.add('hidden');
    });
  }
}

function changePage(newPage) {
  const canvas = document.getElementById('sticker-canvas');
  canvas.style.opacity = '0.2';
  
  setTimeout(() => {
    currentPage = newPage;
    updatePageDisplay();
    renderCanvas();
    renderTray();
    canvas.style.opacity = '1';
  }, 150);
}

function updatePageDisplay() {
  const display = document.getElementById('page-num-display');
  if (display) {
    display.textContent = `${currentPage} / ${TOTAL_PAGES} ページ`;
  }
}

// すべてのページを通して全シールの中で何枚貼られているか確認
function isStickerPlacedAnywhere(stickerId) {
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    if (pageStickers[p].some(s => s.id === stickerId)) {
      return true;
    }
  }
  return false;
}

function renderTray() {
  const trayList = document.getElementById('tray-list');
  if (!trayList) return;
  trayList.innerHTML = '';

  STICKERS.forEach(sticker => {
    const isUnlocked = unlockedStickers.includes(sticker.id);
    const isPlaced = isStickerPlacedAnywhere(sticker.id);

    const item = document.createElement('div');
    item.className = `tray-item ${!isUnlocked ? 'locked' : ''} ${isPlaced ? 'placed-already' : ''}`;

    if (isUnlocked) {
      item.innerHTML = `
        <div class="icon">${sticker.emoji}</div>
        <div class="name">${sticker.name}</div>
      `;

      item.addEventListener('pointerdown', (e) => {
        if (isStickerPlacedAnywhere(sticker.id)) return;
        
        pageStickers[currentPage].push({
          id: sticker.id,
          x: 40 + (Math.random() * 10 - 5),
          y: 40 + (Math.random() * 10 - 5)
        });
        saveData();
        renderCanvas();
        renderTray();
      });
    } else {
      item.innerHTML = `
        <div class="icon">🔒</div>
        <div class="name">未獲得</div>
      `;
    }

    trayList.appendChild(item);
  });
}

function renderCanvas() {
  const canvas = document.getElementById('sticker-canvas');
  if (!canvas) return;

  const existingStickers = canvas.querySelectorAll('.placed-sticker');
  existingStickers.forEach(el => el.remove());

  const currentStickers = pageStickers[currentPage] || [];

  currentStickers.forEach((item, index) => {
    const stickerData = STICKERS.find(s => s.id === item.id);
    if (!stickerData) return;

    const el = document.createElement('div');
    el.className = 'placed-sticker';
    el.textContent = stickerData.emoji;
    el.style.left = `${item.x}%`;
    el.style.top = `${item.y}%`;

    makeDraggable(el, index, canvas);
    canvas.appendChild(el);
  });
}

function makeDraggable(el, index, canvas) {
  let isDragging = false;
  let startX, startY, startLeftPercent, startTopPercent;

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    el.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;

    startLeftPercent = pageStickers[currentPage][index].x;
    startTopPercent = pageStickers[currentPage][index].y;
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const canvasRect = canvas.getBoundingClientRect();

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = startLeftPercent + (dx / canvasRect.width) * 100;
    let newY = startTopPercent + (dy / canvasRect.height) * 100;

    newX = Math.max(0, Math.min(85, newX));
    newY = Math.max(0, Math.min(85, newY));

    el.style.left = `${newX}%`;
    el.style.top = `${newY}%`;

    pageStickers[currentPage][index].x = newX;
    pageStickers[currentPage][index].y = newY;
  };

  const onPointerUp = (e) => {
    if (isDragging) {
      isDragging = false;
      saveData();
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
}

function initMap() {
  if (map) {
    map.invalidateSize();
    return;
  }

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