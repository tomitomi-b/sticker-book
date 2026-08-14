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
  // シール帳＆トレーのレンダリング＆ドラッグ処理
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

    // トレーのレンダリング
    stickerTray.innerHTML = '';
    if (stickerCountBadge) stickerCountBadge.textContent = `${myStickers.length}枚`;

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

        setupTrayItemTouchDrag(item, sticker);
        stickerTray.appendChild(item);
      });
    }

    renderPlacedStickers();
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

      stickerEl.innerHTML = `<img src="${ps.image}" alt="${ps.title}">`;

      setupPlacedStickerTouchDrag(stickerEl, ps);
      albumBoard.appendChild(stickerEl);
    });
  }

  // スマホ対応：トレーから台紙へのタッチドラッグ
  function setupTrayItemTouchDrag(itemEl, stickerData) {
    itemEl.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      let startX = touch.clientX;
      let startY = touch.clientY;
      let isDragging = false;
      let ghostEl = null;

      const onTouchMove = (ev) => {
        const t = ev.touches[0];
        const moveX = Math.abs(t.clientX - startX);
        const moveY = Math.abs(t.clientY - startY);

        if (!isDragging && (moveX > 4 || moveY > 4)) {
          isDragging = true;
          ghostEl = itemEl.cloneNode(true);
          ghostEl.style.position = 'fixed';
          ghostEl.style.zIndex = '9999';
          ghostEl.style.opacity = '0.9';
          ghostEl.style.pointerEvents = 'none';
          ghostEl.style.transform = 'translate(-50%, -50%) scale(1.15)';
          document.body.appendChild(ghostEl);
        }

        if (isDragging && ghostEl) {
          ghostEl.style.left = `${t.clientX}px`;
          ghostEl.style.top = `${t.clientY}px`;
          ev.preventDefault();
        }
      };

      const onTouchEnd = (ev) => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);

        if (!isDragging) {
          if (ghostEl) ghostEl.remove();
          return;
        }

        const touchEnd = ev.changedTouches[0] || (ev.touches && ev.touches[0]);
        
        if (ghostEl) {
          ghostEl.remove();
          ghostEl = null;
        }

        if (!touchEnd) return;

        const boardRect = albumBoard.getBoundingClientRect();

        if (
          touchEnd.clientX >= boardRect.left &&
          touchEnd.clientX <= boardRect.right &&
          touchEnd.clientY >= boardRect.top &&
          touchEnd.clientY <= boardRect.bottom
        ) {
          const relX = ((touchEnd.clientX - boardRect.left) / boardRect.width) * 100;
          const relY = ((touchEnd.clientY - boardRect.top) / boardRect.height) * 100;

          const newPlacedSticker = {
            instanceId: 'placed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            stickerId: stickerData.id,
            title: stickerData.title,
            image: stickerData.image,
            x: relX,
            y: relY,
            rotation: Math.floor(Math.random() * 16) - 8
          };

          placedStickers.push(newPlacedSticker);
          
          const index = myStickers.findIndex(s => s.id === stickerData.id);
          if (index !== -1) {
            myStickers.splice(index, 1);
          }

          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
          localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
          renderAlbumAndTray();
        }
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    });

    // マウス操作（PC用フォールバック）
    itemEl.addEventListener('mousedown', (e) => {
      let startX = e.clientX;
      let startY = e.clientY;
      let isDragging = false;
      let ghostEl = null;

      const onMouseMove = (ev) => {
        if (!isDragging && (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)) {
          isDragging = true;
          ghostEl = itemEl.cloneNode(true);
          ghostEl.style.position = 'fixed';
          ghostEl.style.zIndex = '9999';
          ghostEl.style.opacity = '0.9';
          ghostEl.style.pointerEvents = 'none';
          ghostEl.style.transform = 'translate(-50%, -50%) scale(1.15)';
          document.body.appendChild(ghostEl);
        }
        if (isDragging && ghostEl) {
          ghostEl.style.left = `${ev.clientX}px`;
          ghostEl.style.top = `${ev.clientY}px`;
        }
      };

      const onMouseUp = (ev) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!isDragging) return;
        if (ghostEl) ghostEl.remove();

        const boardRect = albumBoard.getBoundingClientRect();
        if (
          ev.clientX >= boardRect.left && ev.clientX <= boardRect.right &&
          ev.clientY >= boardRect.top && ev.clientY <= boardRect.bottom
        ) {
          const relX = ((ev.clientX - boardRect.left) / boardRect.width) * 100;
          const relY = ((ev.clientY - boardRect.top) / boardRect.height) * 100;

          placedStickers.push({
            instanceId: 'placed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            stickerId: stickerData.id,
            title: stickerData.title,
            image: stickerData.image,
            x: relX, y: relY,
            rotation: Math.floor(Math.random() * 16) - 8
          });

          const index = myStickers.findIndex(s => s.id === stickerData.id);
          if (index !== -1) myStickers.splice(index, 1);

          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
          localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
          renderAlbumAndTray();
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // スマホ対応：台紙上のシール移動 & 枠外へ持って行くとトレーに戻すタッチドラッグ
  function setupPlacedStickerTouchDrag(stickerEl, placedData) {
    stickerEl.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      let startX = touch.clientX;
      let startY = touch.clientY;
      let isDragging = false;
      const boardRect = albumBoard.getBoundingClientRect();

      const onTouchMove = (ev) => {
        const t = ev.touches[0];
        if (!isDragging && (Math.abs(t.clientX - startX) > 4 || Math.abs(t.clientY - startY) > 4)) {
          isDragging = true;
          stickerEl.style.zIndex = '1000';
        }

        if (isDragging) {
          let relX = ((t.clientX - boardRect.left) / boardRect.width) * 100;
          let relY = ((t.clientY - boardRect.top) / boardRect.height) * 100;
          stickerEl.style.left = `${relX}%`;
          stickerEl.style.top = `${relY}%`;
          ev.preventDefault();
        }
      };

      const onTouchEnd = (ev) => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);

        if (!isDragging) return;
        stickerEl.style.zIndex = '10';

        const t = ev.changedTouches[0] || (ev.touches && ev.touches[0]);
        if (!t) return;

        if (
          t.clientX < boardRect.left ||
          t.clientX > boardRect.right ||
          t.clientY < boardRect.top ||
          t.clientY > boardRect.bottom
        ) {
          returnStickerToTray(placedData);
          return;
        }

        let relX = ((t.clientX - boardRect.left) / boardRect.width) * 100;
        let relY = ((t.clientY - boardRect.top) / boardRect.height) * 100;

        const target = placedStickers.find(p => p.instanceId === placedData.instanceId);
        if (target) {
          target.x = relX;
          target.y = relY;
          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
        }
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    });

    // マウス操作（PC用フォールバック）
    stickerEl.addEventListener('mousedown', (e) => {
      let isDragging = false;
      let startX = e.clientX;
      let startY = e.clientY;
      const boardRect = albumBoard.getBoundingClientRect();

      const onMouseMove = (ev) => {
        if (!isDragging && (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)) {
          isDragging = true;
          stickerEl.style.zIndex = '1000';
        }
        if (isDragging) {
          let relX = ((ev.clientX - boardRect.left) / boardRect.width) * 100;
          let relY = ((ev.clientY - boardRect.top) / boardRect.height) * 100;
          stickerEl.style.left = `${relX}%`;
          stickerEl.style.top = `${relY}%`;
        }
      };

      const onMouseUp = (ev) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!isDragging) return;
        stickerEl.style.zIndex = '10';

        if (
          ev.clientX < boardRect.left || ev.clientX > boardRect.right ||
          ev.clientY < boardRect.top || ev.clientY > boardRect.bottom
        ) {
          returnStickerToTray(placedData);
          return;
        }

        let relX = ((ev.clientX - boardRect.left) / boardRect.width) * 100;
        let relY = ((ev.clientY - boardRect.top) / boardRect.height) * 100;

        const target = placedStickers.find(p => p.instanceId === placedData.instanceId);
        if (target) {
          target.x = relX;
          target.y = relY;
          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  renderAlbumAndTray();
});
