const axios = require('axios');
const { urls: weatherStations } = require('../weather-stations.js');
const dbConfigs = require('./dbConfigs');
const mysql = require('mysql2/promise');

const CHECK_INTERVAL_SECONDS = 120;
const STALE_THRESHOLD_SECONDS = 300;

function getStationStatus(dateStr) {
    if (!dateStr) return 'red';

    const now = new Date();
    const [hours, minutes] = dateStr.split(':').map(Number);
    const lastUpdate = new Date();
    lastUpdate.setHours(hours, minutes, 0, 0);

    const diffSeconds = (now - lastUpdate) / 1000;

    if (diffSeconds <= CHECK_INTERVAL_SECONDS) {
        return 'green';
    } else if (diffSeconds <= STALE_THRESHOLD_SECONDS) {
        return 'orange';
    } else {
        return 'red';
    }
}

const isDataValid = (data) => {
    return data && Object.values(data).every(value => value !== null && value !== '' && value !== undefined);
};

async function fetchWeatherData(data, io) {
    for (const [name, url] of Object.entries(weatherStations)) {
        try {
            const response = await axios.get(url);
            const newData = response.data;

            if (!data[name]?.lastInvalidTime) {
                data[name] = { ...data[name], lastInvalidTime: null };
            }

            const isInvalidData = !newData.date || Object.values(newData).some(value => value === null || value === '');

            if (isInvalidData) {
                if (!data[name].lastInvalidTime) {
                    data[name].lastInvalidTime = new Date();
                }
                
                const diffSeconds = (new Date() - new Date(data[name].lastInvalidTime)) / 1000;

                if (diffSeconds > STALE_THRESHOLD_SECONDS) {
                    newData.status = 'red'; 
                } else if (diffSeconds > CHECK_INTERVAL_SECONDS) {
                    newData.status = 'orange'; 
                } else {
                    newData.status = 'green';
                }

            } else {
                data[name].lastInvalidTime = null;
                newData.status = getStationStatus(newData.date);
            }

            newData.date = newData.date || new Date().toLocaleTimeString().slice(0, 5);

            if (!data[name]) {
                data[name] = newData;
                io.sockets.emit('file-content', { [name]: newData });
            } else {
                const changedValues = {};
                for (const key in newData) {
                    if (newData[key] !== data[name][key]) {
                        changedValues[key] = newData[key];
                    }
                }

                if (Object.keys(changedValues).length > 0) {
                    data[name] = newData;
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
