FROM node:8

ENV TOPIC=$KAFKA_XAPI_TOPIC
ENV BROKER=$KAFKA_BROKER
ENV TARGET=$KAFKA_BROKER

# Create our NodeJS source directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy the project in
COPY src/ ./

# Install the packages
RUN npm install --save

# Expose our port
EXPOSE 8085

# Start the service
CMD ["npm", "start"]
