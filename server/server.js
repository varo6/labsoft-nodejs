'use strict';

// Cargamos el modulo de Express
const express = require('express');

// Cargamos el modulo de JSON Web Token (JWT) para la autenticación
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'clave-secreta-labsoft';

// Crearmos un objeto servidor HTTP
const server = express();

// definimos el puerto a usar por el servidor HTTP
const port = 8080;

// Cargamos el modulo para la gestion de sesiones
const session = require('express-session');

// Creamos el objeto con la configuración
const sesscfg = {
    secret: 'practicas-lsi-2023',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 8*60*60*1000 } // 8 working hours
};

// Se le dice al servidor que use el modulo de sesiones con esa configuracion
server.use(session(sesscfg));

// Obtener la referencia al módulo 'body-parser'
const bodyParser = require('body-parser');

// Configuring express to use body-parser as middle-ware.
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

// Obtener el configurador de rutas
const router = express.Router();

// Cargar el módulo 'path' para manejar rutas de ficheros
const path = require('path');

// cargar el módulo para bases de datos SQLite
var sqlite3 = require('sqlite3').verbose();

// Abrir nuestra base de datos
var db = new sqlite3.Database(
    'emails.db',    // nombre del fichero de base de datos
    (err) => { 
        if (err)      
            console.log(err);  
    }
);

function processLogin(req, res, db) {
    var login = req.body.user;
    var passwd = req.body.passwd;

    db.get(
        // consulta y parámetros cuyo valor será usado en los '?'
        'SELECT * FROM users WHERE login=?', login,
        // funcion que se invocará con los datos obtenidos de la base de datos
        (err, row) => {
            if (row == undefined) {
                // La consulta no devuelve ningun dato -: no existe el usuario
                res.json({ errormsg: 'El usuario no existe'});
            } else if (row.passwd === passwd) {
                // La contraseña es correcta
                // Asociar el userID a los datos de la sesión
                req.session.userID = row.id; // solo el id del usuario registrado

                // Generar un token JWT con los datos del usuario
                const token = jwt.sign({ id: row.id, login: row.login }, JWT_SECRET, { expiresIn: '8h' });

                // Preparar los datos a enviar al navegador (AngularJS)
                var data = {
                    id: row.id,
                    login: row.login,
                    name: row.name,
                    email: row.email,
                    token: token,
                    isAdmin: row.login === 'admin' // Comprobar si es el usuario admin
                };

                // enviar en la respuesta serializado en formato JSON
                res.json(data);
            } else {
                // La contraseña no es correcta, -: enviar este otro mensaje
                res.json({ errormsg: 'Fallo de autenticación'});
            }
        }
    );
}

function verificarUsuario(req) {
    return req.session.userID != undefined;
}

function processListar(req, res, db) {
    // recuperar el id del usuario de los datos asociados a la sesión
    var userId = req.session.userID;
    db.all(
        // consulta y parámetros cuyo valor será usado en los '?'
        'SELECT id, subject, sender, date FROM emails WHERE user=?', userId,
        // funcion que se invocará con los datos obtenidos de la base de datos
        (err, rows) => {
            // enviar en la respuesta serializado en formato JSON
            res.json(rows);
        }
    );
}

function verificarEmail(req, db, validated) {
    // Comprobar que hay un usuario registrado
    if (!verificarUsuario(req)) {
        validated(false);;
    } else {
        // Comprobar si el email solicitado pertenece
        // al usuario que se ha identificado
        var userId = req.session.userID;
        var emailId = req.params.id;

        db.get(
            // Consulta para comprobar la pertenencia del email al usuario
            'SELECT * FROM emails WHERE user=? AND id=?', [userId, emailId],
            (err, row) => {
                // Se asume que si exite es que es valido
                validated(row != undefined);
            }
        );
    }
}

function processEmail(req, res, db) {
    // El identificador del email está entre los parametros de la petición
    var id = req.params.id;
    var sql = 'SELECT * FROM emails as E, contents as C WHERE E.id == C.id AND E.id=?';


    db.get(
        // consulta y parámetros cuyo valor será usado en los '?'
        sql, id,
        (err, row) => {
            if (row == undefined) {
                res.json({ errormsg: 'Error en la base de datos'});
            } else {
                // enviar en la respuesta serializado en formato JSON
                res.json(row);
            }
        }
    );
}

// Configurar la acción asociada al logout de un usuario
function logout(req, res) {
    // Eliminar el usuario de la sesión
    req.session.userID = undefined;

    // Enviar una respuesta al navegador
    res.json({ msg: 'Usuario eliminado de la sesión'});
}

function isAdmin(req){
    return req.session.userID === 1; // El usuario admin tiene id=1
}

// Ahora la acción asociada al login sería:
router.post('/login', (req, res) => {
    // Comprobar si la petición contiene los campos ('user' y 'passwd')
    if (!req.body.user || !req.body.passwd) {
        res.json({ errormsg: 'Peticion mal formada'});
    } else {
        // La petición está bien formada -> procesarla
        processLogin(req, res, db); // Se la pasa tambien la base de datos
    }
});

// Configurar la acción asociada al logout de un usuario
router.put('/logout', (req, res) => {
    // Comprobar si hay un usuario registrado
    if (verificarUsuario(req)) {
        logout(req, res); // Procesar el logout
    } else {
        res.json({ errormsg: 'Peticion mal formada'});
    }
});

// Configurar la accion asociada al listado de correos
router.get('/list', (req, res) => {
    if (verificarUsuario(req)) {
        processListar(req, res, db);
    } else {
        res.json({ errormsg: 'Peticion mal formada'});
    }
});

// Configurar la accion asociada a la petición del contenido de un correo
router.get('/email/:id', (req, res) => {
    verificarEmail(req, db, (valid) => {
        if (valid) {
            processEmail(req, res, db);
        } else {
            res.json({ errormsg: 'Peticion mal formada'});
        }
    });
});

// Configurar la acción asociada a la petición de listado de usuarios
// Solo el usuario admin puede acceder a esta ruta
        
function isAdmin(req) {
    return req.session.userID === 1; // Suponiendo que el admin tiene id=1
}

router.get('/admin/users', (req, res) => {
    if (isAdmin(req)) {
        db.all('SELECT id, login, name, email FROM users WHERE login != "admin"', (err, rows) => {
            if (err) {
                res.status(500).json({ errormsg: 'Error en la base de datos' });
            } else {
                res.json(rows);
            }
        });
    } else {
        res.status(403).json({ errormsg: 'No autorizado' });
    }
});

// Añadir las rutas al servidor
server.use('/', router);

// Servir los ficheros estáticos de la carpeta 'frontend'
server.use(express.static(path.join(__dirname, '../frontend')));

// Servir los ficheros estáticos de la carpeta 'node_modules'
server.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// Poner en marcha el servidor ...
server.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
