var userIndex = 0;
var pid = process.pid;

// var messageIndex = 0;

module.exports = {

   /**
    * Before connection (optional, just for faye)
    * @param {client} client connection
    */
   beforeConnect : function(client) {
     // Example:
     // client.setHeader('Authorization', 'OAuth abcd-1234');
     // client.disable('websocket');
	 // userIndex++;
   },

   /**
    * On client connection (required)
    * @param {client} client connection
    * @param {done} callback function(err) {}
    */
   onConnect : function(client, done) {
     // Faye client
     // client.subscribe('/channel', function(message) { });

     // Socket.io client
     // client.emit('test', { hello: 'world' });

     // Primus client
     // client.write('Sailing the seas of cheese');
	client.emit('add user', 'user-' + pid + '-' + (userIndex++));

     done();
   },

   /**
    * Send a message (required)
    * @param {client} client connection
    * @param {done} callback function(err) {}
    */
   sendMessage : function(client, done) {
     // Example:
     // client.emit('test', { hello: 'world' });
     // client.publish('/test', { hello: 'world' });
	 // client.emit('new message', 'message-' + (messageIndex++));
     done();
   }
};
