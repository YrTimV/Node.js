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
		console.log('Request status code: ' + res.statusCode);
		
		return;
	}
	
	console.log('First ' + cli.options.newsCount + ' news from ' +
					clc.bold.yellowBright('www.vesti.ru'));
	
	const $ = require('cheerio').load(body);
	const $newsItems = $('.b-item__inner', '.news-wrapper_');
	let $newsInnerItem, $newsItem, newsTitle, newsText, newsTime;
	
	for (let i = 0; (($newsItem = $newsItems[i]) && i < cli.options.newsCount); i++) {
		$newsInnerItem = $('.b-item__title a', $newsItem);
		newsTitle = $newsInnerItem.text().trim();
		$newsInnerItem = $('.b-item__text', $newsItem);
		newsText = ($newsInnerItem.length ?
						$newsInnerItem.text().trim() : '');
		$newsInnerItem = $('.b-item__time', $newsItem);
		newsTime = $newsInnerItem.text().trim();

		console.log('\nNews #' + clc.bold.magentaBright(i + 1) + ' (' +
						clc.bold.cyanBright(newsTime) + '): ' + clc.bold.yellowBright(newsTitle) +
						(newsText ? '\n   ' + newsText : ''));
	}
});
