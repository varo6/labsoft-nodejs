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
    'labsoft25.db',    // nombre del fichero de base de datos
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
                    //email: row.email,
                    token: token, // ← APARTADO 1: El token se envía al cliente
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

// **APARTADO 2**: Función para verificar token JWT
function verificarToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
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

// **APARTADO 2**: Endpoint para obtener videos y categorías con autenticación por token
router.get('/videos', (req, res) => {
    const userData = verificarToken(req);
    if (!userData) {
        return res.status(401).json({ errormsg: 'Token inválido o no proporcionado' });
    }

    // Obtener todas las categorías con sus videos
    db.all(`
        SELECT 
            c.id as categoria_id, 
            c.nombre as categoria_nombre,
            v.id as video_id,
            v.titulo as video_titulo,
            v.enlace as video_enlace
        FROM categorias c
        LEFT JOIN videos v ON c.id = v.categoria_id
        ORDER BY c.nombre, v.titulo
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ errormsg: 'Error en la base de datos' });
        }

    // Agrupar los resultados por categoría
        const categorias = {};
        rows.forEach(row => {
            if (!categorias[row.categoria_id]) {
                categorias[row.categoria_id] = {
                    id: row.categoria_id,
                    nombre: row.categoria_nombre,
                    videos: []
                };
            }
            
            if (row.video_id) {
                categorias[row.categoria_id].videos.push({
                    id: row.video_id,
                    titulo: row.video_titulo,
                    enlace: row.video_enlace
                });
            }
        });

        // Convertir el objeto a array
        const resultado = Object.values(categorias);
        res.json(resultado);
    });

});

// Configurar la acción asociada a la petición de listado de usuarios
// Solo el usuario admin puede acceder a esta ruta
        
function isAdmin(req) {
    return req.session.userID === 1; // Suponiendo que el admin tiene id=1
}

router.get('/admin/users', (req, res) => {
    if (isAdmin(req)) {
        db.all('SELECT id, login, name FROM users WHERE login != "admin"', (err, rows) => {
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

// Configurar la acción asociada al registro de un usuario
router.post('/admin/users' , (req, res) => {
    if(isAdmin(req)){
        const { username, name, password } = req.body;
        if (!username || !name || !password) {
            res.status(400).json({ errormsg: 'Petición mal formada' });
            return;
        }
        db.run(
            'INSERT INTO users (login, name, passwd, token) VALUES (?, ?, ?, ?)',
            [username, name, password, ''],
            function(err) {
                if (err) {
                    res.status(500).json({ errormsg: 'Error al registrar el usuario' });
                } else {
                    res.json({ id: this.lastID, login: username, name: name });
                }
            }
        );
    } else {
        res.status(403).json({ errormsg: 'No autorizado' });
    }
});

// Configurar la acción asociada a la eliminación de un usuario
router.delete('/admin/users/:id', (req, res) => {
    if(isAdmin(req)){
        const userId = parseInt(req.params.id);
        if (!userId) {
            res.status(400).json({ errormsg: 'Petición mal formada' });
            return;
        }
        db.run(
            'DELETE FROM users WHERE id = ?',
            [userId],
            function(err) {
                if (err) {
                    res.status(500).json({ errormsg: 'Error al eliminar el usuario' });
                } else {
                    res.json({ msg: 'Usuario eliminado correctamente' });
                }
            }
        );
    } else {
        res.status(403).json({ errormsg: 'No autorizado' });
    }
});

// Configurar la acción asociada a la moficación de un usuario
router.put('/admin/users/:id', (req, res) => {
    if(isAdmin(req)){
        const userId = parseInt(req.params.id);
        const { username, name, password } = req.body;
        if (!userId || !username || !name || !password) {
            res.status(400).json({ errormsg: 'Petición mal formada' });
            return;
        }
        db.run(
            'UPDATE users SET login = ?, name = ?, passwd = ? WHERE id = ?',
            [username, name, password, userId],
            function(err) {
                if (err) {
                    res.status(500).json({ errormsg: 'Error al modificar el usuario' });
                } else {
                    res.json({ msg: 'Usuario modificado correctamente' });
                }
            }
        );
    } else {
        res.status(403).json({ errormsg: 'No autorizado' });
    }
});

// Listar categorías
router.get('/admin/categorias', (req, res) => {
    if (isAdmin(req)) {
        db.all('SELECT * FROM categorias', (err, rows) => {
            if (err) res.status(500).json({ errormsg: 'Error en la base de datos' });
            else res.json(rows);
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
});

// Crear categoría
router.post('/admin/categorias', (req, res) => {
    if (isAdmin(req)) {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ errormsg: 'Nombre requerido' });
        db.run('INSERT INTO categorias (nombre) VALUES (?)', [nombre], function(err) {
            if (err) res.status(500).json({ errormsg: 'Error al crear categoría' });
            else res.json({ id: this.lastID, nombre });
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
});

// Modificar categoría
router.put('/admin/categorias/:id', (req, res) => {
    if (isAdmin(req)) {
        const { nombre } = req.body;
        db.run('UPDATE categorias SET nombre=? WHERE id=?', [nombre, req.params.id], function(err) {
            if (err) res.status(500).json({ errormsg: 'Error al modificar categoría' });
            else res.json({ msg: 'Categoría modificada' });
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
});

// Eliminar categoría
router.delete('/admin/categorias/:id', (req, res) => {
    if (isAdmin(req)) {
        const categoriaId = req.params.id;
        // Primero elimina los vídeos de la categoría
        db.run('DELETE FROM videos WHERE categoria_id=?', [categoriaId], function(err) {
            if (err) {
                res.status(500).json({ errormsg: 'Error al eliminar vídeos de la categoría' });
            } else {
                // Luego elimina la categoría
                db.run('DELETE FROM categorias WHERE id=?', [categoriaId], function(err2) {
                    if (err2) res.status(500).json({ errormsg: 'Error al eliminar categoría' });
                    else res.json({ msg: 'Categoría y vídeos eliminados' });
                });
            }
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
});

// Listar vídeos de una categoría
router.get('/admin/categorias/:id/videos', (req, res) => {
    if (isAdmin(req)) {
        db.all('SELECT * FROM videos WHERE categoria_id=?', [req.params.id], (err, rows) => {
            if (err) res.status(500).json({ errormsg: 'Error en la base de datos' });
            else res.json(rows);
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
});

// Añadir vídeo a una categoría
router.post('/admin/categorias/:id/videos', (req, res) => {
    if (isAdmin(req)) {
        const { titulo, enlace } = req.body;
        db.run('INSERT INTO videos (categoria_id, titulo, enlace) VALUES (?, ?, ?)', [req.params.id, titulo, enlace], function(err) {
            if (err) res.status(500).json({ errormsg: 'Error al añadir vídeo' });
            else res.json({ id: this.lastID, titulo, enlace });
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
});

// Eliminar vídeo
router.delete('/admin/videos/:id', (req, res) => {
    if (isAdmin(req)) {
        db.run('DELETE FROM videos WHERE id=?', [req.params.id], function(err) {
            if (err) res.status(500).json({ errormsg: 'Error al eliminar vídeo' });
            else res.json({ msg: 'Vídeo eliminado' });
        });
    } else res.status(403).json({ errormsg: 'No autorizado' });
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