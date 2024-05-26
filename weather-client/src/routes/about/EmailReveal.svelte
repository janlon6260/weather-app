<script>
    let showEmail = false;
  
    function revealEmail() {
      showEmail = true;
    }
  </script>
  
  <span on:click={revealEmail} style="cursor: pointer; color: blue; text-decoration: underline;">
    {#if !showEmail}
      Klikk her for å vise e-postadresse
    {/if}
  </span>
  {#if showEmail}
    <span>janove@longvastol.no</span>
  {/if}
  