var net = require('net');

var clientId = 100000 + Math.floor(Math.random() * 900000);
var queryId = 1;
var login="librarian", password = "secret";

function makePacket(code, tail) {
    var result = code + "\nC\n" + code + "\n"
        + clientId.toString() + "\n"
        + queryId.toString() + "\n"
        + password + "\n"
        + login + "\n"
        + "\n\n\n"
        + tail;
    result = result.length.toString() + "\n" + result;
    queryId++;

    return result;
}

var answer = null;

async function sendAndReceive (code, tail) {
    var packet = makePacket(code, tail);

    var client = net.createConnection(6666, '127.0.0.1', function () {
        console.log('Socket connected');
        console.log('Data sent:\n' + packet);
        client.write(packet);
        client.end();
    });

    client.on('data', function (data) {
        answer = data;
        console.log('Data received:\n' + data);
    });
    client.on('close', function () {
        console.log('Socket closed');
    });

    client.on('end', function () {
        console.log('END received');
    });

    client.on('error', function (error) {
        console.log('ERROR ' + error);
    });
}

function connect() {
    let tail = login + "\n" + password + "\n";
    sendAndReceive('A', tail).then((res) => {
        console.log("CONNECTED");
        disconnect();
    });
}

function disconnect() {
    let tail = login + "\n";
    sendAndReceive('B', tail).then((res) => {
        console.log("DISCONNECTED");
    });
}

connect();
