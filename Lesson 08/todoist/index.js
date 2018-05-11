// Import built-in and external modules.
const app = require('express')();
const bodyParser = require('body-parser');
const cli = require('cli');
const mongoose = require('mongoose');

// Import project modules.
const config = require('./modules/config');
const common = require('./modules/common');
const routes_user = require('./modules/routes_user');
const routes_task = require('./modules/routes_task');
const sockets = require('./modules/sockets');



// Set listen port for requests.
common.setListenPort(cli);

// Parse JSON type requests.
app.use(bodyParser.json());

// MongoDB connection.
mongoose.connect(config.connection.connectionString);

routes_user(app);
routes_task(app);

// Default route request handler.
// Sends 404 error status.
app.all('*', (req, res) => {
	res.status(404).json();
});


// Binding and starting of the server app.
sockets.fn.init();

app.listen(cli.options.serverPort, () => {
	console.info(`Server is listening for API requests on port ${cli.options.serverPort}...`);
});
