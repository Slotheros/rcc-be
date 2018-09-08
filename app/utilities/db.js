const mysql = require('mysql');

/**
 * Creates connection pool
 */
const pool = mysql.createPool({
  connectionLimit: 10,
  host: '129.21.183.59',
  user: 'root',
  password: 'subversionperversion',
  database: 'rrcc'
});

/**
 * Exports the connection pool to be user by server.js
 */
module.exports = pool;
