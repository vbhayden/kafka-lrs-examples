# Kafka Example: ADL LRS w/ a Kafka Proxy

"What am I looking at?"

This is an Nginx proxy balancing HTTP requests between 3 instances of a NodeJS service built to relay traffic to and from an LRS while producing Kafka messages with the validated xAPI statements.

**Please Note:** *This is an experimental configuration.  It will likely change as we unearth nuances and best practices for handling this type of relay.* 

## Setup
The Nginx instance and the NodeJS instances are configured using Docker-Compose and the `.env` file for environmental variables.  These variables will determine:
- Kafka SASL credentials,
- Kafka Broker locations,
- The Kafka topic for these messages, and
- The LRS being proxied

These instructions are for Ubuntu 16.  They may work for other operating sytsems, but only Ubuntu 16 has been tested.

- `git clone https://github.com/vbhayden/kafka-lrs-examples`
- `cd kafka-lrs-examples`
- `sudo ./install-reqs.sh`
- Adjust the `.env` file for your own use (see below)
- `sudo docker-compose up -d --build`

The LRS needs to be configured after this, but you'll need to wait for the process to actually start.  When the LRS is available (**which can take awhile**), you need to create a superuser for the LRS.  This is done by navigating to the root directory of the project and running:
```
sudo ./create-admin.sh
```

After this, you should be done.

As each of the other containers are relatively lightweight, there shouldn't be much of a delay.  You can check the status with `sudo docker ps`, checking that nothing is restarting repeatedly.

### Environment Variables
Environment variables are broken into two files based on their scope within the TLA project (local and global).  

### Configuring the `.env` file
For variables specific to the LRS proxy, you will need to configure this `.env` file with your own values:
- **PROXY_LRS_ROOT**: Root URL for the LRS being used, **must include protocol** (i.e. https://lrs.adlnet.gov)
- **PROXY_PORT**: Port that the NodeJS services are using for traffic (`8085`)
- **PROXY_INFER**: Whether or not to infer minor xAPI properties without retrieving statement as it appears in the LRS (`true`)
- **HOSTNAME**: DNS / IP for the server running this stuff, **no protocol**
- **KAFKA_BROKERS**: Comma-separated list of Kafka brokers, **no protocol** (i.e. 192.168.30.47:19092,192.168.30.47:29092)
- **KAFKA_USE_SASL**: "true" if your Kafka brokers are using SASL auth
- **KAFKA_SASL_USER**: SASL user for the Kafka cluster
- **KAFKA_SASL_PASS**: SASL password for the Kafka cluster
- **KAFKA_XAPI_TOPIC**: Kafka topic for the xAPI statements

### Using the LRS Proxy
After the containers come online, you'll have access to the LRS proxy service.  To use this service, treat it as though you were
communicating with your LRS itself.

Once the proxy service is online, your activities should target the proxy instead of your LRS.  Assuming your proxies are running on `192.168.30.188`, your xAPI endpoint would become:
```
https://lrs.adlnet.gov/xapi --> http://192.168.30.188/xapi
```
