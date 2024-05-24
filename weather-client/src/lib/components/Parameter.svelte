<script>
  import { createEventDispatcher } from 'svelte';

  export let icon;
  export let label;
  export let data;

  const dispatch = createEventDispatcher();

  function handleClick(location, type) {
    dispatch('fetchTrend', { location, type });
  }
</script>

<div class="parameter">
  <div class="icon-and-label">
    <i class="{icon}" aria-hidden="true"></i>
    <span>{label}</span>
  </div>
  <div class="data-grid">
    {#each data as { location, class: className, value, imgSrc, bearing, isLast }}
      <div class="data-row">
        <span class="location">{location}:</span>
        {#if imgSrc}
          <span class="{className} data-value" on:click={() => handleClick(location, className)}>
            <img
              class="wind-icon"
              src="{imgSrc}"
              alt="SVG Image"
              style="transform: rotate({bearing}deg);"
            >
            <b>{value}</b>
          </span>
        {:else}
          <span class="{className} data-value" on:click={() => handleClick(location, className)}><b>{value}</b></span>
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
</style>