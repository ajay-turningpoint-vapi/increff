const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "sa",
  password: "password",
  database: "syncdb",
  port: 5432,
});

module.exports = pool;



