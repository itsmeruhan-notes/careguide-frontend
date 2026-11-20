try {
  if (localStorage.getItem('rn-theme') === 'dark') document.documentElement.classList.add('dark');
} catch (e) {
  void e;
}
