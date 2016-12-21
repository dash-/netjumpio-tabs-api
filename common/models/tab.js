'use strict';


///
// Dependencies
///

var path = require('path');
var urlParser = require('url');
var rp = require('request-promise');
var cheerio = require('cheerio');


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
		return rp(buildRPOptions(url)).then((data) => {
			return processPage(url, data);
		}).catch((err) => {
			return {
				logoUrl: '',
				name: '',
				url: url,
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

	if(relativeUrl.match(/^\/\//)) {
		relativeUrl = parsedBaseUrl.protocol + relativeUrl;
	}

	let parsedRelativeUrl = urlParser.parse(relativeUrl);

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
