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

app.get("/api/getProfil/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    connection.query("SELECT pseudo, xp, first_pokemon, second_pokemon, third_pokemon, fourth_pokemon, fifth_pokemon, sixth_pokemon, profil_picture, level, box, canOpen, lastOpening, pkmToken FROM profil WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
connection.end()

app.listen(8080, () => {
    console.log('Server started on port 3000');
});