import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  try {
    const initialConn = await mysql.createConnection({
      host: '106.52.209.141',
      user: 'root',
      password: '14753abc....'
    });
    await initialConn.query('CREATE DATABASE IF NOT EXISTS wms_db');
    await initialConn.end();
    
    const conn = await mysql.createConnection({
      host: '106.52.209.141',
      user: 'root',
      password: '14753abc....',
      database: 'wms_db',
      multipleStatements: true
    });
    
    const sql = fs.readFileSync('d:\\wms\\scripts\\init_db.sql', 'utf8');
    await conn.query(sql);
    await conn.end();
    
    console.log('数据库初始化成功！');
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
}

main();