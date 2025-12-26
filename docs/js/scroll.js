// (function() {
    
//     const scrollButton = document.querySelector('.scroll-top-btn');

//     window.addEventListener('scroll', (e) => {
//         const pageTop = window.pageYOffset;
//         if(pageTop > 150) {
//             scrollButton.style.transform = 'translateX(0)';
//             scrollButton.style.opacity = 1;
//         } else {
//             scrollButton.style.transform = 'translateX(10rem)';
//             scrollButton.style.opacity = 0;
//         }
//     });

//     scrollButton.addEventListener('click', () => {
//         window.scrollTo({
//             top: 0,
//             behavior: 'smooth'
//         });
//     });

// })();

// jQuery option for all browsers
(function($) {
    
    // for scroll to top button
    // ===== Scroll to Top ==== 
    $(window).scroll(function() {
        // If page is scrolled more than 50px
        if ($(this).scrollTop() >= 50) { 
            // Fade in the arrow       
            $('.scroll-top-btn').fadeIn(200);    
        } else {
            // Else fade out the arrow
            $('.scroll-top-btn').fadeOut(200);   
        }
    });
    // When arrow is clicked
    $('.scroll-top-btn').click(function() {      
        $('body,html').animate({
            // Scroll to top of body
            scrollTop : 0                       
        }, 500);
    });

})(jQuery);

