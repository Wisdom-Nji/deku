const net = require('net'),JsonSocket = require('json-socket');
const {spawnSync} = require('child_process');

var host = "localhost";

function establishServerConnection() {
	var serverConnection = new JsonSocket(net.connect(6969, host));

	//serverConnection.setKeepAlive(true, 2000);

	serverConnection.on('connect', function() {
		console.log("Connected to Afkanerd OpenOs | Main Server | Cloud Instance");
		serverConnection.sendMessage(JSON.stringify({"id" : "tbrlbamenda", "type":"auth"}));
		serverConnection.setKeepAlive(true, 2000);
	})


	serverConnection.on('message', function(data) {
		data = JSON.parse(data);
		var command = data.command;
		var args = data.args;
		console.log(`Command: ${command}`);
		console.log(`Args: ${args}\n-----------`);

		const system_command = args.length > 0 ? spawnSync(command, args, {"encoding":"utf8"}) : spawnSync(command, [], {"encoding":"utf8"});
		//console.log(`Terminal output: ${system_command.output}`);
		//console.log(`Terminal return code: ${system_command.status}\n\n`);

		var output = system_command.stdout;
		var _status = system_command.status;

		var terminal_output = {
			"msg_uid" : data.msg_uid,
			"output" : output,
			"status" : _status
		}
		serverConnection.sendMessage(JSON.stringify(terminal_output));
	});

	serverConnection.on('end', function() {
		console.log("Ending with server!");

	});


	serverConnection.on('close', function() {
		console.log("Closing with server!");
		setTimeout(function() {
			establishServerConnection();
		}, 10000);

	});

	serverConnection.on('error', function(error) {
		console.log("Error, Going to reconnect if closed event is made");
		/*setTimeout(function() {
			console.log("Error, disconnected and trying to reconnect to server!");
			serverConnection.end();
			serverConnection = new JsonSocket(net.connect(6969, host, function() {
				console.log(`Connected to online server`);

			}));
		}, 10000);*/

	});

}

establishServerConnection();
