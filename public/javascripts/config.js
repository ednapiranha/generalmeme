requirejs.config({
  deps: ['main'],
  paths: {
    'jquery': 'lib/jquery',
    'moment': 'lib/moment'
  },
  shim: {
    'jquery': {
      exports: 'jQuery'
    },
    'moment': {
      exports: 'moment'
    }
  }
});
