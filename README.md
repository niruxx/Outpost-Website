# Outpost-Website

The landing page for [Outpost](https://github.com/niruxx/outpost), the self-hosted panel for game servers, apps and containers.

The page uses Outpost's own five themes: **Outpost** (Material 3 dark), **Windows XP**, **Minecraft**, **Windows Vista / 7** and **Frutiger Aero**. The color tokens, `ui-*` component hooks and animated wallpapers are ported from the panel's `web/src/index.css` and `web/src/lib/theme.ts`, so each theme looks the same here as it does in the app. Visitors can switch themes from the nav bar or the Themes section. Their choice is saved in their browser.

## Structure

```
index.html         the page
assets/styles.css  tokens, components, the five themes and their wallpapers
assets/app.js      theme picker, wallpaper toggle, install tabs, copy buttons
assets/demo.js     the live demo: a simulated panel that runs entirely in the browser
assets/demo.css    styles for the live demo (badges, console, dialog, toasts per theme)
favicon.svg        the Outpost watchtower mark
.nojekyll          tells GitHub Pages to serve the files as-is
```

There's no build step and no dependencies other than Google Fonts.

## Hosting on GitHub Pages

1. Push to `main`.
2. In the repo, go to **Settings → Pages** and set **Source** to **Deploy from a branch**, then pick **`main`** / **`/ (root)`**.
3. The site goes live at `https://<user>.github.io/Outpost-Website/`. All paths are relative, so it also works from a custom domain.

## Previewing locally

```bash
python -m http.server 8000   # then open http://localhost:8000
```

To link to a specific theme, add `?theme=` with one of `outpost`, `xp`, `minecraft`, `vista` or `aero`, e.g. `index.html?theme=minecraft`.

## Keeping it in sync

The content currently reflects Outpost up to commit `f7fa622` (Oct 20, 2026). When new commits land, add them to the **What's new** section, tag new features with `<span class="new-tag">New</span>`, and drop the tags from features that are no longer recent.

When Outpost changes a theme, copy the matching token block and component rules from `web/src/index.css` into `assets/styles.css`. If a theme is added, also add its entry to `THEMES` in `assets/app.js` and to the id list in the inline script in `index.html`.
