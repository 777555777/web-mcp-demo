<script lang="ts">
	import { configurator } from '$lib/state/configurator.svelte.js';
	import { categories } from '$lib/domain/menu.js';
	import { formatPrice } from '$lib/domain/pricing.js';

	/** Resolve ingredient names from current selections for display. */
	function getSelectionDisplay(categoryId: string): string {
		const category = categories.find((c) => c.id === categoryId);
		if (!category) return '';

		const value = configurator.selections[categoryId];
		if (!value) return '—';

		if (typeof value === 'string') {
			const ing = category.ingredients.find((i) => i.id === value);
			return ing ? `${ing.emoji} ${ing.name}` : '—';
		}

		if (value.length === 0) return 'None selected';

		return value
			.map((id) => {
				const ing = category.ingredients.find((i) => i.id === id);
				return ing ? `${ing.emoji} ${ing.name}` : '';
			})
			.filter(Boolean)
			.join(', ');
	}
</script>

<div class="summary-card">
	<h3 class="summary-title">🍕 Your Pizza</h3>

	<div class="summary-lines">
		{#each categories as category (category.id)}
			<div class="summary-line">
				<span class="line-label">{category.name}</span>
				<span class="line-value">{getSelectionDisplay(category.id)}</span>
			</div>
		{/each}
	</div>

	<hr class="divider divider--accent" />

	<div class="summary-total">
		<span class="total-label">Total</span>
		<span class="total-price">{formatPrice(configurator.totalPrice)}</span>
	</div>
</div>

<style>
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
		text-align: center;
	}

	.summary-lines {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.summary-line {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
		padding-block: var(--space-xs);
	}

	.line-label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-smoke);
		flex-shrink: 0;
	}

	.line-value {
		font-size: var(--text-sm);
		color: var(--color-char);
		text-align: right;
		line-height: 1.5;
	}

	.divider {
		margin-block: var(--space-md);
	}

	.summary-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
</style>
