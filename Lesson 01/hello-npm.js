const ansi = require("ansi");
let cursor = ansi(process.stdout);

console.log("Here goes a beep.");
cursor.beep();
