const ApplicationConfig = {
	DEFAULT_PORT: 3000
};

const ConnectionConfig = {
	host: 'masterworks.universe.local',
	database: 'todoist'
}

ConnectionConfig.connectionString =
	`mongodb://${ConnectionConfig.host}/${ConnectionConfig.database}`;


// Export definitions.
module.exports = {
	application: ApplicationConfig,
	connection: ConnectionConfig
};
