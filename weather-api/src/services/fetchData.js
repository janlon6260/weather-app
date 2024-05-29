const axios = require('axios');
const { urls: weatherStations } = require('../weather-stations.js');
const dbConfigs = require('./dbConfigs');
const mysql = require('mysql2/promise');

async function fetchWeatherData(data, io) {
    for (const [name, url] of Object.entries(weatherStations)) {
        try {
            const response = await axios.get(url);
            const newData = response.data;

            const enrichedData = {
                ...newData,
                date: newData.date || new Date().toLocaleTimeString().slice(11, 16)
            };

            if (!data[name]) {
                data[name] = enrichedData;
                io.sockets.emit('file-content', { [name]: enrichedData });
            } else {
                const changedValues = {};

                for (const key in enrichedData) {
                    if (enrichedData[key] !== data[name][key]) {
                        changedValues[key] = enrichedData[key];
                    }
                }

                if (Object.keys(changedValues).length > 0) {
                    data[name] = enrichedData;
                    io.sockets.emit('file-content', { [name]: changedValues });
                }
            }
        } catch (error) {
            console.error(`Error fetching data for ${name}: ${error.message}`);
        }
    }
}

function getSocketHandlers(socket, data) {
    socket.on('searchByDate', async ({ station, date }) => {
        const dbConfig = dbConfigs[station];
        if (!dbConfig) {
            socket.emit('trendData', { error: `No database configuration found for station: ${station}` });
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

            socket.emit('trendData', {
                station,
                data: rows,
                maxGust: (maxGust * 0.277778).toFixed(1),
                dailyRainfall: dailyRainfall.toFixed(1)
            });
        } catch (error) {
            console.error(`Error querying data for ${station}: ${error.message}`);
            socket.emit('trendData', { error: 'Error querying data' });
        }
    });

    socket.on('fetch24HourTrend', async ({ station, type }) => {
        const dbConfig = dbConfigs[station];
        if (!dbConfig) {
            socket.emit('trendData', { error: `No database configuration found for station: ${station}` });
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
            socket.emit('trendData', { error: `Invalid type requested: ${type}` });
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
                value: (type === 'currwind' || type === 'gustwind') ? row.value * 0.277778 : row.value
            }));

            socket.emit('trendData', { station, type, data: convertedRows });
        } catch (error) {
            console.error(`Error querying data for ${station} and type ${type}: ${error.message}`);
            socket.emit('trendData', { error: `Error querying data for ${station} and type ${type}: ${error.message}` });
        }
    });
}

module.exports = {
    fetchWeatherData,
    getSocketHandlers
};
