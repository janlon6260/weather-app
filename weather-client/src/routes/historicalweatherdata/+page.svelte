<script>
  import { onMount, afterUpdate } from 'svelte';
  import { format } from 'date-fns';
  import { nb } from 'date-fns/locale';
  import windArrow from '$lib/images/0.svg';
  import Chart from 'chart.js/auto';
  import { fade } from 'svelte/transition';
  import './style.css';

  let selectedStation = 'Skodje';
  let selectedInterval = 'last24hours';
  let viewMode = 'chart';
  let isLoading = false;
  let searchDate = '';
  let formattedSearchDate = '';
  let displayText = 'Viser nå: Siste døgn';

  let weatherData = [];
  let maxGust = 0;
  let dailyRainfall = 0;
  let maxAverageWindspeed = 0;
  let maxRainRate = 0;

  let stations = ['Skodje', 'Håhjem', 'Longva'];
  let chart;
  let chartContainer;
  let selectedDataType = 'temperature';

  function formatDate(date) {
    if (!date || isNaN(new Date(date).getTime())) return '';
    return format(new Date(date), 'dd.MM.yyyy', { locale: nb });
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const timePart = timestamp.split(' ')[1];
    return timePart ? timePart.slice(0, 5) : 'Ugyldig tidspunkt';
  }

  async function fetchWeatherData() {
    if (!selectedStation) return;
    isLoading = true;

    const filter = {
      last24hours: selectedInterval === 'last24hours',
      last30days: selectedInterval === 'last30days',
      last365days: selectedInterval === 'last365days'
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchhistoricaldata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          station: selectedStation,
          filter 
        }),
      });

      if (!response.ok) {
        console.error("Feil mottatt fra backend:", response.statusText);
        isLoading = false;
        return;
      }

      const responseData = await response.json();
      if (responseData && responseData.data) {
        const intervalData = selectedInterval === 'last24hours' ? responseData.data.last24hours
                          : selectedInterval === 'last30days' ? responseData.data.last30days
                          : responseData.data.last365days;

        const summaryData = selectedInterval === 'last24hours' ? responseData.data.last24hoursSummary
                          : selectedInterval === 'last30days' ? responseData.data.last30daysSummary
                          : responseData.data.last365daysSummary;

        weatherData = selectedInterval === 'last24hours'
          ? intervalData
          : intervalData.map(d => ({ ...d, timestamp: d.day }));

        maxGust = summaryData.maxGust || '0.0';
        dailyRainfall = summaryData.maxDailyRainfall || '0.0';
        maxAverageWindspeed = summaryData.maxAverageWindspeed || '0.0';
        maxRainRate = summaryData.maxRainRate || '0.0';

        if (viewMode === 'chart') {
          updateChart();
        }
      }
      isLoading = false;
    } catch (error) {
      console.error("Feil ved henting av data:", error);
      isLoading = false;
    }
  }

  async function datosøk() {
    if (!selectedStation || !searchDate) return;
    isLoading = true;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/searchByDate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          station: selectedStation,
          date: searchDate,
        }),
      });

      if (!response.ok) {
        console.error("Feil mottatt fra backend:", response.statusText);
        isLoading = false;
        return;
      }

      const responseData = await response.json();
      if (responseData && responseData.data) {
        weatherData = responseData.data.map(item => ({
          timestamp: item.date ? item.date + ' ' + item.time : null,
          temperature: item.temperature,
          barometer: item.barometer,
          outdoor_humidity: item.outdoor_humidity,
          wind_direction: item.wind_direction,
          gust_windspeed: item.gust_windspeed * 0.277778,
          average_windspeed: item.average_windspeed * 0.277778,
          daily_rainfall: item.daily_rainfall,
        }));

        maxGust = responseData.maxGust || '0.0';
        dailyRainfall = responseData.dailyRainfall || '0.0';
        maxAverageWindspeed = responseData.maxAverageWindspeed || '0.0';
        maxRainRate = responseData.maxRainRate || '0.0';

        if (viewMode === 'chart') {
          updateChart();
        }
      }
      isLoading = false;
    } catch (error) {
      console.error("Feil ved datosøk:", error);
      isLoading = false;
    }
  }

  $: if (searchDate) {
    selectedInterval = '';
    formattedSearchDate = formatDate(searchDate);
    displayText = `Viser for dato ${formattedSearchDate}`;
    datosøk();
} else {
    displayText = selectedInterval === 'last24hours' ? 'Viser siste døgn'
               : selectedInterval === 'last30days' ? 'Viser siste 30 dager'
               : 'Viser ett år tilbake';
}

  onMount(() => {
    fetchWeatherData();
  });

  afterUpdate(() => {
    if (viewMode === 'chart' && chartContainer) {
      updateChart();
    }
  });

  function updateChart() {
  if (chart) chart.destroy();

  if (chartContainer) {
    const ctx = chartContainer.getContext('2d');
    const labelMap = {
      temperature: 'Temperatur (°C)',
      barometer: 'Trykk (hPa)',
      daily_rainfall: 'Nedbør (mm)',
      average_windspeed: 'Vind (m/s)',
    };

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weatherData.map(item => 
          selectedInterval === 'last24hours' || searchDate 
            ? formatTime(item.timestamp) 
            : formatDate(item.timestamp)
        ),
        datasets: [
          {
            label: labelMap[selectedDataType],
            data: weatherData.map(item => item[selectedDataType]),
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: true, title: { display: true, text: (selectedInterval === 'last24hours' || searchDate) ? 'Tid' : 'Dato' } },
          y: { display: true, title: { display: true, text: labelMap[selectedDataType] } }
        }
      }
    });
  }
}

