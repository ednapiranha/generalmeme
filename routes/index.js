'use strict';

module.exports = function (app, nconf, isLoggedIn) {
  var levelup = require('levelup');
  var leveldown = require('leveldown');
  var request = require('request');
  var uuid = require('uuid');
  var knox = require('knox');

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.post('/upload', isLoggedIn, function (req, res, next) {
    var buffer = new Buffer(req.body.photo, 'base64');

    var s3 = knox.createClient({
      key: nconf.get('s3_key'),
      secret: nconf.get('s3_secret'),
      bucket: nconf.get('s3_bucket')
    });

    var headers = {
      'Content-Type': 'image/' + req.body.fileType
    };

    var uid = uuid.v1();
    var filename = 'meme-' + uid + '.' + req.body.fileType;

    s3.putBuffer(buffer, filename, headers, function (err, res) {
      if (err) {
        res.status(500);
        next(err);
      } else {
        levelup(nconf.get('db'), {
          createIfMissing: true,
          keyEncoding: 'binary',
          valueEncoding: 'json'
        }, function (err, db) {
          if (db) {
            db.put('meme_' + uid, {
              url: s3.url(filename)
            }, function () {
              db.get('meme_' + uid, function (e, p) {
                res.redirect('/meme/' + p.url, function () {
                  db.close();
                });
              });
            });
          } else {
            throw new Error('could not open database ', err);
          }
        });
      }
    });

    if (req.session.loginType === 'appdotnet') {
      // use app.net's file api

    }
  });
};
