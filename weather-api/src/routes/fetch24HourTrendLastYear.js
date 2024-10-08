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
    gustwind: 'gust_windspeed',
  };

  const field = typeFieldMap[type];
  if (!field) {
    res.status(400).json({ error: `Invalid type requested: ${type}` });
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Beregn slutt- og starttider for samme periode for ett år siden
    const currentEndTime = new Date();
    const currentStartTime = new Date(currentEndTime.getTime() - 24 * 60 * 60 * 1000);

    const endTime = new Date(currentEndTime);
    endTime.setFullYear(endTime.getFullYear() - 1);  // Ett år tilbake

    const startTime = new Date(currentStartTime);
    startTime.setFullYear(startTime.getFullYear() - 1);  // Ett år tilbake

    // Formatér tidsstemplene for spørringen, nå med riktig år (fjoråret)
    const endTimeStr = endTime.toISOString().slice(0, 19).replace('T', ' ');
    const startTimeStr = startTime.toISOString().slice(0, 19).replace('T', ' ');

    // Utfør SQL-spørringen med korrekte tidsstempler for fjoråret
    const [rows] = await connection.execute(
      `SELECT CONCAT(date, ' ', time) AS timestamp, ${field} as value, date
       FROM wx_data
       WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?
       ORDER BY timestamp`,
      [startTimeStr, endTimeStr]
    );

    await connection.end();

    // Ingen normalisering av tidsstemplene, returner data som er
    const convertedRows = rows.map((row) => ({
      ...row,
      value: type === 'currwind' || type === 'gustwind' ? row.value * 0.277778 : row.value,
    }));

    res.json({ station, type, data: convertedRows });
  } catch (error) {
    console.error(`Error querying data for ${station} and type ${type}: ${error.message}`);
    res.status(500).json({ error: `Error querying data for ${station} and type ${type}: ${error.message}` });
  }
});

module.exports = router;
