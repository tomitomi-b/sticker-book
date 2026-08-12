document.addEventListener('DOMContentLoaded', () => {
  // サンプルスポットデータ
  const spots = [
    { id: 'spot1', name: '東京駅限定シール', icon: '🏯', lat: 35.681236, lng: 139.767125 },
    { id: 'spot2', name: '新宿タワーシール', icon: '🗼', lat: 35.690921, lng: 139.700258 },
    { id: 'spot3', name: '渋谷ハチ公シール', icon: '🐕', lat: 35.659033, lng: 139.700683 }
  ];

  // ローカルストレージ管理データ
  let myStickers = JSON.parse(localStorage.getItem('my_stickers') || '[]');
  let placedStickers = JSON.parse(localStorage.getItem('placed_stickers') || '[]');

  // --- UI要素 ---
  const bookCover = document.getElementById('book-cover');
  const stickerBook = document.getElementById('sticker-book');
  const openBookBtn = document.getElementById('open-book-btn');
  const closeBookBtn = document.getElementById('close-book-btn');
  const mapToggleBtn = document.getElementById('map-toggle-btn');
  const mapModal = document.getElementById('map-modal');
  const closeMapBtn = document.getElementById('close-map-btn');
  const canvas = document.getElementById('sticker-canvas');
  const trayList = document.getElementById('tray-list');

  // 1. 表紙開閉処理
  openBookBtn.addEventListener('click', () => {
    bookCover.classList.add('hidden');
    stickerBook.classList.remove('hidden');
    renderPlacedStickers();
    renderTray();
  });

  closeBookBtn.addEventListener('click', () => {
    stickerBook.classList.add('hidden');
    bookCover.classList.remove('hidden');
  });

  // 2. マップモーダル開閉処理
  let mapInitialized = false;
  let map;

  mapToggleBtn.addEventListener('click', () => {
    mapModal.classList.remove('hidden');
    if (!mapInitialized) {
      initMap();
      mapInitialized = true;
    } else {
      setTimeout(() => map.invalidateSize(), 100);
    }
  });

  closeMapBtn.addEventListener('click', () => {
    mapModal.classList.add('hidden');
  });

  // 3. マップ初期化
  function initMap() {
    map = L.map('map').setView([35.681236, 139.767125], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      });
    }

    // スポットピンの配置
    spots.forEach((spot) => {
      const marker = L.marker([spot.lat, spot.lng]).addTo(map);
      const isCollected = myStickers.includes(spot.id);

      const popupContent = document.createElement('div');
      popupContent.style.textAlign = 'center';
      popupContent.innerHTML = `
        <div style="font-size: 1.8rem;">${spot.icon}</div>
        <strong>${spot.name}</strong><br>
        ${isCollected
          ? '<span style="color: #4caf50; font-size: 0.8rem;">獲得済み！</span>'
          : `<button id="btn-${spot.id}" class="get-btn">シールをゲット！</button>`}
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const getBtn = document.getElementById(`btn-${spot.id}`);
        if (getBtn) {
          getBtn.addEventListener('click', () => {
            collectSticker(spot);
            marker.closePopup();
          });
        }
      });
    });
  }

  // 4. シール獲得
  function collectSticker(spot) {
    if (!myStickers.includes(spot.id)) {
      myStickers.push(spot.id);
      localStorage.setItem('my_stickers', JSON.stringify(myStickers));

      // 初期配置として台紙の中央付近に貼る（手貼り感を出すためランダムな角度・大きさをつける）
      placedStickers.push({
        instanceId: Date.now().toString(),
        spotId: spot.id,
        icon: spot.icon,
        x: 50 + (placedStickers.length * 15),
        y: 100 + (placedStickers.length * 15),
        rotation: Math.round((Math.random() * 24 - 12) * 10) / 10,
        size: Math.round((2.2 + Math.random() * 1.8) * 10) / 10 // 2.2rem〜4.0remの範囲でばらつかせる
      });
      localStorage.setItem('placed_stickers', JSON.stringify(placedStickers));

      alert(`🎉 『${spot.name}』を獲得してシール帳に貼りました！`);
      renderTray();
      renderPlacedStickers();
    }
  }

  // 5. 下部トレイ描画
  function renderTray() {
    trayList.innerHTML = '';
    spots.forEach((spot) => {
      const isCollected = myStickers.includes(spot.id);
      const item = document.createElement('div');
      item.className = `tray-item ${isCollected ? '' : 'locked'}`;
      item.innerHTML = `
        <div class="icon">${isCollected ? spot.icon : '❓'}</div>
        <div class="name">${isCollected ? spot.name : '未獲得'}</div>
      `;
      trayList.appendChild(item);
    });
  }

  // 6. 台紙上のシール描画 & ドラッグ移動
  function renderPlacedStickers() {
    // 既存のシール要素をクリア（ヒントテキスト以外）
    const oldStickers = canvas.querySelectorAll('.placed-sticker');
    oldStickers.forEach(el => el.remove());

    placedStickers.forEach((st) => {
      const el = document.createElement('div');
      el.className = 'placed-sticker';
      el.innerText = st.icon;
      el.style.left = `${st.x}px`;
      el.style.top = `${st.y}px`;
      el.style.transform = `rotate(${st.rotation || 0}deg)`;
      el.style.fontSize = `${st.size || 3}rem`;

      makeDraggable(el, st.instanceId);
      canvas.appendChild(el);
    });
  }

  // 7. ドラッグ＆ドロップ処理（マウス＆タッチ対応）
  function makeDraggable(element, instanceId) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    const rotation = placedStickers.find(s => s.instanceId === instanceId)?.rotation || 0;

    function onStart(e) {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      initialLeft = element.offsetLeft;
      initialTop = element.offsetTop;

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;

      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
      // ドラッグ中はまっすぐに戻して掴んでいる感を出す
      element.style.transform = 'rotate(0deg)';
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;

      // 座標の保存更新
      const targetIndex = placedStickers.findIndex(s => s.instanceId === instanceId);
      if (targetIndex !== -1) {
        placedStickers[targetIndex].x = element.offsetLeft;
        placedStickers[targetIndex].y = element.offsetTop;
        localStorage.setItem('placed_stickers', JSON.stringify(placedStickers));
      }

      // 元の貼り付け角度に戻す
      element.style.transform = `rotate(${rotation}deg)`;

      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    }

    element.addEventListener('mousedown', onStart);
    element.addEventListener('touchstart', onStart, { passive: false });
  }
});