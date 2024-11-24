const process = require('process')
var mysql      = require('mysql');
var connection = mysql.createPool({
  host     : process.env.MYSQL_ADDON_HOST,
  database : process.env.MYSQL_ADDON_DB,
  user     : process.env.MYSQL_ADDON_USER,
  password : process.env.MYSQL_ADDON_PASSWORD,
  port : process.env.MYSQL_ADDON_PORT
});

connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});


module.exports = connection;