'use strict';

module.exports = function (app, nconf, isLoggedIn) {
  var levelup = require('levelup');
  var leveldown = require('leveldown');
  var needle = require('needle');
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
          limit: 30,
          reverse: true
        }).on('data', function (data) {
          memes.push({
            key: data.key,
            url: data.value.url,
            user: data.value.user,
            loginType: data.value.loginType
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
    var uid = uuid.v1();
    var buffer = new Buffer(req.body.photo, 'base64');
    var keyName = (new Date().getTime()) + uid;
    var filename = keyName + '.' + req.body.fileType;
    var user;

    var updateDb = function (url, callback) {
      levelup(nconf.get('db'), {
        createIfMissing: true,
        keyEncoding: 'binary',
        valueEncoding: 'json'
      }, function (err, db) {
        if (db) {
          db.put(keyName, {
            key: keyName,
            url: url,
            loginType: req.session.loginType,
            user: user
          }, function () {
            db.get(keyName, function (e, p) {
              callback();
              db.close();
            });
          });
        } else {
          res.status(500);
          next(err);
        }
      });
    };

    if (req.session.loginType === 'appdotnet') {
      user = req.session.passport.user.id;

      // use app.net's file api
      var data = {
        content: {
          buffer: buffer,
          filename: filename,
          content_type: 'image/png',
        },
        public: true,
        type: 'photo'
      };

      needle.post('https://alpha-api.app.net/stream/0/files', data, {
        headers: {
          'Authorization': 'Bearer ' + req.session.passport.user.access_token
        },
        multipart: true
      }, function (err, resp, body) {
        updateDb(body.data.url_permanent, function () {
          res.redirect('/meme/' + keyName);
        });
      });

    } else {

      // using s3
      var s3 = knox.createClient({
        key: nconf.get('s3_key'),
        secret: nconf.get('s3_secret'),
        bucket: nconf.get('s3_bucket')
      });

      var headers = {
        'Content-Type': 'image/' + req.body.fileType
      };

      user = req.session.email;

      s3.putBuffer(buffer, filename, headers, function (err) {
        if (err) {
          res.status(500);
          next(err);
        } else {
          updateDb(s3.url(filename), function () {
            res.redirect('/meme/' + keyName);
          });
        }
      });
    }
  });

  app.get('/delete/:keyname', isLoggedIn, function (req, res, next) {
    levelup(nconf.get('db'), {
      createIfMissing: true,
      keyEncoding: 'binary',
      valueEncoding: 'json'
    }, function (err, db) {
      if (db) {
        db.get(req.params.keyname, function (e, p) {
          if (e) {
            res.status(404);
            next();
          } else {
            if (req.session && (req.session.email == p.user ||
                req.session.passport.user.id == p.user)) {
              db.del(req.params.keyname);
            }
            res.redirect('/');
          }
          db.close();
        });
      } else {
        res.status(500);
        next(err);
      }
    });
  });

  app.get('/meme/:keyname', function (req, res, next) {
    levelup(nconf.get('db'), {
      createIfMissing: true,
      keyEncoding: 'binary',
      valueEncoding: 'json'
    }, function (err, db) {
      if (db) {
        db.get(req.params.keyname, function (e, p) {
          if (e) {
            res.status(404);
            next();
          } else {
            res.render('meme', {
              key: p.key,
              url: p.url,
              isOwner: req.session.authenticated && (req.session.email == p.user || (req.session.passport && req.session.passport.user && req.session.passport.user.id == p.user))
            });
          }
          db.close();
        });
      } else {
        res.status(500);
        next(err);
      }
    });
  });
};
