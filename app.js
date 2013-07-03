var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);
var passport = require('passport');
var AppDotNetStrategy = require('passport-appdotnet').Strategy;

nconf.argv().env().file({ file: 'local.json' });

/* Passport OAuth setup */

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new AppDotNetStrategy({
    clientID: nconf.get('appnet_consumer_key'),
    clientSecret: nconf.get('appnet_consumer_secret'),
    scope: 'files',
    callbackURL: nconf.get('domain') + ':' + nconf.get('authPort') + '/auth/appdotnet/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function (err) {
      if (!profile.access_token) {
        profile.access_token = accessToken;
      }
      return done(err, profile);
    });
  }
));

/* Filters for routes */

var isLoggedIn = function (req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/logout');
  }
};

require('express-persona')(app, {
  audience: nconf.get('domain') + ':' + nconf.get('authPort')
});

// routes
require('./routes')(app, nconf, isLoggedIn);
require('./routes/auth')(app, passport);

app.listen(process.env.PORT || nconf.get('port'));
