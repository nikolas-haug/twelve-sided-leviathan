/**
 * File nav-fixed.js.
 *
 * 
*/
(function() {
// When the user scrolls the page
window.onscroll = function() {
    fixedSidebar();
    animateHamburger();
};
// Get the navbar
const sidebar = document.querySelector('.sidebar');
// Get the content
const content = document.querySelector('.content');
// Get the offset position of the sidebar
const sticky = sidebar.offsetTop;
// Get all list items in sidebar
const sidebarItems = document.querySelectorAll('.target-link');
// Get the mobile toggle button
const mobileToggle = document.querySelector('.mobile-toggle');
// Get the mobile hamburger
const mobileHamburger = document.querySelector('.mobile-toggle > .mobile-toggle__hamburger');

mobileToggle.addEventListener('click', function(e) {
    sidebar.classList.toggle('sidebar-mobile--active');
    this.classList.toggle('mobile-toggle--active');
    toggleAnimation();
});

mobileToggle.addEventListener('transitionend', function(e) {
    this.classList.remove('animate');
});

sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
        sidebar.classList.remove('sidebar-mobile--active');
        mobileToggle.classList.remove('mobile-toggle--active')
        toggleAnimation();
    });
});

// Add the sticky class to the sidebar when you reach its scroll position. Remove "sticky" when you leave the scroll position
function fixedSidebar() {
  if (window.pageYOffset >= sticky) {
    sidebar.classList.add("sidebar--fixed");
    content.classList.add('content--fixed');
  } else {
    sidebar.classList.remove("sidebar--fixed");
    content.classList.remove('content--fixed');
  }
  // Add active class to current content section
  activeListItem();
}

function activeListItem() {
    sidebarItems.forEach(item => {
        let refElement = document.querySelector(item.getAttribute('href'));
        if(refElement.offsetTop <= window.pageYOffset && refElement.offsetTop + refElement.offsetHeight > window.pageYOffset && refElement.getAttribute('id') !== 'about') {
            item.classList.add('sidebar--active');
        } else {
            item.classList.remove('sidebar--active');
        }
    });
}

function toggleAnimation() {
    if(mobileHamburger.classList.contains('open-animate')) {
        mobileHamburger.classList.add('close-animate');
        mobileHamburger.classList.remove('open-animate');
    } else {
        mobileHamburger.classList.add('open-animate');
        mobileHamburger.classList.remove('close-animate');
    }
}

function animateHamburger() {
    console.log(window.pageYOffset);
    if(window.pageYOffset >= 100) {
        mobileToggle.classList.add('mobile-toggle--scrolled');
    } else {
        mobileToggle.classList.remove('mobile-toggle--scrolled');
    }
}
})();

