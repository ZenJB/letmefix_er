import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import expressSession from 'express-session';
import fs from 'fs';
import passport from 'passport';
import facebookPassport from 'passport-facebook';

const FacebookStrategy = facebookPassport.Strategy;

const db = new sqlite3.Database('./db.db');
var app = express();

passport.use(new FacebookStrategy({
    clientID: '',
    clientSecret: '',
    callbackURL: "https://letmefix.tk/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name'] //This
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));
  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });
  
  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });


console.clear();
console.log("================");
console.log("=== LetMeFix ===");
console.log("================\n");
// Definições do Servidor
app.use(express.urlencoded());
app.use(expressSession({secret: 'letmefix_er', saveUninitialized: false, resave: false}));
app.use(passport.initialize());
app.use(passport.session());
app.disable('x-powered-by');
//Sessão do utilizador
var session;

app.get('/auth/facebook',
  passport.authenticate('facebook', { scope : ['email'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    const email = req.user.emails[0].value;
    const nome = req.user.name.givenName+' '+req.user.name.familyName;
    console.log('Recebido dados do facebook do cliente: Nome: '+nome+' Email: '+email);

    const sql = `SELECT * FROM utilizadores WHERE email=?`;
    db.get(sql,[email], (err,row) =>{
        res.header(200);
        if(!err && row)
        {
        if(row.tipoDeUtilizador === "Admin"){
            session = req.session;
            session.uniqueID = email;
            /* Inicio */
            fs.readFile(__dirname+'/public/listar_obras.html', function read(err, data) {
                if (err) {
                    res.redirect('/');
                    console.log("[ERRO listar_obras.html] "+err);
                }else{
                    const sql = `SELECT * FROM obra`;
                    
                    db.all(sql,[], (err,rows) =>{
                        res.header(200);
                        if(err){
                            res.header(200).end('Erro!');
                            console.log("[main.html] "+err.toString());
                        }
                        var lista_servicos = '';
                        if(!rows)
                            res.header(200).end(data.toString().replace('<%= numero_servicos %>',''));
                        else{
                            db.serialize(function() {
                            rows.forEach((row) => {
                                lista_servicos += '<tr><td class="indice">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td></tr>';
                            });
                            if(lista_servicos === '')
                                res.header(200).end(data.toString().replace('<%= lista_servicos %>',''));
                            else
                                res.header(200).end(data.toString().replace('<%= lista_servicos %>',lista_servicos).replace('<div class="navBar">','<p class="titulo botao_clicavel" onclick="logout();">Terminar Sessão</p><div class="navBar" style="display: none;">').replace('<th>Custo Total da Obra</th>',''));
                        });
                        }
                        
                    
                    })  
                }  
            });
            /* Fim*/
        }else
        res.redirect('/');
        }else{
            fs.readFile(__dirname+'/public/registar.html', function read(err, data) {
                if (err) {
                    res.redirect('/registar.html');
                    console.log("[ERRO registar.html] "+err);
                }
                var ficheiro = data.toString();
                ficheiro = ficheiro.replace('id="email"','id="email" value="'+email+'"');
                ficheiro = ficheiro.replace('id="nome_completo"','id="nome_completo" value="'+nome+'"');
                ficheiro = ficheiro.replace('<br><a class="login_btn" href="/auth/facebook">Registar usando o Facebook</a>','');
                res.header(200).end(ficheiro);
            });
        }
    })
    //A partir daqui proceguir com registo e login
  });

app.get('/login', (req,res) => {
    res.redirect('/');
});

app.get('/', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        res.redirect('/main.html');
    }else
    fs.readFile(__dirname+'/public/index.html', function read(err, data) {
        if (err) {
            res.redirect('/');
            console.log("[ERRO criar_obra.html] "+err);
        }
        res.header(200).end(data.toString());
    });
});

app.get('/index.html', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        res.redirect('/main.html');
    }else
    fs.readFile(__dirname+'/public/index.html', function read(err, data) {
        if (err) {
            res.redirect('/');
            console.log("[ERRO criar_obra.html] "+err);
        }
        res.header(200).end(data.toString());
    });
});

