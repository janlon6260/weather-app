const express = require('express');
const mysql = require('mysql2/promise');
const dbConfigs = require('../services/dbConfigs');
const router = express.Router();

router.post('/', async (req, res) => {
    const { station, type } = req.body;
    const dbConfig = dbConfigs[station];
    if (!dbConfig) {
        res.status(400).json({ error: `No database configuration found for station: ${station}` });
        return;
    }

    const typeFieldMap = {
        temperature: 'temperature',
        humidity: 'outdoor_humidity',
        barometer: 'barometer',
        rain: 'rain_rate',
        daily_rainfall: 'daily_rainfall',
        currwind: 'average_windspeed',
        gustwind: 'gust_windspeed'
    };

    const field = typeFieldMap[type];
    if (!field) {
        res.status(400).json({ error: `Invalid type requested: ${type}` });
        return;
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT CONCAT(date, ' ', time) AS timestamp, ${field} as value, date FROM wx_data WHERE CONCAT(date, ' ', time) >= NOW() - INTERVAL 1 DAY ORDER BY timestamp`
        );
        await connection.end();

        const convertedRows = rows.map(row => ({
            ...row,
            value: type === 'currwind' ? row.value * 0.277778 : row.value
        }));

        res.json({ station, type, data: convertedRows });
    } catch (error) {
        console.error(`Error querying data for ${station} and type ${type}: ${error.message}`);
        res.status(500).json({ error: `Error querying data for ${station} and type ${type}: ${error.message}` });
    }
});

module.exports = router;
