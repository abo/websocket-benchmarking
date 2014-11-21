var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');


module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);
  
  var app = require('express')();
  
  // Get a reference to our raw Node HTTP server
  var httpServer = worker.getHTTPServer();
  // Get a reference to our realtime SocketCluster server
  var scServer = worker.getSCServer();
  
  app.use(serveStatic(__dirname + '/public'));

  httpServer.on('req', app);

  var activeSessions = {};

  var count = 0;

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

  /*
    In here we handle our incoming realtime connections and listen for events.
    From here onwards is just like Socket.io but with some additional features.
  */
  scServer.on('connection', function (socket) {
    var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.global.publish('new message', {
      username: socket.username,
      message: data
    });
    // socket.broadcast.emit('new message', {
    //   username: socket.username,
    //   message: data
    // });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    console.log( socket.username + ' joined ' + process.pid + ', current numUsers:' + numUsers);
    // // echo globally (all clients) that a person has connected
    // socket.global.publish('user joined', {
    // socket.broadcast.emit('user joined', {
    //   username: socket.username,
    //   numUsers: numUsers
    // });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.global.publish('typing', {
      username: socket.username
    });
    // socket.broadcast.emit('typing', {
    //   username: socket.username
    // });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.global.publish('stop typing', {
      username: socket.username
    });
    // socket.broadcast.emit('stop typing', {
    //   username: socket.username
    // });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // // echo globally that this client has left
      // socket.global.publish('user left', {
      // socket.broadcast.emit('user left', {
      //   username: socket.username,
      //   numUsers: numUsers
      // });
      console.log(socket.username + ' left ' + process.pid + ', current numUsers:' + numUsers);
    }else{
      console.log('socket disconnect ' + process.pid + ', current numUsers:' + numUsers);
    }
  });

    // /*
    //   Store that socket's session for later use.
    //   We will emit events on it later - Those events will 
    //   affect all sockets which belong to that session.
    // */
    // activeSessions[socket.session.id] = socket.session;
    
    // socket.on('ping', function (data) {
    //   count++;
    //   console.log('PING', data);
    //   scServer.global.publish('pong', count);
    // });
  });
  
  // scServer.on('sessionend', function (ssid) {
  //   delete activeSessions[ssid];
  // });
  
  // setInterval(function () {
    
  //     Emit a 'rand' event on each active session.
  //     Note that in this case the random number emitted will be the same across all sockets which
  //     belong to the same session (I.e. All open tabs within the same browser).
    
  //   for (var i in activeSessions) {
  //     activeSessions[i].emit('rand', {rand: Math.floor(Math.random() * 100)});
  //   }
  // }, 1000);
};