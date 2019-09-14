var mysql = require('mysql');
var connection = mysql.createConnection({
    host:'13.125.95.139',
    port:3306,
    user:'vasco',
    password:'vascoroad',
    database:'vascoDB'
});

module.exports = connection;