'use strict';

(function () {
	const INVALID_FIELD_CLASS = 'invalidField';
	
	$('#translateForm').on('submit', (event) => {
		const PORT_MIN = 1024;
		const PORT_MAX = 65535;
		const $serverPort = $('#serverPort');
		const serverPort =  $serverPort.val();
		const $textSource = $('#textSource');
		let textSource = $textSource.val().trim();
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
					lang: $('#lang').val(),
					text: textSource
				},
				success: (data) => {
					if (data.code === 200) {
						$('#textResult').val(
							data.lang === 'ru-en' ?
							decodeURIComponent(data.text) :
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
