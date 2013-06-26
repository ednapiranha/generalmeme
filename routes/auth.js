'use strict';

module.exports = function (app, passport) {
  // Login
  app.get('/auth/appdotnet',
    passport.authenticate('appdotnet'),
    function (req, res) {
      // App.net for authentication
    }
  );

  // Callback
  app.get('/auth/appdotnet/callback',
    passport.authenticate('appdotnet', { failureRedirect: '/' }),
    function (req, res) {
      req.session.authenticated = req.isAuthenticated();
      req.session.loginType = 'appdotnet';
      res.redirect('/');
    }
  );

  // Persona callback
  app.get('/auth/persona', function (req, res) {
    if (req.session.email) {
      req.session.loginType = 'persona';
      req.session.authenticated = true;
    }
    res.json({ message: 'persona login' });
  });

  // Logout
  app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
  });
};
