const moment = require('moment');

const Users = {
	list: function (pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				'SELECT * FROM users ORDER BY name',
				(err, rows) => {
					if (err) {
						console.error(err);
					} else {
						render(res, rows.map((value) => ({
							create_time:
								moment(value.create_time).format('YYYY/MM/DD HH:mm:ss'),
								...value
						})));
					}
					
					connection.release();
				});
		});
	}
}

module.exports = Users;
