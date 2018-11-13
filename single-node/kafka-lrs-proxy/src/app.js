// Entry Point for the LRS ReRoute Service.
//
// This is a NodeJS Express application 
//
const cors = require("cors");
const axios = require("axios");
const kafka = require("no-kafka");
const express = require("express");
const bodyParser = require("body-parser");
const proxy = require("express-http-proxy");

// Configuration
//
const PROXY_TARGET = (process.env.PROXY_TARGET || "https://lrs.adlnet.gov");
const KAFKA_BROKER = (process.env.KAFKA_BROKER || "http://192.168.30.188:9092");
const KAFKA_XAPI_TOPIC = (process.env.KAFKA_XAPI_TOPIC || "topic");
const PORT = (process.env.PORT || 8085);

// Create an instance of the express class and declare our port
const app = express();

// Set EJS as our view engine for partial templates
app.set("view engine", "ejs");

// Express makes it easier to parse our request body, removing the
// ugly callback system from the default http module
app.use(bodyParser.json())

// Since the point of this service is to receive and respond to requests
// from other services, we need to make sure the cross domain middleware
// is running
app.use(cors())

app.options("*", function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.end();
});

// Port we're redirecting to
//
const PROXY_RAW = PROXY_TARGET;
const REDIRECT_URL = PROXY_RAW.endsWith("/") ? PROXY_RAW.substring(0, PROXY_RAW.length - 1) : PROXY_RAW;

// Main index page.  Shows the registered services and their most recent statuses.
app.use("/", proxy(REDIRECT_URL, {

    // "intercept" is deprecated and the deprecation message is actually wrong.
    // This will give us access to the:
    //      - original request (req)
    //      - original response (res)
    //      - the response this proxy service will send back (proxyRes) 
    //      - the data this proxy service will include in its response (proxyResData)
    //
    userResDecorator: function(proxyRes, proxyResData, req, res) {

        // Assign our CORS stuff
        proxyRes.headers["Access-Control-Allow-Origin"] = "*";
        proxyRes.headers["Access-Control-Allow-Methods"] = "*";
        proxyRes.headers["Access-Control-Allow-Headers"] = "*";

        // Intercept POST requests to write xAPI to the log
        if (req.method == "POST") {

            // Intercept xAPI statements
            if (req.url.toLowerCase().endsWith("/statements")) {
                
                // Check if it was accepted
                if (proxyRes.statusCode == 200) {
                    
                    // Get what we stored these statements as
                    let statementIds = JSON.parse(proxyResData.toString('utf8'));
                    
                    // Get each statement we just stored
                    for (let k=0; k<statementIds.length; k++) {

                        // Statement UUID from the response
                        let id = statementIds[k];
                        
                        // Do this with promises so we can stay async
                        //
                        axios.get(REDIRECT_URL + req.url + "?statementId=" + id, {
                            headers: {
                                "Authorization": req.get("Authorization"),
                                "X-Experience-API-Version": req.get("X-Experience-API-Version")
                            }
                        })
                        .then(response => {
                            publishStatement(response.data);
                        })
                        .catch(error => {
                            console.log("[Proxy] Error retrieving statement from LRS: ", error);
                        })
                    }
                };
            }
        }

        return proxyResData;
    }
}));

// Initialize the Kafka connection
const producer = new kafka.Producer({
    connectionString: KAFKA_BROKER
});
producer.init()
.then(function(){
    console.log("[Kafka] Producer initialized, will target: ", KAFKA_BROKER);
})
.catch(function(error){
    console.log("[Kafka] Initialization Error: ", error);
})

// This will be called from the promise in our proxy interception callback's axios promise
function publishStatement(statement) {

    producer.send({
        topic: KAFKA_XAPI_TOPIC,
        partition: 0,
        message: {
            value: JSON.stringify(statement)   
        }
    })
    .then(function(result) {
        console.log("[Kafka] Statement published: ", statement);
    })
    .catch(function(error){
        console.log("[Kafka] Error publishing statement: ", error);
    });
}

// Then start the server.
app.listen(PORT, "0.0.0.0", function(){

    console.log("\n[Proxy]: LRS Wrapper Service listening on port %s", PORT);
    console.log("[Proxy]: Relaying traffic to %s", REDIRECT_URL);
});
