const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const consolidate = require('consolidate');
const path = require('path');
const cli = require('cli');
const Tasks = require('./assets/models/tasks');
const Users = require('./assets/models/users');
const Menu = require('./assets/models/menu');
const Account = require('./assets/models/account');
const config = require('./config');
const session = require('cookie-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const connectionPool = require('mysql').createPool(config.myDBConnection);
const viewSettings = {
	// Default view settings.
};


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

// Template engine setup.
app.engine('hbs', consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'assets/views'));

// View settings.
viewSettings.mainPage = `http://localhost:${cli.options.serverPort}`;

// Handle static content: style, script and package files.
app.use('/packages', express.static(path.join(__dirname, 'assets/packages')));
app.use('/scripts', express.static(path.join(__dirname, 'assets/scripts')));
app.use('/styles', express.static(path.join(__dirname, 'assets/styles')));

// Use session and passport handler.
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({keys: ['crypto']}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// MongoDB connection.
mongoose.connect(config.monDBConnection.connectionString);

// Route requests handlers.
const authNeeded = (req, res, next) => {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/account');
	}
}

const authNotNeeded = (req, res, next) => {
	if (req.isAuthenticated()) {
		res.redirect('/tasks');
	} else {
		next();
	}
}

// Parse requests only without auth.
app.use('/account', authNotNeeded);
app.get('/account', (req, res) => {
		res.render('account', {
			title: 'My account @ Todoist',
			menuItems: Menu(viewSettings.mainPage)
		});
});
app.post('/account', passport.authenticate('local', {
	successRedirect: '/tasks',
	failureRedirect: '/account'
}));

app.post('/register', (req, res) => {
	Account.register(
		new Account({username: req.body.username}),
		req.body.password, (err, user) => {
			if (err) {
					return res.render('account', {
						user: user,
						alreadyRegistered: true
					});
			}

			passport.authenticate('local')(req, res, () => {
				res.redirect('/tasks');
			});
		});
});

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

// Parse requests only with valid auth.
app.use('/tasks', authNeeded);
app.get('/tasks', (req, res) => {
	Tasks.list(connectionPool, res, (err, result) => {
		res.render('tasks', {
			title: 'Todoist',
			menuItems: Menu(viewSettings.mainPage),
			postUrl: `${viewSettings.mainPage}/tasks/submit`,
			taskData: result,
			user: req.user.username
		});
	});
});

function sendResponse(err, response, result) {
	if (err) {
		console.error(err);
	}

	response.json(result);
}

app.post('/tasks/submit', (req, res) => {
	const {
		taskId: id,
		taskUserId: user_id,
		taskPriorityId: priority_id,
		taskTitle: title,
		taskText: text
	} = req.body;
	const task = {id, user_id, priority_id, title, text};

	if (task.id) {
		Tasks.update(task, connectionPool, res, sendResponse);
	} else {
		Tasks.add(task, connectionPool, res, sendResponse);
	}
});

app.post('/tasks/complete', (req, res) => {
	Tasks.complete(
		req.body.taskId, connectionPool, res, sendResponse);
});

app.post('/tasks/delete', (req, res) => {
	Tasks.delete(
		req.body.taskId, connectionPool, res, sendResponse);
});

app.get('/', (req, res) => {
	res.render('main', {
		title: 'Todoist',
		menuItems: Menu(viewSettings.mainPage)
	});
});

// Default route request handler.
app.get('*', (req, res) => {
	res.render('default', {mainPage: viewSettings.mainPage});
});

// Binding and starting of the server app.
app.listen(cli.options.serverPort, () => {
	console.info(`Server is listening on port ${cli.options.serverPort}...`);
});
