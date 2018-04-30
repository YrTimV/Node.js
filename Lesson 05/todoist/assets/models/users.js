function formatDateTime(time) {
	return (
		time ?
		time.toLocaleDateString() + ' ' + time.toLocaleTimeString() :
		time);
}

const Users = {
	list: function (pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				'SELECT * FROM ?? ORDER BY ??',
				['users', 'name'],
				(err, rows) => {
					if (err) {
						console.error(err);
					} else {
						rows.map((value) => {
							value.create_time = formatDateTime(value.create_time);
						});
						
						render(res, rows);
					}
					
					connection.release();
				});
		});
	}
}

module.exports = Users;
