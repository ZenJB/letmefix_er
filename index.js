import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import expressSession from 'express-session';
import { read } from 'fs';

const db = new sqlite3.Database('./db.db');
var app = express();


console.clear();
console.log("================");
console.log("=== LetMeFix ===");
console.log("================\n");
// Definições do Servidor
app.use(express.urlencoded());
app.use(expressSession({secret: 'letmefix_er', saveUninitialized: false, resave: false}));
app.disable('x-powered-by');
//Sessão do utilizador
var session;

app.get('/', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        res.redirect('/main.html');
    }else
        res.sendFile(__dirname+'/public/index.html');
});

app.get('/index.html', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        res.redirect('/main.html');
    }else
        res.sendFile(__dirname+'/public/index.html');
});

app.get('/main.html', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        res.sendFile(__dirname+'/public/main.html');
    }else
    res.redirect('/');
});

app.post('/registo', (req,res,next) =>{
    const sql = `INSERT INTO utilizadores (email,nome_completo,tipoDeUtilizador,password) VALUES (?,?,?,?)`;
    const nome_completo = req.body.nome_completo;
    const email = req.body.email;
    const tipoDeUtilizador = req.body.tipoDeUtilizador;
    const senha = req.body.password;

    db.run(sql, [email,nome_completo,tipoDeUtilizador,senha], function(err) {
        res.header(200);
        if (err) {
            res.end('nok');
          return console.log(err.message);
        }
        // get the last insert id
        res.end('ok');
        console.log(`O ${tipoDeUtilizador} ${nome_completo} foi inserido!`);
      });
});

app.post('/login', (req,res,next) => {
    const sql = `SELECT * FROM utilizadores WHERE email=?`;
    const email = req.body.email;
    const senha = req.body.password;
    db.get(sql,[email], (err,row) =>{
        res.header(200);
        if(!err && row && senha === row.password)
        {
            session = req.session;
            session.uniqueID = email;
            res.end('ok');
        }else{
            res.end('nok');
        }
    })    
});

app.post('/logout', (req,res,next) => {
    req.session.destroy();
    res.header(200);
    res.end('ok');
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000);
console.log('[HTTP] Iniciado na porta 3000'); 
