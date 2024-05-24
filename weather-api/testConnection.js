const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'web-sql1.intern.skodje.org', // Bruk 'localhost' hvis MariaDB kjører lokalt
    port: '3306',
    user: 'weatherdb-read',
    password: 'soacMADLLWkpLDRJr1a3',
    database: 'weatherstation1',
    connectTimeout: 30000 // Økt tilkoblingstid (10 sekunder)
};

async function testConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to the database successfully!');
        await connection.end();
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
    }
}

testConnection();
