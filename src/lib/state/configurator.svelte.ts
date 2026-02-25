/**
 * ConfiguratorState — reactive state for the pizza builder.
 *
 * Uses Svelte 5 runes ($state, $derived) in a class pattern.
 * File must be .svelte.ts for rune compilation.
 */

import type { PizzaConfig, Selections } from '$lib/domain/types.js';
import { categories, defaultSelections } from '$lib/domain/menu.js';
import { calculatePrice } from '$lib/domain/pricing.js';
import { generateId } from '$lib/shared/utils';

class ConfiguratorState {
	/** Current ingredient selections keyed by category id. */
	selections: Selections = $state(structuredClone(defaultSelections));

	/** Derived total price based on current selections. */
	totalPrice: number = $derived(calculatePrice(this.selections));

	/**
	 * Set a single-select category to a specific ingredient.
	 */
	selectSingle = (categoryId: string, ingredientId: string): void => {
		const category = categories.find((c) => c.id === categoryId);
		if (!category || category.selectionMode !== 'single') return;
		if (!category.ingredients.some((i) => i.id === ingredientId)) return;

		this.selections[categoryId] = ingredientId;
	};

	/**
	 * Toggle an ingredient in a multi-select category.
	 */
	toggleMulti = (categoryId: string, ingredientId: string): void => {
		const category = categories.find((c) => c.id === categoryId);
		if (!category || category.selectionMode !== 'multi') return;
		if (!category.ingredients.some((i) => i.id === ingredientId)) return;

		const current = (this.selections[categoryId] as string[]) ?? [];
		const index = current.indexOf(ingredientId);

		if (index >= 0) {
			current.splice(index, 1);
		} else {
			current.push(ingredientId);
		}

		// Reassign to ensure reactivity for the record entry
		this.selections[categoryId] = [...current];
	};

	/**
	 * Check if an ingredient is currently selected.
	 */
	isSelected = (categoryId: string, ingredientId: string): boolean => {
		const value = this.selections[categoryId];
		if (typeof value === 'string') return value === ingredientId;
		if (Array.isArray(value)) return value.includes(ingredientId);
		return false;
	};

	/**
	 * Reset to default selections.
	 */
	reset = (): void => {
		this.selections = structuredClone(defaultSelections);
	};

	/**
	 * Build a PizzaConfig snapshot for adding to cart.
	 * Uses $state.snapshot() to strip reactive proxies before cloning.
	 */
	toConfig = (): PizzaConfig => {
		return {
			id: generateId(),
			selections: structuredClone($state.snapshot(this.selections)),
			totalPrice: this.totalPrice
		};
	};
}

export const configurator = new ConfiguratorState();
