import { THEME_COOKIE } from '@/lib/i18n/config';

export const themeInitScript = `
(function () {
  try {
    var name = '${THEME_COOKIE}';
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    var stored = match ? decodeURIComponent(match[1]) : null;
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();
`.trim();
