const express = require('express');
const mysql = require('mysql2/promise');
const dbConfigs = require('../services/dbConfigs');
const router = express.Router();

router.post('/', async (req, res) => {
    const { station, filter } = req.body;
    const { last24hours, last30days, last365days } = filter || {};
    const dbConfig = dbConfigs[station];

    if (!dbConfig) {
        res.status(400).json({ error: `No database configuration found for station: ${station}` });
        return;
    }

    if (!last24hours && !last30days && !last365days) {
        res.status(400).json({ error: 'Please specify at least one filter: last24hours, last30days, or last365days' });
        return;
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const queries = [];
        const dataResponse = {};

        if (last24hours) {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
            const endTimeStr = endTime.toISOString().slice(0, 19).replace('T', ' ');
            const startTimeStr = startTime.toISOString().slice(0, 19).replace('T', ' ');

            queries.push(
                connection.execute(
                    `SELECT CONCAT(date, ' ', time) AS timestamp, 
                            ROUND(temperature, 1) AS temperature, 
                            ROUND(outdoor_humidity, 1) AS outdoor_humidity, 
                            ROUND(barometer, 1) AS barometer, 
                            ROUND(rain_rate, 1) AS rain_rate, 
                            ROUND(daily_rainfall, 1) AS daily_rainfall, 
                            ROUND(IF(average_windspeed * 0.277778 > 45, 0, average_windspeed * 0.277778), 1) AS average_windspeed, 
                            ROUND(IF(gust_windspeed * 0.277778 > 45, 0, gust_windspeed * 0.277778), 1) AS gust_windspeed, 
                            wind_direction
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?
                     ORDER BY timestamp`,
                    [startTimeStr, endTimeStr]
                ).then(([rows]) => {
                    dataResponse.last24hours = rows;
                })
            );

            queries.push(
                connection.execute(
                    `SELECT 
                        MAX(gust_windspeed) * 0.277778 AS max_gust,
                        MAX(average_windspeed) * 0.277778 AS max_average_windspeed,
                        MAX(rain_rate) AS max_rain_rate
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?`,
                    [startTimeStr, endTimeStr]
                ).then(([rows]) => {
                    const summary = rows[0];
                    dataResponse.last24hoursSummary = {
                        maxGust: summary.max_gust ? summary.max_gust.toFixed(1) : '0.0',
                        maxAverageWindspeed: summary.max_average_windspeed ? summary.max_average_windspeed.toFixed(1) : '0.0',
                        maxRainRate: summary.max_rain_rate ? summary.max_rain_rate.toFixed(1) : '0.0'
                    };
                })
            );

            queries.push(
                connection.execute(
                    `SELECT DATE(date) AS day, MAX(daily_rainfall) AS max_daily_rainfall
                     FROM wx_data
                     WHERE DATE(date) IN (?, ?)
                     GROUP BY day`,
                    [startTimeStr.split(' ')[0], endTimeStr.split(' ')[0]]
                ).then(([rows]) => {
                    const totalRainfall = rows.reduce((acc, row) => acc + (row.max_daily_rainfall || 0), 0);
                    dataResponse.last24hoursSummary.maxDailyRainfall = totalRainfall.toFixed(1);
                })
            );
        }

        if (last30days) {
            const endTime = new Date();
            const startTime = new Date();
            startTime.setDate(endTime.getDate() - 30);
            const endTimeStr = endTime.toISOString().slice(0, 19).replace('T', ' ');
            const startTimeStr = startTime.toISOString().slice(0, 19).replace('T', ' ');

            queries.push(
                connection.execute(
                    `SELECT DATE(date) AS day, 
                            ROUND(AVG(temperature), 1) AS temperature, 
                            ROUND(AVG(outdoor_humidity), 1) AS outdoor_humidity, 
                            ROUND(AVG(barometer), 1) AS barometer, 
                            ROUND(MAX(daily_rainfall), 1) AS daily_rainfall,
                            ROUND(IF(AVG(average_windspeed) * 0.277778 > 45, 0, AVG(average_windspeed) * 0.277778), 1) AS average_windspeed, 
                            ROUND(IF(MAX(gust_windspeed) * 0.277778 > 45, 0, MAX(gust_windspeed) * 0.277778), 1) AS gust_windspeed
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?
                     GROUP BY day
                     ORDER BY day`,
                    [startTimeStr, endTimeStr]
                ).then(([rows]) => {
                    dataResponse.last30days = rows;
                })
            );

            queries.push(
                connection.execute(
                    `SELECT 
                        MAX(gust_windspeed) * 0.277778 AS max_gust,
                        MAX(average_windspeed) * 0.277778 AS max_average_windspeed,
                        MAX(rain_rate) AS max_rain_rate
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?`,
                    [startTimeStr, endTimeStr]
                ).then(([rows]) => {
                    const summary = rows[0];
                    dataResponse.last30daysSummary = {
                        maxGust: summary.max_gust ? summary.max_gust.toFixed(1) : '0.0',
                        maxAverageWindspeed: summary.max_average_windspeed ? summary.max_average_windspeed.toFixed(1) : '0.0',
                        maxRainRate: summary.max_rain_rate ? summary.max_rain_rate.toFixed(1) : '0.0'
                    };
                })
            );

            queries.push(
                connection.execute(
                    `SELECT DATE(date) AS day, MAX(daily_rainfall) AS max_daily_rainfall
                     FROM wx_data
                     WHERE DATE(date) BETWEEN ? AND ?
                     GROUP BY day`,
                    [startTimeStr.split(' ')[0], endTimeStr.split(' ')[0]]
                ).then(([rows]) => {
                    const totalRainfall = rows.reduce((acc, row) => acc + (row.max_daily_rainfall || 0), 0);
                    dataResponse.last30daysSummary.maxDailyRainfall = totalRainfall.toFixed(1);
                })
            );
        }

        if (last365days) {
            const endTime = new Date();
            const startTime = new Date();
            startTime.setFullYear(endTime.getFullYear() - 1);
            const endTimeStr = endTime.toISOString().slice(0, 19).replace('T', ' ');
            const startTimeStr = startTime.toISOString().slice(0, 19).replace('T', ' ');

            queries.push(
                connection.execute(
                    `SELECT DATE(date) AS day, 
                            ROUND(AVG(temperature), 1) AS temperature, 
                            ROUND(AVG(outdoor_humidity), 1) AS outdoor_humidity, 
                            ROUND(AVG(barometer), 1) AS barometer, 
                            ROUND(MAX(daily_rainfall), 1) AS daily_rainfall,
                            ROUND(IF(AVG(average_windspeed) * 0.277778 > 45, 0, AVG(average_windspeed) * 0.277778), 1) AS average_windspeed, 
                            ROUND(IF(MAX(gust_windspeed) * 0.277778 > 45, 0, MAX(gust_windspeed) * 0.277778), 1) AS gust_windspeed
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?
                     GROUP BY day
                     ORDER BY day`,
                    [startTimeStr, endTimeStr]
                ).then(([rows]) => {
                    dataResponse.last365days = rows;
                })
            );

            queries.push(
                connection.execute(
                    `SELECT 
                        MAX(gust_windspeed) * 0.277778 AS max_gust,
                        MAX(average_windspeed) * 0.277778 AS max_average_windspeed,
                        MAX(rain_rate) AS max_rain_rate
                     FROM wx_data
                     WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?`,
                    [startTimeStr, endTimeStr]
                ).then(([rows]) => {
                    const summary = rows[0];
                    dataResponse.last365daysSummary = {
                        maxGust: summary.max_gust ? summary.max_gust.toFixed(1) : '0.0',
                        maxAverageWindspeed: summary.max_average_windspeed ? summary.max_average_windspeed.toFixed(1) : '0.0',
                        maxRainRate: summary.max_rain_rate ? summary.max_rain_rate.toFixed(1) : '0.0'
                    };
                })
            );

            queries.push(
                connection.execute(
                    `SELECT DATE(date) AS day, MAX(daily_rainfall) AS max_daily_rainfall
                     FROM wx_data
                     WHERE DATE(date) BETWEEN ? AND ?
                     GROUP BY day`,
                    [startTimeStr.split(' ')[0], endTimeStr.split(' ')[0]]
                ).then(([rows]) => {
                    const totalRainfall = rows.reduce((acc, row) => acc + (row.max_daily_rainfall || 0), 0);
                    dataResponse.last365daysSummary.maxDailyRainfall = totalRainfall.toFixed(1);
                })
            );
        }

        await Promise.all(queries);
        await connection.end();

        res.json({ station, data: dataResponse });
    } catch (error) {
        console.error(`Error querying data for ${station}: ${error.message}`);
        res.status(500).json({ error: `Error querying data for ${station}: ${error.message}` });
    }
});

module.exports = router;
