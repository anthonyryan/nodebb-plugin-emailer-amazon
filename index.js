'use strict';

var
	ses = require('node-ses'),
	winston = module.parent.require('winston'),
	Meta = module.parent.require('./meta'),
	Emailer = {},

	client;

Emailer.init = function(app, middleware, controllers, callback) {
	function render(req, res, next) {
		res.render('admin/plugins/emailer-amazon', {});
	}

	Meta.settings.get('amazon-ses', function(err, settings) {
		if (!err && settings && settings.apiKey && settings.apiSecret) {
			client = ses.createClient({ key: settings.apiKey, secret: settings.apiSecret });

		} else {
			winston.error('[plugins/emailer-amazon] API key or secret not set!');
		}
	});

	app.get('/admin/plugins/emailer-amazon', middleware.admin.buildHeader, render);
	app.get('/api/admin/plugins/emailer-amazon', render);

	callback();


};

Emailer.send = function(data) {
	if (!client) {
		return winston.error('[emailer.amazon] Amazon SES is not set up properly!')
	}

	client.sendemail({
		to: data.to
		, from: data.from
		, cc: ''
		, bcc: []
		, subject: data.subject
		, message: data.html
		, altText: data.plaintext
	}, function (err, data, res) {
	if (!err) {
		winston.info('[emailer.amazon] Sent `' + data.template + '` email to uid ' + data.uid);
	} else {
		winston.warn('[emailer.amazon] Unable to send `' + data.template + '` email to uid ' + data.uid + '!!');
		winston.error('[emailer.amazon] (' + err.message + ')');
	}
	});
};

Emailer.admin = {
	menu: function(custom_header, callback) {
		custom_header.plugins.push({
			"route": '/plugins/emailer-amazon',
			"icon": 'fa-envelope-o',
			"name": 'Emailer (Amazon SES)'
		});

		callback(null, custom_header);
	}
};

module.exports = Emailer;