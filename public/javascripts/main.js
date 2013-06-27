define(['jquery', 'moment', 'memerator'],
  function ($, moment, Memerator) {
  'use strict';

  var body = $('body');
  var input = $('.text-input');
  var file = $('.file-input');
  var currentUser = localStorage.getItem('personaEmail');

  var canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.width = canvas.height = 500;

  document.getElementById('canvas-block').appendChild(canvas);

  var meme = new Memerator();

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

  body.on('change', 'input[type="file"]', function (ev) {
    var files = ev.target.files;
    var file;

    if (files && files.length > 0) {
      file = files[0];

      var fileReader = new FileReader();

      fileReader.onload = function (evt) {
        body.find('#canvas-block').removeClass('hidden');
        meme.image.src = evt.target.result;
        meme.generate();
      };

      fileReader.readAsDataURL(file);
    }
  });

  input.on('keyup', function () {
    meme.updateText($(this).val());
  });

  body.on('submit', function (ev) {
    body.find('.file-type').val('png');
    file.val(meme.canvas.toDataURL().replace(/data:image\/png;base64/, ''));
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
