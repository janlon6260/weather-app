<script>
	import EmailReveal from './EmailReveal.svelte';
	import metadata from '$lib/data/metadata.json';
</script>

<svelte:head>
	<title>Om denne siden</title>
	<meta name="description" content="Om denne værsiden" />
	<meta name="keywords" content={metadata.keywords} />
	<meta name="author" content={metadata.author} />
  
	<script type="application/ld+json">
	  {JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WeatherForecast",
		"name": metadata.title,
		"description": metadata.description,
		"location": metadata.location,
		"provider": {
		  "@type": "Organization",
		  "name": metadata.author,
		  "url": metadata.providerUrl
		}
	  })}
	</script>
</svelte:head>

<h1>Om denne siden</h1>

<center>
	<b>Værstasjon Skodje sentrum, Ålesund:</b>
	<br>Davis Vantage Vue  (85 moh.), 7 meter over terrenget
	<p></p>
	<b>Værstasjon Håhjem, Grønvika, Ålesund:</b>
	<br>Davis Vantage Pro2 (10 moh.), 5 meter over terrenget
	<p></p>
	<b>Værstasjon Longva, Haram:</b>
	<br>Davis Vantage Vue  (13 moh.), 7 meter over terrenget
	<p></p>
	Ansvarlig:
	<br>Jan Ove Longvastøl, tlf. 992 28 535 / <EmailReveal />
	<p></p>
	Har din værstasjon mulighet for å sende værdata til internett, med minst 5 minutters intervall? Ta kontakt om du ønsker å være med å utvide tilbudet på denne siden. 
	<p></p>
	Denne siden henter alle dataene fra private værstasjoner (med unntak av ev. værvarsler, farevarsler o.l). Denne siden og de tilknyttede værstasjonene er ikke godkjent av, eller har tilknytning til, Meteorologisk institutt eller YR.no.

<h2><b>Legg til som app på Hjem-skjermen (Progressive Web App)</b></h2>

<div class="pwa-guide">
	<p>For å legge til denne værappen på Hjem-skjermen på din mobil, følg stegene under:</p>

	<div class="step">
		<img src="/images/PWA1.png" alt="Steg 1 - Trykk på del-ikonet" class="step-image" />
		<div class="step-text">1. Trykk på del-ikonet i nettleseren</div>
	</div>
	<div class="step">
		<img src="/images/PWA2.png" alt="Steg 2 - Velg 'Legg til på Hjem-skjerm'" class="step-image" />
		<div class="step-text">2. Bla litt ned, og velg <i>‘Legg til på Hjem-skjerm’</i> fra menyen</div>
	</div>
	<div class="step">
		<img src="/images/PWA3.jpg" alt="Steg 3 - Bekreft og legg til appen" class="step-image" />
		<div class="step-text">3. Bekreft handlingen, og appen legges til på Hjem-skjermen</div>
	</div>
</div>
</center>
<style>
	.pwa-guide {
		margin: 20px auto;
		width: 90%;
		max-width: 600px;
		text-align: center;
	}
	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 15px 0;
		animation: fadeInUp 0.6s ease;
	}
	.step-image {
		width: 100px;
		height: auto;
		margin-bottom: 8px;
		border-radius: 10px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}
	.step-text {
		font-size: 1rem;
		font-weight: 500;
		color: #333;
	}
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
