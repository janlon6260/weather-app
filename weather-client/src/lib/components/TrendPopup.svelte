<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import 'chartjs-adapter-date-fns';  // Import the date adapter
  import { nb } from 'date-fns/locale'; // Import Norwegian locale for date-fns
  Chart.register(...registerables);

  export let selectedLocation;
  export let selectedType;
  export let trendData = [];
  export let onClose;
  export let error = '';

  const dispatch = createEventDispatcher();
  let chartCanvas;
  let chart;
  let dataLoaded = false;

  function closePopup() {
    dispatch('close');
    if (onClose) {
      onClose();
    }
  }

  const typeLabelMap = {
    temperature: 'Temperaturtrend',
    humidity: 'Luftfuktighetstrend',
    barometer: 'Barometertrend',
    rain: 'Nedbørstrend',
    daily_rainfall: 'Daglig nedbørstrend',
    currwind: 'Middelvindstrend'
  };

  function createChart() {
    if (chart) {
      chart.destroy();
    }

    if (trendData.length > 0 && chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: trendData.map(data => new Date(data.timestamp)),
          datasets: [{
            label: typeLabelMap[selectedType] || `${selectedType} trend`,
            data: trendData.map(data => data.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'hour',
                tooltipFormat: 'HH:mm', // Format time in tooltip
                displayFormats: {
                  hour: 'HH:mm' // Format time on x-axis
                }
              },
              adapters: {
                date: {
                  locale: nb // Use Norwegian locale
                }
              },
              title: {
                display: true,
                text: 'Tid'
              }
            },
            y: {
              title: {
                display: true,
                text: typeLabelMap[selectedType] || selectedType
              }
            }
          }
        }
      });
    }
  }

  onMount(() => {
    // console.log('Trend data in TrendPopup:', trendData);
    // Initial check if data is already available
    if (trendData.length > 0) {
      dataLoaded = true;
      createChart();
    }
  });

  // Watcher for trendData, selectedLocation, and selectedType changes
  $: if (chartCanvas) {
    createChart();
  }

  $: if (trendData.length > 0 && chartCanvas) {
    createChart();
  }

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<div class="popup-overlay" on:click={closePopup}>
  <div class="popup" on:click|stopPropagation>
    <h2>Trend siste 24 timer for {selectedLocation} - {typeLabelMap[selectedType] || selectedType}</h2>
    <button class="close-btn" on:click={closePopup}>X</button>
    <div class="trend-data">
      {#if error}
        <p>Ingen data tilgjengelig</p>
      {:else if trendData.length > 0}
        <canvas bind:this={chartCanvas}></canvas>
      {:else}
        <p>Ingen data tilgjengelig</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .popup {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    position: relative;
    width: 80%;
    max-width: 600px;
  }

  .close-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }

  .trend-data {
    margin-top: 1rem;
  }
</style>
