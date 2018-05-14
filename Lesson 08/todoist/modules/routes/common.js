
function handleRoutes(app) {
	// Default route request handler.
	// Sends 404 error status.
	app.all('*', (req, res) => {
		res.status(404).json();
	});
}

module.exports = handleRoutes;
