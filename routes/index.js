'use strict';

module.exports = function (app, nconf, isLoggedIn) {
  var levelup = require('levelup');
  var leveldown = require('leveldown');
  var request = require('request');
  var uuid = require('uuid');
  var knox = require('knox');

  app.get('/', function (req, res, next) {
    levelup(nconf.get('db'), {
      createIfMissing: true,
      keyEncoding: 'binary',
      valueEncoding: 'json'
    }, function (err, db) {
      var memes = [];

      if (db) {
        db.createReadStream({
          limit: 25
        }).on('data', function (data) {
          memes.push({
            url: data.value.url,
            encoded: encodeURIComponent(data.value.url)
          });
        }).on('error', function (err) {
          res.status(500);
          next(err);
        }).on('end', function () {
          res.render('index', { memes: memes });
          db.close();
        });
      } else {
        res.status(500);
        next(err);
      }
    });
  });

  app.get('/add', isLoggedIn, function (req, res, next) {
    res.render('add');
  });

  app.post('/add', isLoggedIn, function (req, res, next) {
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

    s3.putBuffer(buffer, filename, headers, function (err) {
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
            var user;

            if (req.session.loginType === 'appdotnet') {
              user = req.session.passport.user.id;
            } else {
              user = req.session.email;
            }

            db.put('meme_' + uid, {
              url: s3.url(filename),
              loginType: req.session.loginType,
              user: user
            }, function () {
              db.get('meme_' + uid, function (e, p) {
                if (req.session.loginType === 'appdotnet') {
                  // use app.net's file api
                  request({
                    method: 'POST',
                    url: 'https://alpha-api.app.net/stream/0/files',
                    headers: {
                      'Authorization': 'Bearer ' + req.session.passport.user.access_token
                    },
                    json: {
                      content: buffer,
                      public: true,
                      type: 'photo'
                    }
                  }, function (err, resp, body) {
                    console.log(body)
                    res.redirect('/meme/' + encodeURIComponent(p.url));
                    db.close();
                  });
                } else {
                  res.redirect('/meme/' + encodeURIComponent(p.url));
                  db.close();
                }
              });
            });
          } else {
            res.status(500);
            next(err);
          }
        });
      }
    });
  });

  app.get('/meme/:url', function (req, res, next) {
    res.render('meme', { url: req.params.url });
  });
};
