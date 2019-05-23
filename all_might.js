const net = require('net'),JsonSocket = require('json-socket');
const express = require('express');
var bodyParser = require('body-parser'); 

const app = express();
var collection_of_clients = {};
var collection_of_client_responses = {};

app.use(function (err, req, res, next) {
  res.status(400);
  res.send({
    code : 400,
    data : "syntax_parse_error",
    message : "check body of request"
  })
})


app.use(bodyParser.json());
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.setHeader('Content-Type', 'application/json');

    // Pass to next layer of middleware
    next();
});


var socketConnection = new net.Server;

socketConnection.on('connection', function(client) {
	client = new JsonSocket(client);
	client.uid = Math.floor(Math.random() * 1000);

	collection_of_clients[client.uid] = client;
	console.log(`Number of collected clients| ${Object.keys(collection_of_clients).length}`);

	var stdin = process.openStdin();

	stdin.addListener("data", function(input){
		for(var clients in collection_of_clients) {
			//sample input: ls -a
			var terminal_command = input.toString().trim().split(" ");
			input = {"command" : terminal_command[0]};
			input.args = [];
			delete terminal_command[0];
			for(var i in terminal_command) {
				input.args.push(terminal_command[i]);
			}
			collection_of_clients[clients].sendMessage(JSON.stringify(input));
		}
	});

	client.on('close', function() {
		console.log(`Deleting client| ${client.id}`);
		delete collection_of_clients[client.uid];
	});

	client.on('disconnect', function() {
		console.log(`Disconnecting client| ${client.id}`);
		delete collection_of_clients[client.uid];
	});

	client.on('end', function() {
		console.log(`Client ended| ${client.id}`);
		delete collection_of_clients[client.uid];
	});

	client.on('error', function() {
		console.log(`Error from client| ${client.id}`);
		delete collection_of_clients[client.uid];
	});

	client.on('message', function(data) {
		data = JSON.parse(data);
		if(typeof data.type != "undefined") {
			switch(data.type) {
				case "auth":
					client.id = data.id;
					break;
			}
		} else {
			console.log(`Terminal output\n-----------\n`);
			console.log(data);

			var res = collection_of_client_responses[data.msg_uid];
			console.log(`Res UID: ${data.msg_uid}`);
			res.status(200);
			res.send(JSON.stringify(data));
			delete collection_of_client_responses[data.msg_uid];
		}
	});

});

/*
socketConnection.on('message', function(data) {
	console.log(`Terminal Output\n-------\n${data}`);
});
*/

socketConnection.on('end', function(){
	console.log("ended");
});

socketConnection.on('disconnect', function() {
	console.log("Disconnected");
});

socketConnection.on('error', function() {
	console.log("Error");
});


app.get('/sms/:information', function(req, res) {
	var information = req.params.information;
	//console.log(information);
	JSON.parse(information);
	if(typeof information != "undefined" && information != null) {	
		//console.log(information.data);
		console.log(information.constructor);
		for(var i in collection_of_clients) {
			var client = collection_of_clients[i];
			client.sendMessage(information);
		//	client.pipe(client);
		}
	}
	res.end();
});

app.get('/socket/', function(req, res) {
	res.status(200);
	var collection_of_clients_function = function() {
		var collection = []
		for(var i in collection_of_clients) collection.push({"id": collection_of_clients[i].id, "uid" : collection_of_clients[i].uid});
		return collection;
	}
	res.send(
		JSON.stringify({
			"message" : {
				"number_of_clients" : Object.keys(collection_of_clients).length,
				"clients" : collection_of_clients_function()
			}
		}));
});


app.post('/terminal/:id/:uid', function(req, res) {
	var id = req.params.id;
	var uid = req.params.uid;
	var command = req.body;
	console.log(req.body);
	//var command = JSON.parse(req.body);
	//var command = "";
	console.log(command);

	var client = collection_of_clients[uid];

	var terminal_command = command.toString().split(" ");
	
	command = {"msg_uid": uid, "command" : terminal_command[0]}
	command.args = [];
	delete terminal_command[0];
	
	for(var i in terminal_command) {
		command.args.push(terminal_command[i]);
	}
	client.sendMessage(JSON.stringify(command));
	res.status(201);
	res.uid = client.uid;
	collection_of_client_responses[res.uid] = res;
})



socketConnection.listen(6969, function() {
	console.log(`Started SMS Gateway on port 6969`);
});

app.listen(7455, function() {
	console.log(`Started URL Router on port 7455`);
});


