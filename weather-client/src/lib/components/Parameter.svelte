<script>
  import { createEventDispatcher } from 'svelte';

  export let icon;
  export let label;
  export let data;

  const dispatch = createEventDispatcher();

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

  function handleClick(location, type) {
    dispatch('fetchTrend', { location, type });
  }

  function isOlderThanXMinutes(dateStr) {
    if (!dateStr) return false; // If dateStr is undefined, consider it as not old

    const now = new Date();
    const [hours, minutes] = dateStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const diff = now - date;
    return diff > 5 * 60 * 1000; // Declare station dead if data is older than 5 minutes
  }
</script>

<div class="parameter">
  <div class="icon-and-label">
    <i class="{icon}" aria-hidden="true"></i>
    <span>{label}</span>
  </div>
  <div class="data-grid">
    {#each data as { location, class: className, value, imgSrc, bearing, description, date, isLast }}
      <div class="data-row">
        <span class="location">{location}:</span>
        {#if imgSrc}
          <span class="{className} data-value {isOlderThanXMinutes(date) ? 'old-data' : ''}" on:click={() => handleClick(location, className)}>
            <div class="wind-container">
              <img
                class="wind-icon"
                src="{imgSrc}"
                alt="SVG Image"
                style="transform: rotate({bearing}deg);"
              >
              <b class="description">{description}</b>
            </div>
            <b class="value">{value}</b>
          </span>
        {:else}
          <span class="{className} data-value {isOlderThanXMinutes(date) ? 'old-data' : ''}" on:click={() => handleClick(location, className)}><b>{value}</b></span>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .parameter {
    display: flex;
    flex-direction: column;
  }

  .icon-and-label {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .icon-and-label i {
    margin-right: 0.5rem;
  }

  .data-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .data-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .location {
    font-weight: normal;
    flex-shrink: 0;
    width: 60px;
  }

  .label {
    font-weight: normal;
  }

  .wind-container {
  display: flex;
  align-items: center;
}

  .temperature, .barometer, .humidity, .rain, .currwind, .gustwind {
    display: flex;
    align-items: center;
  }

  .wind-icon {
  margin-right: 1.0rem;
  flex-shrink: 0;
}

.description {
  font-weight: bold;
  margin-right: 0.5rem;
  white-space: nowrap; 
}

  .data-value {
    display: flex;
    align-items: center;
    flex: 1;
    cursor: pointer;
  }

  .old-data {
    color: red;
  }

  .value {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>