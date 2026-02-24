/**
 * Pure pricing logic for pizza configurations.
 *
 * No framework dependencies — pure functions only.
 */

import type { Selections } from './types.js';
import { categories } from './menu.js';

/**
 * Calculate the total price for a set of selections.
 *
 * Iterates all categories, finds the selected ingredient(s),
 * and sums their prices.
 */
export function calculatePrice(selections: Selections): number {
	let total = 0;

	for (const category of categories) {
		const selected = selections[category.id];
		if (!selected) continue;

		if (typeof selected === 'string') {
			// Single selection
			const ingredient = category.ingredients.find((i) => i.id === selected);
			if (ingredient) total += ingredient.price;
		} else {
			// Multi selection
			for (const id of selected) {
				const ingredient = category.ingredients.find((i) => i.id === id);
				if (ingredient) total += ingredient.price;
			}
		}
	}

	return Math.round(total * 100) / 100;
}

/** Format a price as EUR string. */
export function formatPrice(price: number): string {
	return `€${price.toFixed(2)}`;
}
