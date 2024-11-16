const axios = require('axios');
const { urls: weatherStations } = require('../weather-stations.js');
const dbConfigs = require('./dbConfigs');
const mysql = require('mysql2/promise');

const CHECK_INTERVAL_SECONDS = 120;
const STALE_THRESHOLD_SECONDS = 300;

async function fetchWeatherData(data, io) {
    for (const [name, url] of Object.entries(weatherStations)) {
        try {
            const response = await axios.get(url);
            const newData = response.data;

            if (!data[name]) {
                data[name] = { ...newData, lastInvalidTime: null, lastValidTime: null, status: 'red' };
            }

            const isInvalidData = !newData.date || Object.entries(newData).some(([key, value]) => {
                if (typeof value === 'string') {
                    value = value.trim(); // Fjerner mellomrom rundt strengen
                }
                // Tomme strenger er tillatt
                if (value === '') {
                    return false;
                }
                // Sjekk for null eller ugyldige numeriske verdier
                return value === null || (typeof value === 'string' && value.trim() === '');
            });

            if (isInvalidData) {
                if (!data[name].lastInvalidTime) {
                    data[name].lastInvalidTime = new Date();
                }

                const diffSeconds = data[name].lastValidTime
                    ? (new Date() - data[name].lastValidTime) / 1000
                    : STALE_THRESHOLD_SECONDS + 1;

                if (diffSeconds <= 120) {
                    data[name].status = 'green';
                } else if (diffSeconds <= 300) {
                    data[name].status = 'orange';
                } else {
                    data[name].status = 'red';
                }

            } else {
                data[name].lastInvalidTime = null;

                for (const key in newData) {
                    data[name][key] = typeof newData[key] === 'string' ? newData[key].trim() : newData[key];
                }

                let lastValidTime = new Date();
                const [hours, minutes] = (newData.date || '').split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    lastValidTime.setHours(hours, minutes, 0, 0);
                    // Sørg for at lastValidTime ikke er i fremtiden
                    if (lastValidTime > new Date()) {
                        lastValidTime.setDate(lastValidTime.getDate() - 1);
                    }
                } else {
                    lastValidTime = new Date();
                }

                data[name].lastValidTime = lastValidTime;

                const diffSeconds = (new Date() - lastValidTime) / 1000;

                if (diffSeconds <= 120) {
                    data[name].status = 'green';
                } else if (diffSeconds <= 300) {
                    data[name].status = 'orange';
                } else {
                    data[name].status = 'red';
                }
            }

            io.sockets.emit('file-content', { [name]: data[name] });

        } catch (error) {
            console.error(`Error fetching data for ${name}: ${error.message}`);

            if (!data[name]) {
                data[name] = {
                    lastInvalidTime: new Date(),
                    lastValidTime: null,
                    status: 'red',
                    date: null
                };
            } else {
                if (!data[name].lastInvalidTime) {
                    data[name].lastInvalidTime = new Date();
                }

                const diffSeconds = data[name].lastValidTime
                    ? (new Date() - data[name].lastValidTime) / 1000
                    : STALE_THRESHOLD_SECONDS + 1;

                if (diffSeconds <= 120) {
                    data[name].status = 'green';
                } else if (diffSeconds <= 300) {
                    data[name].status = 'orange';
                } else {
                    data[name].status = 'red';
                }
            }

            io.sockets.emit('file-content', { [name]: data[name] });
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

            socket.emit('trendData', {
                station,
                data: rows,
                maxGust: (maxGust * 0.277778).toFixed(1),
                dailyRainfall: dailyRainfall.toFixed(1),
                maxAverageWindspeed: (maxAverageWindspeed * 0.277778).toFixed(1),
                maxRainRate: maxRainRate.toFixed(1)
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
