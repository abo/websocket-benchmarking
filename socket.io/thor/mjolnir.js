'use strict';

var io = require('socket.io-client')
  , connections = {}
  , concurrent = 0;

//
// Get the session document that is used to generate the data.
//
var session = require(process.argv[2]);

//
// WebSocket connection details.
//
var masked = process.argv[4] === 'true'
  , binary = process.argv[5] === 'true'
  , protocol = +process.argv[3] || 13
  , uid = 0;

process.on('message', function message(task) {
  var now = Date.now();

  //
  // Write a new message to the socket. The message should have a size of x
  //
  if ('write' in task) {
    Object.keys(connections).forEach(function write(id) {
      write(connections[id], task, id);
    });
  }

  //
  // Shut down every single socket.
  //
  if (task.shutdown) {
    Object.keys(connections).forEach(function shutdown(id) {
      // connections[id].close();
      connections[id].disconnect();
    });
  }

  // End of the line, we are gonna start generating new connections.
  if (!task.url) return;

  var socket = io.connect(task.url);
  //  new Socket(task.url, {
  //   protocolVersion: protocol
  // });

  socket.on('connect', function(){
    process.send({ type: 'open', duration: Date.now() - now, id: task.id, concurrent: concurrent });
    // login
    socket.emit('add user', 'user-' + process.pid + '-' + (++uid));
  });
  // socket.on('open', function open() {
  //   process.send({ type: 'open', duration: Date.now() - now, id: task.id, concurrent: concurrent });
  //   write(socket, task, task.id);
  //
  //   // As the `close` event is fired after the internal `_socket` is cleaned up
  //   // we need to do some hacky shit in order to tack the bytes send.
  // });

  socket.on('login', function(data){
    process.send({ type: 'login', duration: Date.now() - now, id: task.id, concurrent: concurrent });
    write(socket, task, task.id);
  });
  socket.on('new message', function(data){
    process.send({
      type: 'message', latency: Date.now() - data.timestamp, concurrent: concurrent,
      id: task.id
    });

    // Only write as long as we are allowed to send messages
    if (--task.messages) {
      write(socket, task, task.id);
    } else {
      socket.disconnect();
    }
  });

  // socket.on('message', function message(data) {
  //   process.send({
  //     type: 'message', latency: Date.now() - socket.last, concurrent: concurrent,
  //     id: task.id
  //   });
  //
  //   // Only write as long as we are allowed to send messages
  //   if (--task.messages) {
  //     write(socket, task, task.id);
  //   } else {
  //     socket.close();
  //   }
  // });

  socket.on('disconnect', function close() {
    var internal = socket._socket || {};

    process.send({
      type: 'close', id: task.id, concurrent: --concurrent,
      read: internal.bytesRead || 0,
      send: internal.bytesWritten || 0
    });

    delete connections[task.id];
  });

  socket.on('error', function error(err) {
    process.send({ type: 'error', message: err.message, id: task.id, concurrent: --concurrent });

    socket.disconnect();
    delete connections[task.id];
  });

  // Adding a new socket to our socket collection.
  ++concurrent;
  connections[task.id] = socket;
});

/**
 * Helper function from writing messages to the socket.
 *
 * @param {WebSocket} socket WebSocket connection we should write to
 * @param {Object} task The given task
 * @param {String} id
 * @param {Function} fn The callback
 * @api private
 */
function write(socket, task, id, fn) {
  session[binary ? 'binary' : 'utf8'](task.size, function message(err, data) {
    // var start = socket.last = Date.now();
    var message = {content: data, timestamp: Date.now()};

    socket.emit('new message', message);
    if(fn) fn(err);
    // socket.send(data, {
    //   binary: binary,
    //   mask: masked
    // }, function sending(err) {
    //   if (err) {
    //     process.send({ type: 'error', message: err.message, concurrent: --concurrent, id: id });
    //
    //     socket.close();
    //     delete connections[id];
    //   }
    //
    //   if (fn) fn(err);
    // });
  });
}
