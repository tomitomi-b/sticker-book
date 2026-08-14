document.addEventListener('DOMContentLoaded', () => {
  // 表紙開閉
  const cover = document.getElementById('cover');
  if (cover) {
    cover.addEventListener('click', () => {
      cover.classList.add('open');
      setTimeout(() => { if (window.map) window.map.invalidateSize(); }, 400);
    });
  }

  // ページ切り替え
  const btnPage1 = document.getElementById('btn-page-1');
  const btnPage2 = document.getElementById('btn-page-2');
  const page1 = document.getElementById('page-1');
  const page2 = document.getElementById('page-2');

  btnPage1.addEventListener('click', () => {
    btnPage1.classList.add('active');
    btnPage2.classList.remove('active');
    page1.classList.add('active');
    page2.classList.remove('active');
    if (window.map) window.map.invalidateSize();
  });

  btnPage2.addEventListener('click', () => {
    btnPage2.classList.add('active');
    btnPage1.classList.remove('active');
    page2.classList.add('active');
    page1.classList.remove('active');
    renderAlbumAndTray();
  });

  // ユーザーIDの生成/取得
  let myUserId = localStorage.getItem('my_user_id');
  if (!myUserId) {
    myUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('my_user_id', myUserId);
  }

  let userLocation = null;
  let myStickers = JSON.parse(localStorage.getItem('my_collected_stickers') || '[]');
  let placedStickers = JSON.parse(localStorage.getItem('my_placed_stickers') || '[]');
  let mapSpots = JSON.parse(localStorage.getItem('map_sticker_spots') || '[]');

  // サンプルデータ
  if (mapSpots.length === 0) {
    mapSpots = [
      {
        id: 'sample-1',
        ownerId: 'other-user',
        title: '東京駅限定スタンプ',
        lat: 35.681236,
        lng: 139.767125,
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=150&auto=format&fit=crop&q=60'
      }
    ];
    localStorage.setItem('map_sticker_spots', JSON.stringify(mapSpots));
  }

  // 地図初期化
  const map = L.map('map').setView([35.681236, 139.767125], 14);
  window.map = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  let userMarker = null;

  function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ----------------------------------------------------
  // 2ページ目: シール帳＆トレーのレンダリング＆ドラッグ処理
  // ----------------------------------------------------
  const albumBoard = document.getElementById('albumBoard');
  const stickerTray = document.getElementById('stickerTray');
  const emptyMsg = document.getElementById('emptyMsg');
  const stickerCountBadge = document.getElementById('sticker-count-badge');

  function renderAlbumAndTray() {
    // トレーのレンダリング
    stickerTray.innerHTML = '';
    stickerCountBadge.textContent = `${myStickers.length}枚`;

    if (myStickers.length === 0) {
      stickerTray.innerHTML = '<span class="empty-tray-msg">シールがありません</span>';
    } else {
      myStickers.forEach(sticker => {
        const item = document.createElement('div');
        item.className = 'tray-sticker-item';
        item.dataset.stickerId = sticker.id;
        item.innerHTML = `
          <img src="${sticker.image}" alt="${sticker.title}">
          <span>${sticker.title}</span>
        `;

        // トレーからのドラッグイベント設定
        setupTrayItemDrag(item, sticker);
        stickerTray.appendChild(item);
      });
    }

    // 台紙上のシールを再描画
    renderPlacedStickers();
  }

  function renderPlacedStickers() {
    // 既存の貼られたシール要素をクリア
    const existingStickers = albumBoard.querySelectorAll('.placed-sticker');
    existingStickers.forEach(el => el.remove());

    if (placedStickers.length > 0) {
      emptyMsg.style.display = 'none';
    } else {
      emptyMsg.style.display = 'block';
    }

    placedStickers.forEach(ps => {
      const stickerEl = document.createElement('div');
      stickerEl.className = 'placed-sticker';
      stickerEl.dataset.placedId = ps.instanceId;
      stickerEl.style.left = `${ps.x}%`;
      stickerEl.style.top = `${ps.y}%`;
      stickerEl.style.transform = `translate(-50%, -50%) rotate(${ps.rotation || 0}deg)`;

      stickerEl.innerHTML = `
        <img src="${ps.image}" alt="${ps.title}">
        <span>${ps.title}</span>
      `;

      // 台紙上でのドラッグ移動イベント設定
      setupPlacedStickerDrag(stickerEl, ps);
      albumBoard.appendChild(stickerEl);
    });
  }

  // トレーから台紙へドラッグ
  function setupTrayItemDrag(itemEl, stickerData) {
    let isDragging = false;
    let ghostEl = null;

    itemEl.addEventListener('pointerdown', (e) => {
      isDragging = true;
      itemEl.setPointerCapture(e.pointerId);

      // ドラッグ中の見た目クローンを作成
      ghostEl = itemEl.cloneNode(true);
      ghostEl.style.position = 'fixed';
      ghostEl.style.zIndex = '1000';
      ghostEl.style.opacity = '0.85';
      ghostEl.style.pointerEvents = 'none';
      ghostEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
      document.body.appendChild(ghostEl);

      updateGhostPosition(e);
    });

    itemEl.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      updateGhostPosition(e);
    });

    itemEl.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;

      if (ghostEl) {
        ghostEl.remove();
        ghostEl = null;
      }

      // ドロップ判定（albumBoardの領域内か）
      const boardRect = albumBoard.getBoundingClientRect();
      if (
        e.clientX >= boardRect.left &&
        e.clientX <= boardRect.right &&
        e.clientY >= boardRect.top &&
        e.clientY <= boardRect.bottom
      ) {
        // 台紙内での相対パーセント座標を計算
        const relX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
        const relY = ((e.clientY - boardRect.top) / boardRect.height) * 100;
        const randomRotation = Math.floor(Math.random() * 16) - 8; // -8deg ~ +8deg

        const newPlacedSticker = {
          instanceId: 'placed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          stickerId: stickerData.id,
          title: stickerData.title,
          image: stickerData.image,
          x: relX,
          y: relY,
          rotation: randomRotation
        };

        placedStickers.push(newPlacedSticker);
        localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
        renderPlacedStickers();
      }
    });

    function updateGhostPosition(e) {
      if (ghostEl) {
        ghostEl.style.left = `${e.clientX}px`;
        ghostEl.style.top = `${e.clientY}px`;
      }
    }
  }

  // 台紙内での移動ドラッグ
  function setupPlacedStickerDrag(stickerEl, placedData) {
    let isDragging = false;
    let boardRect = null;

    stickerEl.addEventListener('pointerdown', (e) => {
      isDragging = true;
      stickerEl.setPointerCapture(e.pointerId);
      boardRect = albumBoard.getBoundingClientRect();
      stickerEl.style.zIndex = '100';
    });

    stickerEl.addEventListener('pointermove', (e) => {
      if (!isDragging || !boardRect) return;

      let relX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
      let relY = ((e.clientY - boardRect.top) / boardRect.height) * 100;

      // 範囲制限 (0% ~ 100%)
      relX = Math.max(0, Math.min(100, relX));
      relY = Math.max(0, Math.min(100, relY));

      stickerEl.style.left = `${relX}%`;
      stickerEl.style.top = `${relY}%`;
    });

    stickerEl.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      stickerEl.style.zIndex = '10';

      if (boardRect) {
        let relX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
        let relY = ((e.clientY - boardRect.top) / boardRect.height) * 100;

        relX = Math.max(0, Math.min(100, relX));
        relY = Math.max(0, Math.min(100, relY));

        // 座標更新＆保存
        const target = placedStickers.find(p => p.instanceId === placedData.instanceId);
        if (target) {
          target.x = relX;
          target.y = relY;
          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
        }
      }
    });
  }

  // ----------------------------------------------------
  // マップ・スポット関連処理
  // ----------------------------------------------------
  const spotMarkers = [];
  function renderMapSpots() {
    spotMarkers.forEach(m => map.removeLayer(m));
    spotMarkers.length = 0;

    mapSpots.forEach(spot => {
      const isAlreadyGet = myStickers.some(s => s.id === spot.id);
      const isMine = spot.ownerId === myUserId;

      const spotIcon = L.icon({
        iconUrl: spot.image,
        iconSize: [38, 38],
        className: 'custom-spot-icon'
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon }).addTo(map);

      marker.on('click', () => {
        let distText = '現在地を取得してください';
        let canGet = false;

        if (userLocation) {
          const dist = getDistanceMeters(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
          distText = `距離: 約${Math.round(dist)}m`;
          if (dist <= 200) canGet = true;
        }

        const btnText = isAlreadyGet ? '獲得済み' : (canGet ? 'シールを獲得！' : '遠すぎます (200m以内)');
        const btnDisabled = isAlreadyGet || !canGet ? 'disabled' : '';

        const popupContent = document.createElement('div');
        popupContent.className = 'popup-container';
        popupContent.innerHTML = `
          <b>${spot.title}</b>
          <img src="${spot.image}" class="popup-img">
          <small>${distText}</small>
          <button class="popup-get-btn" ${btnDisabled}>${btnText}</button>
          ${isMine ? `
            <div class="owner-actions">
              <button class="edit-btn">編集</button>
              <button class="delete-btn">削除</button>
            </div>
          ` : ''}
        `;

        const getBtn = popupContent.querySelector('.popup-get-btn');
        if (getBtn && canGet && !isAlreadyGet) {
          getBtn.addEventListener('click', () => {
            myStickers.push(spot);
            localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
            alert(`🎉 「${spot.title}」のシールを獲得しました！\n「📖 コレクション」ページで貼ってみよう！`);
            map.closePopup();
            renderMapSpots();
          });
        }

        if (isMine) {
          const editBtn = popupContent.querySelector('.edit-btn');
          const deleteBtn = popupContent.querySelector('.delete-btn');

          if (editBtn) {
            editBtn.addEventListener('click', () => {
              openEditModal(spot);
              map.closePopup();
            });
          }

          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              if (confirm(`「${spot.title}」を削除してもよろしいですか？`)) {
                mapSpots = mapSpots.filter(s => s.id !== spot.id);
                localStorage.setItem('map_sticker_spots', JSON.stringify(mapSpots));
                renderMapSpots();
                alert('削除しました。');
              }
            });
          }
        }

        marker.bindPopup(popupContent).openPopup();
      });

      spotMarkers.push(marker);
    });
  }

  function updateUserLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        if (userMarker) map.removeLayer(userMarker);
        
        userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map).bindPopup('📍 あなたの現在地');

        map.setView([userLocation.lat, userLocation.lng], 15);
        renderMapSpots();
      }, () => {
        alert('現在地が取得できませんでした。');
      });
    }
  }

  document.getElementById('locate-me-btn').addEventListener('click', updateUserLocation);

  // モーダル関連
  const spotModal = document.getElementById('spot-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const spotForm = document.getElementById('spot-form');
  const imageInput = document.getElementById('spot-image-input');
  
  let selectedLatLng = null;
  let uploadedImageBase64 = '';

  map.on('click', (e) => {
    selectedLatLng = e.latlng;
    uploadedImageBase64 = '';
    
    document.getElementById('modal-title').textContent = '新しいシールスポットを設置';
    document.getElementById('modal-submit-btn').textContent = '設置する';
    document.getElementById('editing-spot-id').value = '';
    document.getElementById('image-input-label').textContent = 'シール画像';
    spotForm.reset();
    imageInput.required = true;

    spotModal.style.display = 'flex';
  });

  function openEditModal(spot) {
    document.getElementById('modal-title').textContent = 'スポットの編集';
    document.getElementById('modal-submit-btn').textContent = '更新する';
    document.getElementById('editing-spot-id').value = spot.id;
    document.getElementById('spot-title-input').value = spot.title;
    document.getElementById('image-input-label').textContent = 'シール画像 (変更する場合のみ)';
    
    uploadedImageBase64 = spot.image;
    imageInput.required = false;

    spotModal.style.display = 'flex';
  }

  modalCancelBtn.addEventListener('click', () => {
    spotModal.style.display = 'none';
  });

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => { uploadedImageBase64 = evt.target.result; };
      reader.readAsDataURL(file);
    }
  });

  spotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editingId = document.getElementById('editing-spot-id').value;
    const title = document.getElementById('spot-title-input').value;

    if (editingId) {
      const targetSpot = mapSpots.find(s => s.id === editingId);
      if (targetSpot) {
        targetSpot.title = title;
        if (uploadedImageBase64) targetSpot.image = uploadedImageBase64;
      }
      alert('シール名を更新しました！');
    } else {
      if (!uploadedImageBase64 || !selectedLatLng) return;

      const newSpot = {
        id: 'spot-' + Date.now(),
        ownerId: myUserId,
        title: title,
        lat: selectedLatLng.lat,
        lng: selectedLatLng.lng,
        image: uploadedImageBase64
      };

      mapSpots.push(newSpot);
      alert(`📍 「${title}」のシールスポットを設置しました！`);
    }

    localStorage.setItem('map_sticker_spots', JSON.stringify(mapSpots));
    renderMapSpots();
    spotForm.reset();
    uploadedImageBase64 = '';
    spotModal.style.display = 'none';
  });

  // 初回表示
  renderMapSpots();
  updateUserLocation();
});
