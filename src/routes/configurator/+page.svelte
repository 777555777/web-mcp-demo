<script lang="ts">
	import CategorySelector from '$lib/components/CategorySelector.svelte';
	import PizzaSummaryCard from '$lib/components/PizzaSummaryCard.svelte';
	import Button from '$lib/components/Button.svelte';
	import { categories } from '$lib/domain/menu.js';
	import { formatPrice } from '$lib/domain/pricing.js';
	import { configurator } from '$lib/state/configurator.svelte.js';
	import { cart } from '$lib/state/cart.svelte.js';

	let added = $state(false);

	function handleAddToCart() {
		const config = configurator.toConfig();
		cart.addPizza(config);
		configurator.reset();
		added = true;

		setTimeout(() => {
			added = false;
		}, 2000);
	}
</script>

<svelte:head>
	<title>Build Your Pizza — Forno Antico</title>
</svelte:head>

<div class="configurator container">
	<header class="page-header">
		<h1>Build Your Pizza</h1>
		<p>Select your ingredients below. Your pizza summary updates live.</p>
	</header>

	<!-- Mobile sticky price bar -->
	<div class="mobile-price-bar">
		<span class="mobile-price-label">🍕 Current total</span>
		<span class="mobile-price-value">{formatPrice(configurator.totalPrice)}</span>
	</div>

	<div class="configurator-layout">
		<div class="categories-panel">
			{#each categories as category (category.id)}
				<CategorySelector {category} />
			{/each}

			<div class="actions-bar">
				<Button variant="primary" size="lg" onclick={handleAddToCart}>
					{added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
				</Button>
				<Button variant="ghost" size="md" onclick={() => configurator.reset()}>Reset</Button>
			</div>
		</div>

		<aside class="summary-panel">
			<PizzaSummaryCard />

			{#if cart.itemCount > 0}
				<div class="cart-hint">
					<p>
						{cart.itemCount} pizza{cart.itemCount === 1 ? '' : 's'} in cart
					</p>
					<Button variant="secondary" size="sm" href="/order">View Cart →</Button>
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.configurator {
		padding-block: var(--space-2xl) var(--space-4xl);
	}

	.page-header {
		text-align: center;
		margin-bottom: var(--space-2xl);
	}

	.page-header h1 {
		margin-bottom: var(--space-sm);
	}

	.page-header p {
		font-size: var(--text-lg);
		color: var(--color-smoke);
		margin-bottom: 0;
	}

	.configurator-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-2xl);
		align-items: start;
	}

	.categories-panel {
		display: flex;
		flex-direction: column;
	}

	.summary-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		position: sticky;
		top: calc(var(--nav-height) + var(--space-lg));
		align-self: start;
	}

	.actions-bar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--color-flour-dark);
	}

	.cart-hint {
		background-color: var(--color-mozzarella);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		text-align: center;
	}

	.cart-hint p {
		font-size: var(--text-sm);
		color: var(--color-smoke);
		margin-bottom: var(--space-sm);
	}

	/* Mobile sticky price bar */
	.mobile-price-bar {
		display: none;
	}

	@media (max-width: 860px) {
		.configurator-layout {
			grid-template-columns: 1fr;
		}

		.summary-panel {
			display: none;
			position: static;
			top: auto;
		}

		.mobile-price-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			position: sticky;
			top: 56px;
			z-index: 90;
			background-color: var(--color-mozzarella);
			border-bottom: 1px solid var(--color-flour-dark);
			padding: var(--space-sm) var(--space-lg);
			margin-inline: calc(-1 * var(--space-lg));
			box-shadow: var(--shadow-sm);
			margin-bottom: var(--space-lg);
		}

		.mobile-price-label {
			font-size: var(--text-sm);
			font-weight: 500;
			color: var(--color-smoke);
		}

		.mobile-price-value {
			font-family: var(--font-display);
			font-size: var(--text-xl);
			font-weight: 700;
			color: var(--color-crust);
		}
	}
</style>
