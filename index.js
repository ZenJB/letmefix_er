import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import expressSession from 'express-session';
import fs from 'fs';

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
    }else{
        res.sendFile(__dirname+'/public/index.html');
    }
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
        fs.readFile(__dirname+'/public/main.html', function read(err, data) {
            if (err) {
                res.redirect('/');
                console.log("[ERRO main.html] "+err);
            }
            const sql = `SELECT * FROM obra WHERE proprietario=?`;
            db.all(sql,[session.uniqueID], (err,rows) =>{
                res.header(200);
                if(err){
                    res.header(200).end('Erro!');
                    console.log("[main.html] "+err.toString());
                }
                var numero_servicos = 0;
                if(!rows)
                    res.header(200).end(data.toString().replace('<%= numero_servicos %>','Sem qualquer serviço a decorrer'));
                else{
                    rows.forEach((row) => {
                        numero_servicos++;
                    });
                    if(numero_servicos == 0)
                        res.header(200).end(data.toString().replace('<%= numero_servicos %>','Sem qualquer serviço a decorrer'));
                    else
                        res.header(200).end(data.toString().replace('<%= numero_servicos %>',`A decorrer ${numero_servicos} serviço(s)!`));
                }
                
               
            })    
        });
    }else
    res.redirect('/');
});

app.get('/criar_obra.html', (req,res) => {
    session = req.session;
    const email = session.uniqueID;
    const sql = `SELECT * FROM utilizadores WHERE email=?`;
    if(email){
        db.get(sql,[email], (err,row) =>{
            if(row.tipoDeUtilizador == "Profissional")
                res.redirect('/');
            else{
                fs.readFile(__dirname+'/public/criar_obra.html', function read(err, data) {
                    if (err) {
                        res.redirect('/');
                        console.log("[ERRO criar_obra.html] "+err);
                    }
                    res.header(200).end(data.toString());
                });
            }
        });
    }else
    res.redirect('/');
});

app.post('/registo', (req,res,next) =>{
    const sql = `INSERT INTO utilizadores (email,nome_completo,tipoDeUtilizador,password,morada,nif,telefone,competencias) VALUES (?,?,?,?,?,?,?,?)`;
    const nome_completo = req.body.nome_completo;
    const email = req.body.email;
    const tipoDeUtilizador = req.body.tipoDeUtilizador;
    const senha = req.body.password;
    const morada = req.body.morada;
    const nif = req.body.nif;
    const telefone = req.body.telefone;
    const competencias = req.body.competencias;

    db.run(sql, [email,nome_completo,tipoDeUtilizador,senha,morada,nif,telefone,competencias], function(err) {
        res.header(200);
        if (err) {
            res.end('nok');
          return console.log(err.message);
        }
        // get the last insert id
        session = req.session;
        session.uniqueID = email;
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

app.post('/criar_obra', (req,res,next) =>{
    session = req.session;
    const sql = `INSERT INTO obra (descricao,carpintaria,canalizador,eletricista,construcao_civil,proprietario,data_limite) VALUES (?,?,?,?,?,?,?)`;
    const descricao = req.body.descricao;
    const carpintaria = req.body.carpintaria;
    const canalizador = req.body.canalizador;
    const eletricista = req.body.eletricista;
    const construcao_civil = req.body.construcao_civil;
    const data_limite = req.body.data_limite;

    db.run(sql, [descricao,carpintaria,canalizador,eletricista,construcao_civil,session.uniqueID,data_limite], function(err) {
        res.header(200);
        if (err) {
            res.end('nok');
          return console.log(err.message);
        }
        res.end('ok');
        
        console.log(`O ${session.uniqueID} criou uma nova obra!`);

      });
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000);
console.log('[HTTP] Iniciado na porta 3000'); 
