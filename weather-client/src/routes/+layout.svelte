<script>
	import Header from './Header.svelte';
	import './styles.css';

	if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js').catch((error) => {
		});
	}
</script>


<svelte:head>
	<title>Været på Sunnmøre</title>
	<meta name="description" content="Gir sanntidsoppdatert værdata fra ulike lokasjoner rundt om på Sunnmøre. Brukeren kan også datosøket på været som har vært." />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/icons/pwa-512x512.png" />
	<meta name="theme-color" content="#ffffff">
</svelte:head>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<!-- <footer>

	</footer> -->
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
/**
	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 120px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
		**/
</style>
