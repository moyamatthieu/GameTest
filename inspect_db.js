import Database from 'better-sqlite3';
const db = new Database('server/game_debug_123.sqlite');

console.log('--- Players ---');
console.log(db.prepare('SELECT * FROM players').all());

console.log('--- Entities ---');
console.log(db.prepare('SELECT * FROM entities').all());

console.log('--- Foreign Key Check ---');
console.log(db.prepare('PRAGMA foreign_key_check').all());

db.close();
