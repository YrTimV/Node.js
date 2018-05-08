// Import built-in and external modules.
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Import project modules.
const config = require('./config');

// Set app listen port.
function setListenPort(cli) {
	// Parse command line options.
	cli.parse({
		serverPort: ['p', 'Set a listen port for requests (1024-65535).', 'int', config.application.DEFAULT_PORT]
	});

	if (cli.options.serverPort < 1024 || cli.options.serverPort > 65535) {
		console.warning(
			`Invalid listen port defined (${cli.options.serverPort}). ` +
			`Fallback to the default port ${config.application.DEFAULT_PORT}.`
		);
		
		cli.options.serverPort = config.application.DEFAULT_PORT;
	}
}

// Validate access token.
function isAccessTokenValid(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		sendResponse(res, null, {
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
		res.json(err);
	} else {
		res.json(result);
	}
}

// Check for validation errors.
function validationErrors(req, res) {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		sendResponse(res, null, errors.array());
		return true;
	}

	return false;
}

module.exports = {
	setListenPort,
	isAccessTokenValid,
	sendResponse,
	validationErrors
}
