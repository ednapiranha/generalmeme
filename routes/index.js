'use strict';

module.exports = function (app, nconf, isLoggedIn) {
  var level = require('levelup');
  var request = require('request');
  var knox = require('knox');
  var MultiPartUpload = require('knox-mpu');

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.post('/upload', isLoggedIn, function (req, res) {
    if (req.session.loginType === 'persona') {
      // use s3
    } else {
      // use app.net's file api
      console.log(req.body)
    }
  });
};
