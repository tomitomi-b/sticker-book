document.addEventListener('DOMContentLoaded', () => {
  // 1. 表紙の開閉
  const cover = document.getElementById('cover');
  const innerPage = document.querySelector('.inner-page');

  if (cover) {
    cover.addEventListener('click', () => {
      cover.classList.add('open');
      setTimeout(() => {
        if (window.map) {
          window.map.invalidateSize();
        }
      }, 400);
    });
  }

  // 再度クリックで閉じられるよう内側クリックのハンドラも追加
  if (innerPage) {
    innerPage.addEventListener('dblclick', () => {
      if (cover && cover.classList.contains('open')) {
        cover.classList.remove('open');
      }
    });
  }

  // 2. Leaflet 地図の初期化 (東京駅周辺をデフォルト)
  const map = L.map('map').setView([35.681236, 139.767125], 13);
  window.map = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 3. 地図クリックでシール獲得/登録モーダル表示
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('create-sticker-form');
  const stickerList = document.getElementById('stickerList');
  const imageInput = document.getElementById('sticker-image-input');

  let selectedLatLng = null;
  let stickerImageData = '';

  map.on('click', (e) => {
    selectedLatLng = e.latlng;
    modalOverlay.style.display = 'flex';
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      modalOverlay.style.display = 'none';
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          stickerImageData = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // フォーム送信で地図とコレクションにシールを追加
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('sticker-title-input').value;

      if (!stickerImageData || !selectedLatLng) return;

      // 地図にカスタムアイコンピンを立てる
      const customIcon = L.icon({
        iconUrl: stickerImageData,
        iconSize: [36, 36],
        className: 'custom-map-sticker'
      });

      L.marker([selectedLatLng.lat, selectedLatLng.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>${title}</b>`);

      // 下部のシールリストに追加
      const emptyMsg = stickerList.querySelector('.empty-msg');
      if (emptyMsg) emptyMsg.remove();

      const item = document.createElement('div');
      item.className = 'sticker-item';
      item.innerHTML = `
        <img src="${stickerImageData}" alt="${title}">
        <span>${title}</span>
      `;
      stickerList.appendChild(item);

      // モーダルリセット＆閉じる
      form.reset();
      stickerImageData = '';
      modalOverlay.style.display = 'none';
    });
  }

  // 4. 現在地ボタンの機能
  const getLocationBtn = document.getElementById('get-location-btn');
  if (getLocationBtn) {
    getLocationBtn.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          map.setView([lat, lng], 15);
          
          selectedLatLng = { lat, lng };
          modalOverlay.style.display = 'flex';
        }, () => {
          alert('現在地の取得に失敗しました。');
        });
      } else {
        alert('お使いのブラウザは位置情報に対応していません。');
      }
    });
  }
});
