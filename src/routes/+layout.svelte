<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { initWebMCPTools } from '$lib/webmcp/tools.js';
	import { dev } from '$app/environment';
	import WebMCPDevPanel from '$lib/components/WebMCPDevPanel.svelte';

	let { children } = $props();

	// Enable cross-document view transitions on navigation
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		initWebMCPTools();
	});
</script>

<svelte:head>
	<title>Forno Antico — Pizza Configurator</title>
	<meta name="description" content="Craft your perfect pizza at Forno Antico" />
</svelte:head>

<div class="app-shell">
	<Navbar currentPath={page.url.pathname} />
	<main class="main-content">
		{@render children()}
	</main>
	<Footer />
</div>

{#if dev}
	<WebMCPDevPanel />
{/if}

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
	}
</style>