app.get('/concorrer_servico_trabalho.html', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        const sql_user = `SELECT * FROM utilizadores WHERE email=?`;
        db.get(sql_user,[session.uniqueID], (err,row) =>{
            if(row.tipoDeUtilizador == "Profissional"){
                var ficheiro = fs.readFileSync(__dirname+'/public/concorrer_servico_trabalho.html', 'utf8').toString();
                var sql = ``;
                const user_competencia = row.competencias;
                switch(user_competencia){
                    case "Carpintaria":
                    sql = `SELECT * FROM obra WHERE carpintaria IS NOT 0`;
                    break;
                    case "Canalizador":
                    sql = `SELECT * FROM obra WHERE canalizador IS NOT 0`;
                    break;
                    case "Eletricista":
                    sql = `SELECT * FROM obra WHERE eletricista IS NOT 0`;
                    break;
                    case "Construção Civil":
                    sql = `SELECT * FROM obra WHERE construcao_civil IS NOT 0`;
                    break;
                    default:
                    sql = `SELECT * FROM obra`;
                    break;
                }
                db.all(sql,[], (err,rows) =>{
                    res.header(200);
                    if(err){
                        res.header(200).end('Erro!');
                        console.log("[main.html] "+err.toString());
                    }
                    var lista_servicos = '';
                    if(!rows)
                        res.header(200).end(ficheiro.replace('<%= lista_servicos %>',''));
                    else{
                        rows.forEach((row) => {
                            switch(user_competencia){
                                case "Carpintaria":
                                lista_servicos += '<tr><td class="indice" onclick="mostrarMenuEnviarPedido('+row.id+')">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td><td>'+row.descricao_carpintaria+'</td></tr>';
                                break;
                                case "Canalizador":
                                lista_servicos += '<tr><td class="indice" onclick="mostrarMenuEnviarPedido('+row.id+')">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td><td>'+row.descricao_canalizador+'</td></tr>';
                                break;
                                case "Eletricista":
                                lista_servicos += '<tr><td class="indice" onclick="mostrarMenuEnviarPedido('+row.id+')">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td><td>'+row.descricao_eletricista+'</td></tr>';
                                break;
                                case "Construção Civil":
                                lista_servicos += '<tr><td class="indice" onclick="mostrarMenuEnviarPedido('+row.id+')">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td><td>'+row.descricao_construcao_civil+'</td></tr>';
                                break;
                                default:
                                lista_servicos += '<tr><td class="indice" onclick="mostrarMenuEnviarPedido('+row.id+')">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td><td></td></tr>';
                                break;
                            }
                            
                        });
                        if(lista_servicos == 0)
                            res.header(200).end(ficheiro.replace('<%= lista_servicos %>','').replace('<%= tipo_trabalho %>',user_competencia));
                        else
                            res.header(200).end(ficheiro.replace('<%= lista_servicos %>',lista_servicos).replace('<%= tipo_trabalho %>',user_competencia));
                    }
                });
            }else{    
                res.redirect('/');
            }
        });
    }else
    res.redirect('/');
});

