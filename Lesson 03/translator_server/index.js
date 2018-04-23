const http = require('http');
const clc = require('cli-color');
const clcValue = clc.bold.yellowBright;
const urlutils = require('url');
const request = require('request');
const cli = require('cli');
const cliOptions = {
	serverPort: ['p', 'Bind a custom port for requests (1024-65535).', 'int', 3000],
	logRequests: ['l', 'Log requests in the server console.', 'bool', false]
};

cli.setApp('A simple server-translator (ru<->en).', '0.0.1');
cli.enable('version');
cli.parse(cliOptions);

cli.options.serverPort = (
	cli.options.serverPort < 1024 || cli.options.serverPort > 65535 ?
	3000 : cli.options.serverPort);

try {
	http.createServer(parseRequest).listen(cli.options.serverPort);
	
	console.log(
		'Client requests console logging is ' +
		clcValue(cli.options.logRequests ? 'on' : 'off'));
	console.log(
		'The server is listening on port ' +
		clcValue(cli.options.serverPort) +
		'...\n');
}
catch (err) {
	console.error(err);
}

function sendResponse(res, json) {
	// Write back a JSON response to the client.
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*'
	});
	res.write(typeof json === 'object' ? JSON.stringify(json) : json);
	res.end();
}

function logRequest(log, params) {
	if (!log) {
		return;
	}
	
	let now = new Date();
	
	now ='[' + clcValue(
		now.toLocaleDateString() + ' ' +
		now.toLocaleTimeString()) + ']';
	
	if (!params) {
		console.warn(now, 'Request with empty parameters.');
	} else if (!params.text || !params.lang) {
		const paramText = (params.text ? 'text: ' + params.text : '');
		const paramLang = (params.lang ? 'lang: ' + params.lang : '');
		
		console.warn(
			now, 'Request with invalid parameters.' +
			(paramText ? '\ntext: ' + paramText : '') +
			(paramLang ? '\nlang: ' + paramLang : ''));
	} else {
		console.log(
			now,
			'Valid request' + (params.code ? ' (code ' + clcValue(params.code) + ')' : '') + '.' +
			'\ntext: ' + params.text +
			'\nlang: ' + params.lang);
	}
}

function parseRequest(clientRequest, clientResponse) {
	const params = urlutils.parse('http://' + clientRequest.headers.host + clientRequest.url);
	const apiKey =
			'trnsl.1.1.20180422T153932Z.11eeef67fa9f0e9'+
			'f.7892300ba455c436637e5ac358b76f0bae4b9cf0';
	let queryResult = {code: 1, lang: '', text: ''};
	let queryParams = params.query;
	let keyValue;

	if (!queryParams) {
		logRequest(cli.options.logRequests, queryParams);
		sendResponse(clientResponse, queryResult);
		
		return;
	}
	
	queryParams = queryParams.split('\&');

	for (const param of queryParams) {
		keyValue = param.split('=');

		switch (keyValue[0].toLowerCase()) {
			case 'lang': queryResult.lang = keyValue[1]; break;
			case 'text': queryResult.text = keyValue[1]; break;
		}
	}

	if (!queryResult.lang || !queryResult.text) {
		logRequest(cli.options.logRequests, queryResult);
		sendResponse(clientResponse, queryResult);
		
		return;
	}
	
	request.post({
		url: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
		form: {
			key: apiKey,
			text: decodeURI(queryResult.text),
			lang: queryResult.lang
		}
	}, (err, res, json) => {
		if (err) {
			queryResult.code = 1;
		}
		
		queryResult.code = res.statusCode;
		
		if (res.statusCode === 200) {
			json = JSON.parse(json);
			queryResult.code = json.code;
			
			// Convert text arrain into single text result.
			json.text = json.text[0];
			
			logRequest(cli.options.logRequests, queryResult);
			sendResponse(clientResponse, JSON.stringify(json));
		}
		else {
			sendResponse(clientResponse, queryResult);
		}
	});
}
