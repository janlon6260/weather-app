<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import { nb } from 'date-fns/locale';
  Chart.register(...registerables);

  export let selectedLocation;
  export let selectedType;
  export let trendData = [];
  export let onClose;
  export let error = '';
  export let chartWidth = '100%';

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
    currwind: 'Middelvindstrend',
    gustwind: 'Vindkasttrend'
  };

  const suffixMap = {
    temperature: ' °C',
    humidity: ' %',
    barometer: ' hPa',
    rain: ' mm',
    daily_rainfall: ' mm',
    currwind: ' m/s',
    gustwind: ' m/s'
  };

  function filterHourlyData(data) {
    const hourlyData = [];
    const seenHours = new Set();

    for (const item of data) {
      const hour = new Date(item.timestamp).getHours();
      if (!seenHours.has(hour)) {
        hourlyData.push(item);
        seenHours.add(hour);
      }
    }
    return hourlyData;
  }

  function createChart() {
    if (chart) {
      chart.destroy();
    }

    const filteredTrendData = filterHourlyData(trendData);

    if (filteredTrendData.length > 0 && chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filteredTrendData.map(data => new Date(data.timestamp)),
          datasets: [{
            label: typeLabelMap[selectedType] || `${selectedType} trend`,
            data: filteredTrendData.map(data => data.value),
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
                tooltipFormat: 'HH:mm',
                displayFormats: {
                  hour: 'HH:mm'
                }
              },
              adapters: {
                date: {
                  locale: nb
                }
              },
              title: {
                display: false,
                text: 'Tid'
              }
            },
            y: {
              title: {
                display: false,
                text: typeLabelMap[selectedType] || selectedType
              },
              ticks: {
                callback: function(value) {
                  return value + (suffixMap[selectedType] || '');
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(tooltipItem) {
                  return tooltipItem.formattedValue + (suffixMap[selectedType] || '');
                }
              }
            },
            legend: {
              display: false
            }
          }
        }
      });
    }
  }

  onMount(() => {
    if (trendData.length > 0) {
      dataLoaded = true;
      createChart();
    }
  });

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
    <h2 class="title"><b>{selectedLocation} - {typeLabelMap[selectedType] || selectedType} siste 24t</b></h2>
    <button class="close-btn" on:click={closePopup}>X</button>
    <div class="trend-data">
      {#if error}
        <p>Ingen data tilgjengelig</p>
      {:else if trendData.length > 0}
        <canvas bind:this={chartCanvas} style="width: {chartWidth};"></canvas>
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
    padding: 0rem;
    border-radius: 5px;
    position: relative;
    width: 100%;
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

  .title {
  text-align: center;
  margin-right: 20px;
}

</style>
