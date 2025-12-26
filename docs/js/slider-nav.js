(function() {
	const toggler = document.querySelector('.slider-menu__toggler');
	const menu = document.querySelector('.slider-menu');
	
	const span_togglers = document.querySelector('.slider-menu__toggler span');
	
	/*
	 * Toggles on and off the 'active' class on the menu
	 * and the toggler button.
	 */
	toggler.addEventListener('click', () => {
		toggler.classList.toggle('active');
		menu.classList.toggle('active');
	
		document.body.classList.toggle('dimmed');
	});
	
	// check for all children of an element
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
	
	window.addEventListener('mouseup', function (event) {
		const root = menu;
	
		if (-1 !== toggler.className.indexOf('active') && !isDescendantOrSelf(root, event.target) && event.target != span_togglers && event.target != toggler) {
			// console.log('Passed!');
			toggler.classList.toggle('active');
			menu.classList.toggle('active');
    
            // Need to add this class in base if used
			document.body.classList.toggle('dimmed');
		}
	});
})();

