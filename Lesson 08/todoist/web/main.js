window.onload = () => {
	const socket = io.connect('http://localhost:8000');
	
	socket.on('message', message => {
		$('<p>', {
			html: `(${message.timestamp}) ${message.text}`
		}).appendTo($(`div[data-roomName="${message.room}"]`));
	});

	socket.on('roomJoin', data => {
		const $button = $(`button[data-roomName="${data.room}"]`);
		
		$button.html('Leave');
		$button.on('click', leaveRoom);
		$(`span[data-roomName="${data.room}"]`).addClass('roomJoined');
		
		$(`div[data-roomName="${data.room}"]`).addClass('active').show(200);
	});

	socket.on('roomLeave', data => {
		const $button = $(`button[data-roomName="${data.room}"]`);

		$button.html('Join');
		$button.on('click', joinRoom);
		$(`span[data-roomName="${data.room}"]`).removeClass('roomJoined');
		
		$(`div[data-roomName="${data.room}"]`).removeClass('active').show(200);
	});

	function joinRoom() {
		socket.emit('roomJoin', $(this).attr('data-roomName'));
	}
	
	function leaveRoom() {
		const $this = $(this);
		
		$this.html('Join');
		$this.on('click', joinRoom);
		socket.emit('roomLeave', $this.attr('data-roomName'));
	}

	$('.roomAction').on('click', joinRoom);
}
