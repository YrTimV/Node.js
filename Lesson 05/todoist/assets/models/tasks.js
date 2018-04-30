function formatDateTime(time) {
	return (
		time ?
		time.toLocaleDateString() + ' ' + time.toLocaleTimeString() :
		time);
}

const Tasks = {
	list: function (pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				`SELECT ??, ??, ?? AS ??, ??, ?? AS ??, ??, ??, ??, ??, ??
				FROM ??
				INNER JOIN ?? ON ?? = ??
				INNER JOIN ?? ON ?? = ??
				ORDER BY ??`,
				['tasks.id', 'user_id', 'users.name', 'user', 'priority_id', 'priorities.name', 'priority', 'tasks.create_time', 'modify_time', 'complete_time', 'title', 'text', 'tasks', 'users', 'tasks.user_id', 'users.id', 'priorities', 'tasks.priority_id', 'priorities.id', 'tasks.id'],
				(err, rows) => {
					if (err) {
						console.error(err);
					} else {
						rows.map((value) => {
							value.create_time = formatDateTime(value.create_time);
							value.modify_time = formatDateTime(value.modify_time)
							value.complete_time = formatDateTime(value.complete_time)
						});
						
						render(res, rows);
					}
					
					connection.release();
				});
			});
		},
	add: function (task, pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				`INSERT INTO ?? SET ?`,
				['tasks', task],
				(err) => {
					if (err) {
						console.error(err);
					} else {
						render(pool, res);
					}
					
					connection.release();
				});
		});
	},
	update: function (task, pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				`UPDATE ?? SET ?, ?? = NOW() WHERE ?? = ?`,
				['tasks', {
					priority_id: task.priority_id,
					title: task.title,
					text: task.text
				}, 'modify_time', 'id', task.id],
				(err) => {
					if (err) {
						console.error(err);
					} else {
						render(pool, res);
					}
					
					connection.release();
				});
		});
	},
	complete: function (id, pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				`UPDATE ?? SET ?? = NOW() WHERE ?? = ? AND ?? IS NULL`,
				['tasks', 'complete_time', 'id', id, 'complete_time'],
				(err) => {
					if (err) {
						console.error(err);
					} else {
						render(pool, res);
					}
					
					connection.release();
				});
		});
	},
	delete: function (id, pool, res, render) {
		pool.getConnection((err, connection) => {
			if (err) {
				console.error(err);
				
				return;
			}
			
			connection.query(
				`DELETE FROM ?? WHERE ?? = ?`,
				['tasks', 'id', id],
				(err) => {
					if (err) {
						console.error(err);
					} else {
						render(pool, res);
					}
					
					connection.release();
				});
		});
	}
};

module.exports = Tasks;
