const ApplicationConfig = {
	DEFAULT_PORT: 3000
};

const MyDBConnectionConfig = {
	host: 'masterworks.universe.local',
	database: 'todoist',
	user: 'todoist',
	password: 'Pa$$w07d'
};

const MonDBConnectionConfig = {
	host: 'masterworks.universe.local',
	database: 'todoist'
	// user: 'todoist',
	// password: 'Pa$$w07d'
}

MonDBConnectionConfig.connectionString =
	`mongodb://${MonDBConnectionConfig.host}/${MonDBConnectionConfig.database}`;

module.exports = {
	application: ApplicationConfig,
	myDBConnection: MyDBConnectionConfig,
	monDBConnection: MonDBConnectionConfig
};
