<script>
  import { onMount } from 'svelte';

  let alerts = [];

  onMount(async () => {
    const response = await fetch('https://api.met.no/weatherapi/metalerts/2.0/current.json?lat=62.50488&lon=6.69015');
    if (response.ok) {
      const data = await response.json();
      alerts = data.features;
    }
  });

  function getSeverityClass(severity) {
    switch (severity) {
      case 'Moderate':
        return 'yellow-alert';
      case 'Severe':
        return 'orange-alert';
      case 'Extreme':
        return 'red-alert';
      default:
        return '';
    }
  }

  function getSeverityLabel(severity) {
    switch (severity) {
      case 'Moderate':
        return 'Gult farevarsel';
      case 'Severe':
        return 'Oransje farevarsel';
      case 'Extreme':
        return 'Rødt farevarsel';
      default:
        return severity;
    }
  }

  function getIcon(event) {
    switch (event) {
      case 'forestFire':
        return 'fas fa-fire';
      case 'flood':
        return 'fas fa-water';
      case 'storm':
        return 'fas fa-wind';
      case 'avalanche':
        return 'fas fa-snowflake';

      default:
        return 'fas fa-exclamation-triangle';
    }
  }
</script>

<style>
  .alerts-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin: 20px 0;
  }

  .alert-box {
    width: 600px;
    padding: 10px;
    text-align: left;
  }

  .yellow-alert {
    border: 2px solid yellow;
  }

  .orange-alert {
    border: 2px solid orange;
  }

  .red-alert {
    border: 2px solid red;
  }

  .alert-header {
    margin: 0;
    display: flex;
    align-items: center;
  }

  .alert-header i {
    margin-right: 10px;
  }

  .alert-content {
    margin-top: 5px;
  }
</style>

<svelte:head>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
</svelte:head>

{#if alerts.length > 0}
  <div class="alerts-wrapper">
    {#each alerts as alert (alert.id)}
      <div class="alert-box {getSeverityClass(alert.properties.severity)}">
        <h3 class="alert-header">
          <i class="{getIcon(alert.properties.event)}"></i>
          {alert.properties.eventAwarenessName}
        </h3>
        <div class="alert-content">
          <b>Alvorlighetsgrad:</b> {getSeverityLabel(alert.properties.severity)}
          {#if alert.properties.when && alert.properties.when.interval}
            <br><b>Start:</b> {new Date(alert.properties.when.interval[0]).toLocaleString('no-NO')}
            <br><b>Slutt:</b> {new Date(alert.properties.when.interval[1]).toLocaleString('no-NO')}
          {/if}
          <br><b>Beskrivelse:</b> {alert.properties.description}
        </div>
      </div>
    {/each}
  </div>
{:else}
{/if}
