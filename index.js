// @author: Carlos Eduardo Ortega Frias
// @date: 21/11/2021
const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const mysqldump = require('./mysqldump');
const mysql = require('mysql');
const cmd = require('./cmd');
var connection = null;

app.use(express.static('respaldos'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    secret:"mysqldumppractice",
    resave:false,
    saveUninitialized:true,
    cookie:{secure:true}
}));

app.set('views', 'views');
app.set('view engine', 'ejs');

app.get('/', (req, res)=>{
    res.render('index');
});

app.post('/', (req, res)=>{
    const {server, port, user, password} = req.body;
    connection = mysql.createConnection({
            host:server,
            user:user,
            password:password,
            port:port
    });
    res.render('index', {message:"Servidor configurado correctamente"});
});

app.get('/seleccionar_base', (req, res)=>{
    if(connection !== null){
        connection.query("show databases", (err, result, fields)=>{
            if(err) throw err;
            res.render('seleccionar_base', {bases:result});
        });
    }else{
        res.render('seleccionar_base', {bases:[]});
    }
});

app.post('/seleccionar_base', (req, res)=>{
    const {database} = req.body;
    mysqldump(['-u', 'root', database], (result)=>{
        let respaldo_path = path.join(__dirname, 'respaldos');
        if(!fs.existsSync(respaldo_path)) fs.mkdirSync(respaldo_path);
        fs.writeFileSync(path.join(respaldo_path, database+".sql"), result);
        res.render('respaldo_basedatos', {resultado:result, ruta:"/"+database+".sql"});
    });
});

app.get('/respaldar_bases', (req, res)=>{
    mysqldump(['-u', 'root', '--all-databases'], (result)=>{
        let respaldo_path = path.join(__dirname, 'respaldos');
        if(!fs.existsSync(respaldo_path)) fs.mkdirSync(respaldo_path);
        fs.writeFileSync(path.join(respaldo_path, "all_databases.sql"), result);
        res.render('respaldo_basedatos', {resultado:result, ruta:"/all_databases.sql"});
    });
});

app.get('/tablas/:database', (req, res)=>{
    if(connection!==null){
        connection.query("use "+req.params.database+";", (err, result)=>{
            connection.query("show tables;", (e, re)=>{
                res.json({tables:re});
            });
        });
    }
});

app.get('/seleccionar_tabla', (req, res)=>{
    if(connection !== null){
        connection.query("show databases", (err, result, fields)=>{
            if(err) throw err;
            res.render('seleccionar_tabla', {bases:result});
        });
    }else{
        res.render('seleccionar_tabla', {bases:[]});
    }
});

app.post('/seleccionar_tabla', (req, res)=>{
    const {database, table} = req.body;
    mysqldump(['-u', 'root', database, table], (result)=>{
        let respaldo_path = path.join(__dirname, 'respaldos');
        if(!fs.existsSync(respaldo_path)) fs.mkdirSync(respaldo_path);
        fs.writeFileSync(path.join(respaldo_path, "tb_"+table+".sql"), result);
        res.render('respaldo_basedatos', {resultado:result, ruta:"/tb_"+table+".sql"});
    });
});

app.get('/restaurar', (req, res)=>{
    const respaldos = fs.readdirSync(path.join(__dirname, 'respaldos'));
    var respaldo_path = [];
    respaldos.map((val)=>{
        respaldo_path.push(path.join(__dirname, 'respaldos', val));
    });
    res.render('restaurar', {respaldo_path, respaldos});
});

app.post('/restaurar', (req, res)=>{
    const respaldos = fs.readdirSync(path.join(__dirname, 'respaldos'));
    var respaldo_path = [];
    respaldos.map((val)=>{
        respaldo_path.push(path.join(__dirname, 'respaldos', val));
    });
    const {database, file, type} = req.body;
    if(database === "SIN_DATA"){
        cmd("-u root < \""+file+"\"", (result)=>{
            if(result.length===0){
                res.render('restaurar', {respaldo_path, respaldos, message: "Restaurado correctamente"});
            }      
        });
    }
    else
    {
        cmd("-u root "+database+" < \""+file+"\"", (result)=>{
            if(result.length===0){
                res.render('restaurar', {respaldo_path, respaldos, message: "Restaurado correctamente"});
            }      
        });
    }
});

app.get('/ayuda', (req, res)=>{
    mysqldump(["--help"], (consola)=>{
        let temp = consola.split('\n');
        res.render('ayuda', {ayuda:temp});
    });
});

app.listen(8000, ()=>{
    console.log("Server start");
});