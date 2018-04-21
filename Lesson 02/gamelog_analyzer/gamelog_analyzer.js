const cli = require("cli");
const clc = require("cli-color");
const clcValue = clc.bold.yellowBright;
const cliOptions = {
	logFile: ["l", "Read game log JSON file FILE.", "file"]
};
const fs = require("fs");

cli.setApp("A «Heads & Tails» game log analyzer", "0.0.1");
cli.enable("version");
cli.parse(cliOptions);

// Clear the terminal screen.
process.stdout.write(clc.erase.screen);

if (!cli.options.logFile) {
	console.error(clc.bold.redBright("No log file defined."));
	console.log("Use -h / --help parameter.");
	
	process.exit(-1);
}

if (!fs.existsSync(cli.options.logFile)) {
	console.error(clc.bold.redBright(
		"Log file «" + cli.options.logFile + "» doesn't exist!"));
	
	process.exit(-1);
}

// Read a log file game session data.
const gameSession = JSON.parse(fs.readFileSync(cli.options.logFile, "utf8"));

// Perform a simple validation of the game session object.
if (!Array.isArray(gameSession)) {
	console.error(clc.bold.redBright(
		"Log file «" + cli.options.logFile +
		"» doesn't contain valid game session data!"));
	
	process.exit(-1);
}

// TO-DO: Some other game session data validation required.
// Lets assume for now we have a valid game session object.

// Analyze game session data.
let gameSessionStartTime = new Date(gameSession[0]);
let gameSessionEndTime = new Date(gameSession[gameSession.length - 1]);
const gameSessionData = gameSession.slice(1, gameSession.length - 1);
let gameSessionStats = {
	totalRounds: 0,
	playerGuesses: 0,
	coinsOnTheEdge: 0,
	games: {
		draw: 0,
		won: 0,
		flawlessWins: 0,
		winStreak: 0,
		lost: 0,
		totalLoses: 0,
		loseStreak: 0
	}
};

gameSessionStartTime = gameSessionStartTime.toLocaleDateString() + " " +
	gameSessionStartTime.toLocaleTimeString();

gameSessionEndTime = gameSessionEndTime.toLocaleDateString() + " " +
	gameSessionEndTime.toLocaleTimeString();

for (const gameData of gameSessionData) {
	let wins = 0, winStreak = 0;
	let loses = 0, loseStreak = 0;
	
	gameSessionStats.totalRounds += gameData.coinTossRounds;
	gameSessionStats.playerGuesses += gameData.playerGuesses;
	
	for (const tossResult of gameData.coinTossResults) {
		// Validate coin toss result against player guess.
		if (tossResult.tossResult === tossResult.playerGuess) {
			winStreak++;
			wins++;
			gameSessionStats.games.loseStreak = Math.max(
				gameSessionStats.games.loseStreak, loseStreak);
			loseStreak = 0;
		} else if (tossResult.tossResult) {
			loseStreak++;
			loses++;
			gameSessionStats.games.winStreak = Math.max(
				gameSessionStats.games.winStreak, winStreak);
			winStreak = 0;
		} else {
			gameSessionStats.coinOnTheEdge++;
		}
	}
	
	if (wins === loses) {
		gameSessionStats.games.draw++;
	} else if (wins > loses) {
		gameSessionStats.games.won++;
	} else {
		gameSessionStats.games.lost++;
	}
	
	if (wins === gameData.coinTossResults.length) {
		gameSessionStats.games.flawlessWins++;
	} else if (loses === gameData.coinTossResults.length) {
		gameSessionStats.games.totalLoses++;
	}
}

const gameWonLoseRatio = round(
	gameSessionStats.games.won /
	(gameSession.length - 1 - gameSessionStats.games.draw) * 100, 2);

console.log("Game session start: " +
				clcValue(gameSessionStartTime));
console.log("Games played during session: " +
				clcValue(gameSession.length - 2));
console.log("Total rounds played: " +
				clcValue(gameSessionStats.totalRounds));
console.log("Player guesses: " +
				clcValue(gameSessionStats.playerGuesses));
console.log("Coins on the edge: " +
				clcValue(gameSessionStats.coinsOnTheEdge));
console.log("Games are " + clc.bold.cyanBright("draw") + ": " +
				clcValue(gameSessionStats.games.draw));
console.log("Games " + clc.bold.cyanBright("won") + ": " +
				clcValue(gameSessionStats.games.won));
console.log("Longest " + clc.bold.cyanBright("win") + " streak: " +
				clcValue(gameSessionStats.games.winStreak));
console.log("Flawless " + clc.bold.cyanBright("wins") + ": " +
				clcValue(gameSessionStats.games.flawlessWins));
console.log("Games " + clc.bold.cyanBright("lost") + ": " +
				clcValue(gameSessionStats.games.lost));
console.log("Longest " + clc.bold.cyanBright("lose") + " streak: " +
				clcValue(gameSessionStats.games.loseStreak));
console.log("Total " + clc.bold.cyanBright("loses") + ": " +
				clcValue(gameSessionStats.games.totalLoses));
console.log("Games " + clc.bold.cyanBright("win/loss ratio") + ": " +
				clcValue(gameWonLoseRatio + "%"));
console.log("Game session end: " +
				clcValue(gameSessionEndTime));

process.exit(-1);

function round(number, precision) {
	let shift = function (number, precision, reverseShift) {
		if (reverseShift) {
			precision = -precision;
		}
		
		let numArray = ("" + number).split("e");
		
		return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
	};
	
	return shift(Math.round(shift(number, precision, false)), precision, true);
}
