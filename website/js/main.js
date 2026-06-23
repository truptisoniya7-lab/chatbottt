// Scroll nav shadow
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 20);
  });

  // Toast notifications
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Filter tabs
  function setTab(btn) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    showToast('Filtering: ' + btn.textContent);
  }

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // Wishlist toggle
  document.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isWished = btn.textContent === '❤️';
      btn.textContent = isWished ? '♡' : '❤️';
      showToast(isWished ? '♡ Removed from wishlist' : '❤️ Added to wishlist!');
    });
  });