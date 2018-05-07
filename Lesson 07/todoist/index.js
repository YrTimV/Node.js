const app = require('express')();
const bodyParser = require('body-parser');
const cli = require('cli');
const config = require('./config');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');



// Parse command line options.
cli.parse({
	serverPort: ['p', 'Bind a custom port for requests (1024-65535).', 'int', config.application.DEFAULT_PORT]
});

if (cli.options.serverPort < 1024 || cli.options.serverPort > 65535) {
	console.warning(
		`Invalid custom port defined (${cli.options.serverPort}). ` +
		`Fallback to the default port ${config.application.DEFAULT_PORT}.`
	);
	
	cli.options.serverPort = config.application.DEFAULT_PORT;
}

// Parse JSON type requests.
app.use(bodyParser.json());

// MongoDB connection.
mongoose.connect(config.connection.connectionString);

// REST API models and routes.
const User = require('./models/user');
const Task = require('./models/task');

// Authorization procedure.
app.post('/api/auth', (req, res) => {
	const {username, password} = req.body;

	if (!username || !password) {
		sendResponse(res, {
			username,
			error: 'Invalid credentials.'
		});
		return;
	}

	User.model
		.findOne({username: new RegExp(`^${username}$`, 'i')})
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// User not found.
			if (!result) {
				sendResponse(res, {
					username,
					error: 'The user is not found.'
				});
				return;
			}

			// Incorrect password.
			// @TO-DO: Password check with HMAC.
			if (!password) {
				sendResponse(res, {
					username,
					error: 'The password is incorrect.'
				});
				return;
			}
			
			res.json({
				access_token: jwt.sign({id: result._id, username}, 'tokenSign', {
					expiresIn: Date.now() + 3 * 24 * 60 * 60
				})
			});
		});
});

// Validate access token.
function isAccessTokenValid(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		sendResponse(res, {
			error: 'You are not authorized.'
		});
		return;
	}

	const [bearer, accessToken] = authHeader.split(' ');

	function denyAccess(res, accessToken) {
		res.status(401).json({
			accessToken,
			error: 'The access token is invalid or expired. Access denied.'
		});
	}

	if (bearer !== 'Bearer') {
		denyAccess(res, accessToken);
		return;
	}

	try {
		if (jwt.verify(accessToken, 'tokenSign')) {
			req.user = jwt.decode(accessToken);
			next();
		} else {
			denyAccess(res, accessToken);
			return;
		}
	}
	catch (err) {
		denyAccess(res, accessToken);
	}
}

// Common response algorithm for different requests and results.
function sendResponse(res, err, result) {
	if (err) {
		res.status(500).json(err);
	} else {
		res.json(result);
	}
}

// Fetch users list (access token required).
app.get('/api/users', isAccessTokenValid, (req, res) => {
	User.model
		.find()
		.exec((err, result) => {
			sendResponse(res, err, result);
		});
});

// Fetch specific user info (access token required).
app.get('/api/users/:username', isAccessTokenValid, (req, res) => {
	const { username } = req.body;

	User.model
		.findOne({username: new RegExp(`^${username}$`, 'i')})
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// User not found.
			if (!result) {
				sendResponse(res, {
					username,
					error: 'The user is not found.'
				});
				return;
			}
		
			sendResponse(res, err, result);
		});
});

// Process user registration.
app.post('/api/users', (req, res) => {
	const { username, password, email } = req.body;
	
	// Validate user register params in the request body.
	const invalidParams = User.fn.validateParams(User.params.register, req.body);

	if (invalidParams.length > 0) {
		sendResponse(res, {
			params: invalidParams,
			error: 'Invalid parameters for user registration.'
		});
		return;
	}

	// Duplicate user check.
	User.model
		.findOne({username: new RegExp(`^${username}$`, 'i')})
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// User found.
			if (result) {
				sendResponse(res, {
					username,
					error: `The user is already registered.`
				});
				return;
			}
		});

	// User registration.
	const user = new User.model({
		username,
		email,
		registerDate: Date.now(),
		mainRole: 'User'
	});

	User.model
		.register(user, password,	(err, result) => {
			sendResponse(res, err, result);
		});
});

// Process user info update (access token required).
app.patch('/api/users/:username', isAccessTokenValid, (req, res) => {
	const { username } = req.params;

	User.model
		.findOne({username: new RegExp(`^${username}$`, 'i')})
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// User not found.
			if (!result) {
				sendResponse(res, {
					username,
					error: 'The user is not found.'
				});
				return;
			}

			// Validate user update params in the request body.
			const invalidParams = User.fn.validateParams(
				User.params.update, req.body, true);
			
			if (invalidParams.length > 0) {
				sendResponse(res, {
					params: invalidParams,
					error: 'Invalid parameters for user info update.'
				});
				return;
			}
			
			// Parse update params from the request body and use default ones
			// from the user data.
			const {
				email = result.email,
				firstName = result.firstName,
				lastName = result.lastName,
				age = result.age
			} = req.body;

			// User data update.
			[result.email, result.firstName, result.lastName, result.age] =
				[email, firstName, lastName, age];

			result.save((err, result) => {
				sendResponse(res, err, result);
			});
		});
});

