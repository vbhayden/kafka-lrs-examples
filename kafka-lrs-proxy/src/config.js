module.exports = {
    /**
     * Whether or not to infer xAPI statement details.  
     * 
     * This speeds up the process quite a bit, but will not be capable of forwarding
     * the statement exactly as it appears in the LRS.  
     * 
     * Namely, Authority, Stored, and Timestamp will be inferred. 
     */
    infer: (process.env.PROXY_INFER || "true").toLowerCase() == "true",

    /**
     * Root of the LRS we're targeting.  
     * 
     * Note that targeting an LRS using HTTPS 
     * will require either a cert here, at the nginx level, or the 
     * NODE_TLS_REJECT_UNAUTHORIZED = 0 hack. 
     */
    proxyRoot: (process.env.PROXY_LRS_ROOT || "http://lrs:8000"),

    /**
     * Authority to use on these statements when they're forwarded.
     * 
     * Non-inferred statements will have their spec-ensured authority.
     */
    authority: {
        name: "Kafka LRS Proxy",
        account: {
            name: "Proxy",
            homePage: (process.env.PROXY_LRS_ROOT || "https://lrs.adlnet.gov")
        }
    },

    /**
     * Configuration for the Kafka broker(s) being targeted.
     */
    kafka: {
        /**
         * Broker(s) to target.
         * 
         * This can be an array for the local definition or a comma-delimited string.  
         */
        brokers: (process.env.KAFKA_BROKERS || "localhost:9092"),

        /** Topic to produce statements onto.  */
        topic: (process.env.KAFKA_XAPI_TOPIC || "default-topic"),
        sasl: {
            /** Whether or not to use the SASL auth.  Ignores below if not. */
            use: (process.env.KAFKA_USE_SASL || "true").toLowerCase() == "true",
            mechanism: 'plain', 
            username: (process.env.KAFKA_SASL_USER || "kafka-username"), 
            password: (process.env.KAFKA_SASL_PASS || "kafka-password") 
        },
    },
}