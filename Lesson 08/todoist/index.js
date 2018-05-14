// Import built-in and external modules.
const app = require('express')();
const bodyParser = require('body-parser');
const cli = require('cli');
const mongoose = require('mongoose');

// Import project modules.
const config = require('./modules/config');
const common = require('./modules/common');
const routes = require('./modules/routes/');
const sockets = require('./modules/sockets');



// Set listen port for requests.
common.setListenPort(cli);

// Parse JSON type requests.
app.use(bodyParser.json());

// MongoDB connection.
mongoose.connect(config.connection.connectionString);

routes.user(app);
routes.task(app);
routes.common(app);

// Binding and starting of the server app.
sockets.fn.init();

app.listen(cli.options.serverPort, () => {
	console.info(`Server is listening for API requests on port ${cli.options.serverPort}...`);
});
