<script lang="ts">
	import type { Category } from '$lib/domain/types.js';
	import { formatPrice } from '$lib/domain/pricing.js';
	import { configurator } from '$lib/state/configurator.svelte.js';

	let { category }: { category: Category } = $props();
</script>

<fieldset class="category">
	<legend class="category-header">
		<span class="category-emoji">{category.emoji}</span>
		<div class="category-info">
			<h3 class="category-name">{category.name}</h3>
			<p class="category-desc">{category.description}</p>
		</div>
		<span class="category-mode">
			{category.selectionMode === 'single' ? 'Pick one' : 'Pick any'}
		</span>
	</legend>

	<div class="ingredients-grid">
		{#each category.ingredients as ingredient (ingredient.id)}
			{@const selected = configurator.isSelected(category.id, ingredient.id)}
			<button
				class="ingredient-chip"
				class:selected
				onclick={() => {
					if (category.selectionMode === 'single') {
						configurator.selectSingle(category.id, ingredient.id);
					} else {
						configurator.toggleMulti(category.id, ingredient.id);
					}
				}}
				aria-pressed={selected}
				role={category.selectionMode === 'single' ? 'radio' : 'checkbox'}
			>
				<span class="chip-emoji">{ingredient.emoji}</span>
				<span class="chip-name">{ingredient.name}</span>
				{#if ingredient.price > 0}
					<span class="chip-price">{formatPrice(ingredient.price)}</span>
				{:else}
					<span class="chip-price included">included</span>
				{/if}
			</button>
		{/each}
	</div>
</fieldset>

<style>
	.category {
		border: none;
		padding: 0;
		margin-bottom: var(--space-xl);
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding-bottom: var(--space-md);
		margin-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-flour-dark);
	}

	.category-emoji {
		font-size: 1.8rem;
		flex-shrink: 0;
	}

	.category-info {
		flex: 1;
	}

	.category-name {
		font-size: var(--text-lg);
		margin-bottom: 0;
	}

	.category-desc {
		font-size: var(--text-sm);
		color: var(--color-smoke);
		margin-bottom: 0;
	}

	.category-mode {
		font-size: var(--text-xs);
		color: var(--color-smoke);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		flex-shrink: 0;
	}

	.ingredients-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: var(--space-sm);
	}

	.ingredient-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-md) var(--space-sm);
		border: 2px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		background: var(--color-mozzarella);
		cursor: pointer;
		transition:
			border-color var(--transition-fast),
			background-color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform var(--transition-fast);
		text-align: center;
	}

	.ingredient-chip:hover {
		border-color: var(--color-crust-light);
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}

	.ingredient-chip.selected {
		border-color: var(--color-crust);
		background-color: rgba(194, 112, 62, 0.06);
		box-shadow: 0 0 0 1px var(--color-crust);
	}

	.chip-emoji {
		font-size: 1.5rem;
	}

	.chip-name {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-char);
	}

	.chip-price {
		font-size: var(--text-xs);
		color: var(--color-crust);
		font-weight: 500;
	}

	.chip-price.included {
		color: var(--color-basil);
	}
</style>
