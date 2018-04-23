const request = require('request');
const clc = require('cli-color');
const cli = require('cli');
const cliOptions = {
	newsCount: ['n', 'Fetch first NUM of news.', 'num']
};

cli.setApp('A simple news reader app.', '0.0.1');
cli.enable('version');
cli.parse(cliOptions);
cli.options.newsCount = cli.options.newsCount || 10;
	
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
	const newsCountToFetch = 10;
	let $newsInnerItem, $newsItem, newsTitle, newsText, newsTime;
	
	for (let i = 0; (($newsItem = $newsItems[i]) && i < newsCountToFetch); i++) {
		$newsInnerItem = $('.b-item__title a', $newsItem);
		newsTitle = $newsInnerItem[0].children[0].nodeValue.trim();
		$newsInnerItem = $('.b-item__text', $newsItem);
		newsText = ($newsInnerItem.length ?
						$newsInnerItem[0].children[0].nodeValue.trim() : '');
		$newsInnerItem = $('.b-item__time', $newsItem);
		newsTime = $newsInnerItem[0].children[0].nodeValue.trim();

		console.log('\nNews #' + clc.bold.magentaBright(i + 1) + ' (' +
						clc.bold.cyanBright(newsTime) + '): ' + clc.bold.yellowBright(newsTitle) +
						(newsText ? '\n   ' + newsText : ''));
	}
});
