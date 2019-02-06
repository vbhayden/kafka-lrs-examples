# Kafka Examples with xAPI and Docker
Collection of small services to interact with a single-node Kafka configuration, specifically using the **[Experience API](https://adlnet.gov/experience-api)**.

This repo is my own sandbox for learning how to use Kafka and is probably not suitable for production systems (if 
that wasn't apparent from the "single-node" bit).  At the moment, only NodeJS and WebSocket examples are present,
but other examples will be included later.

## Setup
While these services can be run manually, it's recommended to use Docker and Docker-Compose.  The docker-compose.yml file is configured
to use environment variables from the `.env` file, but as this is hidden on operating systems by default I might change that later.

These instructions are for Ubuntu 16.  They may work for other operating sytsems, but only Ubuntu 16 has been tested.

- `git clone https://github.com/vbhayden/kafka-lrs-examples`
- `cd kafka-lrs-examples`
- `sudo ./install-reqs.sh`
- Adjust the `.env` file for your own use (see below)
- `sudo ./rebuild.sh`

The initial Kafka container **might take awhile to warm up**, so this might cause the two NodeJS containers to restart
due to connection failures.  These services will eventually be dine, but you can check on the Kafka container with 
`sudo docker logs -f docker_kafka` or check all containers with `sudo docker ps`.

### Configuring the .env file
To use this project, you will need to configure this `.env` file with your own values:
- **PROXY_TARGET**: Endpoint for the LRS you want to use (i.e. `https://my-lrs.net/`)
- **KAFKA_BROKER**: Address of the Kafka broker (whatever IP your Ubuntu instance is using on the network) 
- **KAFKA_XAPI_TOPIC**: Name of the topic you want to use ("topic" by default)

Once this file is configured, these values will be used in `docker-compose.yml`.

### Using the LRS Proxy
After the containers come online, you'll have access to the LRS proxy service.  To use this service, treat it as though you were
communicating with your LRS itself.

As an example, suppose you are sending statements to the public ADL LRS at `https://lrs.adlnet.gov` and your Ubuntu has an address
of `192.168.30.188` on the network.  Your `.env` file would be configured as (its default value of)
```
PROXY_TARGET=https://lrs.adlnet.gov
KAFKA_BROKER=192.168.30.188:9092
KAFKA_XAPI_TOPIC=topic
```

Once the proxy service is online, your activities should target the proxy instead of your LRS.  By default, the proxy service 
uses port `8085`, so your endpoint would change from
```
https://lrs.adlnet.gov/xapi --> http://192.168.30.188:8085/xapi
```

You can then monitor statement traffic through the Web Socket page.

## Individual Services
While the Kafka and Zookeeper instances are built from Confluent's Docker images, the NodeJS services are proprietary and their
source is available in this repo.  Brief notes will be included here, with more detailed explanations available in their corresponding
folders.

### Kafka Web Socket Service
A NodeJS service that produces two servers (`http://` on 3001 and `ws://` on 3002).  This service connects to the Kafka instance
and consumes its configured topic ("topic" by default).  Each consumed message is then sent as a message through each open WebSocket.

Navigating to 3001 will return a page that connects to the WebSocket server and writes those messages to a log on the page.

### Kafka LRS Proxy
A NodeJS service that acts as a proxy for a targeted LRS.  This service can target an LRS and intercept all requests and responses
as though it were the LRS itself.  

After acknowledgement of a successful statement submission to the LRS, the proxy will then retrieve those statements from the LRS
(in order to know exactly how appear in the LRS) and publish them to the configured Kafka topic.
