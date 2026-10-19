/*
 * Theme picker, wallpaper toggle, install tabs and copy buttons.
 * Theme data mirrors the panel's web/src/lib/theme.ts.
 */
(function () {
  'use strict';

  var THEMES = [
    {
      id: 'outpost',
      label: 'Outpost',
      description: 'The default dark Material look.',
      chrome: '#11140f',
      swatch: ['#11140f', '#1d211b', '#78dc77', '#e1e4da'],
      preview: { sidebar: '#1d211b', radius: 8 },
    },
    {
      id: 'xp',
      label: 'Windows XP',
      description: 'Luna blue task panes, beige windows and glossy buttons.',
      chrome: '#0a5fe8',
      swatch: ['#ece9d8', '#ffffff', '#0054e3', '#000000'],
      preview: { sidebar: 'linear-gradient(#7ba2e7, #6375d6)', radius: 3 },
    },
    {
      id: 'minecraft',
      label: 'Minecraft',
      description: 'Square inventory panels, stone buttons and a pixel font.',
      chrome: '#593d29',
      swatch: ['#aaaaaa', '#c6c6c6', '#5d9c3a', '#3f3f3f'],
      preview: { sidebar: '#4a3524', radius: 0, border: '2px solid #000' },
    },
    {
      id: 'vista',
      label: 'Windows Vista / 7',
      description: 'Aero glass, a deep blue desktop and glossy Explorer buttons.',
      chrome: '#0c3266',
      swatch: ['#eaf1f9', '#ffffff', '#2a7bd4', '#1e395b'],
      preview: {
        sidebar: 'linear-gradient(180deg, rgba(60,110,170,.9), rgba(10,35,70,.95))',
        page: 'radial-gradient(ellipse at 70% 35%, #6fb4ee, transparent 70%), linear-gradient(160deg, #1d5594, #071f45)',
        radius: 4,
        border: '1px solid rgba(110,140,180,.6)',
      },
    },
    {
      id: 'aero',
      label: 'Frutiger Aero',
      description: 'Glossy sky, bubbles and grass — frosted glass everywhere.',
      chrome: '#3fb8f2',
      swatch: ['#8fdcff', 'rgba(255,255,255,.75)', '#79cf3a', '#07466f'],
      preview: {
        sidebar: 'linear-gradient(rgba(255,255,255,.75), rgba(255,255,255,.45))',
        page: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,.9) 0 6%, transparent 7%), linear-gradient(180deg, #3fb8f2, #b9ecff 70%, #7fd14a 71%)',
        radius: 12,
        border: '1px solid rgba(255,255,255,.95)',
      },
    },
  ];

  var THEME_KEY = 'outpost_site_theme';
  var WALLPAPER_KEY = 'outpost_site_wallpaper';
  var root = document.documentElement;

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // private window or blocked storage — the choice still applies for this visit
    }
  }

  function findTheme(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return THEMES[0];
  }

  function applyTheme(id, save) {
    var theme = findTheme(id);
    root.dataset.theme = theme.id;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.chrome);
    var buttons = document.querySelectorAll('[data-theme-id]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.themeId === theme.id));
    }
    var label = document.querySelector('.theme-toggle-label');
    if (label) label.textContent = theme.label;
    if (save) store(THEME_KEY, theme.id);
  }

  // A mini window drawn from the theme's swatches, like the panel's Appearance picker.
  function miniPreview(theme) {
    var p = theme.preview;
    var mini = document.createElement('span');
    mini.className = 'mini';
    mini.setAttribute('aria-hidden', 'true');
    mini.style.borderRadius = p.radius + 'px';
    mini.style.border = p.border || '1px solid rgba(0,0,0,.25)';
    mini.style.background = p.page || theme.swatch[0];

    var side = document.createElement('span');
    side.style.background = p.sidebar;
    var page = document.createElement('span');
    page.className = 'mini-page';
    for (var i = 0; i < 2; i++) {
      var panel = document.createElement('span');
      panel.className = 'mini-panel';
      panel.style.background = theme.swatch[1];
      panel.style.borderRadius = Math.max(0, p.radius - 2) + 'px';
      if (p.border) panel.style.border = p.border;
      page.appendChild(panel);
    }
    var accent = document.createElement('span');
    accent.className = 'mini-accent';
    accent.style.background = theme.swatch[2];
    accent.style.borderRadius = Math.min(p.radius, 3) + 'px';
    page.appendChild(accent);

    mini.appendChild(side);
    mini.appendChild(page);
    return mini;
  }

  function renderPickers() {
    var pickers = document.querySelectorAll('[data-theme-picker]');
    for (var i = 0; i < pickers.length; i++) {
      var host = pickers[i];
      THEMES.forEach(function (theme) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-opt';
        btn.dataset.themeId = theme.id;
        btn.appendChild(miniPreview(theme));
        var text = document.createElement('span');
        var name = document.createElement('b');
        name.textContent = theme.label;
        var desc = document.createElement('small');
        desc.textContent = theme.description;
        text.appendChild(name);
        text.appendChild(desc);
        btn.appendChild(text);
        btn.addEventListener('click', function () {
          applyTheme(theme.id, true);
        });
        host.appendChild(btn);
      });
    }
  }

  function setupWallpaperToggle() {
    var toggles = document.querySelectorAll('[data-wallpaper-toggle]');
    function sync() {
      for (var i = 0; i < toggles.length; i++) toggles[i].checked = root.dataset.wallpaper !== 'static';
    }
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('change', function (e) {
        var mode = e.target.checked ? 'animated' : 'static';
        root.dataset.wallpaper = mode;
        store(WALLPAPER_KEY, mode);
        sync();
      });
    }
    sync();
  }

  function setupPopover() {
    var toggle = document.getElementById('theme-toggle');
    var pop = document.getElementById('theme-popover');
    var close = document.getElementById('theme-close');
    if (!toggle || !pop) return;

    function setOpen(open) {
      pop.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        var current = pop.querySelector('[aria-pressed="true"]') || pop.querySelector('button');
        if (current) current.focus();
      }
    }
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(pop.hidden);
    });
    close.addEventListener('click', function () {
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener('click', function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== toggle) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function setupTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('ui-btn-primary', on);
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(tab);
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });
    var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    if (initial) select(initial);
  }

  function setupCopyButtons() {
    var buttons = document.querySelectorAll('.ui-terminal .copy');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var btn = e.currentTarget;
        var code = btn.closest('.ui-terminal').querySelector('code');
        // Copy only the commands, not the trailing "# comments".
        var text = code.innerText
          .split('\n')
          .map(function (line) { return line.replace(/\s+#.*$/, ''); })
          .join('\n')
          .trim();
        var done = function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else {
          fallbackCopy(text);
          done();
        }
      });
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(area);
  }

  renderPickers();
  applyTheme(root.dataset.theme, false);
  setupWallpaperToggle();
  setupPopover();
  setupTabs();
  setupCopyButtons();
})();
