<script>
    import { createEventDispatcher } from 'svelte';
  
    let startY = 0;
    let distance = 0;
    let refreshing = false;
    const dispatch = createEventDispatcher();
  
    function handleTouchStart(event) {
      if (window.scrollY === 0) {
        startY = event.touches[0].clientY;
      }
    }
  
    function handleTouchMove(event) {
      if (startY === 0) return;
  
      distance = event.touches[0].clientY - startY;
      if (distance > 50) {
        refreshing = true;
      }
    }
  
    function handleTouchEnd() {
      if (refreshing) {
        dispatch('refresh');
      }
      startY = 0;
      distance = 0;
      refreshing = false;
    }
  </script>
  
  <div
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    class="pull-to-refresh"
  >
    {#if refreshing}
      <div class="refresh-indicator">Oppdaterer...</div>
    {/if}
    <slot></slot>
  </div>
  
  <style>
    .pull-to-refresh {
      overflow: hidden;
      touch-action: pan-y;
    }
    .refresh-indicator {
      position: absolute;
      top: 10px;
      width: 100%;
      text-align: center;
      font-size: 1.2em;
      color: #555;
    }
  </style>
  