app.get('/main.html', (req,res) => {
    session = req.session;
    res.header(200);
    if(session.uniqueID){
        console.log("Email: "+session.uniqueID);
        const sql_user = `SELECT * FROM utilizadores WHERE email=?`;
        db.get(sql_user,[session.uniqueID], (err,row) =>{
            if(row.tipoDeUtilizador == "Profissional"){
                var ficheiro = fs.readFileSync(__dirname+'/public/main_prof.html', 'utf8').toString();
                var sql = `SELECT obra.id, obra.data_limite, obra.descricao FROM obra INNER JOIN profissionais_nas_obras ON profissionais_nas_obras.obra = obra.id AND profissionais_nas_obras.aceite=1 AND profissionais_nas_obras.profissional =?`;
                db.all(sql,[session.uniqueID], (err,rows) =>{
                    res.header(200);
                    if(err){
                        res.header(200).end('Erro!');
                        console.log("[main.html] "+err.toString());
                    }
                    var lista_servicos = '';
                    if(!rows)
                        res.header(200).end(ficheiro.replace('<%= lista_servicos %>',''));
                    else{
                        rows.forEach((row) => {
                            
                                lista_servicos += '<tr><td class="indice">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td></tr>';
                                
                                   
                        });
                        if(lista_servicos == 0)
                            res.header(200).end(ficheiro.replace('<%= lista_servicos %>',''));
                        else
                            res.header(200).end(ficheiro.replace('<%= lista_servicos %>',lista_servicos));
                    }
                });
            }else{
                const ficheiro = fs.readFileSync(__dirname+'/public/main.html', 'utf8').toString();
                const sql = `SELECT * FROM obra WHERE proprietario=?`;
                db.all(sql,[session.uniqueID], (err,rows) =>{
                    if(err){
                        res.header(200).end('Erro!');
                        console.log("[main.html] "+err.toString());
                        return;
                    }
                    var numero_servicos = 0;
                    var dados_a_enviar = ficheiro.toString();
                    if(!rows)
                        dados_a_enviar = dados_a_enviar.replace('<%= numero_servicos %>','Sem qualquer serviço a decorrer');
                    else{
                        rows.forEach((row) => {
                            numero_servicos++;
                        });
                        if(numero_servicos == 0)
                            dados_a_enviar = dados_a_enviar.replace('<%= numero_servicos %>','Sem qualquer serviço a decorrer');
                        else
                            dados_a_enviar = dados_a_enviar.replace('<%= numero_servicos %>',`A decorrer ${numero_servicos} serviço(s)!`);
                        const sql2 = `SELECT profissionais_nas_obras.custo AS custo, profissionais_nas_obras.aceite AS aceite,profissionais_nas_obras.obra AS obra,profissionais_nas_obras.proposta_do_profissional AS proposta_do_profissional,profissionais_nas_obras.profissional AS profissional FROM profissionais_nas_obras INNER JOIN obra ON obra.id = profissionais_nas_obras.obra AND obra.proprietario = ?`;
                        db.all(sql2,[session.uniqueID], (err,rows) =>{
                            if(err){
                                dados_a_enviar = dados_a_enviar.replace('<%= lista_servicos_por_aceitar %>','');
                                console.log(err.toString());
                            }else{
                                var pedidos_de_servico = '';
                                rows.forEach((row) => {
                                    var id_da_obra = row.obra;
                                    console.log("ID: "+id_da_obra+ "Custo: "+row.custo);
                                    
                                    pedidos_de_servico += '<tr><td>'+row.obra+'</td><td>'+row.proposta_do_profissional+'</td><td>'+row.profissional+'</td><td>'+row.custo+'</td>';
                                    if(row.aceite == 1)
                                    pedidos_de_servico += '<td>Aceite!</td></tr>';
                                    else
                                    if(row.aceite == 0)
                                    pedidos_de_servico += '<td>Rejeitado!</td></tr>';
                                    else
                                    pedidos_de_servico += '<td><a class="botao_clicavel" onclick="pedidos(true,'+row.obra+',\''+row.profissional+'\');">[ACEITAR]</a> <a class="botao_clicavel" onclick="pedidos(false,'+row.obra+',\''+row.profissional+'\');">[REJEITAR]</a></td></tr>';
                                });
                                dados_a_enviar = dados_a_enviar.replace('<%= lista_servicos_por_aceitar %>',pedidos_de_servico);
                            }
                            res.header(200).end(dados_a_enviar);
                        });
                    }
                });    
            }
        });
    }else
    res.redirect('/');
});

