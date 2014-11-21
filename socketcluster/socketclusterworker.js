(function () {

  var socketCluster = require('socketcluster-client'),
    util = require('util'),
    BaseWorker = require('./baseworker.js'),
    logger = require('../logger.js');

  /**
   * SocketClusterWorker Worker class inherits form BaseWorker
   */
  var SocketClusterWorker = function (server, generator) {
    SocketClusterWorker.super_.apply(this, arguments);
  };

  util.inherits(SocketClusterWorker, BaseWorker);

  SocketClusterWorker.prototype.createClient = function (callback) {
    var self = this;

    var client = socketCluster.connect({url:this.server,autoReconnect:false});

    client.on('connect', function () {
      callback(false, client);
    });

    client.on('fail', function (err) {
      if (self.verbose) {
        logger.error("SocketCluster Worker fail " + JSON.stringify(err));
      }
        console.log("SocketCluster Worker fail " + JSON.stringify(err));
      callback(true, client);
    });
    client.on('disconnect', function (err) {
      if (self.verbose) {
        logger.error("SocketCluster Worker disconnect " + JSON.stringify(err));
      }
        console.log("SocketCluster Worker disconnect " + JSON.stringify(err));
      callback(true, client);
    });


    client.on('error', function (err) {
      if (self.verbose) {
        logger.error("SocketCluster Worker error: " + JSON.stringify(err));
      }
        logger.error("SocketCluster Worker error: " + JSON.stringify(err));
      callback(true, client);
    });
  };

  module.exports = SocketClusterWorker;

})();
