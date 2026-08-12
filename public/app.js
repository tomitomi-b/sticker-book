// シール帳アプリの主要ロジック

// 収集済みシールデータ
const ALL_STICKERS = [
  { id: 'tokyo-station', name: '東京駅限定シール', icon: '🏯', unlocked: true },
  { id: 'shinjuku-tower', name: '新宿タワーシール', icon: '🗼', unlocked: true },
  { id: 'shibuya-dog', name: '渋谷ハチ公シール', icon: '🐕', unlocked: false, lat: 35.6591, lng: 139.7006 },
  { id: 'skytree', name: 'スカイツリーシール', icon: '🏙️', unlocked: false, lat: 35.7101, lng: 139.8107 }
];

// 台紙上に置かれているシール（1種類につき最大1個）
// 形式: { stickerId: string, x: number, y: number }
let placedStickers = [];

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  renderTray();
  renderCanvas();
});

function initUI() {
  const openBtn = document.getElementById('open-book-btn');
  const cover = document.getElementById('book-cover');
  const book = document.getElementById('sticker-book');
  const mapBtn = document.getElementById('spot-map-btn');
  const mapModal = document.getElementById('map-modal');
  const closeMapBtn = document.getElementById('close-map-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      cover.classList.add('hidden');
      book.classList.remove('hidden');
    });
  }

  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      mapModal.classList.remove('hidden');
    });
  }

  if (closeMapBtn) {
    closeMapBtn.addEventListener('click', () => {
      mapModal.classList.add('hidden');
    });
  }
}

// トレイの描画
function renderTray() {
  const trayList = document.getElementById('tray-list');
  if (!trayList) return;
  trayList.innerHTML = '';

  ALL_STICKERS.forEach((sticker) => {
    const item = document.createElement('div');
    item.className = 'tray-item';

    const isPlaced = placedStickers.some(p => p.stickerId === sticker.id);

    if (!sticker.unlocked) {
      item.classList.add('locked');
      item.innerHTML = `
        <div class="icon">🔒</div>
        <div class="name">${sticker.name}</div>
      `;
    } else {
      if (isPlaced) {
        item.classList.add('placed-already');
      }
      item.innerHTML = `
        <div class="icon">${sticker.icon}</div>
        <div class="name">${sticker.name}</div>
      `;

      // ドラッグ/タッチイベント
      setupTrayDrag(item, sticker);
    }

    trayList.appendChild(item);
  });
}

// トレイからのドラッグ処理（1枚のみ許可）
function setupTrayDrag(element, sticker) {
  element.addEventListener('pointerdown', (e) => {
    // すでに台紙に貼られている場合は新たに追加させない
    const isPlaced = placedStickers.some(p => p.stickerId === sticker.id);
    if (isPlaced) return;

    e.preventDefault();
    const canvas = document.getElementById('sticker-canvas');
    const rect = canvas.getBoundingClientRect();

    // 台紙の中央付近に新しく配置
    const x = e.clientX - rect.left - 30;
    const y = e.clientY - rect.top - 30;

    placedStickers.push({
      stickerId: sticker.id,
      x: Math.max(10, Math.min(rect.width - 70, x)),
      y: Math.max(10, Math.min(rect.height - 70, y))
    });

    renderCanvas();
    renderTray();
  });
}

// 台紙上のシールを描画
function renderCanvas() {
  const canvas = document.getElementById('sticker-canvas');
  if (!canvas) return;

  // ヒントテキスト以外を消去
  const existingStickers = canvas.querySelectorAll('.placed-sticker');
  existingStickers.forEach(el => el.remove());

  placedStickers.forEach((placed, index) => {
    const stickerData = ALL_STICKERS.find(s => s.id === placed.stickerId);
    if (!stickerData) return;

    const el = document.createElement('div');
    el.className = 'placed-sticker';
    el.textContent = stickerData.icon;
    el.style.left = `${placed.x}px`;
    el.style.top = `${placed.y}px`;

    // 台紙上での自由な移動ドラッグ
    setupCanvasStickerDrag(el, index, canvas);

    canvas.appendChild(el);
  });
}

// 台紙上でのシール移動
function setupCanvasStickerDrag(element, index, canvas) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    element.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;
    initialX = placedStickers[index].x;
    initialY = placedStickers[index].y;
  });

  element.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const canvasRect = canvas.getBoundingClientRect();
    const newX = Math.max(0, Math.min(canvasRect.width - 60, initialX + dx));
    const newY = Math.max(0, Math.min(canvasRect.height - 60, initialY + dy));

    placedStickers[index].x = newX;
    placedStickers[index].y = newY;

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
  });

  const endDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      try {
        element.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  element.addEventListener('pointerup', endDrag);
  element.addEventListener('pointercancel', endDrag);
}