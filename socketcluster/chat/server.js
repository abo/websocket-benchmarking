var argv = require('minimist')(process.argv.slice(2));
var SocketCluster = require('socketcluster').SocketCluster;

var socketCluster = new SocketCluster({
  balancers: Number(argv.b) || 2,
  workers: Number(argv.w) || 2,
  stores: Number(argv.s) || 1,
  port: Number(argv.p) || 8000,
  appName: argv.n || 'app',
  workerController: __dirname + '/worker.js',
  balancerController: __dirname + '/balancer.js',
  storeController: __dirname + '/store.js',
  addressSocketLimit: 0,
  socketEventLimit: 100,
  rebootWorkerOnCrash: true
});
