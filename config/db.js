const mysql = require('mysql')
const process = require('process')
var connection = mysql.createConnection({
  host     : process.env.MYSQL_ADDON_HOST,
  database : process.env.MYSQL_ADDON_DB,
  user     : process.env.MYSQL_ADDON_USER,
  password : process.env.MYSQL_ADDON_PASSWORD
});
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});


module.exports = pool;
