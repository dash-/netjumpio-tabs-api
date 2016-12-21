'use strict';


///
// Dependencies
///

var path = require('path');
var urlParser = require('url');
var rp = require('request-promise');
var cheerio = require('cheerio');
var assign = require('lodash/assign');


///
// Configuration
///

const config = {
	userAgent: (
		'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 ' +
		'(KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36'
	),
}


///
// Module
///

module.exports = function(Tab) {
	Tab.webpage = function(url) {
		let scope = {};

		return Promise.resolve().then(() => {
			const processedUrl = processUrl(
				urlParser.parse(url, false, true)
			)

			if(isInvalidUrl(processedUrl)) {
				throw new Error(
					'Invalid url: ' + urlParser.format(processedUrl)
				);
			}

			return scope.url = urlParser.format(processedUrl);

		}).then(url => {
			return rp(buildRPOptions(url));

		}).then(data => {
			return processPage(scope.url, data);

		}).catch(err => {
			return {
				logoUrl: '',
				name: '',
				url: scope.url,
			};
		});
	};

	Tab.remoteMethod('webpage', {
		http: {path: '/webpage', verb: 'get'},
		accepts: {arg: 'url', type: 'string'},
		returns: {type: 'object', root: true},
	});
};


///
// Helpers
///

function processUrl(urlObject) {
	if(urlObject.path && ! urlObject.host ) {
		const parts = urlObject.path.split('/', 2);
		urlObject.host = parts[0];
		urlObject.path = parts[1] ? '/' + parts[1] : '';
		urlObject.pathname = urlObject.path;
	}

	if(! urlObject.protocol) {
		urlObject = assign({}, urlObject, {protocol: 'http:'});
	}

	return urlObject;
}

function isInvalidUrl(urlObject) {
	return ! (urlObject.protocol && urlObject.host);
}

function buildRPOptions(url) {
	return {
		uri: url,
		headers: {
			'Upgrade-Insecure-Requests': 1,
			'User-Agent': config.userAgent,
		},
		json: true,
		gzip: true
	};
}

function processPage(url, data) {
	const $ = cheerio.load(data);

	return {
		logoUrl: getLogoUrl(url, $),
		name: getTitle($),
		url: url,
	}
}

function getLogoUrl(url, $) {
	let logoUrl = '';

	$('link').each((tagIdx, tag) => {
		const rel = $(tag).attr('rel') || '';
		if(rel.toLowerCase() !== 'shortcut icon') {
			// .each continue
			return;
		}

		const href = $(tag).attr('href');

		if(! href) {
			// .each continue
			return;
		}

		logoUrl = toAbsoluteUrl(url, href);

		return false;
	});

	return logoUrl;
}

function getTitle($) {
	return $('title').text();
}

function toAbsoluteUrl(baseUrl, relativeUrl) {
	const parsedBaseUrl = urlParser.parse(baseUrl);

	let parsedRelativeUrl = urlParser.parse(relativeUrl, false, true);

	if(! parsedRelativeUrl.protocol) {
		parsedRelativeUrl.protocol = parsedBaseUrl.protocol;
	}

	if(! parsedRelativeUrl.host) {
		parsedRelativeUrl.host = parsedBaseUrl.host;
	}

	if(! path.isAbsolute(parsedRelativeUrl.path)) {
		parsedRelativeUrl.path = path.resolve(
			parsedBaseUrl.path, 
			parsedRelativeUrl.path
		);
	}

	return urlParser.format(parsedRelativeUrl);
}
