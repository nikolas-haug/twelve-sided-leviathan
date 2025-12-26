(function() {

    const navToggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');

    navToggle.addEventListener('click', function() {
        navList.classList.toggle('nav__list--active');
        this.classList.toggle('nav__toggle--active-toggle');
    });

})();