app.get('/listar_obras.html', (req,res) => {
    session = req.session;
    const email = session.uniqueID;
    const sql = `SELECT * FROM utilizadores WHERE email=?`;
    if(email){
        db.get(sql,[email], (err,row) =>{
            if(row.tipoDeUtilizador == "Profissional")
                res.redirect('/');
            else{

                fs.readFile(__dirname+'/public/listar_obras.html', function read(err, data) {
                    if (err) {
                        res.redirect('/');
                        console.log("[ERRO listar_obras.html] "+err);
                    }else{
                        const sql = `SELECT * FROM obra WHERE proprietario=?`;
                        db.all(sql,[session.uniqueID], (err,rows) =>{
                            res.header(200);
                            if(err){
                                res.header(200).end('Erro!');
                                console.log("[main.html] "+err.toString());
                            }
                            var lista_servicos = '';
                            if(!rows)
                                res.header(200).end(data.toString().replace('<%= numero_servicos %>',''));
                            else{
                                rows.forEach((row) => {
                                    lista_servicos += '<tr><td class="indice">'+row.id+'</td><td>'+row.data_limite+'</td><td>'+row.descricao+'</td></tr>';
                                });
                                if(lista_servicos === '')
                                    res.header(200).end(data.toString().replace('<%= lista_servicos %>',''));
                                else
                                    res.header(200).end(data.toString().replace('<%= lista_servicos %>',lista_servicos));
                            }
                            
                        
                        })  
                    }  
                });
            }
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
    const sql = `INSERT INTO utilizadores (email,nome_completo,tipoDeUtilizador,password,morada,nif,telefone,competencias,ramo_do_cliente_comercial) VALUES (?,?,?,?,?,?,?,?,?)`;
    const nome_completo = req.body.nome_completo;
    const email = req.body.email;
    const tipoDeUtilizador = req.body.tipoDeUtilizador;
    const senha = req.body.password;
    const morada = req.body.morada;
    const nif = req.body.nif;
    const telefone = req.body.telefone;
    const competencias = req.body.competencias;
    const ramo_do_cliente_comercial = req.body.ramo_do_cliente_comercial;
    console.log("Registado utilizador com competencia "+competencias);
    db.run(sql, [email,nome_completo,tipoDeUtilizador,senha,morada,nif,telefone,competencias,ramo_do_cliente_comercial], function(err) {
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
    const sql = `INSERT INTO obra (descricao,carpintaria,canalizador,eletricista,construcao_civil,proprietario,data_limite,descricao_carpintaria,descricao_canalizador,descricao_eletricista,descricao_construcao_civil) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    const descricao = req.body.descricao;
    const carpintaria = req.body.carpintaria;
    const canalizador = req.body.canalizador;
    const eletricista = req.body.eletricista;
    const construcao_civil = req.body.construcao_civil;
    const data_limite = req.body.data_limite;
    const descricao_carpintaria = req.body.descricao_carpintaria;
    const descricao_canalizador = req.body.descricao_canalizador;
    const descricao_eletricista = req.body.descricao_eletricista;
    const descricao_construcao_civil = req.body.descricao_construcao_civil;

    db.run(sql, [descricao,carpintaria,canalizador,eletricista,construcao_civil,session.uniqueID,data_limite,descricao_carpintaria,descricao_canalizador,descricao_eletricista,descricao_construcao_civil], function(err) {
        res.header(200);
        if (err) {
            res.end('nok');
          return console.log(err.message);
        }
        res.end('ok');
        
        console.log(`O ${session.uniqueID} criou uma nova obra!`);

      });
});

app.post('/criar_proposta_trabalho', (req,res,next) =>{
    session = req.session;
    const sql = `INSERT INTO profissionais_nas_obras (obra,profissional,proposta_do_profissional,custo) VALUES (?,?,?,?)`;
    const obra = req.body.id_obra;
    const profissional = session.uniqueID;
    const proposta_do_profissional = req.body.descricao;
    const custo = req.body.custo;

    db.run(sql, [obra,profissional,proposta_do_profissional,custo], function(err) {
        res.header(200);
        if (err) {
            res.end('nok');
          return console.log(err.message);
        }
        res.end('ok');
        
        console.log(`O ${session.uniqueID} criou uma nova porposta para uma obra!`);

      });
});

app.post('/aceitar_proposta_trabalho', (req,res,next) =>{
    console.log("PEDIDO DE RESPOSTA A PROPOSTA!");
    session = req.session;
    const sql = `UPDATE profissionais_nas_obras SET aceite = ? WHERE obra=? AND profissional=?`;
    const obra = req.body.id;
    const profissional = req.body.profissional;
    var aceitar;
    if(req.body.aceitar === 'true')
    aceitar = 1;
    if(req.body.aceitar === 'false')
    aceitar = 0;
    console.log("Obra: "+obra+" Prof: "+profissional+" Aceite: "+aceitar);

    db.run(sql, [aceitar,obra,profissional], function(err) {
        res.header(200);
        if (err) {
            res.end('nok');
          return console.log(err.message);
        }
        res.end('ok');
        
        console.log(`O ${session.uniqueID} respondeu a um pedido!`);

      });
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000);
console.log('[HTTP] Iniciado na porta 3000'); 
