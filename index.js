'use strict';

var
        ses = require('node-ses'),
        winston = module.parent.require('winston'),
        Meta = module.parent.require('./meta'),
        Emailer = {},

        client;

Emailer.init = function (data, callback) {

        // modify render for NodeBB 9.x
        function renderAdminPage(req, res) {
                res.render('admin/plugins/emailer-amazon', {});
        }

        Meta.settings.get('amazon-ses', function(err, settings) {
                if (!err && settings && settings.apiKey && settings.apiSecret) {
                        client = ses.createClient({ key: settings.apiKey, secret: settings.apiSecret });

                } else {
                        winston.error('[emailer.amazon] API key or secret not set!');
                }
        });

        data.router.get('/admin/plugins/emailer-amazon', data.middleware.admin.buildHeader, renderAdminPage);
        data.router.get('/api/admin/plugins/emailer-amazon', renderAdminPage);

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
        }, function (err, result, res) {
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

Emailer.getNotices = function(notices, callback) {
        //console.log(client);
        notices.push({
                done: client !== undefined,
                doneText: 'Emailer (Amazon SES) OK',
                notDoneText: 'Emailer (Amazon SES) needs setup'
        });

        callback(null, notices);
}

module.exports = Emailer;
