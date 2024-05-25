<script>
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
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import weatherData from '$lib/objects/weather-data';
  import { fade } from 'svelte/transition';
  import Parameter from '$lib/components/Parameter.svelte';
  import TrendPopup from '$lib/components/TrendPopup.svelte';

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
    1: 'Svak vind',
    2: 'Lett bris',
    3: 'Svak bris',
    4: 'Moderat bris',
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

  onMount(() => {
    socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });
    socket.connect();

    socket.on('connect_error', (err) => {
      // console.log(`connect_error due to ${err.message}`);
    });

    socket.on('file-content', (data) => {
      // console.log('Received file-content:', data);
      loaded = true;
      for (const location in data) {
        for (const key in data[location]) {
          weather[location][key] = data[location][key];
        }
      }
    });

    socket.on('trendData', (data) => {
      // console.log('Received trendData:', data);
      if (data.station === selectedLocation && data.type === selectedType) {
        trendData = data.data;
        // console.log('Updated trendData:', trendData);
      } else {
        // console.log('trendData did not match the selected location and type');
      }
    });
  });

  function handleFetchTrend(event) {
    const { location, type } = event.detail;
    // console.log('Fetching trend for location:', location, 'and type:', type);
    selectedLocation = location;
    selectedType = type;
    showPopup = true;
    socket.emit('fetch24HourTrend', { station: location, type });
    // console.log('fetch24HourTrend event emitted');
  }

  function handleClosePopup() {
    // console.log('Closing popup');
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
        { location: "Skodje", class: "rain", value: `${weather.Skodje.rrate} mm/t (${weather.Skodje.rfall} mm)`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "rain", value: `${weather.Hahjem.rrate} mm/t (${weather.Hahjem.rfall} mm)`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "rain", value: `${weather.Flemsoy.rrate} mm/t (${weather.Flemsoy.rfall} mm)`, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-wind",
      label: "Sanntid vind nå (middelvind):",
      data: [
        { location: "Skodje", class: "currwind", description: beaufortDescriptions[extractNumber(weather.Skodje.beaufort)], value: `${weather.Skodje.wlatest} (${weather.Skodje.wspeed}) m/s`, imgSrc: currentbSkodje, bearing: weather.Skodje.bearing, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "currwind", description: beaufortDescriptions[extractNumber(weather.Hahjem.beaufort)], value: `${weather.Hahjem.wlatest} (${weather.Hahjem.wspeed}) m/s`, imgSrc: currentbHahjem, bearing: weather.Hahjem.bearing, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "currwind", description: beaufortDescriptions[extractNumber(weather.Flemsoy.beaufort)], value: `${weather.Flemsoy.wlatest} (${weather.Flemsoy.wspeed}) m/s`, imgSrc: currentbFlemsoy, bearing: weather.Flemsoy.bearing, date: weather.Flemsoy.date, isLast: true }
      ]
    },
    {
      icon: "fas fa-wind",
      label: "Høyeste vindkast i dag:",
      data: [
        { location: "Skodje", class: "gustwind", value: `${weather.Skodje.wgustTM} m/s - registrert klokken ${weather.Skodje.TwgustTM}`, date: weather.Skodje.date, isLast: false },
        { location: "Håhjem", class: "gustwind", value: `${weather.Hahjem.wgustTM} m/s - registrert klokken ${weather.Hahjem.TwgustTM}`, date: weather.Hahjem.date, isLast: false },
        { location: "Longva", class: "gustwind", value: `${weather.Flemsoy.wgustTM} m/s - registrert klokken ${weather.Flemsoy.TwgustTM}`, date: weather.Flemsoy.date, isLast: true }
      ]
    }
  ];
</script>

<svelte:head>
  <title>Været på Sunnmøre</title>
  <meta name="description" content="Været på Sunnmøre" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <meta name="keywords" content="Været på Skodje, Været på Håhjem, Været på Longva, Været i Ålesund, Flemsøy, Skuløy, Skodje, Ålesund, Haram, Været på Sunnmøre, Vind Sunnmøre">
  <meta name="author" content="Longvastøl Data">
</svelte:head>
<center>Tabellen oppdaterer seg i sanntid. Klikk på verdiene for å vise trend de siste 24 timene.</center>
<p>
<section>
  {#if loaded}
    <div in:fade={{ duration: 500 }} class="weather-card mt-4">
      <div class="parameter-box">
        {#each parameters as { icon, label, data }}
          <Parameter {icon} {label} {data} on:fetchTrend={handleFetchTrend} />
        {/each}
      </div>
    </div>
  {/if}
</section>

{#if showPopup}
  <TrendPopup {selectedLocation} {selectedType} {trendData} onClose={handleClosePopup} />
{/if}

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  .parameter-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
