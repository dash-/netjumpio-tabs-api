'use strict';

module.exports = function(Tab) {
	Tab.webpage = function(url) {
		return new Promise((resolve, reject) => {
			return resolve({
				logoUrl: 'https://lh3.googleusercontent.com/-qn7Hl_AXEOA/Vegu58jvBrI/AAAAAAAAAVA/RtkSABWWZsU/w768-h768/Google_icon_2015.png',
				name: 'Google',
				url: url,
			});
		});
	};

	Tab.remoteMethod('webpage', {
		http: {path: '/webpage', verb: 'get'},
		accepts: {arg: 'url', type: 'string'},
		returns: {type: 'object', root: true},
	});
};
