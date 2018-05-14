// Import built-in and external modules.
const { check, validationResult } = require('express-validator/check');

// Import project modules.
const common = require('../common');
const sockets = require('../sockets');
const Task = require('../../models/task');
const modelRoomName = 'tasks';



function handleRoutes(app) {
	// Fetch tasks list (access token required).
	app.get('/api/tasks', common.isAccessTokenValid, (req, res) => {
		Task
			.find()
			.exec((err, result) => {
				common.sendResponse(res, err, result);
				sockets.fn.broadcastMessage(modelRoomName, 'Task list has been requested.');
			});
	});

	// Fetch specific task info.
	app.get('/api/tasks/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId()
	], (req, res) => {
		const { id } = req.params;
		
		if (common.validationErrors(req, res)) {
			return;
		}

		Task
			.findById(id)
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, null, err);
					return;
				}

				// Task not found.
				if (!result) {
					common.sendResponse(res, null, {
						id,
						error: 'The task is not found.'
					});
					return;
				}
			
				common.sendResponse(res, err, result);
				sockets.fn.broadcastMessage(modelRoomName, `Task #${id} details has been requested.`);
			});
	});

	// Process task creation (access token required).
	app.post('/api/tasks', common.isAccessTokenValid, [
		check('userId', 'Invalid userId defined.').trim().isMongoId(),
		check('priority', 'Priority is not defined.').trim().exists(),
		check('title', 'Title is not defined.').trim().exists()
	], (req, res) => {
		const { userId, priority, title, text } = req.body;

		if (common.validationErrors(req, res)) {
			return;
		}
		
		// Task creation.
		const task = new Task({
			userId,
			priority: priority.toLowerCase(),
			createDate: Date.now(),
			title,
			text
		});

		Task
			.insertMany([task], (err, result) => {
				common.sendResponse(res, err, result);
				sockets.fn.broadcastMessage(modelRoomName, `New task #${result[0]._id} has been created.`);
			});
	});

	// Process task info update (access token required).
	app.patch('/api/tasks/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId(),
		check('userId', 'Invalid userId defined.').trim().isMongoId(),
		check('priority', 'Priority is not defined.').trim().exists(),
		check('title', 'Title is not defined.').trim().exists()
	], (req, res) => {
		const { id } = req.params;

		if (common.validationErrors(req, res)) {
			return;
		}

		Task
			.findById(id)
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, err);
					return;
				}

				// Task not found.
				if (!result) {
					common.sendResponse(res, {
						id,
						error: 'The task is not found.'
					});
					return;
				}

				// Task is completed.
				if (result.completeDate) {
					common.sendResponse(res, null, {
						id,
						completeDate: result.completeDate,
						error: 'The task has already been completed.'
					});
					return;
				}

				// Parse update params from the request body and use default ones
				// from the user data.
				const { userId, priority, title, text } = req.body;

				// User data update.
				result.userId = userId;
				result.priority = priority;
				result.updateDate = Date.now();
				result.title = title;
				result.text = text;

				result.save((err, result) => {
					common.sendResponse(res, err, result);
					sockets.fn.broadcastMessage(modelRoomName, `Task #${id} info has been updated.`);
				});
			});
	});

	// Process task completion (access token required).
	app.put('/api/tasks/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId()
	], (req, res) => {
		const { id } = req.params;

		if (common.validationErrors(req, res)) {
			return;
		}

		Task
			.findById(id)
			.exec((err, result) => {
				if (err) {
					common.sendResponse(res, err);
					return;
				}

				// Task not found.
				if (!result) {
					common.sendResponse(res, null, {
						id,
						error: 'The task is not found.'
					});
					return;
				}

				// Task is completed.
				if (result.completeDate) {
					common.sendResponse(res, null, {
						id,
						completeDate: result.completeDate,
						error: 'The task has already been completed.'
					});
					return;
				}

				result.completeDate = Date.now();

				result.save((err, result) => {
					common.sendResponse(res, err, result);
					sockets.fn.broadcastMessage(modelRoomName, `Task #${id} has been completed.`);
				});
			});
	});


	// Process task deletion (access token required).
	app.delete('/api/tasks/:id', common.isAccessTokenValid, [
		check('id', 'Invalid id defined.').isMongoId()
	], (req, res) => {
		const { id } = req.params;

		if (common.validationErrors(req, res)) {
			return;
		}

		Task
			.findByIdAndRemove(id)
			.exec((err, result) => {
				if (!result) {
					common.sendResponse(res, null, {
						id,
						error: 'The task is not found.'
					});
				} else {
					common.sendResponse(res, null, {
						id,
						message: 'The task has been deleted.'
					});
					sockets.fn.broadcastMessage(modelRoomName, `Task #${id} has been deleted.`);
				}
			});
	});
}

module.exports = handleRoutes;
