const os = require("os");
const clc = require("cli-color");
const beep = require("beepbeep");

const freeMem = Math.floor(os.freemem() / 1024 / 1024);
const totalMem = Math.floor(os.totalmem() / 1024 / 1024);
const clcTitle = clc.bgGreen.yellowBright.underline;
const clcParam = clc.greenBright.bold;
const clcMem = clc.yellowBright.bold;

process.stdout.write(
	"\n" + clcTitle("OS information") +
	"\n  " + clcParam("Type") + ": \t\t\t" + os.type() +
	"\n  " + clcParam("Release") + ": \t\t\t" + os.release() +
	"\n  " + clcParam("Platform") + ": \t\t\t" + os.platform() +
	"\n  " + clcParam("Architecture") + ": \t\t" + os.arch() +
	"\n  " + clcParam("Hostname") + ": \t\t\t" + os.hostname() +
	"\n  " + clcParam("Memory (free / total)") + ": \t" + clcMem(freeMem + " Mb") + " / " + clcMem(totalMem + " Mb"));

beep(2, 1000);
