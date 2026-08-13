document.addEventListener('DOMContentLoaded', () => {
  const cover = document.getElementById('cover');

  if (cover) {
    // 表紙をクリックするとトグルで開閉（めくるアニメーション）
    cover.addEventListener('click', () => {
      cover.classList.toggle('open');
    });
  }
});
