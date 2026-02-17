const { Redis } = require("ioredis");

module.exports = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null
});
