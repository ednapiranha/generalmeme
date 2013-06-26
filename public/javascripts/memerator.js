'use strict';

var Memerator = function () {
  this.canvas = document.getElementById('canvas');
  this.ctx = canvas.getContext('2d');
  this.ctx.font = '40px Bebas';
  this.ctx.fillStyle = 'white';
  this.ctx.strokeStyle = 'black';
  this.image = new Image();
  this.imageSize = 500;
};

Memerator.prototype.generate = function (src) {
  var self = this;

  this.ctx.clearRect(0, 0, this.imageSize, this.imageSize);

  this.image.onload = function () {
    self.ctx.drawImage(self.image, 0, 0);
  };
};

Memerator.prototype.updateText = function (text) {
  var count = 1;
  var words = text.split(' ');
  var currLine = '';

  this.ctx.clearRect(0, 0, this.imageSize, this.imageSize);
  this.ctx.drawImage(this.image, 0, 0);

  for (var t = 0; t < words.length; t ++) {
    var word = words[t];
    var width = this.ctx.measureText(currLine + ' ' + word).width;

    if (width < 470) {
      currLine += ' ' + word;
    } else {
      count ++;
      currLine = word;
    }

    this.ctx.fillText(currLine, 10, 45 * count);
    this.ctx.strokeText(currLine, 10, 45 * count);
  }
};

define([], function () {
  return Memerator;
});
