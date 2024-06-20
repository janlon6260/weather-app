<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  let alerts = [];

  onMount(async () => {
    const response = await fetch('https://api.met.no/weatherapi/metalerts/2.0/current.json?lat=62.50488&lon=6.69015');
    if (response.ok) {
      const data = await response.json();
      alerts = data.features.map(alert => ({ ...alert, expanded: false }));
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
      case 'rainFlood':
        return 'fas fa-cloud-showers-heavy';
      case 'wind':
        return 'fas fa-wind';
      default:
        return 'fas fa-exclamation-triangle';
    }
  }

  function toggleAlert(index) {
    alerts = alerts.map((alert, i) => {
      if (i === index) {
        return { ...alert, expanded: !alert.expanded };
      }
      return alert;
    });
  }

  function formatDateTime(dateTime) {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const formattedDateTime = new Date(dateTime).toLocaleString('no-NO', options).replace(',', ' klokken');
    return formattedDateTime;
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
    width: 100%;
    max-width: 600px;
    padding: 10px;
    text-align: left;
    font-family: var(--font-body);
    color: var(--color-text);
    background-color: rgba(255, 255, 255, 0.45);
    border-radius: 3px;
    box-shadow: 2px 2px 6px rgb(255 255 255 / 25%);
    overflow: hidden;
    cursor: pointer; /* Add cursor pointer for better UX */
  }

  .yellow-alert {
    border: 2px solid yellow;
    background-color: rgba(255, 255, 0, 0.08);
  }

  .orange-alert {
    border: 2px solid orange;
    background-color: rgba(255, 165, 0, 0.08);
  }

  .red-alert {
    border: 2px solid red;
    background-color: rgba(255, 0, 0, 0.08);
  }

  .alert-header {
    margin: 0;
    display: flex;
    align-items: center;
    line-height: var(--line-height-header, 1.2);
  }

  .alert-header i {
    margin-right: 10px;
  }

  .alert-header .toggle-text {
    margin-left: auto;
    font-weight: normal;
    font-size: 1.0rem;
  }

  .alert-details {
    margin-top: 5px;
    line-height: var(--line-height-content, 1.4);
  }

  .alert-content {
    overflow: hidden;
    margin-top: 10px;
  }

  @media (max-width: 600px) {
    .alert-box {
      width: 90%;
    }
  }
</style>

<svelte:head>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
</svelte:head>

{#if alerts.length > 0}
  <div class="alerts-wrapper">
    {#each alerts as alert, index (alert.id)}
      <div class="alert-box {getSeverityClass(alert.properties.severity)}" on:click={() => toggleAlert(index)}>
        <h3 class="alert-header">
          <i class="{getIcon(alert.properties.event)}"></i>
          {alert.properties.eventAwarenessName}
          <span class="toggle-text">{alert.expanded ? 'Vis mindre' : 'Vis mer'}</span>
        </h3>
        <div class="alert-details">
          <b>Grad:</b> {getSeverityLabel(alert.properties.severity)}
        </div>
        {#if alert.expanded}
          <div class="alert-content" transition:slide>
            <br><b>Beskrivelse:</b> {alert.properties.description}
            <div style="margin-top: 10px;">
              {#if alert.when && alert.when.interval}
                <br><b>Gjelder fra:</b> {formatDateTime(alert.when.interval[0])}
                <br><b>Gjelder til:</b> {formatDateTime(alert.when.interval[1])}
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{:else}
{/if}
