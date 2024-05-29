<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import { format } from 'date-fns';
  import { nb } from 'date-fns/locale';
  import windArrow from '$lib/images/0.svg'; // Import the wind arrow image

  let selectedDate = getYesterdayDate();
  let selectedStation = 'Skodje';
  let weatherData = [];
  let maxGust = 0;
  let dailyRainfall = 0;
  let maxAverageWindspeed = 0;
  let maxRainRate = 0;
  let socket;
  let stations = ['Skodje', 'Håhjem', 'Longva'];

  function getYesterdayDate() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().substring(0, 10);
  }

  function formatDate(date) {
    return format(new Date(date), 'dd.MM.yyyy', { locale: nb });
  }

  function formatTime(time) {
    if (!time) return '';
    return time.split(':').slice(0, 2).join(':');
  }

  function handleDateChange(event) {
    selectedDate = event.target.value;
  }

  function handleStationChange(event) {
    selectedStation = event.target.value;
  }

  function fetchWeatherData() {
    if (!selectedDate || !selectedStation) return;
    socket.emit('searchByDate', { station: selectedStation, date: selectedDate });
  }

  function filterHourlyData(data) {
    const hourlyData = [];
    const seenHours = new Set();

    for (const item of data) {
      const hour = item.time.split(':')[0];
      if (!seenHours.has(hour)) {
        hourlyData.push(item);
        seenHours.add(hour);
      }
    }
    return hourlyData;
  }

  onMount(() => {
    socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });
    socket.connect();

    socket.on('trendData', (data) => {
      if (data.error) {
        console.error(data.error);
        return;
      }
      
      console.log('Received data:', data);  // Log received data

      const filteredData = filterHourlyData(data.data);

      weatherData = filteredData.map(item => ({
        ...item,
        daily_rainfall: item.daily_rainfall.toFixed(1) // Fixed to one decimal place
      }));

      maxGust = data.maxGust;
      dailyRainfall = data.dailyRainfall;
      maxAverageWindspeed = data.data.length > 0 ? (data.data[0].max_average_windspeed_day * 0.277778).toFixed(1) : 0;  // Extracting and converting max_average_windspeed_day
    });
    
    fetchWeatherData();
  });
</script>


<center>
  <style>
    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 8px 12px;
      border: 1px solid #ddd;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
    }

    .form-control {
      margin: 10px 0;
      display: flex;
      flex-direction: column;
    }

    .form-control label {
      margin-bottom: 5px;
    }

    #station-select, #date-input {
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 40%;
  box-sizing: border-box;
  margin: 0 auto;
}

    button {
      margin-top: 10px;
      padding: 10px 20px;
      font-size: 1rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: #0056b3;
    }
  </style>

  <div>
    <h1>Datosøk</h1>
    <div class="form-control">
      <label for="station-select">Velg værstasjon:</label>
      <select id="station-select" bind:value={selectedStation} on:change={handleStationChange}>
        {#each stations as station}
          <option value={station}>{station}</option>
        {/each}
      </select>
    </div>
    <div class="form-control">
      <label for="date-input">Velg dato:</label>
      <input id="date-input" type="date" bind:value={selectedDate} on:change={handleDateChange}>
    </div>
    <button on:click={fetchWeatherData}>Søk</button>
    
    {#if weatherData.length > 0}
<p></p>
<div style="overflow-x:auto;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <th style="width: 50%; text-align: left; padding-right: 10px;">Høyeste vindkast denne dagen</th>
      <td style="width: 50%; text-align: left;">{maxGust} m/s</td>
    </tr>
    <tr>
      <th style="width: 50%; text-align: left; padding-right: 10px;">Høyeste middelvind</th>
      <td style="width: 50%; text-align: left;">{maxAverageWindspeed} m/s</td>
    </tr>
    <tr>
      <th style="width: 50%; text-align: left; padding-right: 10px;">Nedbør denne dagen</th>
      <td style="width: 50%; text-align: left;">{dailyRainfall} mm/24t</td>
    </tr>
  </table>
</div>

<p></p>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Tid</th>
              <th>Temp. (°C)</th>
              <th>Trykk (hPa)</th>
              <th>Fukt (%)</th>
              <th>Vind</th>
            </tr>
          </thead>
          <tbody>
            {#each weatherData as item}
            <tr>
              <td>{formatTime(item.time)}</td>
              <td>{Number(item.temperature).toFixed(1)}</td>
              <td>{Number(item.barometer).toFixed(1)}</td>
              <td>{Number(item.outdoor_humidity).toFixed(1)}</td>
              <td>
                <img src={windArrow} alt="Vindretning" style="transform: rotate({item.wind_direction}deg); width: 30px; height: 30px;">
              </td>
            </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p>Ingen data tilgjengelig for valgt dato.</p>
    {/if}
  </div>
</center>

<svelte:head>
	<title>Datosøk</title>
	<meta name="description" content="Datosøk på været som har vært" />
  <meta name="keywords" content="Været som har vært på Skodje, Været som har vært på Håhjem, Været som har vært på Longva, Været i Ålesund, Flemsøy, Skuløy, Skodje, Ålesund, Haram, Været på Sunnmøre, Vind Sunnmøre">
  <meta name="author" content="Longvastøl Data">
</svelte:head>
