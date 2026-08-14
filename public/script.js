document.addEventListener('DOMContentLoaded', () => {
  const cover = document.getElementById('cover');
  const badgeText = document.getElementById('badgeText');

  if (cover) {
    cover.addEventListener('click', () => {
      cover.classList.toggle('open');
      if (badgeText) {
        badgeText.textContent = cover.classList.contains('open') ? 'CLICK TO CLOSE' : 'CLICK TO OPEN';
      }
      if (typeof window.map !== 'undefined' && window.map) {
        setTimeout(() => { window.map.invalidateSize(); }, 300);
      }
    });
  }

  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const imageInput = document.getElementById('sticker-image-input');
  const form = document.getElementById('create-sticker-form');

  let currentSelectedLatLng = null;
  let currentImageDataUrl = '';

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => { modalOverlay.style.display = 'none'; });
  }

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => { currentImageDataUrl = event.target.result; };
        reader.readAsDataURL(file);
      }
    });
  }

  const bindMapClick = () => {
    if (window.map) {
      window.map.on('click', (e) => {
        currentSelectedLatLng = e.latlng;
        modalOverlay.style.display = 'flex';
      });
    } else {
      setTimeout(bindMapClick, 500);
    }
  };
  bindMapClick();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('sticker-title-input').value;
      if (!currentImageDataUrl || !currentSelectedLatLng) return;

      if (window.map) {
        const customIcon = L.icon({
          iconUrl: currentImageDataUrl,
          iconSize: [40, 40],
          className: 'user-custom-stamp'
        });
        L.marker([currentSelectedLatLng.lat, currentSelectedLatLng.lng], { icon: customIcon })
          .addTo(window.map)
          .bindPopup(`<b>${title}</b>`);
      }

      alert(`スタンプ「${title}」を登録しました！`);
      form.reset();
      modalOverlay.style.display = 'none';
    });
  }
});
