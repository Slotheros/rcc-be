const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: '129.21.183.59',
  user: 'root',
  password: 'subversionperversion',
  database: 'rrcc'
});

module.exports = pool;
