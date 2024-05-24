<script>
  import { createEventDispatcher } from 'svelte';

  export let icon;
  export let label;
  export let data;

  const dispatch = createEventDispatcher();

  function handleClick(location, type) {
    dispatch('fetchTrend', { location, type });
  }

  function isOlderThanOneMinute(dateStr) {
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
    {#each data as { location, class: className, value, imgSrc, bearing, date, isLast }}
      <div class="data-row">
        <span class="location">{location}:</span>
        {#if imgSrc}
          <span class="{className} data-value {isOlderThanOneMinute(date) ? 'old-data' : ''}" on:click={() => handleClick(location, className)}>
            <img
              class="wind-icon"
              src="{imgSrc}"
              alt="SVG Image"
              style="transform: rotate({bearing}deg);"
            >
            <b>{value}</b>
          </span>
        {:else}
          <span class="{className} data-value {isOlderThanOneMinute(date) ? 'old-data' : ''}" on:click={() => handleClick(location, className)}><b>{value}</b></span>
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

  .temperature, .barometer, .humidity, .rain, .currwind, .gustwind {
    display: flex;
    align-items: center;
  }

  .wind-icon {
    margin-right: 1.0rem;
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
</style>
