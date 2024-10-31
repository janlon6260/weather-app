<script>
  let showEmail = false;

  function revealEmail() {
    showEmail = true;
  }
</script>

{#if !showEmail}
  <button
    on:click={revealEmail}
    style="cursor: pointer; color: blue; text-decoration: underline; background: none; border: none; padding: 0; font: inherit;">
    Vis e-postadresse
  </button>
{/if}

{#if showEmail}
  <span>janove@longvastol.no</span>
{/if}
