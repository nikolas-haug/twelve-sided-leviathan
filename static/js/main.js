// Twelve-Sided Leviathan — site JavaScript

// =====================================================
// THEME ANNOUNCEMENT BAR
// =====================================================

let themePhrases = { light: [], dark: [] };
let announcementBar = null;
let hideTimer = null;

function createAnnouncementBar() {
    const bar = document.createElement('div');
    bar.id = 'theme-announcement';
    bar.className = 'theme-announcement';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');

    const text = document.createElement('p');
    text.className = 'theme-announcement__text';
    bar.appendChild(text);

    document.body.appendChild(bar);
    return bar;
}

async function loadPhrases() {
    try {
        const base = window.SITE_BASE_URL || '/';
        const res = await fetch(base + 'js/phrases.json');
        themePhrases = await res.json();
    } catch (_) {
        themePhrases = {
            light: ['and the day rises once more'],
            dark:  ['the darkness comes and the blood moon follows'],
        };
    }
}

function showAnnouncement(mode) {
    if (!announcementBar) return;
    const pool = themePhrases[mode] || [];
    if (!pool.length) return;

    const msg = pool[Math.floor(Math.random() * pool.length)];
    announcementBar.querySelector('.theme-announcement__text').textContent = msg;

    if (hideTimer) clearTimeout(hideTimer);
    announcementBar.classList.add('is-visible');

    hideTimer = setTimeout(() => {
        announcementBar.classList.remove('is-visible');
    }, 5000);
}

// =====================================================
// THEME TOGGLE
// The light-mode class lives on <html> so the inline
// script in <head> can apply it before the body paints.
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    announcementBar = createAnnouncementBar();
    await loadPhrases();

    const btn = document.querySelector('.theme-toggle-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        showAnnouncement(isLight ? 'light' : 'dark');
    });
});
