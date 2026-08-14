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
  // シール帳＆トレーのレンダリング＆配置処理（タップ＆ドラッグ両対応）
  // ----------------------------------------------------
  const albumBoard = document.getElementById('albumBoard');
  const stickerTray = document.getElementById('stickerTray');
  const emptyMsg = document.getElementById('emptyMsg');
  const stickerCountBadge = document.getElementById('sticker-count-badge');

  // 現在選択中のシール（スマホのタップ配置用）
  let selectedStickerForPlacement = null;

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
      selectedStickerForPlacement = null;
    } else {
      myStickers.forEach(sticker => {
        const item = document.createElement('div');
        item.className = 'tray-sticker-item';
        if (selectedStickerForPlacement && selectedStickerForPlacement.tempKey === sticker._tempKey) {
          item.classList.add('selected-for-place');
        }
        
        // 一意のテンポラリーキーを付与
        if (!sticker._tempKey) sticker._tempKey = Math.random().toString(36).substring(2, 9);

        item.dataset.stickerId = sticker.id;
        item.innerHTML = `
          <img src="${sticker.image}" alt="${sticker.title}">
          <span>${sticker.title}</span>
        `;

        // スマホ用タップ選択
        item.addEventListener('click', () => {
          document.querySelectorAll('.tray-sticker-item').forEach(el => el.classList.remove('selected-for-place'));
          selectedStickerForPlacement = sticker;
          item.classList.add('selected-for-place');
          alert(`「${sticker.title}」を選択しました。貼りたい台紙の場所をタップしてください！`);
        });

        // PC用ドラッグ
        setupTrayItemDrag(item, sticker);
        stickerTray.appendChild(item);
      });
    }

    renderPlacedStickers();
  }

  // 台紙をタップした時の配置（スマホ用）
  if (albumBoard) {
    albumBoard.addEventListener('click', (e) => {
      // 台紙上に貼られた既存シールやゴミ箱などのクリック時はスルー
      if (e.target.closest('.placed-sticker')) return;

      if (selectedStickerForPlacement) {
        const boardRect = albumBoard.getBoundingClientRect();
        const relX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
        const relY = ((e.clientY - boardRect.top) / boardRect.height) * 100;

        const newPlacedSticker = {
          instanceId: 'placed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          stickerId: selectedStickerForPlacement.id,
          title: selectedStickerForPlacement.title,
          image: selectedStickerForPlacement.image,
          x: relX,
          y: relY,
          rotation: Math.floor(Math.random() * 16) - 8
        };

        placedStickers.push(newPlacedSticker);
        
        const index = myStickers.findIndex(s => s._tempKey === selectedStickerForPlacement._tempKey);
        if (index !== -1) {
          myStickers.splice(index, 1);
        }

        selectedStickerForPlacement = null;

        localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
        localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
        renderAlbumAndTray();
      }
    });
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

      // 貼られたシールをタップしたらトレーに戻す（または移動）
      stickerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`「${ps.title}」をシール一覧（トレー）に戻しますか？`)) {
          returnStickerToTray(ps);
        }
      });

      setupPlacedStickerDrag(stickerEl, ps);
      albumBoard.appendChild(stickerEl);
    });
  }

  // トレーから台紙へドラッグ（PC用）
  function setupTrayItemDrag(itemEl, stickerData) {
    itemEl.addEventListener('pointerdown', (e) => {
      let startX = e.clientX;
      let startY = e.clientY;
      let isDragging = false;
      let ghostEl = null;

      const onPointerMove = (ev) => {
        if (!isDragging && (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5)) {
          isDragging = true;
          try { itemEl.setPointerCapture(e.pointerId); } catch (err) {}

          ghostEl = itemEl.cloneNode(true);
          ghostEl.style.position = 'fixed';
          ghostEl.style.zIndex = '1000';
          ghostEl.style.opacity = '0.85';
          ghostEl.style.pointerEvents = 'none';
          ghostEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
          document.body.appendChild(ghostEl);
        }

        if (isDragging && ghostEl) {
          ghostEl.style.left = `${ev.clientX}px`;
          ghostEl.style.top = `${ev.clientY}px`;
        }
      };

      const onPointerUp = (ev) => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);

        if (!isDragging) return;
        if (ghostEl) { ghostEl.remove(); ghostEl = null; }

        const boardRect = albumBoard.getBoundingClientRect();
        if (
          ev.clientX >= boardRect.left &&
          ev.clientX <= boardRect.right &&
          ev.clientY >= boardRect.top &&
          ev.clientY <= boardRect.bottom
        ) {
          const relX = ((ev.clientX - boardRect.left) / boardRect.width) * 100;
          const relY = ((ev.clientY - boardRect.top) / boardRect.height) * 100;

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
          
          const index = myStickers.findIndex(s => s._tempKey === stickerData._tempKey);
          if (index !== -1) {
            myStickers.splice(index, 1);
          }

          localStorage.setItem('my_placed_stickers', JSON.stringify(placedStickers));
          localStorage.setItem('my_collected_stickers', JSON.stringify(myStickers));
          renderAlbumAndTray();
        }
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  }

  // 台紙上でのドラッグ移動 & 枠外ドラッグ
  function setupPlacedStickerDrag(stickerEl, placedData) {
    stickerEl.addEventListener('pointerdown', (e) => {
      let isDragging = false;
      let startX = e.clientX;
      let startY = e.clientY;
      const boardRect = albumBoard.getBoundingClientRect();

      const onPointerMove = (ev) => {
        if (!isDragging && (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5)) {
          isDragging = true;
          try { stickerEl.setPointerCapture(e.pointerId); } catch (err) {}
          stickerEl.style.zIndex = '100';
        }

        if (isDragging) {
          let relX = ((ev.clientX - boardRect.left) / boardRect.width) * 100;
          let relY = ((ev.clientY - boardRect.top) / boardRect.height) * 100;
          stickerEl.style.left = `${relX}%`;
          stickerEl.style.top = `${relY}%`;
        }
      };

      const onPointerUp = (ev) => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);

        if (!isDragging) return; // ドラッグしていなければタップイベントに任せる
        stickerEl.style.zIndex = '10';

        if (
          ev.clientX < boardRect.left ||
          ev.clientX > boardRect.right ||
          ev.clientY < boardRect.top ||
          ev.clientY > boardRect.bottom
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

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      e.stopPropagation();
    });
  }

  renderAlbumAndTray();
});