// Process user deletion (access token required).
app.delete('/api/users/:username', isAccessTokenValid, (req, res) => {
	const { username } = req.params;

	User.model
		.findOneAndRemove({username: new RegExp(`^${username}$`, 'i')})
		.exec((err, result) => {
			if (!result) {
				sendResponse(res, {
					username,
					error: 'The user is not found.'
				});
			} else {
				sendResponse(res, null, {
					username,
					message: 'The user has been deleted.'
				});
			}
		});
});


// Fetch tasks list (access token required).
app.get('/api/tasks', isAccessTokenValid, (req, res) => {
	Task.model
		.find()
		.exec((err, result) => {
			sendResponse(res, err, result);
		});
});

// Fetch specific task info.
app.get('/api/tasks/:id', isAccessTokenValid, (req, res) => {
	const { id } = req.body;

	Task.model
		.findById(id)
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// Task not found.
			if (!result) {
				sendResponse(res, {
					id,
					error: 'The task is not found.'
				});
				return;
			}
		
			sendResponse(res, err, result);
		});
});




// Process task creation (access token required).
app.post('/api/tasks', isAccessTokenValid, (req, res) => {
	const { username, priority, title, text } = req.body;
	
	// Validate task create params in the request body.
	const invalidParams = Task.fn.validateParams(Task.params.common, req.body);

	if (invalidParams.length > 0) {
		sendResponse(res, {
			params: invalidParams,
			error: 'Invalid parameters for task creation.'
		});
		return;
	}

	// Task creation.
	const task = new Task.model({
		username,
		priority: priority.toLowerCase(),
		createDate: Date.now(),
		title,
		text
	});

	Task.model
		.insertMany([task], (err, result) => {
			sendResponse(res, err, result);
		});
});

// Process task info update (access token required).
app.patch('/api/tasks/:id', isAccessTokenValid, (req, res) => {
	const { id } = req.params;

	Task.model
		.findById(id)
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// Task not found.
			if (!result) {
				sendResponse(res, {
					id,
					error: 'The task is not found.'
				});
				return;
			}

			// Task is completed.
			if (result.completeDate) {
				sendResponse(res, {
					id,
					completeDate: result.completeDate,
					error: 'The task has already been completed.'
				});
				return;
			}

			// Validate task update params in the request body.
			const invalidParams = Task.fn.validateParams(
				Task.params.common, req.body, true);
			
			if (invalidParams.length > 0) {
				sendResponse(res, {
					params: invalidParams,
					error: 'Invalid parameters for task info update.'
				});
				return;
			}
			
			// Parse update params from the request body and use default ones
			// from the user data.
			const {
				username = result.username,
				priority = result.priority,
				title = result.title,
				text = result.text
			} = req.body;

			// User data update.
			[result.username, result.priority, result.updateDate, result.title, result.text] =
				[username, priority.toLowerCase(), Date.now(), title, text];

			result.save((err, result) => {
				sendResponse(res, err, result);
			});
		});
});

// Process task completion (access token required).
app.put('/api/tasks/:id', isAccessTokenValid, (req, res) => {
	const { id } = req.params;

	Task.model
		.findById(id)
		.exec((err, result) => {
			if (err) {
				sendResponse(res, err);
				return;
			}

			// Task not found.
			if (!result) {
				sendResponse(res, {
					id,
					error: 'The task is not found.'
				});
				return;
			}

			// Task is completed.
			if (result.completeDate) {
				sendResponse(res, {
					id,
					completeDate: result.completeDate,
					error: 'The task has already been completed.'
				});
				return;
			}

			result.completeDate = Date.now();

			result.save((err, result) => {
				sendResponse(res, err, result);
			});
		});
});


// Process task deletion (access token required).
app.delete('/api/tasks/:id', isAccessTokenValid, (req, res) => {
	const { id } = req.params;

	Task.model
		.findByIdAndRemove(id)
		.exec((err, result) => {
			if (!result) {
				sendResponse(res, {
					id,
					error: 'The task is not found.'
				});
			} else {
				sendResponse(res, null, {
					id,
					message: 'The task has been deleted.'
				});
			}
		});
});



// Default route request handler.
// Sends 404 error status.
app.all('*', (req, res) => {
	res.status(404).json();
});

// Binding and starting of the server app.
app.listen(cli.options.serverPort, () => {
	console.info(`Server is listening on port ${cli.options.serverPort}...`);
});
