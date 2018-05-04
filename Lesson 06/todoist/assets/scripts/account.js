'use strict';

$(window).ready(() => {
	$('#menu').menu({
		items: "> :not(.ui-widget-header)"
	});

	$('#register').on('click', () => {
		$('#registerForm').attr('action', '/register');
	});
});
