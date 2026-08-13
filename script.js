document.addEventListener('DOMContentLoaded', () => {
  const binder = document.getElementById('binder');
  const parrot = document.getElementById('parrot');

  if (parrot) {
    parrot.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const svg = parrot.querySelector('.parrot-svg');
      svg.style.transform = 'scale(1.25) rotate(8deg)';
      
      setTimeout(() => {
        svg.style.transform = '';
      }, 350);
    });
  }

  if (binder) {
    binder.addEventListener('click', () => {
      console.log('Binder clicked.');
    });
  }
});
