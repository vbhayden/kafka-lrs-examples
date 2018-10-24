// Entry Point for the LRS ReRoute Service.
//
// This is a NodeJS Express application 
//
const cors = require("cors");
const kafka = require("no-kafka");
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require('ws');

// Get these from Docker if available
const KAFKA_BROKER = process.env.KAFKA_BROKER || "192.168.30.188:9092";
const KAFKA_XAPI_TOPIC = process.env.KAFKA_XAPI_TOPIC || "topic";
const APP_PORT = process.env.APP_PORT || 3001;
const WS_PORT = process.env.WS_PORT ||  3002;

// Object that knows about Kafka and the WebSocket
var helper = {
    kafkaAlive: false,
    kafkaCallback: null,
    sockets: [

    ]
};

// Create an instance of the express class and declare our port
var app = express();

// Set EJS as our view engine for partial templates
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("scripts"));
app.use(express.static("views"));

// Main page.
app.get("/", function(req, res, next){
    res.render("index.ejs");
});

// Then start the server.
app.listen(APP_PORT, "0.0.0.0", function(){
    console.log("\nKafka Web Socket Example listening on port %s", APP_PORT);
});


// Set up our WebSocket server
const wss = new WebSocket.Server({
    port: WS_PORT,
});

// WebSocket events
wss.on('connection', function connection(ws) {

    // Assign to our sockets
    helper.sockets.push(ws);
    console.log("[Socket] Socket opened.  Total:", helper.sockets.length);

    ws.on('message', function incoming(message) {
        console.log('[Socket] Message Received: %s', message);
        ws.send(message);
    });

    ws.on("close", function close() {
        let index = helper.sockets.indexOf(ws);
        helper.sockets.splice(index, 1);

        console.log("[Socket] Socket closed.  Remaining:", helper.sockets.length);
    });

    ws.send('Connected to Kafka Web Socket Server!');
});

// Kafka integration
const consumer = new kafka.SimpleConsumer({
    connectionString: KAFKA_BROKER
});
var dataHandler = function (messageSet, topic, partition) {
    messageSet.forEach(function (m) {

        let msg = m.message.value.toString('utf8');
        console.log(msg);

        // Write to each socket
        for (let k=0; k<helper.sockets.length; k++) {
            helper.sockets[k].send(msg);
        }
    });
};
consumer.init()
.then(function(){
    console.log("[Kafka] Consumer initialized, will target: ", KAFKA_BROKER);

    // Message callback
    consumer.subscribe(KAFKA_XAPI_TOPIC, dataHandler);
})
.catch(function(error){
    console.log("[Kafka] Initialization Error: ", error);
});