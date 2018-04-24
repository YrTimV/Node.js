const request = require('request');
const clc = require('cli-color');
const cli = require('cli');
const cliOptions = {
	newsCount: ['n', 'Fetch first NUM of news.', 'num', 10]
};

cli.setApp('A simple news reader app.', '0.0.1');
cli.enable('version');
cli.parse(cliOptions);
	
request('https://www.vesti.ru/news/', (err, res, body) => {
	if (err) {
		console.error(err);
		
		return;
	}
	
	if (res.statusCode !== 200) {
		console.log(`Request status code: ${res.statusCode}`);
		
		return;
	}
	
	console.log(
		`First ${cli.options.newsCount} news from ` +
		`${clc.bold.yellowBright('www.vesti.ru')}`);
	
	const $ = require('cheerio').load(body);
	
	$('.b-item__inner', '.news-wrapper_').each((i, $elem) => {
		// Skip exeeded amount of news items.
		if (i >= cli.options.newsCount) {
			return;
		}
		
		const newsTitle = $('.b-item__title a', $elem).text().trim();
		const newsText = $('.b-item__text', $elem).text().trim();
		const newsTime = $('.b-item__time', $elem).text().trim();

		console.log(
			`\nNews #${clc.bold.magentaBright(i + 1)} (` +
			`${clc.bold.cyanBright(newsTime)}): ${clc.bold.yellowBright(newsTitle)}` +
			(newsText ? `\n   ${newsText}` : ``));
	});
});
