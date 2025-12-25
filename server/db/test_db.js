import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'test_schema.sqlite');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
const schemaPath = path.join(__dirname, 'schema_v2.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

try {
    db.exec(schema);
    console.log('Schema executed successfully!');
} catch (e) {
    console.error('Schema execution failed:', e);
} finally {
    db.close();
}
