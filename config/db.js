const mysql = require('mysql')

var pool  = mysql.createPool({
  host: "bqg2wximjlnqgmfjj44o-mysql.services.clever-cloud.com",
  user: "u1lw03a0o85nt1dw",
  password: "5Q9BxiCFQgxHyBpg67eE",
  database:"bqg2wximjlnqgmfjj44o",
  port:21610
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});


module.exports = pool;
