(() => {
  // Language comes from the URL ("/" = Arabic, "/en/" = English) and is rendered on the server.
  try {
    document.documentElement.dataset.theme = localStorage.getItem('sami-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  } catch {
    document.documentElement.dataset.theme = 'dark'
  }
})();
