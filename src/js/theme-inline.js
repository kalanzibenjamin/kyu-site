(function () {
  const key = 'kyu-theme';
  const dark = 'dark';
  const light = 'light';
  const stored = localStorage.getItem(key);
  const theme = stored === light ? light : dark;
  const root = document.documentElement;
  const body = document.body;

  if (theme === light) {
    root.classList.add('light-mode');
    body && body.classList.add('light-mode');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light-mode');
    body && body.classList.remove('light-mode');
    root.style.colorScheme = 'dark';
  }

  root.setAttribute('data-theme', theme);
})();
