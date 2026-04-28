/**
 * navigation.js
 * Mobile hamburger menu toggle.
 * Handles open/close via button, Escape key, and outside click.
 */
document.addEventListener('DOMContentLoaded', function () {
    var hamburger = document.querySelector('.hamburger-btn');
    var nav = document.querySelector('.main-nav');
    var closeBtn = document.querySelector('.close-menu-btn');

    if (!hamburger || !nav) return;

    function openMenu() {
        nav.classList.add('menu-open');
        hamburger.setAttribute('aria-expanded', 'true');
        closeBtn && closeBtn.focus();
    }

    function closeMenu() {
        nav.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
    }

    hamburger.addEventListener('click', function () {
        var isOpen = nav.classList.contains('menu-open');
        isOpen ? closeMenu() : openMenu();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
            closeMenu();
        }
    });

    // Close when clicking outside the nav
    document.addEventListener('mouseup', function (e) {
        if (
            nav.classList.contains('menu-open') &&
            !nav.contains(e.target) &&
            e.target !== hamburger &&
            !hamburger.contains(e.target)
        ) {
            closeMenu();
        }
    });

    // Close menu when a nav link is clicked (useful on same-page links)
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
});
