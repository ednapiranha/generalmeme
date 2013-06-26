define(['jquery', 'moment'],
  function ($, moment) {
  'use strict';

  var body = $('body');
  var currentUser = localStorage.getItem('personaEmail');

  navigator.id.watch({
    loggedInUser: currentUser,
    onlogin: function (assertion) {
      $.ajax({
        type: 'POST',
        url: '/persona/verify',
        data: { assertion: assertion },
        success: function (res, status, xhr) {
          $.get('/auth/persona', function () {
            localStorage.setItem('personaEmail', res.email);
            document.location.href = '/';
          });
        },
        error: function (res, status, xhr) {
          console.log('error logging in');
        }
      });
    },
    onlogout: function() {
      $.ajax({
        url: '/persona/logout',
        type: 'POST',
        success: function (res, status, xhr) {
          localStorage.removeItem('personaEmail');
          document.location.href = '/logout';
        },
        error: function (res, status, xhr) {
          console.log('logout failure ', res);
        }
      });
    }
  });

  body.on('click', function (ev) {
    var self = $(ev.target);

    switch (self.data('action')) {
      case 'login':
        ev.preventDefault();
        navigator.id.request();
        break;

      case 'logout':
        ev.preventDefault();
        navigator.id.logout();
        break;
    }
  });
});
