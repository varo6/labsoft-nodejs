//Archivo para inicializar la base de datos SQLite por si falla algo

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('labsoft25.db');
const sql = fs.readFileSync('labsoft25.sql', 'utf8');

db.exec(sql, (err) => {
    if (err) {
        console.error('Error creando la base de datos:', err.message);
    } else {
        console.log('Base de datos creada correctamente.');
    }
    db.close();
});