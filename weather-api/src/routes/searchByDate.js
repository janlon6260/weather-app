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
        const [rows] = await connection.execute(
            `SELECT 
                *,
                wind_direction,
                max_average_windspeed_day,
                max_rain_rate_curent_day 
             FROM wx_data 
             WHERE DATE(date) = ?`, 
            [date]
        );

        const [maxGustRow] = await connection.execute(
            `SELECT MAX(max_gust_current_day) AS max_gust_current_day 
             FROM wx_data 
             WHERE DATE(date) = ?`,
            [date]
        );

        const [dailyRainfallRow] = await connection.execute(
            `SELECT MAX(daily_rainfall) AS daily_rainfall 
             FROM wx_data 
             WHERE DATE(date) = ?`,
            [date]
        );

        const [maxAverageWindspeedRow] = await connection.execute(
            `SELECT MAX(max_average_windspeed_day) AS max_average_windspeed_day 
             FROM wx_data 
             WHERE DATE(date) = ?`,
            [date]
        );

        const [maxRainRateRow] = await connection.execute(
            `SELECT MAX(max_rain_rate_curent_day) AS max_rain_rate_curent_day 
             FROM wx_data 
             WHERE DATE(date) = ?`,
            [date]
        );

        await connection.end();

        const maxGust = maxGustRow.length > 0 ? maxGustRow[0].max_gust_current_day : 0;
        const dailyRainfall = dailyRainfallRow.length > 0 ? dailyRainfallRow[0].daily_rainfall : 0;
        const maxAverageWindspeed = maxAverageWindspeedRow.length > 0 ? maxAverageWindspeedRow[0].max_average_windspeed_day : 0;
        const maxRainRate = maxRainRateRow.length > 0 ? maxRainRateRow[0].max_rain_rate_curent_day : 0;

        const convertedRows = rows.map(row => ({
            ...row,
            max_gust_current_day: (row.max_gust_current_day * 0.277778).toFixed(1),  // Convert to m/s
            max_average_windspeed_day: (row.max_average_windspeed_day * 0.277778).toFixed(1),  // Convert to m/s
            daily_rainfall: row.daily_rainfall.toFixed(1)
        }));

        res.json({
            station,
            data: convertedRows,
            maxGust: (maxGust * 0.277778).toFixed(1),  // Convert to m/s
            dailyRainfall: dailyRainfall.toFixed(1),
            maxAverageWindspeed: (maxAverageWindspeed * 0.277778).toFixed(1),  // Convert to m/s
            maxRainRate: maxRainRate.toFixed(1)
        });
    } catch (error) {
        console.error(`Error querying data for ${station}: ${error.message}`);
        res.status(500).json({ error: 'Error querying data' });
    }
});

module.exports = router;
