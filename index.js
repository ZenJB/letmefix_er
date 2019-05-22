import express from 'express';
var app = express();
import path from 'path';
//import sqlite3 from 'sqlite3';

//var db = sqlite3.verbose().Database('./db.db');

console.clear();
app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root

app.listen(3000);
console.log('Listening on port 3000');