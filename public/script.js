document.addEventListener('DOMContentLoaded', () => {
  const cover = document.getElementById('cover');
  const badgeText = document.getElementById('badgeText');

  if (cover) {
    cover.classList.remove('open');
    cover.addEventListener('click', () => {
      cover.classList.toggle('open');
      if (badgeText) {
        badgeText.textContent = cover.classList.contains('open') ? 'CLICK TO CLOSE' : 'CLICK TO OPEN';
      }
    });
  }
});
