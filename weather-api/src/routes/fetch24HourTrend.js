const express = require('express');
const mysql = require('mysql2/promise');
const dbConfigs = require('../services/dbConfigs');
const router = express.Router();

router.post('/', async (req, res) => {
    const { station, type, filter } = req.body;
    const trendLast24h = filter?.trendLast24h === true;
    const trend24hLastYear = filter?.trend24hLastYear === true;
    
    if (!trendLast24h && !trend24hLastYear) {
        res.status(400).json({ error: 'Please specify at least one filter: trendLast24h or trend24hLastYear' });
        return;
    }
    
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
        const queries = [];

        if (trendLast24h) {
            queries.push(
                connection.execute(
                    `SELECT CONCAT(date, ' ', time) AS timestamp, ${field} as value, date 
                     FROM wx_data 
                     WHERE CONCAT(date, ' ', time) >= NOW() - INTERVAL 1 DAY 
                     ORDER BY timestamp`
                )
            );
        }

        if (trend24hLastYear) {
            const currentEndTime = new Date();
            const currentStartTime = new Date(currentEndTime.getTime() - 24 * 60 * 60 * 1000);

            const endTime = new Date(currentEndTime);
            endTime.setFullYear(endTime.getFullYear() - 1); 

            const startTime = new Date(currentStartTime);
            startTime.setFullYear(startTime.getFullYear() - 1); 

            const endTimeStr = endTime.toISOString().slice(0, 19).replace('T', ' ');
            const startTimeStr = startTime.toISOString().slice(0, 19).replace('T', ' ');

            queries.push(
                connection.execute(
                    `SELECT CONCAT(date, ' ', time) AS timestamp, ${field} as value, date
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?
                     ORDER BY timestamp`,
                    [startTimeStr, endTimeStr]
                )
            );
        }

        const results = await Promise.all(queries);
        await connection.end();

        const response = {};

        if (trendLast24h) {
            response.trendLast24h = results[0][0].map(row => ({
                ...row,
                value: (type === 'currwind' || type === 'gustwind') ? row.value * 0.277778 : row.value
            }));
        }

        if (trend24hLastYear) {
            const lastYearData = trendLast24h ? results[1][0] : results[0][0];
            response.trend24hLastYear = lastYearData.map(row => ({
                ...row,
                value: (type === 'currwind' || type === 'gustwind') ? row.value * 0.277778 : row.value
            }));
        }

        res.json({ station, type, data: response });
    } catch (error) {
        console.error(`Error querying data for ${station} and type ${type}: ${error.message}`);
        res.status(500).json({ error: `Error querying data for ${station} and type ${type}: ${error.message}` });
    }
});

module.exports = router;
