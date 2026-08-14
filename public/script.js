document.addEventListener('DOMContentLoaded', () => {
  // 表紙開閉
  const cover = document.getElementById('cover');
  if (cover) {
    cover.addEventListener('click', () => {
      cover.classList.add('open');
      setTimeout(() => { if (window.map) window.map.invalidateSize(); }, 400);
    });
  }

  // ユーザーIDの生成/取得（自分が作成したか識別するため）
  let myUserId = localStorage.getItem('my_user_id');
  if (!myUserId) {
    myUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('my_user_id', myUserId);
  }

  let userLocation = null;
  let myStickers = JSON.parse(localStorage.getItem('my_collected_stickers') || '[]');
  let mapSpots = JSON.parse(localStorage.getItem('map_sticker_spots') || '[]');

  // サンプルデータ
  if (mapSpots.length === 0) {
    mapSpots = [
      {
        id: 'sample-1',
        ownerId: 'other-user',
        title: '東京駅限定スタンプ',
        description: '東京駅丸の内駅舎を記念した特製スタンプです！',
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

  function renderMyStickers() {
    const listEl = document.getElementById('myStickerList');
    listEl.innerHTML = '';
    
    if (myStickers.length === 0) {
      listEl.innerHTML = '<span class="empty-msg">まだシールを獲得していません。</span>';
      return;
    }

    myStickers.forEach(s => {
      const item = document.createElement('div');
      item.className = 'sticker-item';
      item.innerHTML = `
        <img src="${s.image}" alt="${s.title}">
        <span>${s.title}</span>
      `;
      listEl.appendChild(item);
    });
  }

  const spotMarkers = [];
  function renderMapSpots() {
    spotMarkers.forEach(m => map.removeLayer(m));
    spotMarkers.length = 0;

    mapSpots.forEach(spot => {
      const isAlreadyGet = myStickers.some(s => s.id === spot.id);
      const isMine = spot.ownerId === myUserId; // 自分が作成したものかチェック

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
          <p class="popup-desc">${spot.description || '説明はありません。'}</p>
          <small>${distText}</small>
          <button class="popup-get-btn" ${btnDisabled}>${btnText}</button>
          ${isMine ? `
            <div class="owner-actions">
              <button class="edit-btn">編集</button>
              <button class="delete-btn">削除</button>
            </div>
          ` : ''}
        `;

        // 獲得ボタンイベント
        const getBtn = popupContent.querySelector('.popup-get-btn');
        if (getBtn && canGet && !isAlreadyGet) {
          getBtn.addEventListener('click', () => {
            myStickers.push(spot);
            localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
            renderMyStickers();
            alert(`🎉 「${spot.title}」のシールを獲得しました！`);
            map.closePopup();
            renderMapSpots();
          });
        }

        // 自分が作成したスポットの場合：編集・削除イベントを登録
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

  // 新規設置モーダルを開く
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

  // 編集モーダルを開く関数
  function openEditModal(spot) {
    document.getElementById('modal-title').textContent = 'スポットの編集';
    document.getElementById('modal-submit-btn').textContent = '更新する';
    document.getElementById('editing-spot-id').value = spot.id;
    document.getElementById('spot-title-input').value = spot.title;
    document.getElementById('spot-desc-input').value = spot.description || '';
    document.getElementById('image-input-label').textContent = 'シール画像 (変更する場合のみ)';
    
    uploadedImageBase64 = spot.image; // デフォルトは既存の画像
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

  // 送信（新規・更新共通）
  spotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editingId = document.getElementById('editing-spot-id').value;
    const title = document.getElementById('spot-title-input').value;
    const description = document.getElementById('spot-desc-input').value;

    if (editingId) {
      // 編集更新
      const targetSpot = mapSpots.find(s => s.id === editingId);
      if (targetSpot) {
        targetSpot.title = title;
        targetSpot.description = description;
        if (uploadedImageBase64) targetSpot.image = uploadedImageBase64;
      }
      alert('スポット情報を更新しました！');
    } else {
      // 新規作成
      if (!uploadedImageBase64 || !selectedLatLng) return;

      const newSpot = {
        id: 'spot-' + Date.now(),
        ownerId: myUserId, // 作成者IDを付与
        title: title,
        description: description,
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
  renderMyStickers();
  renderMapSpots();
  updateUserLocation();
});
