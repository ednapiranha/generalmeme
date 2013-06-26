'use strict';

module.exports = function (app, nconf, isLoggedIn) {
  var level = require('levelup');

  app.get('/', function (req, res) {
    res.render('index');
  });
};
