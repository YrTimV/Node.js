const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const consolidate = require('consolidate');
const request = require('request');
const path = require('path');
const cheerio = require('cheerio');
const cli = require('cli');
const appSettings = {
	DEFAULT_PORT: 3000
};
const viewSettings = {
	pageTitle: `NewsFlash | A simple news fetch service`
}
const siteSettings = {
	vesti: {
		name: 'vesti',
		title: 'vesti.ru',
		articleUrl: 'https://www.vesti.ru/',
		requestUrl: 'https://www.vesti.ru/news/',
		categories: []
	}
};


// Set command line options.
cli.parse({
	serverPort: ['p', 'Bind a custom port for requests (1024-65535).', 'int', appSettings.DEFAULT_PORT]
});

if (cli.options.serverPort < 1024 || cli.options.serverPort > 65535) {
	console.warning(
		`Invalid custom port defined (${cli.options.serverPort}). ` +
		`Fallback to the default port ${appSettings.DEFAULT_PORT}.`
	);
	
	cli.options.serverPort = appSettings.DEFAULT_PORT;
}

viewSettings.mainPage = `http://localhost:${cli.options.serverPort}`;
viewSettings.newsPage = `http://localhost:${cli.options.serverPort}/news`;

app.engine('hbs', consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Handle static content: style and script files.
app.use('/styles', express.static('styles'));
app.use('/scripts', express.static('scripts'));


// News category parser functions.
function parseCategoryVesti($) {
	let cid;
	
	$('.aside-menu__list-item', '.aside-menu__list').each((i, $elem) => {
		$elem = $('a', $elem);
		cid = $elem.attr('href').trim().match(/cid=(\d+)$/);
		
		if (cid) {
			siteSettings.vesti.categories.push({
				cid: cid[1],
				title: $elem.text()
			});
		}
	});
	
	return (siteSettings.vesti.categories.length ? siteSettings.vesti.categories : null);
}

const responseData = {
	result: 0,
	message: '',
	data: null
};

function fetchNewsVesti(clientReq, clientRes) {
	let requestUrl = siteSettings.vesti.requestUrl;
	
	if (clientReq.body.newsCategory) {
		requestUrl =
			`${siteSettings.vesti.articleUrl}section.html?` +
			`cid=${clientReq.body.newsCategory}`;
	}
	
	request(requestUrl, (err, res, body) => {
		const news = [];
		const newsCount = parseInt(clientReq.body.newsCount);
		let category;
		
		if (!err && res.statusCode === 200) {
			const $ = cheerio.load(body);
			let $newsWrapper = '.news-wrapper_';
			
			if (clientReq.body.newsCategory) {
				category = siteSettings.vesti.categories.find((elem) =>
					elem.cid === clientReq.body.newsCategory);
				category = (category ? category.title : undefined);
				
				$newsWrapper = '.news-wrapper_section';
			}
			
			// Limit selector with news count, if needed.
			$(`.b-item__inner`, $newsWrapper).each((i, $elem) => {
				if (newsCount && i >= newsCount) {
					return;
				}
				
				const $title = $('.b-item__title a', $elem);

				news.push({
					num: i + 1,
					title: $title.text().trim(),
					text: $('.b-item__text', $elem).text().trim(),
					time: $('.b-item__time', $elem).text().trim(),
					url: $title.attr('href').trim().replace(/^\//, siteSettings.vesti.articleUrl)
				});
			});
		}
		
		clientRes.render('news', {
			title: viewSettings.pageTitle,
			mainPage: viewSettings.mainPage,
			newsSite: siteSettings.vesti.title,
			newsCount: newsCount,
			newsCategory: category,
			news: news
		});
	});
}

// News handler.
app.post('/news', urlencodedParser, (clientReq, clientRes) => {
	switch (clientReq.body.newsSite) {
		case 'vesti': fetchNewsVesti(clientReq, clientRes); break;
	}
});


// News categories handler.
app.get('/news/:site', (clientReq, clientRes) => {
	const newsSite = siteSettings[clientReq.params.site];
	
	if (!newsSite) {
		responseData.result = 404;
		clientRes.send(responseData);
		
		return;
	}
	
	request(newsSite.requestUrl, (err, res, body) => {
		if (err) {
			responseData.result = 1;
			responseData.message = err.message;
		} else if (res.statusCode !== 200) {
			responseData.result = res.statusCode;
			responseData.message = res.statusText;
		}
		
		if (responseData.result) {
			clientRes.send(JSON.stringify(responseData));
			
			return;
		}
		
		switch (newsSite.name) {
			case 'vesti': responseData.data = parseCategoryVesti(cheerio.load(body)); break;
			default: break;
		}

		if (!responseData.data) {
			responseData.result = 1;
		}
		
		clientRes.send(JSON.stringify(responseData));
	});
});


// Root request handler.
app.get('/', (req, res) => {
	const countOptions = [
		{value: 10, text: '10'},
		{value: 20, text: '20'},
		{value: 30, text: '30'},
		{value: 0, text: 'All'}
	];
	let optElem;
	
	// Parse newsCount param.
	if (req.query.newsCount) {
		req.query.newsCount = parseInt(req.query.newsCount.trim());
		optElem = countOptions.find((elem) => elem.value === req.query.newsCount);
		
		// Select param option or default value (20 news count).
		if (optElem) {
			optElem.selected = true;
		} else {
			countOptions[1].selected = true;
		}
	}

	// Parse newsSite param.
	if (req.query.newsSite) {
		req.query.newsSite = req.query.newsSite.trim();
		
		optElem = siteSettings.find((elem) => elem.name === req.query.newsSite);
		
		// Select param option or default value (first site).
		if (optElem) {
			optElem.selected = true;
		} else {
			siteSettings[0].selected = true;
		}
	}
	
	res.render('newsFlash', {
		newsPage: viewSettings.newsPage,
		title: viewSettings.title,
		countOptions: countOptions,
		newsSites: siteSettings
	});
});


// Default request handler.
function renderDefaultPage(res) {
	res.render('default', {mainPage: viewSettings.mainPage});
}

app.get('*', (undefined, res) => {
	renderDefaultPage(res);
});

// Binding and starting of the server app.
app.listen(cli.options.serverPort, () => {
	console.info(`Server is listening on port ${cli.options.serverPort}...`);
});
