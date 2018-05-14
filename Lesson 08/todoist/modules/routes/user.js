// Import built-in and external modules.
const { check, validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');

// Import project modules.
const common = require('../common');
const sockets = require('../sockets');
const User = require('../../models/user');
const modelRoomName = 'users';


function handleRoutes(app) {
	// Authorization procedure.
	app.post('/api/auth', [
		check('username', 'Invalid username.').trim().exists(),
		check('password', 'Invalid password.').trim().exists()
	], (req, res) => {
		const errors = validationResult(req).array();
		
		if (!errors.isEmpty()) {
			common.sendResponse(res, null, errors.array());
			return;
		}

		const { username } = req.body;

		User
			.findOne({username})
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, err);
					return;
				}

				// User not found.
				if (!result) {
					common.sendResponse(res, null, {
						username,
						error: 'The user is not found.'
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

	// Fetch users list (access token required).
	app.get('/api/users', common.isAccessTokenValid, (req, res) => {
		User
			.find()
			.exec((err, result) => {
				common.sendResponse(res, err, result);
				sockets.fn.broadcastMessage(modelRoomName, 'User list has been requested.');
			});
	});

	// Fetch specific user info (access token required).
	app.get('/api/users/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId()
	], (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			sendResponse(res, null, errors.array());
			return;
		}

		const { id } = req.params;

		User
			.findById(id)
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, err);
					return;
				}

				// User not found.
				if (!result) {
					common.sendResponse(res, null, {
						id,
						error: 'The user is not found.'
					});
					return;
				}
			
				common.sendResponse(res, err, result);
				sockets.fn.broadcastMessage(modelRoomName, `User #${id} details has been requested.`);
			});
	});

	// Process user registration.
	app.post('/api/users', [
		check('username', 'Invalid username defined.').trim().exists(),
		check('password', 'Invalid password defined.').trim().exists(),
		check('email', 'Invalid email defined.').trim().isEmail().normalizeEmail()
	], (req, res) => {
		const errors = validationResult(req);
		
		if (!errors.isEmpty()) {
			common.sendResponse(res, null, errors.array());
			return;
		}
		
		const { username, password, email } = req.body;
		
		// Duplicate user check.
		User
			.findOne({username})
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, err);
					return;
				}

				// User found.
				if (result) {
					common.sendResponse(res, null, {
						username,
						error: `The user is already registered.`
					});
					return;
				}
			});

		// User registration.
		const user = new User({
			username,
			email,
			registerDate: Date.now(),
			mainRole: 'User'
		});

		User
			.register(user, password,	(err, result) => {
				common.sendResponse(res, err, result);
				sockets.fn.broadcastMessage(
					modelRoomName, `New user #${result._id} has been registered.`);
			});
	});

	// Process user info update (access token required).
	app.patch('/api/users/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId(),
		check('email', 'Invalid email defined.').trim().isEmail().normalizeEmail(),
		check('firstName', 'First name is not defined.').exists().trim(),
		check('lastName', 'Last name is not defined.').exists().trim(),
		check('age', 'Age is not defined.')
	], (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			common.sendResponse(res, null, errors.array());
			return;
		}

		const { id } = req.params;

		User
			.findById(id)
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, err);
					return;
				}

				// User not found.
				if (!result) {
					common.sendResponse(res, null, {
						id,
						error: 'The user is not found.'
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
				result.email = email;
				result.firstName = firstName;
				result.lastName = lastName;
				result.age = age;

				result.save((err, result) => {
					common.sendResponse(res, err, result);
					sockets.fn.broadcastMessage(modelRoomName, `User #${id} info has been updated.`);
				});
			});
	});

	// Process user deletion (access token required).
	app.delete('/api/users/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId(),
	], (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			common.sendResponse(res, null, errors.array());
			return;
		}

		const { id } = req.params;

		User
			.findByIdAndRemove(id)
			.exec((err, result) => {
				if (!result) {
					common.sendResponse(res, null, {
						id,
						error: 'The user is not found.'
					});
				} else {
					common.sendResponse(res, null, {
						id,
						message: 'The user has been deleted.'
					});
					sockets.fn.broadcastMessage(modelRoomName, `User #${id} has been deleted.`);
				}
			});
	});
}

module.exports = handleRoutes;
