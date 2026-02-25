<script lang="ts">
	import CartItemComponent from '$lib/components/CartItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import { cart } from '$lib/state/cart.svelte.js';
	import { formatPrice } from '$lib/domain/pricing.js';
	import type { Order } from '$lib/domain/types.js';

	const webmcpPageManifest = JSON.stringify({
		spec: 'webmcp/0.1',
		page: { url: '/order', title: 'Your Order' },
		intents: [
			{
				id: 'cart.get_snapshot',
				description: 'Read cart items, totals, and count.'
			},
			{
				id: 'cart.update_item_quantity',
				description: 'Update quantity for a cart line item by pizzaId.'
			},
			{
				id: 'cart.remove_item',
				description: 'Remove a cart item by pizzaId.'
			},
			{
				id: 'cart.clear',
				description: 'Remove all cart items.'
			},
			{
				id: 'order.place',
				description: 'Place order from cart and return order summary.'
			}
		]
	});

	let lastOrder: Order | null = $state(null);

	function handlePlaceOrder() {
		lastOrder = cart.placeOrder();
	}

	function handleClearCart() {
		cart.clear();
	}
</script>

<svelte:head>
	<title>Your Cart — Forno Antico</title>
	<script id="webmcp" type="application/json">
{webmcpPageManifest}
	</script>
</svelte:head>

<div class="order-page container">
	<header class="page-header">
		<h1>Your Order</h1>
		<p>Review your pizzas before placing the order.</p>
	</header>

	{#if lastOrder}
		<!-- Order Confirmation -->
		<div class="confirmation">
			<div class="confirmation-icon">✅</div>
			<h2>Order Placed!</h2>
			<p class="confirmation-id">Order #{lastOrder.id.slice(0, 8)}</p>
			<p>Your order has been logged to the console as JSON.</p>
			<p class="confirmation-total">Total: {formatPrice(lastOrder.totalPrice)}</p>

			<details class="order-json">
				<summary>View Order JSON</summary>
				<pre><code>{JSON.stringify(lastOrder, null, 2)}</code></pre>
			</details>

			<div class="confirmation-actions">
				<Button variant="primary" href="/configurator">Build Another Pizza</Button>
				<Button
					variant="ghost"
					onclick={() => {
						lastOrder = null;
					}}>Dismiss</Button
				>
			</div>
		</div>
	{:else if cart.isEmpty}
		<!-- Empty Cart -->
		<div class="empty-cart">
			<span class="empty-emoji">🫙</span>
			<h3>Your cart is empty</h3>
			<p>Head to the configurator to build your first pizza!</p>
			<Button variant="primary" href="/configurator">Build a Pizza</Button>
		</div>
	{:else}
		<!-- Cart Items -->
		<div class="cart-layout">
			<div class="cart-items">
				{#each cart.items as item (item.pizza.id)}
					<CartItemComponent {item} />
				{/each}
			</div>

			<aside class="order-summary">
				<div class="summary-card">
					<h3 class="summary-title">Order Summary</h3>

					<div class="summary-lines">
						{#each cart.items as item (item.pizza.id)}
							<div class="summary-line">
								<span>🍕 Pizza × {item.quantity}</span>
								<span>{formatPrice(item.pizza.totalPrice * item.quantity)}</span>
							</div>
						{/each}
					</div>

					<hr class="divider divider--accent" />

					<div class="summary-total">
						<span class="total-label">Total</span>
						<span class="total-price">{formatPrice(cart.totalPrice)}</span>
					</div>

					<div class="summary-actions">
						<Button variant="primary" size="lg" onclick={handlePlaceOrder}>Place Order 🎉</Button>
						<Button variant="danger" size="sm" onclick={handleClearCart}>Clear Cart</Button>
					</div>
				</div>
			</aside>
		</div>
	{/if}
</div>

<style>
	.order-summary {
		position: sticky;
		top: calc(var(--nav-height) + var(--space-lg));
		align-self: start;
	}

	.order-page {
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

	/* Empty state */
	.empty-cart {
		text-align: center;
		padding: var(--space-4xl) var(--space-xl);
	}

	.empty-emoji {
		font-size: 4rem;
		display: block;
		margin-bottom: var(--space-lg);
	}

	.empty-cart h3 {
		margin-bottom: var(--space-sm);
	}

	.empty-cart p {
		color: var(--color-smoke);
		margin-bottom: var(--space-xl);
	}

	/* Cart layout */
	.cart-layout {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: var(--space-2xl);
		align-items: start;
	}

	.cart-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	/* Order summary sidebar */
	.summary-card {
		background-color: var(--color-mozzarella);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-xl);
		padding: var(--space-xl);
		box-shadow: var(--shadow-md);
		position: sticky;
		top: calc(var(--nav-height) + var(--space-lg));
	}

	.summary-title {
		font-size: var(--text-xl);
		margin-bottom: var(--space-lg);
	}

	.summary-lines {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.summary-line {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-sm);
	}

	.divider {
		margin-block: var(--space-md);
	}

	.summary-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-lg);
	}

	.total-label {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 600;
	}

	.total-price {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--color-crust);
	}

	.summary-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	/* Confirmation */
	.confirmation {
		text-align: center;
		padding: var(--space-2xl);
		max-width: 600px;
		margin-inline: auto;
	}

	.confirmation-icon {
		font-size: 4rem;
		margin-bottom: var(--space-md);
	}

	.confirmation h2 {
		margin-bottom: var(--space-sm);
	}

	.confirmation-id {
		font-family: monospace;
		font-size: var(--text-sm);
		color: var(--color-smoke);
	}

	.confirmation-total {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--color-crust);
	}

	.order-json {
		text-align: left;
		margin-block: var(--space-xl);
		background-color: var(--color-char);
		color: var(--color-flour);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.order-json summary {
		padding: var(--space-md);
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.order-json pre {
		padding: 0 var(--space-md) var(--space-md);
		font-size: var(--text-xs);
		overflow-x: auto;
		line-height: 1.5;
	}

	.confirmation-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		margin-top: var(--space-lg);
	}

	@media (max-width: 860px) {
		.cart-layout {
			grid-template-columns: 1fr;
			justify-content: center;
		}
	}
</style>
