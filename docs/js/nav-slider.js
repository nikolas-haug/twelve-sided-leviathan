/**
 * File nav-slider.js.
 *
 * 
*/
(function() {
	const toggler = document.querySelector('.slider-menu__toggler');
	const menu = document.querySelector('.slider-menu');
	const spanTogglers = document.querySelector('.slider-menu__toggler span');
	/*
	 * Toggles on and off the 'active' class on the menu
	 * and the toggler button.
	 */
	toggler.addEventListener('click', () => {
		toggler.classList.toggle('active');
		menu.classList.toggle('active');
		// add 'dimmed' class to body background
		document.body.classList.toggle('dimmed');
	});
	// Helper Function - check for all children of an element
	function isDescendantOrSelf(parent, child) {
		let node = child;
		while (node != null) {
			if (node == parent) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}
	// Close the slider menu if a click is not the parent node or any of its children
	window.addEventListener('mouseup', function (event) {
		const root = menu;
		if (-1 !== toggler.className.indexOf('active') && !isDescendantOrSelf(root, event.target) && event.target != spanTogglers && event.target != toggler) {
			toggler.classList.toggle('active');
			menu.classList.toggle('active');
            // Need to add this class in base stylesheet if used
			document.body.classList.toggle('dimmed');
		}
	});
})();

