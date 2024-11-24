const express = require('express')
const app = express()
var mysql      = require('mysql');
const process = require("process");
var connection = mysql.createConnection({
    host     : process.env.MYSQL_ADDON_HOST,
    database : process.env.MYSQL_ADDON_DB,
    user     : process.env.MYSQL_ADDON_USER,
    password : process.env.MYSQL_ADDON_PASSWORD
});
connection.connect()
connection.query('SELECT 1 + 1 AS solution', (err, rows, fields) => {
    if (err) throw err

    console.log('The solution is: ', rows[0].solution)
})
connection.end()

app.listen(8080, () => {
    console.log('Server started on port 3000');
});