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
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(8080, () => {
    console.log('Server started on port 3000');
});