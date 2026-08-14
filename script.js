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

  if (btnPage1 && btnPage2) {
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
  }

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
  const mapContainer = document.getElementById('map');
  if (mapContainer && typeof L !== 'undefined') {
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

    const spotMarkers = [];
    function renderMapSpots() {
      spotMarkers.forEach(m => map.removeLayer(m));
      spotMarkers.length = 0;

      mapSpots.forEach(spot => {
        const isAlreadyGet = myStickers.some(s => s.id === spot.id) || placedStickers.some(p => p.stickerId === spot.id);
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
          `;

          const getBtn = popupContent.querySelector('.popup-get-btn');
          if (getBtn && canGet && !isAlreadyGet) {
            getBtn.addEventListener('click', () => {
              myStickers.push(spot);
              localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
              alert(`🎉 「${spot.title}」のシールを獲得しました！`);
              map.closePopup();
              renderMapSpots();
              renderAlbumAndTray();
            });
          }

          marker.bindPopup(popupContent).openPopup();
        });

        spotMarkers.push(marker);
      });
    }

    function updateUserLocation() {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (userMarker) map.removeLayer(userMarker);
          userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 8, fillColor: '#3b82f6', color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.9
          }).addTo(map).bindPopup('📍 あなたの現在地');
          map.setView([userLocation.lat, userLocation.lng], 15);
          renderMapSpots();
        });
      }
    }

    const locateBtn = document.getElementById('locate-me-btn');
    if (locateBtn) locateBtn.addEventListener('click', updateUserLocation);

    renderMapSpots();
    updateUserLocation();
  }

  // ----------------------------------------------------
  // タップで配置 ＆ ドラッグで移動する実装
  // ----------------------------------------------------
  const albumBoard = document.getElementById('albumBoard');
  const stickerTray = document.getElementById('stickerTray');
  const emptyMsg = document.getElementById('emptyMsg');
  const stickerCountBadge = document.getElementById('sticker-count-badge');

  function returnStickerToTray(placedData) {
    placedStickers = placedStickers.filter(p => p.instanceId !== placedData.instanceId);
    
    myStickers.push({
      id: placedData.stickerId,
      title: placedData.title,
      image: placedData.image
    });

    localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
    localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
    
    renderAlbumAndTray();
  }

  function renderAlbumAndTray() {
    if (!stickerTray || !albumBoard) return;

    stickerTray.innerHTML = '';
    if (stickerCountBadge) stickerCountBadge.textContent = `${myStickers.length}枚`;

    if (myStickers.length === 0) {
      stickerTray.innerHTML = '<span class="empty-tray-msg">シールがありません</span>';
    } else {
      myStickers.forEach(sticker => {
        const item = document.createElement('div');
        item.className = 'tray-sticker-item';
        item.style.touchAction = 'manipulation';
        item.innerHTML = `
          <img src="${sticker.image}" alt="${sticker.title}">
          <span>${sticker.title}</span>
        `;

        // トレーのシールをタップすると台紙に配置
        item.addEventListener('click', () => {
          const randomX = 30 + Math.random() * 40; 
          const randomY = 30 + Math.random() * 40;

          const newPlacedSticker = {
            instanceId: 'placed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            stickerId: sticker.id,
            title: sticker.title,
            image: sticker.image,
            x: randomX,
            y: randomY,
            rotation: Math.floor(Math.random() * 20) - 10
          };

          placedStickers.push(newPlacedSticker);
          
          const index = myStickers.findIndex(s => s.id === sticker.id);
          if (index !== -1) {
            myStickers.splice(index, 1);
          }

          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
          localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
          renderAlbumAndTray();
        });

        stickerTray.appendChild(item);
      });
    }

    renderPlacedStickers();
  }

  // 台紙上のシールをドラッグ可能にする関数
  function makeDraggable(el, stickerData) {
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
      
      const boardRect = albumBoard.getBoundingClientRect();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = startLeftPercent + (dx / boardRect.width) * 100;
      let newY = startTopPercent + (dy / boardRect.height) * 100;

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

      localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  }

  function renderPlacedStickers() {
    if (!albumBoard) return;
    const existingStickers = albumBoard.querySelectorAll('.placed-sticker');
    existingStickers.forEach(el => el.remove());

    if (emptyMsg) {
      emptyMsg.style.display = placedStickers.length > 0 ? 'none' : 'block';
    }

    placedStickers.forEach(ps => {
      const stickerEl = document.createElement('div');
      stickerEl.className = 'placed-sticker';
      stickerEl.dataset.placedId = ps.instanceId;
      stickerEl.style.left = `${ps.x}%`;
      stickerEl.style.top = `${ps.y}%`;
      stickerEl.style.transform = `translate(-50%, -50%) rotate(${ps.rotation || 0}deg)`;
      stickerEl.style.position = 'absolute';
      stickerEl.style.touchAction = 'none'; // スマホドラッグに必須
      stickerEl.style.zIndex = '10';
      stickerEl.style.display = 'flex';
      stickerEl.style.flexDirection = 'column';
      stickerEl.style.alignItems = 'center';

      // 画像と×ボタンを配置
      stickerEl.innerHTML = `
        <div style="position: relative;">
          <img src="${ps.image}" alt="${ps.title}" style="pointer-events: none; width: 50px; height: 50px; border-radius: 50%; border: 2px solid #f3e8ff; object-fit: cover;">
          <button class="remove-sticker-btn" style="position: absolute; top: -5px; right: -5px; background: #ff4d4f; color: white; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; font-size: 14px; font-weight: bold; line-height: 20px; text-align: center; cursor: pointer; padding: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 20; touch-action: manipulation;">×</button>
        </div>
        <span style="font-size: 9px; font-weight: bold; color: #44403c; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; margin-top: 4px;">${ps.title}</span>
      `;

      const removeBtn = stickerEl.querySelector('.remove-sticker-btn');
      if (removeBtn) {
        const handleRemove = (e) => {
          e.preventDefault();
          e.stopPropagation();
          returnStickerToTray(ps);
        };
        // タップでもクリックでも反応させる
        removeBtn.addEventListener('click', handleRemove);
        removeBtn.addEventListener('touchstart', handleRemove, { passive: false });
      }

      makeDraggable(stickerEl, ps);
      albumBoard.appendChild(stickerEl);
    });
  }

  renderAlbumAndTray();
});
