
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const consolidate = require('consolidate');
const path = require('path');
const cli = require('cli');
const Tasks = require('./assets/models/tasks');
const Users = require('./assets/models/users');
const Menu = require('./assets/models/menu');
const config = require('./config');
const sql = require('mysql');
const connectionPool = sql.createPool(config.dbConnection);
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

function listUsers(clientRes) {
	Users.list(connectionPool, clientRes, (res, rows) => {
		clientRes.render('users', {
			title: 'Todoist',
			menuItems: Menu(viewSettings.mainPage),
			userData: rows
		});
	});
}

app.get('/users', (clientReq, clientRes) => {
	listUsers(clientRes);
});

function listTasks(pool, clientRes) {
	Tasks.list(pool, clientRes, (res, rows) => {
		clientRes.render('tasks', {
			title: 'Todoist',
			menuItems: Menu(viewSettings.mainPage),
			postUrl: `${viewSettings.mainPage}/tasks/submit`,
			taskData: rows
		});
	});
}

app.get('/tasks', (clientReq, clientRes) => {
	listTasks(connectionPool, clientRes);
});

app.post('/tasks/submit', urlencodedParser, (clientReq, clientRes) => {
	const task = {
		id: parseInt(clientReq.body.taskId),
		user_id: parseInt(clientReq.body.taskUserId),
		priority_id: parseInt(clientReq.body.taskPriorityId),
		title: clientReq.body.taskTitle,
		text: clientReq.body.taskText
	};

	if (task.id) {
		Tasks.update(task, connectionPool, clientRes, listTasks);
	} else {
		delete task.id;
		Tasks.add(task, connectionPool, clientRes, listTasks);
	}
});

app.post('/tasks/complete', urlencodedParser, (clientReq, clientRes) => {
	Tasks.complete(
		parseInt(clientReq.body.taskId), connectionPool, clientRes, listTasks);
});

app.post('/tasks/delete', urlencodedParser, (clientReq, clientRes) => {
	Tasks.delete(
		parseInt(clientReq.body.taskId), connectionPool, clientRes, listTasks);
});

app.get('/', (clientReq, clientRes) => {
	clientRes.render('main', {
		title: 'Todoist',
		menuItems: Menu(viewSettings.mainPage)
	});
});

// Default request handler.
function renderDefaultPage(res) {
	res.render('default', {mainPage: viewSettings.mainPage});
}

app.get('*', (undefined, res) => {
	renderDefaultPage(res);
});

// Binding and starting of the server app.
app.listen(cli.options.serverPort, () => {
	console.info(`Server is listening on port ${cli.options.serverPort}...`);
});
