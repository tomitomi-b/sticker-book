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
  }
];

// ローカルストレージキー
const STORAGE_KEY_UNLOCKED = 'sticker_book_unlocked';
const STORAGE_KEY_PLACED = 'sticker_book_placed_v2';

let unlockedStickers = [];
let placedStickers = [];
let map = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEvents();
  renderTray();
  renderCanvas();
});

// データ読み込み
function loadData() {
  const savedUnlocked = localStorage.getItem(STORAGE_KEY_UNLOCKED);
  if (savedUnlocked) {
    unlockedStickers = JSON.parse(savedUnlocked);
  } else {
    // 初回デフォルト：東京駅と新宿を解放
    unlockedStickers = ['tokyo-station', 'shinjuku-tower'];
    saveData();
  }

  const savedPlaced = localStorage.getItem(STORAGE_KEY_PLACED);
  if (savedPlaced) {
    placedStickers = JSON.parse(savedPlaced);
  } else {
    // 初回デフォルト配置（丸型枠なし）
    placedStickers = [
      { id: 'shinjuku-tower', x: 35, y: 35, instanceId: 'init-1' },
      { id: 'tokyo-station', x: 55, y: 42, instanceId: 'init-2' }
    ];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedStickers));
  localStorage.setItem(STORAGE_KEY_PLACED, JSON.stringify(placedStickers));
}

// イベント設定
function setupEvents() {
  const bookCover = document.getElementById('book-cover');
  const stickerBook = document.getElementById('sticker-book');
  const openBtn = document.getElementById('open-book-btn');
  const closeBtn = document.getElementById('close-book-btn');
  const mapToggleBtn = document.getElementById('map-toggle-btn');
  const mapModal = document.getElementById('map-modal');
  const closeMapBtn = document.getElementById('close-map-btn');

  openBtn.addEventListener('click', () => {
    bookCover.classList.add('hidden');
    stickerBook.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    stickerBook.classList.add('hidden');
    bookCover.classList.remove('hidden');
  });

  mapToggleBtn.addEventListener('click', () => {
    mapModal.classList.remove('hidden');
    initMap();
  });

  closeMapBtn.addEventListener('click', () => {
    mapModal.classList.add('hidden');
  });

  // ドロップ受け入れ
  const canvas = document.getElementById('sticker-canvas');
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', handleDropOnCanvas);
}

// トレイの描画
function renderTray() {
  const trayList = document.getElementById('tray-list');
  trayList.innerHTML = '';

  STICKERS.forEach(sticker => {
    const isUnlocked = unlockedStickers.includes(sticker.id);
    const item = document.createElement('div');
    item.className = `tray-item ${isUnlocked ? '' : 'locked'}`;

    if (isUnlocked) {
      item.draggable = true;
      item.innerHTML = `
        <div class="icon">${sticker.emoji}</div>
        <div class="name">${sticker.name}</div>
      `;
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', sticker.id);
      });
    } else {
      item.innerHTML = `
        <div class="icon">?</div>
        <div class="name">未獲得</div>
      `;
    }

    trayList.appendChild(item);
  });
}

// キャンバス（シール帳面）の描画：丸枠無しのダイカット構成
function renderCanvas() {
  const canvas = document.getElementById('sticker-canvas');
  // 既存の貼られたシールのみ削除（ヒントテキストは維持）
  const existingStickers = canvas.querySelectorAll('.placed-sticker');
  existingStickers.forEach(el => el.remove());

  placedStickers.forEach((item) => {
    const stickerData = STICKERS.find(s => s.id === item.id);
    if (!stickerData) return;

    const el = document.createElement('div');
    el.className = 'placed-sticker';
    el.dataset.instanceId = item.instanceId;
    el.style.left = `${item.x}%`;
    el.style.top = `${item.y}%`;
    
    // 丸枠タグを含めず、絵柄絵文字テキストのみを直接挿入
    el.textContent = stickerData.emoji;

    // ドラッグ移動処理
    makeDraggable(el, item.instanceId);

    canvas.appendChild(el);
  });
}

// ドロップ処理
function handleDropOnCanvas(e) {
  e.preventDefault();
  const stickerId = e.dataTransfer.getData('text/plain');
  if (!stickerId) return;

  const canvas = document.getElementById('sticker-canvas');
  const rect = canvas.getBoundingClientRect();

  const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
  const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

  const newInstance = {
    id: stickerId,
    x: Math.max(2, Math.min(90, xPercent)),
    y: Math.max(2, Math.min(90, yPercent)),
    instanceId: 'st-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
  };

  placedStickers.push(newInstance);
  saveData();
  renderCanvas();
}

// シール移動ドラッグ設定
function makeDraggable(el, instanceId) {
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  const onPointerDown = (e) => {
    isDragging = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX);
    startY = e.clientY || (e.touches && e.touches[0].clientY);

    const canvas = document.getElementById('sticker-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    const targetItem = placedStickers.find(p => p.instanceId === instanceId);
    if (targetItem) {
      startLeft = (targetItem.x / 100) * canvasRect.width;
      startTop = (targetItem.y / 100) * canvasRect.height;
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX);
    const currentY = e.clientY || (e.touches && e.touches[0].clientY);

    const dx = currentX - startX;
    const dy = currentY - startY;

    const canvas = document.getElementById('sticker-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    let newX = ((startLeft + dx) / canvasRect.width) * 100;
    let newY = ((startTop + dy) / canvasRect.height) * 100;

    newX = Math.max(0, Math.min(92, newX));
    newY = Math.max(0, Math.min(92, newY));

    el.style.left = `${newX}%`;
    el.style.top = `${newY}%`;

    const targetItem = placedStickers.find(p => p.instanceId === instanceId);
    if (targetItem) {
      targetItem.x = newX;
      targetItem.y = newY;
    }
  };

  const onPointerUp = () => {
    if (isDragging) {
      isDragging = false;
      saveData();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
  };

  el.addEventListener('pointerdown', onPointerDown);
}

// マップ初期化
function initMap() {
  if (map) return;

  map = L.map('map').setView([35.681236, 139.767125], 13);
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