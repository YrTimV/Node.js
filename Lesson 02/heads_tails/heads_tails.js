const cli = require("cli");
const clc = require("cli-color");
const cliOptions = {
	logFile: ["l", "Write game log to a JSON file FILE.", "file"],
	toss: ["t", "Number of coin toss to score.", "toss"]
};
const readLine = require("readline");
const rlOptions = { input: process.stdin, output: process.stdout };
const moment = require("moment");
let rl = readLine.createInterface(rlOptions);

cli.setApp("A «Heads & Tails» game", "0.0.1");
cli.enable("version");
cli.parse(cliOptions);

// A whole game session and game session data.
// First element is a game session start time.
const gameSession = [moment()];
let gameData;

// Log current game into a JSON file.
function gameSessionLog() {
	// Set log file name as when the game session started or a custom name.
	const logDirName = "logs";
	const logFileName = logDirName + "\\" + (cli.options.logFile ? cli.options.logFile : gameSession[0].format("YYYY-MM-DD_HH-mm-ss")) + ".json";
	const fs = require("fs");
	
	// Last game session element is a game session end time.
	gameSession.push(moment());
	
	try {
		if (!fs.existsSync(logDirName)) {
			fs.mkdirSync(logDirName);
		}
		fs.writeFileSync(logFileName, JSON.stringify(gameSession), { encoding: "utf8" });

		console.log("\nYour game session was saved into a file «" + clc.bold.yellowBright(logFileName) + "».");
	}
	catch (err) {
		console.error(err);
	}
}

function gameOver() {
	gameStatus();
	console.log("\nThank you for playing, the game is over.");
	
	// Store current game data into a session log.
	gameSession.push(gameData);
	
	rl.question("\nWould you like to play again (" + clc.bold.yellowBright("y") + ")? ", (answer) => {
		if (!answer || /^y$/i.test(answer)) {
			// Start a new game in the current session (async).
			setTimeout(newGame, 0);
			return;
		}
		
		// Log current game session into a JSON file.
		gameSessionLog();

		// Quit the app.
		process.exit(-1);
	});
}

function gameStatus() {
	console.log("\nGame status: you guessed " + clc.bold.yellowBright(gameData.playerGuesses) + " time(s) out of " + clc.bold.yellowBright(gameData.coinTossRounds));
}

const newGame = () => {
	gameData = {
		// Default number of tries is 3.
		coinTossRounds: (cli.options.toss ? parseInt(cli.options.toss) : 3),
		// Coin toss results in an array.
		coinTossResults: [],
		// Number of player's guesses.
		playerGuesses: 0
	};
	
	// Clear the terminal screen.
	process.stdout.write(clc.erase.screen);
	
	console.log("Welcome to the game «" + clc.bold.yellowBright.bgBlueBright("Toss a coin") + "» (game #" + clc.bold.cyanBright(gameSession.length) + ").\nNumber of toss rounds: " + clc.bold.yellowBright(gameData.coinTossRounds));
	
	const userInputText =
		"\nChoose " +
		clc.bold.yellowBright("Heads") +
		"(" + clc.bold.cyanBright("1") + "), " +
		clc.bold.yellowBright("Tails") + " (" +
		clc.bold.cyanBright("2") + ") or (" +
		clc.bold.redBright("q") + ") to quit the game: ";

	const question = () => rl.question(userInputText, (answer) => {
		if (/^q$/i.test(answer)) {
			gameOver();
			return;
		} else if (!/[12]/.test(answer)) {
			console.error("Invalid input, try again.")

			// Repeat input (async call).
			setTimeout(question, 0);

			return;
		}

		answer = parseInt(answer);
		const coinSides = ["Edge", "Heads", "Tails"];

		// Coin side can be Heads (<= 50), Tails (> 50) or OnTheEdge (= 0).
		let coinSide = Math.floor(Math.random() * 101);
		let coinTossResultMsg = "COIN TOSS RESULTS: ";

		if (!coinSide) {
			coinTossResultMsg = clc.blink.yellowBright("The coin fell on the edge. It's a draw.");
		} else {
			coinSide = (coinSide <= 50 ? 1 : 2);
			coinTossResultMsg += clc.bold.yellowBright(coinSides[coinSide]);
		}

		const coinTossResult = {
			tossResult: coinSide,
			playerGuess: answer
		};

		console.log(coinTossResultMsg);

		// Player guess result.
		if (answer === coinSide) {
			gameData.playerGuesses++;
			console.log("Your guess is " + clc.bold.cyanBright("right") + "!");
		} else {
			console.log("Your guess is " + clc.bold.redBright("wrong") + ".");
		}

		gameData.coinTossResults.push(coinTossResult);

		if (gameData.coinTossResults.length < gameData.coinTossRounds) {
			gameStatus();

			// Start next round (async call).
			setTimeout(question, 0);
			return;
		}

		// Coin toss rounds are over.
		gameOver();
	});
	
	question();
};

// Start a game (async call).
setTimeout(newGame, 0);
