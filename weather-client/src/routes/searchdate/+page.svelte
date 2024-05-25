<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import { format } from 'date-fns';
  import { nb } from 'date-fns/locale';

  let selectedDate = '';
  let selectedStation = 'Skodje'; // Default station
  let weatherData = [];
  let maxGust = 0;
  let dailyRainfall = 0;
  let socket;
  let stations = ['Skodje', 'Håhjem', 'Longva'];

  function formatDate(date) {
    return format(new Date(date), 'dd.MM.yyyy', { locale: nb });
  }

  function formatTime(time) {
    if (!time) return ''; // Return empty string if time is undefined or null
    return time.split(':').slice(0, 2).join(':'); // Return only HH:MM
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

  onMount(() => {
    socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });
    socket.connect();

    socket.on('trendData', (data) => {
      if (data.error) {
        console.error(data.error);
        return;
      }
      weatherData = data.data.map(item => ({
        ...item,
        max_gust_current_day: (item.max_gust_current_day * 0.277778).toFixed(1), // Convert to m/s
        daily_rainfall: item.daily_rainfall.toFixed(1) // Fixed to one decimal place
      }));

      maxGust = data.maxGust;
      dailyRainfall = data.dailyRainfall;
    });
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
    <div>
      <p><b>Høyeste vindkast denne dagen:</b> {maxGust} m/s</p>
      <p><b>Total nedbør denne dagen:</b> {dailyRainfall} mm</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Dato</th>
          <th>Klokkeslett</th>
          <th>Temperatur (°C)</th>
          <th>Barometer (hPa)</th>
          <th>Luftfuktighet (%)</th>
        </tr>
      </thead>
      <tbody>
        {#each weatherData as item}
          <tr>
            <td>{formatDate(item.date)}</td>
            <td>{formatTime(item.time)}</td>
            <td>{Number(item.temperature).toFixed(1)}</td>
            <td>{Number(item.barometer).toFixed(1)}</td>
            <td>{Number(item.outdoor_humidity).toFixed(1)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
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
