#!/bin/bash
 
# Simple script to build the config file
#
/bin/cat <<EOF >$1
module.exports = {
  proxyTarget: "$2",
  kafkaBroker: "$3",
  kafkaTopic: "$4"
}
EOF