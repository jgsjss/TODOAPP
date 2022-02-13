const {Db} = require('mongodb');
const MongoClient = require('mongodb').MongoClient;


let db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
    if (err) return console.log(err);
    db = client.db('Todo')
})

module.exports = mgdb;