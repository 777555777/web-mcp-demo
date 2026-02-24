<script lang="ts">
	import Button from '$lib/components/Button.svelte';
</script>

<section class="hero">
	<div class="hero-inner container">
		<p class="hero-tagline">Est. 1987 · Napoli</p>
		<h1 class="hero-title">Forno Antico</h1>
		<p class="hero-subtitle">
			Craft your perfect pizza, one ingredient at a time.<br />
			Fresh dough, authentic sauces, and toppings from the old country.
		</p>
		<div class="hero-actions">
			<Button href="/configurator" variant="primary" size="lg">Build Your Pizza</Button>
			<Button href="/order" variant="secondary" size="lg">View Cart</Button>
		</div>
	</div>
</section>

<section class="features container">
	<div class="features-grid">
		<div class="feature-card">
			<span class="feature-emoji">🫓</span>
			<h3>Choose Your Base</h3>
			<p>Classic, thin crust, whole wheat, or stuffed — your call.</p>
		</div>
		<div class="feature-card">
			<span class="feature-emoji">🧀</span>
			<h3>Layer the Flavors</h3>
			<p>Premium cheeses and sauces, mixed however you like.</p>
		</div>
		<div class="feature-card">
			<span class="feature-emoji">🍕</span>
			<h3>Make It Yours</h3>
			<p>Twelve artisan toppings — from pepperoni to truffle oil.</p>
		</div>
	</div>
</section>

<style>
	/* Hero */
	.hero {
		padding-block: var(--space-4xl) var(--space-3xl);
		text-align: center;
		background:
			radial-gradient(ellipse at 30% 80%, rgba(194, 112, 62, 0.06) 0%, transparent 50%),
			radial-gradient(ellipse at 70% 20%, rgba(74, 103, 65, 0.05) 0%, transparent 50%);
	}

	.hero-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
	}

	.hero-tagline {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--color-basil);
		margin-bottom: 0;
	}

	.hero-title {
		font-size: var(--text-4xl);
		font-weight: 700;
		color: var(--color-char);
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	.hero-subtitle {
		font-size: var(--text-lg);
		color: var(--color-smoke);
		max-width: 520px;
		line-height: 1.7;
	}

	.hero-actions {
		display: flex;
		gap: var(--space-md);
		margin-top: var(--space-md);
		flex-wrap: wrap;
		justify-content: center;
	}

	/* Features */
	.features {
		padding-block: var(--space-3xl) var(--space-4xl);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--space-xl);
	}

	.feature-card {
		background-color: var(--color-mozzarella);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		text-align: center;
		transition:
			box-shadow var(--transition-base),
			transform var(--transition-base);
	}

	.feature-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.feature-emoji {
		display: block;
		font-size: 2.5rem;
		margin-bottom: var(--space-md);
	}

	.feature-card h3 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-sm);
	}

	.feature-card p {
		font-size: var(--text-sm);
		color: var(--color-smoke);
		margin-bottom: 0;
	}
</style>
