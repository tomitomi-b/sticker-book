document.addEventListener('DOMContentLoaded', () => {
  // 1. 表紙開閉
  const cover = document.getElementById('cover');
  if (cover) {
    cover.addEventListener('click', () => {
      cover.classList.add('open');
      setTimeout(() => { if (window.map) window.map.invalidateSize(); }, 400);
    });
  }

  // 2. 状態管理（ローカルストレージ連携）
  let userLocation = null; // {lat, lng}
  let myStickers = JSON.parse(localStorage.getItem('my_collected_stickers') || '[]');
  let mapSpots = JSON.parse(localStorage.getItem('map_sticker_spots') || '[]');

  // 初期サンプルスポット（もし何も登録されていなければ追加）
  if (mapSpots.length === 0) {
    mapSpots = [
      {
        id: 'sample-1',
        title: '東京駅限定スタンプ',
        lat: 35.681236,
        lng: 139.767125,
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=150&auto=format&fit=crop&q=60'
      }
    ];
    localStorage.setItem('map_sticker_spots', JSON.stringify(mapSpots));
  }

  // 3. Leaflet 地図初期化
  const map = L.map('map').setView([35.681236, 139.767125], 14);
  window.map = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  let userMarker = null;

  // 2地点間の距離（メートル）を計算する関数 (Haversine formula)
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

  // 所持シールのUI更新
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

  // スポットの再描画
  const spotMarkers = [];
  function renderMapSpots() {
    // 既存マーカー削除
    spotMarkers.forEach(m => map.removeLayer(m));
    spotMarkers.length = 0;

    mapSpots.forEach(spot => {
      const isAlreadyGet = myStickers.some(s => s.id === spot.id);
      
      // カスタムアイコン
      const spotIcon = L.icon({
        iconUrl: spot.image,
        iconSize: [38, 38],
        className: 'custom-spot-icon'
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon }).addTo(map);

      // ポップアップイベント
      marker.on('click', () => {
        let distText = '現在地を取得してください';
        let canGet = false;

        if (userLocation) {
          const dist = getDistanceMeters(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
          distText = `距離: 約${Math.round(dist)}m`;
          // 200m以内なら獲得可能（デモ用に200m設定）
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
        `;

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

        marker.bindPopup(popupContent).openPopup();
      });

      spotMarkers.push(marker);
    });
  }

  // 現在地更新処理
  function updateUserLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        // 現在地ピンを表示
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

  // 地図クリックで新しいスポットを自作登録
  const createModal = document.getElementById('create-modal');
  const createCancelBtn = document.getElementById('create-cancel-btn');
  const createForm = document.getElementById('create-sticker-form');
  const imageInput = document.getElementById('sticker-image-input');
  
  let selectedLatLng = null;
  let uploadedImageBase64 = '';

  map.on('click', (e) => {
    selectedLatLng = e.latlng;
    createModal.style.display = 'flex';
  });

  createCancelBtn.addEventListener('click', () => {
    createModal.style.display = 'none';
  });

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => { uploadedImageBase64 = evt.target.result; };
      reader.readAsDataURL(file);
    }
  });

  createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('sticker-title-input').value;
    if (!uploadedImageBase64 || !selectedLatLng) return;

    const newSpot = {
      id: 'spot-' + Date.now(),
      title: title,
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng,
      image: uploadedImageBase64
    };

    mapSpots.push(newSpot);
    localStorage.setItem('map_sticker_spots', JSON.stringify(mapSpots));

    renderMapSpots();
    createForm.reset();
    uploadedImageBase64 = '';
    createModal.style.display = 'none';
    alert(`📍 「${title}」のシールスポットを地図に設置しました！他のユーザーもここに来れば獲得できます。`);
  });

  // 初回起動処理
  renderMyStickers();
  renderMapSpots();
  updateUserLocation();
});
