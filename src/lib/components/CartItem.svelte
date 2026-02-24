<script lang="ts">
	import type { CartItem as CartItemType } from '$lib/domain/types.js';
	import { categories } from '$lib/domain/menu.js';
	import { formatPrice } from '$lib/domain/pricing.js';
	import { cart } from '$lib/state/cart.svelte.js';
	import Button from './Button.svelte';

	let { item }: { item: CartItemType } = $props();

	/** Resolve ingredient names from selections for display. */
	function getSelectionSummary(): Array<{ label: string; value: string }> {
		const lines: Array<{ label: string; value: string }> = [];

		for (const category of categories) {
			const sel = item.pizza.selections[category.id];
			if (!sel) continue;

			let display: string;
			if (typeof sel === 'string') {
				const ing = category.ingredients.find((i) => i.id === sel);
				display = ing ? `${ing.emoji} ${ing.name}` : sel;
			} else if (sel.length === 0) {
				display = 'None';
			} else {
				display = sel
					.map((id) => {
						const ing = category.ingredients.find((i) => i.id === id);
						return ing ? `${ing.emoji} ${ing.name}` : id;
					})
					.join(', ');
			}

			lines.push({ label: category.name, value: display });
		}

		return lines;
	}
</script>

<article class="cart-item">
	<div class="cart-item-header">
		<h4 class="cart-item-title">🍕 Custom Pizza</h4>
		<span class="cart-item-price">{formatPrice(item.pizza.totalPrice)}</span>
	</div>

	<div class="cart-item-details">
		{#each getSelectionSummary() as line}
			<div class="detail-line">
				<span class="detail-label">{line.label}</span>
				<span class="detail-value">{line.value}</span>
			</div>
		{/each}
	</div>

	<div class="cart-item-footer">
		<div class="quantity-controls">
			<button
				class="qty-btn"
				onclick={() => cart.updateQuantity(item.pizza.id, item.quantity - 1)}
				aria-label="Decrease quantity"
			>
				−
			</button>
			<span class="qty-value">{item.quantity}</span>
			<button
				class="qty-btn"
				onclick={() => cart.updateQuantity(item.pizza.id, item.quantity + 1)}
				aria-label="Increase quantity"
			>
				+
			</button>
		</div>

		<span class="line-total">{formatPrice(item.pizza.totalPrice * item.quantity)}</span>

		<Button variant="ghost" size="sm" onclick={() => cart.removePizza(item.pizza.id)}>
			🗑️ Remove
		</Button>
	</div>
</article>

<style>
	.cart-item {
		background-color: var(--color-mozzarella);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		transition:
			box-shadow var(--transition-base),
			transform var(--transition-base);
	}

	.cart-item:hover {
		box-shadow: var(--shadow-sm);
	}

	.cart-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-md);
	}

	.cart-item-title {
		font-size: var(--text-lg);
		margin-bottom: 0;
	}

	.cart-item-price {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-crust);
	}

	.cart-item-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding-bottom: var(--space-md);
		margin-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-flour-dark);
	}

	.detail-line {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.detail-label {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-smoke);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.detail-value {
		font-size: var(--text-sm);
		color: var(--color-char);
		text-align: right;
	}

	.cart-item-footer {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.quantity-controls {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		background-color: var(--color-flour);
		border-radius: var(--radius-md);
		padding: 2px;
	}

	.qty-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-char);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.qty-btn:hover {
		background-color: var(--color-flour-dark);
	}

	.qty-value {
		min-width: 28px;
		text-align: center;
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.line-total {
		flex: 1;
		text-align: right;
		font-weight: 600;
		font-size: var(--text-base);
		color: var(--color-char);
	}
</style>
