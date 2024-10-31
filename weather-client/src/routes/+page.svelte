<script>
  import WeatherAlerts from './../lib/components/WeatherAlerts.svelte';
  import Parameter from '$lib/components/Parameter.svelte';
  import TrendPopup from '$lib/components/TrendPopup.svelte';
  import PullToRefresh from '$lib/components/PullToRefresh.svelte';
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import weatherData from '$lib/objects/weather-data';
  import { fade, slide } from 'svelte/transition';

  import BF0 from '$lib/images/0.svg';
  import BF1 from '$lib/images/1.svg';
  import BF2 from '$lib/images/2.svg';
  import BF3 from '$lib/images/3.svg';
  import BF4 from '$lib/images/4.svg';
  import BF5 from '$lib/images/5.svg';
  import BF6 from '$lib/images/6.svg';
  import BF7 from '$lib/images/7.svg';
  import BF8 from '$lib/images/8.svg';
  import BF9 from '$lib/images/9.svg';
  import BF10 from '$lib/images/10.svg';
  import BF11 from '$lib/images/11.svg';
  import BF12 from '$lib/images/12.svg';

  function extractNumber(str) {
    return parseInt(str.replace(/\D/g, ''), 10);
  }

  const svgMapping = {
    0: BF0,
    1: BF1,
    2: BF2,
    3: BF3,
    4: BF4,
    5: BF5,
    6: BF6,
    7: BF7,
    8: BF8,
    9: BF9,
    10: BF10,
    11: BF11,
    12: BF12
  };

  const beaufortDescriptions = {
    0: 'Stille',
    1: 'Flau vind',
    2: 'Svak vind',
    3: 'Lett bris',
    4: 'Laber bris',
    5: 'Frisk bris',
    6: 'Liten kuling',
    7: 'Stiv kuling',
    8: 'Sterk kuling',
    9: 'Liten storm',
    10: 'Full storm',
    11: 'Sterk storm',
    12: 'Orkan'
  };

  let loaded = false;
  let weather = {
    Flemsoy: { ...weatherData },
    Skodje: { ...weatherData },
    Hahjem: { ...weatherData }
  };

  let socket;
  let selectedLocation = null;
  let selectedType = null;
  let showPopup = false;
  let trendData = [];

  let skodjeIsDown = 'green';
  let hahjemIsDown = 'green';
  let longvaIsDown = 'green';

  onMount(() => {
    socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });
    socket.connect();

    socket.on('connect_error', (err) => {
      console.error(`connect_error due to ${err.message}`);
    });

    socket.on('file-content', (data) => {
      loaded = true;
      for (const location in data) {
        for (const key in data[location]) {
          weather[location][key] = data[location][key];
        }
      }
      updateStationStatus();
    });

    socket.on('trendData', (data) => {
      if (data.station === selectedLocation && data.type === selectedType) {
        trendData = data.data;
      }
    });
  });

  function updateStationStatus() {
    skodjeIsDown = weather.Skodje.status;
    hahjemIsDown = weather.Hahjem.status;
    longvaIsDown = weather.Flemsoy.status;
  }

  function refreshPage() {
    loaded = false;
    socket.emit('refreshData');
  }

  function handleFetchTrend(event) {
    const { location, type } = event.detail;
    selectedLocation = location;
    selectedType = type;
    showPopup = true;
    socket.emit('fetch24HourTrend', { station: location, type });
  }

  function handleClosePopup() {
    showPopup = false;
  }

  $: currentbSkodje = svgMapping[extractNumber(weather.Skodje.beaufort)];
  $: currentbHahjem = svgMapping[extractNumber(weather.Hahjem.beaufort)];
  $: currentbFlemsoy = svgMapping[extractNumber(weather.Flemsoy.beaufort)];

  $: parameters = [
    {
      icon: "fas fa-thermometer-half",
      label: "Temperatur:",
      data: [
        { location: "Skodje", class: "temperature", value: `${weather.Skodje.temp} °C`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "temperature", value: `${weather.Hahjem.temp} °C`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "temperature", value: `${weather.Flemsoy.temp} °C`, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-chart-bar",
      label: "Barometer:",
      data: [
        { location: "Skodje", class: "barometer", value: `${weather.Skodje.press} hPa`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "barometer", value: `${weather.Hahjem.press} hPa`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "barometer", value: `${weather.Flemsoy.press} hPa`, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-tint",
      label: "Luftfuktighet:",
      data: [
        { location: "Skodje", class: "humidity", value: `${weather.Skodje.hum} %`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "humidity", value: `${weather.Hahjem.hum} %`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "humidity", value: `${weather.Flemsoy.hum} %`, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-cloud-showers-heavy",
      label: "Nedbør nå (totalt i dag):",
      data: [
        { location: "Skodje", class: "daily_rainfall", value: `${weather.Skodje.rrate} mm/t (${weather.Skodje.rfall} mm )`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "daily_rainfall", value: `${weather.Hahjem.rrate} mm/t (${weather.Hahjem.rfall} mm )`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "daily_rainfall", value: `${weather.Flemsoy.rrate} mm/t (${weather.Flemsoy.rfall} mm )`, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-wind",
      label: "Sanntid vind nå (middelvind):",
      data: [
        { location: "Skodje", class: "currwind", description: beaufortDescriptions[extractNumber(weather.Skodje.beaufort)], value: `${weather.Skodje.wlatest} ( ${weather.Skodje.wspeed} ) m/s`, imgSrc: currentbSkodje, bearing: weather.Skodje.bearing, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "currwind", description: beaufortDescriptions[extractNumber(weather.Hahjem.beaufort)], value: `${weather.Hahjem.wlatest} ( ${weather.Hahjem.wspeed} ) m/s`, imgSrc: currentbHahjem, bearing: weather.Hahjem.bearing, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "currwind", description: beaufortDescriptions[extractNumber(weather.Flemsoy.beaufort)], value: `${weather.Flemsoy.wlatest} ( ${weather.Flemsoy.wspeed} ) m/s`, imgSrc: currentbFlemsoy, bearing: weather.Flemsoy.bearing, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-wind",
      label: "Høyeste vindkast i dag:",
      data: [
        { location: "Skodje", class: "gustwind", value: `${weather.Skodje.wgustTM} m/s - klokken ${weather.Skodje.TwgustTM}`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "gustwind", value: `${weather.Hahjem.wgustTM} m/s - klokken ${weather.Hahjem.TwgustTM}`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "gustwind", value: `${weather.Flemsoy.wgustTM} m/s - klokken ${weather.Flemsoy.TwgustTM}`, date: weather.Flemsoy.date, isLast: true }
      ]
    }
  ];

  let isExpanded = false;

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  $: hasIssues = skodjeIsDown === 'red' || hahjemIsDown === 'red' || longvaIsDown === 'red';
  $: hasTemporaryIssues = skodjeIsDown === 'orange' || hahjemIsDown === 'orange' || longvaIsDown === 'orange';



</script>

<svelte:head>
  <title>Været på Sunnmøre</title>
  <meta name="description" content="Været på Sunnmøre" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <meta name="keywords" content="Været på Skodje, Været på Håhjem, Været på Longva, Været i Ålesund, Flemsøy, Skuløy, Skodje, Ålesund, Haram, Været på Sunnmøre, Vind Sunnmøre, Været på Skuløya/Flemsøya, Været på Skuløya, Været på Flemsøya, Været på Nordøyane, Longva, Flem, Haramsøy, Lepsøy, Fjørtoft, Været i Haram, Nordøyane, Vind Haram, Vind Sunnmøre">
  <meta name="author" content="Longvastøl Data">
</svelte:head>

<PullToRefresh on:refresh={refreshPage}>

<div
  class="status-line"
  on:click={toggleExpand}
  on:keydown={(e) => e.key === 'Enter' && toggleExpand(e)}
  role="button"
  tabindex="0">
  <span>Status værstasjoner:</span>
  <span class="{hasIssues ? 'red-circle' : (hasTemporaryIssues ? 'orange-circle' : 'green-circle')}"></span>
  <span>{hasIssues ? 'Problemer' : (hasTemporaryIssues ? 'OK' : 'OK')}</span>
  <span class="toggle-text">{isExpanded ? 'Vis mindre' : 'Vis mer'}</span>
</div>


{#if isExpanded}
<div class="station-status-list" transition:slide>
  <div
    class="station"
    role="button"
    tabindex="0">
    <span>Skodje:</span>
    <span class="{skodjeIsDown === 'red' ? 'red-circle' : (skodjeIsDown === 'orange' ? 'orange-circle' : 'green-circle')}"></span>
    <span>{skodjeIsDown === 'red' ? 'Nede' : (skodjeIsDown === 'orange' ? 'Midlertidig utilgjengelig' : 'OK')}</span>
    <span> - Siste oppdatering: {weather.Skodje.date}</span>
  </div>

  <div
    class="station"
    role="button"
    tabindex="0">
    <span>Håhjem:</span>
    <span class="{hahjemIsDown === 'red' ? 'red-circle' : (hahjemIsDown === 'orange' ? 'orange-circle' : 'green-circle')}"></span>
    <span>{hahjemIsDown === 'red' ? 'Nede' : (hahjemIsDown === 'orange' ? 'Midlertidig utilgjengelig' : 'OK')}</span>
    <span> - Siste oppdatering: {weather.Hahjem.date}</span>
  </div>

  <div
    class="station"
    role="button"
    tabindex="0">
    <span>Longva:</span>
    <span class="{longvaIsDown === 'red' ? 'red-circle' : (longvaIsDown === 'orange' ? 'orange-circle' : 'green-circle')}"></span>
    <span>{longvaIsDown === 'red' ? 'Nede' : (longvaIsDown === 'orange' ? 'Midlertidig utilgjengelig' : 'OK')}</span>
    <span> - Siste oppdatering: {weather.Flemsoy.date}</span>
  </div>
</div>
{/if}

<WeatherAlerts />

<div class="toptext {isExpanded ? 'expanded' : ''}">Klikk på verdiene for å vise trend de siste 24 timene, og på samme tid i fjor.</div>

<section>
  {#if loaded}
    <div in:fade={{ duration: 500 }} class="weather-card mt-4">
      <div class="parameter-box">
        {#each parameters as { icon, label, data }}
          <Parameter {icon} {label} {data} on:fetchTrend={handleFetchTrend} />
        {/each}
      </div>
    </div>
  {:else}
    <div class="loading">
      <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
      <span>Laster inn værdata...</span>
    </div>
  {/if}
</section>

{#if showPopup}
  <TrendPopup {selectedLocation} {selectedType} {trendData} onClose={handleClosePopup} />
{/if}

</PullToRefresh>

<style>
  .status-line {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    margin: 1rem 0;
    font-family: var(--font-body);
    color: var(--color-text);
  }

  .status-line .toggle-text {
    font-size: 0.85rem;
  }

  .green-circle, .red-circle, .orange-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
  .orange-circle {
    background-color: orange;
  }

  .green-circle {
    background-color: green;
  }

  .red-circle {
    background-color: red;
  }

  .station-status-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    margin-top: 0.5rem;
    font-family: var(--font-body);
    color: var(--color-text);
  }

  section {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0.6;
  }

  .parameter-box {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .toptext {
    display: flex;
    align-items: center;
    flex-direction: column;
    padding-bottom: 1.0rem;
    margin-top: 0rem;
  }

  .toptext.expanded {
    margin-top: 1rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: 1.5rem;
    color: #555;
  }

  .loading i {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  @media (max-width: 768px) {
  .parameter-box {
    align-items: flex-start;
    padding-right: 100px;
  }
}

</style>
