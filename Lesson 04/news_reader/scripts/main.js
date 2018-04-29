'use strict';

(() => {
	function refreshNewsCategoryList() {
		// Clear news category list.
		const $newsCategory = $('#newsCategory');
		const newsSite = $('#newsSite').val().trim();
		
		$.get(
			`news/${newsSite}`,
			null,
			(data, success) => {
				if (success !== 'success') {
					console.error(`Couldn't fetch news category list for the site "${newsSite}".`);
				} else {
					data.data.forEach((elem, i) => {
						$newsCategory[0].options[i + 1] = new Option(elem.title, elem.cid);
					});
				}
			},
			'json'
		);
	}
	
	refreshNewsCategoryList();
})();
