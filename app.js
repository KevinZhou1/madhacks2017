//starts an express server
var express = require('express');
var app = express();
var serv = require('http').Server(app);

//if no query, default request is to index.html
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/Client/index.html');
	});

app.use('/Client',express.static(__dirname + '/Client'));

serv.listen(2001);


var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id) {
	var self = {
		x:250,
		y:250,
		id:id,
		rotation:0,
		number: Math.floor(10 * Math.random()),
		maxSpeed: 10,
		speed: 0,
		pressingLeft: false,
		pressingRight: false,
		pressingUp: false,
		pressingDown: false
		}
	self.updatePosition = function() {
		if(self.pressingLeft) {
			self.rotation--;
		}
		if(self.pressingRight)
			self.rotation++;
		if(self.pressingUp)
			if(self.speed < maxSpeed)
				self.speed++;
		if(self.pressingDown)
			if(self.speed > -maxSpeed)
				self.speed--;
		if (self.rotation >= 360)
			self.rotation = 0;
	
	
	}
		return self;

}

//loads and initializes socket.io, returns io object
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {

		SOCKET_LIST[socket.id] = socket;
		
		var player = Player(socket.id);
		PLAYER_LIST[socket.id] = player;
	
		console.log('socket connection');
		socket.on('disconnect', function() {
			delete SOCKET_LIST[socket.id];
			delete PLAYER_LIST[socket.id];
		});
		
		socket.on('keypress', function(data) {
			if(data.inputId === 'left') {
				player.pressingLeft = data.state;
			}
			else if(data.inputId === 'right')
				player.pressingRight = data.state;
			else if(data.inputId === 'up')
				player.pressingUp = data.state;
			else if(data.inputId === 'down')
				player.pressingDown = data.state;
		
		
		});
});

//updates positions every 40ms
setInterval(function() {
	var pack = [];
	for (var i in PLAYER_LIST) {

		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			speed: player.speed,
			rotation: player.rotation,
			number: player.number
		});
	}
	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}


}, 40);