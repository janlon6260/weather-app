require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { fetchWeatherData, getSocketHandlers } = require('./services/fetchData');
const fetch24HourTrendRoute = require('./routes/fetch24HourTrend');
const searchByDateRoute = require('./routes/searchByDate');
const confirmRoute = require('./routes/confirm');

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

app.use('/fetch24HourTrend', fetch24HourTrendRoute);
app.use('/searchByDate', searchByDateRoute);
app.use('/confirm', confirmRoute);

const data = {};
fetchWeatherData(data, io);

io.on('connection', (socket) => {
    socket.emit('file-content', data);
    getSocketHandlers(socket, data);
});

setInterval(() => {
    fetchWeatherData(data, io);
}, 1000);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  