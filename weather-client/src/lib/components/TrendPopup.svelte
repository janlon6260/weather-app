<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import { nb } from 'date-fns/locale';
  Chart.register(...registerables);

  const API_URL = import.meta.env.VITE_API_URL || '';

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

  let showLastYear = false;
  let trendDataLastYear = [];
  let isFetchingLastYear = false;
  let lastYearDataAvailable = true;

  $: chartTitle = `${selectedLocation} - ${typeLabelMap[selectedType] || selectedType} siste 24t${showLastYear ? ' og samme tid i fjor' : ''}`;

  function closePopup() {
    dispatch('close');
    if (onClose) {
      onClose();
    }
  }

  function closePopupIfOverlayClicked(event) {
    if (event.target === event.currentTarget) {
      closePopup();
    }
  }

  const typeLabelMap = {
    temperature: 'Temperaturtrend',
    humidity: 'Luftfuktighetstrend',
    barometer: 'Barometertrend',
    rain: 'Nedbørstrend',
    daily_rainfall: 'Daglig nedbørstrend',
    currwind: 'Middelvindstrend',
    gustwind: 'Vindkasttrend',
  };

  const suffixMap = {
    temperature: ' °C',
    humidity: ' %',
    barometer: ' hPa',
    rain: ' mm',
    daily_rainfall: ' mm',
    currwind: ' m/s',
    gustwind: ' m/s',
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

    const datasets = [
      {
        label: typeLabelMap[selectedType] || `${selectedType} trend`,
        data: filteredTrendData.map((data) => ({
          x: new Date(data.timestamp),
          y: data.value,
        })),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ];

    if (filteredTrendData.length > 0 && chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: datasets,
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
                  hour: 'HH:mm',
                },
              },
              adapters: {
                date: {
                  locale: nb,
                },
              },
              title: {
                display: false,
                text: 'Tid',
              },
            },
            y: {
              title: {
                display: false,
                text: typeLabelMap[selectedType] || selectedType,
              },
              ticks: {
                callback: function (value) {
                  return value + (suffixMap[selectedType] || '');
                },
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return tooltipItem.formattedValue + (suffixMap[selectedType] || '');
                },
              },
            },
            legend: {
              display: datasets.length > 1,
            },
          },
        },
      });
    }

    updateLastYearDataset();
  }

  function updateLastYearDataset() {
    if (chart) {
      const lastYearIndex = chart.data.datasets.findIndex(dataset => dataset.label.includes('(i fjor)'));
      
      if (showLastYear && lastYearDataAvailable && trendDataLastYear.length > 0) {
        const filteredTrendDataLastYear = filterHourlyData(trendDataLastYear);

        const lastYearAdjustedData = filteredTrendDataLastYear.map((data) => {
          let lastYearDate = new Date(data.timestamp);
          lastYearDate.setFullYear(new Date().getFullYear());
          return {
            x: lastYearDate,
            y: data.value,
          };
        });

        const lastYearDataset = {
          label: (typeLabelMap[selectedType] || `${selectedType} trend`) + ' (i fjor)',
          data: lastYearAdjustedData,
          borderColor: 'rgba(192, 75, 75, 1)',
          backgroundColor: 'rgba(192, 75, 75, 0.2)',
          fill: false,
          tension: 0.1,
        };

        if (lastYearIndex >= 0) {
          chart.data.datasets[lastYearIndex] = lastYearDataset;
        } else {
          chart.data.datasets.push(lastYearDataset);
        }
      } else if (lastYearIndex >= 0) {
        chart.data.datasets.splice(lastYearIndex, 1);
      }

      chart.update();
    }
  }

  async function fetchLastYearData() {
    isFetchingLastYear = true;
    try {
      const response = await fetch(`${API_URL}/fetch24HourTrendLastYear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station: selectedLocation, type: selectedType }),
      });
      const result = await response.json();

      if (response.ok) {
        trendDataLastYear = result.data;

        if (trendDataLastYear.length > 0) {
          lastYearDataAvailable = true;
        } else {
          lastYearDataAvailable = false;
        }
        updateLastYearDataset();
      } else {
        console.error(result.error);
        lastYearDataAvailable = false;
      }
    } catch (err) {
      console.error(err);
      lastYearDataAvailable = false;
    } finally {
      isFetchingLastYear = false;
    }
  }

  onMount(() => {
    if (trendData.length > 0) {
      dataLoaded = true;
      createChart();
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') closePopup();
    };
    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  });

  $: if (chartCanvas) {
    createChart();
  }

  $: if (trendData.length > 0 && chartCanvas) {
    createChart();
  }

  $: if (showLastYear) {
    if (trendDataLastYear.length === 0 && !isFetchingLastYear && lastYearDataAvailable !== false) {
      fetchLastYearData();
    } else {
      updateLastYearDataset();
    }
  } else {
    updateLastYearDataset();
  }

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<div
  class="popup-overlay"
  on:click={closePopupIfOverlayClicked}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closePopup();
    }
  }}
  role="button"
  tabindex="0"
  aria-label="Lukk popup">

  <div
    class="popup"
    role="dialog"
    aria-modal="true"
    aria-labelledby="popup-title">

    <h2 id="popup-title" class="title"><b>{chartTitle}</b></h2>

    <button class="close-btn" on:click={closePopup} aria-label="Lukk">X</button>

    <div class="trend-data" role="region" aria-live="polite">
      {#if error}
        <p>Ingen data tilgjengelig</p>
      {:else if trendData.length > 0}
        <canvas bind:this={chartCanvas} style="width: {chartWidth};"></canvas>
        <div class="toggle-last-year">
          <label>
            <input type="checkbox" bind:checked={showLastYear}>
            Vis samme periode i fjor
          </label>
        </div>
        {#if showLastYear && !lastYearDataAvailable && !isFetchingLastYear}
          <div class="no-data-message">
            <p>Ingen data tilgjengelig for samme periode i fjor.</p>
          </div>
        {/if}
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

  .toggle-last-year {
    margin-top: 1rem;
    text-align: center;
  }

  .no-data-message {
    margin-top: 1rem;
    text-align: center;
    color: red;
  }
</style>
