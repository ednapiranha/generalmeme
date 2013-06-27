# General Meme

A meme generator

## Installation

Install [leveldb](http://code.google.com/p/leveldb/downloads/list)

> git clone git@github.com:ednapiranha/generalmeme.git

> cd generalmeme

> npm install

> cp local.json-dist local.json

Edit configuration values in local.json (note the app.net and s3 settings)

> npm -g install grunt-cli nodemon

> nodemon app.js

## In production mode

Set debug: false in local.json and run `grunt` in the project
