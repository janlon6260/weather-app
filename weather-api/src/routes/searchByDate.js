const express = require('express');
const mysql = require('mysql2/promise');
const dbConfigs = require('../services/dbConfigs');
const router = express.Router();

router.post('/', async (req, res) => {
    const { station, date } = req.body;
    const dbConfig = dbConfigs[station];
    if (!dbConfig) {
        res.status(400).json({ error: `No database configuration found for station: ${station}` });
        return;
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`SELECT * FROM wx_data WHERE DATE(date) = ?`, [date]);
        const [maxGustRow] = await connection.execute(
            `SELECT max_gust_current_day FROM wx_data WHERE DATE(date) = ? AND HOUR(time) = 23 ORDER BY time DESC LIMIT 1`,
            [date]
        );
        const [dailyRainfallRow] = await connection.execute(
            `SELECT daily_rainfall FROM wx_data WHERE DATE(date) = ? AND HOUR(time) = 23 ORDER BY time DESC LIMIT 1`,
            [date]
        );
        await connection.end();

        const maxGust = maxGustRow.length > 0 ? maxGustRow[0].max_gust_current_day : 0;
        const dailyRainfall = dailyRainfallRow.length > 0 ? dailyRainfallRow[0].daily_rainfall : 0;

        res.json({
            station,
            data: rows,
            maxGust: (maxGust * 0.277778).toFixed(1),
            dailyRainfall: dailyRainfall.toFixed(1)
        });
    } catch (error) {
        console.error(`Error querying data for ${station}: ${error.message}`);
        res.status(500).json({ error: 'Error querying data' });
    }
});

module.exports = router;
