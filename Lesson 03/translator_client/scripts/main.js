'use strict';

(function () {
	const INVALID_FIELD_CLASS = 'invalidField';
	
	$('#translateForm').on('submit', (event) => {
		const PORT_MIN = 1024;
		const PORT_MAX = 65535;
		const $serverPort = $('#serverPort');
		const serverPort =  $serverPort[0].value;
		const $textSource = $('#textSource');
		let textSource = $textSource[0].value.trim();
		const invalidFields = [];
		
		// Prevent form default submit action.
		event.preventDefault();
		
		if (serverPort < PORT_MIN || serverPort > PORT_MAX) {
			invalidFields.push($serverPort);
		}
		
		if (!textSource) {
			invalidFields.push($textSource);
		}
		
		// There are errors in form fields.
		if (invalidFields.length) {
			for (const $field of invalidFields) {
				$field.addClass(INVALID_FIELD_CLASS);
			}
		} else {
			$.ajax({
				method: 'GET',
				url: 'http://localhost:' + serverPort,
				dataType: 'json',
				data: {
					lang: $('#lang')[0].value,
					text: textSource
				},
				success: (data) => {
					if (data.code === 200) {
						$('#textResult')[0].value = (
							data.lang === 'ru-en' ?
							decodeURI(data.text) :
							data.text);
					}
				}
			});
		}
	});
	
	$('#serverPort, #textSource').on('textchange', (event) => {
		// Hide invalid field highlight.
		$(event.target).removeClass(INVALID_FIELD_CLASS);
	});
}());
