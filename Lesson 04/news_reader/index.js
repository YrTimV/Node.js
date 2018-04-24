const app = require('express')();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const consolidate = require('consolidate');
const request = require('request');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

app.cli = require('cli');
app.cli = require('cli');
app.DEFAULT_PORT = 3000;

// Set command line options.
app.cli.parse({
	serverPort: ['p', 'Bind a custom port for requests (1024-65535).', 'int', app.DEFAULT_PORT]
});

if (app.cli.options.serverPort < 1024 || app.cli.options.serverPort > 65535) {
	console.warning(
		`Invalid custom port defined (${app.cli.options.serverPort}). ` +
		`Fallback to the default port ${app.DEFAULT_PORT}.`
	);
	
	app.cli.options.serverPort = app.DEFAULT_PORT;
}

// Application settings for internal use.
app.viewSettings = {
	pageTitle: `NewsFlash | A simple news fetch service`,
	mainPage: `http://localhost:${app.cli.options.serverPort}`,
	newsPage: `http://localhost:${app.cli.options.serverPort}/news`
};

app.siteSettings = {
	vesti: {
		name: 'vesti',
		title: 'vesti.ru',
		articleUrl: 'https://www.vesti.ru/',
		requestUrl: 'https://www.vesti.ru/news/',
		categories: []
	}
};


app.engine('hbs', consolidate.handlebars);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


// News category parser functions.
function parseCategoryVesti($) {
	let cid;
	
	$('.aside-menu__list-item', '.aside-menu__list').each((i, $elem) => {
		$elem = $('a', $elem);
		cid = $elem.attr('href').trim().match(/cid=(\d+)$/);
		
		if (cid) {
			app.siteSettings.vesti.categories.push({
				cid: cid[1],
				title: $elem.text()
			});
		}
	});
	
	return (app.siteSettings.vesti.categories.length ? app.siteSettings.vesti.categories : null);
}

const responseData = {
	result: 0,
	message: '',
	data: null
};


function fetchNewsVesti(clientReq, clientRes) {
	let requestUrl = app.siteSettings.vesti.requestUrl;
	
	if (clientReq.body.newsCategory) {
		requestUrl =
			`${app.siteSettings.vesti.articleUrl}section.html?` +
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
				$newsWrapper = '.news-wrapper_section';
				
				app.siteSettings.vesti.categories.forEach((elem) => {
					if (elem.cid === clientReq.body.newsCategory) {
						category = elem.title;
					}
				});
			}
			
			$('.b-item__inner', $newsWrapper).each((i, $elem) => {
				// Skip exeeded amount of news items.
				if (newsCount && i >= newsCount) {
					return;
				}
				
				const $title = $('.b-item__title a', $elem);

				news.push({
					num: i + 1,
					title: $title.text().trim(),
					text: $('.b-item__text', $elem).text().trim(),
					time: $('.b-item__time', $elem).text().trim(),
					url: $title.attr('href').trim().replace(/^\//, app.siteSettings.vesti.articleUrl)
				});
			});
		}
		
		clientRes.render('news', {
			title: app.viewSettings.pageTitle,
			mainPage: app.viewSettings.mainPage,
			newsSite: app.siteSettings.vesti.title,
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
	const newsSite = app.siteSettings[clientReq.params.site];
	
	if (!newsSite) {
		responseData.result = 404;
		clientRes.send(JSON.stringify(responseData));
		
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
	let selected;
	
	// Parse newsCount param.
	if (req.query.newsCount) {
		req.query.newsCount = parseInt(req.query.newsCount.trim());
		
		countOptions.forEach((elem) => {
			if (elem.value === req.query.newsCount) {
				elem.selected = true;
				selected = true;
			}
		});
	}

	// Default select is 20 news count.
	if (!selected) {
		countOptions[1].selected = true;
	} else {
		selected = undefined;
	}
	
	// Parse newsSite param.
	if (req.query.newsSite) {
		req.query.newsSite = req.query.newsSite.trim();
		
		for (const site in app.siteSettings) {
			if (app.siteSettings[site].name === req.query.newsSite) {
				app.siteSettings[site].selected = true;
				selected = true;
			}
		}
	}
		
	// Default select is the first site.
	if (!selected) {
		app.siteSettings[0].selected = true;
	} else {
		selected = undefined;
	}
	
	res.render('newsFlash', {
		newsPage: app.viewSettings.newsPage,
		title: app.viewSettings.title,
		countOptions: countOptions,
		newsSites: app.siteSettings
	});
});


// Styles/scripts folder request handlers.
function sendFile(res, path, fileName) {
	if (fs.existsSync(path + fileName)) {
		res.sendFile(path + fileName);
	} else {
		renderDefaultPage(res);
	}
}

app.get('/styles/:file', (req, res) => {
	sendFile(res, `${__dirname}/styles/`, req.params.file.trim());
});

app.get('/scripts/:file', (req, res) => {
	sendFile(res, `${__dirname}/scripts/`, req.params.file.trim());
});


// Default request handler.
function renderDefaultPage(res) {
	res.render('default', {mainPage: app.viewSettings.mainPage});
}

app.get('*', (undefined, res) => {
	renderDefaultPage(res);
});

// Binding and starting of the server app.
app.listen(app.cli.options.serverPort, () => {
	console.info(`Server is listening on port ${app.cli.options.serverPort}...`);
});
