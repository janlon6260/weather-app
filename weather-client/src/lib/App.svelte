<script>
    import { onMount } from 'svelte';
    import { io } from 'socket.io-client';
    import Parameter from '$lib/components/Parameter.svelte';
    import TrendPopup from '$lib/components/TrendPopup.svelte';
  
    let socket;
    let loaded = false;
    let parameters = [];
    let showTrendPopup = false;
    let trendData = [];
  
    onMount(() => {
      socket = io(import.meta.env.VITE_API_URL);
  
      socket.on('file-content', (data) => {
        parameters = [];
        loaded = true;
      });
  
      socket.on('trendData', ({ data }) => {
        trendData = data;
        showTrendPopup = true;
      });
    });
  
    function handleFetchTrend(event) {
      const { location } = event.detail;
      socket.emit('fetch24HourTrend', { station: location });
    }
  
    function closeTrendPopup() {
      showTrendPopup = false;
    }
  </script>
  
  {#if !loaded}
    <p>Loading...</p>
  {:else}
    <Parameter
      icon="fa fa-thermometer-half"
      label="Temperature"
      data={parameters}
      on:fetchTrend={handleFetchTrend}
    />
  {/if}
  
  {#if showTrendPopup}
    <TrendPopup {trendData} on:close={closeTrendPopup} />
  {/if}
  