</script>

<center>
  <h1>Vis historiske værdata</h1>

  <div class="container">
    <div class="select-menu">
      <label>Velg værstasjon:</label>
      <select bind:value={selectedStation} on:change={fetchWeatherData} class="station-select">
        {#each stations as station}
          <option value={station}>{station}</option>
        {/each}
      </select>
    </div>

    <div class="buttons">
      <button class="time-button" on:click={() => { isLoading = true; selectedInterval = 'last24hours'; searchDate = ''; fetchWeatherData(); }}>Siste døgn</button>
      <button class="time-button" on:click={() => { isLoading = true; selectedInterval = 'last30days'; searchDate = ''; fetchWeatherData(); }}>Siste 30 dager</button>
      <button class="time-button" on:click={() => { isLoading = true; selectedInterval = 'last365days'; searchDate = ''; fetchWeatherData(); }}>Ett år tilbake</button>
    </div>
  </div>

  <div class="date-search">
    <label for="searchDate">Søk etter spesifikk dato:</label>
    <input type="date" id="searchDate" bind:value={searchDate} />
  </div>

  <div class="view-options">
    <button class="view-button" on:click={() => { viewMode = 'chart'; updateChart(); }}>Vis som graf</button>
    <button class="view-button" on:click={() => viewMode = 'table'}>Vis som tabell</button>
    {#if viewMode === 'chart'}
      <label class="select-data-type">
        <select bind:value={selectedDataType} on:change={updateChart}>
          <option value="temperature">Temperatur</option>
          <option value="barometer">Barometer</option>
          <option value="daily_rainfall">Nedbør</option>
          <option value="average_windspeed">Vind</option>
        </select>
      </label>
    {/if}
  </div>

  <p style="font-size: 1.2em; font-weight: bold; margin-top: 1em;">{displayText}</p>

  <div class="data-display" in:fade={{ duration: 500 }} out:fade={{ duration: 500 }}>
    {#if isLoading}
      <p class="loading">Laster inn data...</p>
    {:else if viewMode === 'table'}
      <div class="table-container">
        <table class="info-table">
          <tr>
            <th>Høyeste vindkast</th>
            <td>{maxGust} m/s</td>
          </tr>
          <tr>
            <th>Høyeste middelvind</th>
            <td>{maxAverageWindspeed} m/s</td>
          </tr>
          <tr>
            <th>Høyeste nedbør</th>
            <td>{dailyRainfall} mm</td>
          </tr>
          <tr>
            <th>Maks nedbørshastighet</th>
            <td>{maxRainRate} mm/t</td>
          </tr>
        </table>
      </div>

      <p></p>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>{selectedInterval === 'last24hours' ? 'Tid' : 'Dato'}</th>
              <th>Temp. (°C)</th>
              <th>Trykk (hPa)</th>
              <th>Fukt (%)</th>
              <th>Vind</th>
            </tr>
          </thead>
          <tbody>
            {#each weatherData as item}
              <tr>
                <td>{(selectedInterval === 'last24hours' || searchDate) ? formatTime(item.timestamp) : formatDate(item.day || item.timestamp)}</td>
                <td>{Number(item.temperature).toFixed(1)}</td>
                <td>{Number(item.barometer).toFixed(1)}</td>
                <td>{Number(item.outdoor_humidity).toFixed(1)}</td>
                <td>
                  {#if item.wind_direction !== undefined && item.wind_direction !== null}
                    <img src={windArrow} alt="Vindretning" style="transform: rotate({item.wind_direction}deg);" class="wind-arrow">
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
          
        </table>
      </div>
      {:else if viewMode === 'chart'}
      <div class="chart-container">
        <canvas bind:this={chartContainer} width="400" height="200" class="chart"></canvas>
      </div>
    {/if}
    
  </div>
</center>
