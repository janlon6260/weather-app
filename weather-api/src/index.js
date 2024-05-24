require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2/promise');

const { urls: weatherStations } = require('./weather-stations.js');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Serving you fresh weather data throughout the day. Enjoy!');
});

const data = {};

const dbConfigs = {
    Skodje: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME1
    },
    Håhjem: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME2
    },
    Longva: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME3
    }
};

async function fetchData() {
    for (const [name, url] of Object.entries(weatherStations)) {
        try {
            const response = await axios.get(url);
            const newData = response.data;

            // Ensure the date field is included
            const enrichedData = {
                ...newData,
                date: newData.date || new Date().toISOString().slice(11, 16) // Ensure date field is present and formatted as HH:MM
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

fetchData();

io.on('connection', (socket) => {
    socket.emit('file-content', data);

    socket.on('searchByDate', async ({ station, date }) => {
        const dbConfig = dbConfigs[station];
        if (!dbConfig) {
            socket.emit('trendData', { error: `No database configuration found for station: ${station}` });
            return;
        }

        try {
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                `SELECT * FROM wx_data WHERE DATE(date) = ?`,
                [date]
            );
            await connection.end();

            socket.emit('trendData', { station, data: rows });
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

            // Convert km/h to m/s if the type is 'currwind' or 'gustwind'
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
});

setInterval(() => {
    fetchData();
}, 1000);

app.post('/fetch24HourTrend', async (req, res) => {
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

        // Convert km/h to m/s if the type is 'currwind' or 'gustwind'
        const convertedRows = rows.map(row => ({
            ...row,
            value: (type === 'currwind' || type === 'gustwind') ? row.value * 0.277778 : row.value
        }));

        res.json({ station, type, data: convertedRows });
    } catch (error) {
        console.error(`Error querying data for ${station} and type ${type}: ${error.message}`);
        res.status(500).json({ error: `Error querying data for ${station} and type ${type}: ${error.message}` });
    }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.use('/confirm', function (req, res, next) {
    console.log(req);
    next();
});
