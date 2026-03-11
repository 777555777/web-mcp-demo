/**
 * Static menu data for Forno Antico.
 *
 * All ingredient categories, items, and base prices.
 * This file has no framework dependencies.
 */

import type { Category, Selections } from './types.js';

export const categories: Category[] = [
	{
		id: 'size',
		name: 'Size',
		emoji: '📏',
		description: 'Choose your pizza size',
		selectionMode: 'single',
		ingredients: [
			{ id: 'small', name: 'Piccola (10")', emoji: '🍕', price: 6 },
			{ id: 'medium', name: 'Media (12")', emoji: '🍕', price: 8 },
			{ id: 'large', name: 'Grande (14")', emoji: '🍕', price: 10 },
			{ id: 'family', name: 'Famiglia (16")', emoji: '🍕', price: 13 }
		]
	},
	{
		id: 'dough',
		name: 'Dough',
		emoji: '🫓',
		description: 'Select your dough type',
		selectionMode: 'single',
		ingredients: [
			{ id: 'classic', name: 'Classic', emoji: '🫓', price: 0 },
			{ id: 'thin', name: 'Thin Crust', emoji: '🥖', price: 0 },
			{ id: 'wholewheat', name: 'Whole Wheat', emoji: '🌾', price: 1 },
			{ id: 'stuffed', name: 'Stuffed Crust', emoji: '🧀', price: 2 }
		]
	},
	{
		id: 'sauce',
		name: 'Sauce',
		emoji: '🫙',
		description: 'Pick your base sauce',
		selectionMode: 'single',
		ingredients: [
			{ id: 'tomato', name: 'Tomato', emoji: '🍅', price: 0 },
			{ id: 'white', name: 'White (Alfredo)', emoji: '🥛', price: 0.5 },
			{ id: 'pesto', name: 'Pesto', emoji: '🌿', price: 0.5 },
			{ id: 'bbq', name: 'BBQ', emoji: '🔥', price: 0.5 },
			{ id: 'none', name: 'No Sauce', emoji: '❌', price: 0 }
		]
	},
	{
		id: 'cheese',
		name: 'Cheese',
		emoji: '🧀',
		description: 'Add your cheeses',
		selectionMode: 'multi',
		ingredients: [
			{ id: 'mozzarella', name: 'Mozzarella', emoji: '🧀', price: 0 },
			{ id: 'parmesan', name: 'Parmigiano', emoji: '🧀', price: 1 },
			{ id: 'gorgonzola', name: 'Gorgonzola', emoji: '🧀', price: 1.5 },
			{ id: 'burrata', name: 'Burrata', emoji: '🫧', price: 2 },
			{ id: 'ricotta', name: 'Ricotta', emoji: '🥣', price: 1 },
			{ id: 'vegan', name: 'Vegan Cheese', emoji: '🌱', price: 1.5 }
		]
	},
	{
		id: 'toppings',
		name: 'Toppings',
		emoji: '🥗',
		description: 'Load up your toppings',
		selectionMode: 'multi',
		ingredients: [
			{ id: 'pepperoni', name: 'Pepperoni', emoji: '🥓', price: 1.5 },
			{ id: 'ham', name: 'Prosciutto', emoji: '🍖', price: 2 },
			{ id: 'salami', name: 'Salami', emoji: '🥩', price: 1.5 },
			{ id: 'mushrooms', name: 'Mushrooms', emoji: '🍄', price: 1 },
			{ id: 'olives', name: 'Olives', emoji: '🫒', price: 1 },
			{ id: 'peppers', name: 'Bell Peppers', emoji: '🫑', price: 1 },
			{ id: 'onions', name: 'Red Onions', emoji: '🧅', price: 0.75 },
			{ id: 'artichokes', name: 'Artichokes', emoji: '🌻', price: 1.5 },
			{ id: 'arugula', name: 'Arugula', emoji: '🥬', price: 0.75 },
			{ id: 'anchovies', name: 'Anchovies', emoji: '🐟', price: 1.5 },
			{ id: 'jalapenos', name: 'Jalapeños', emoji: '🌶️', price: 1 },
			{ id: 'truffle', name: 'Truffle Oil', emoji: '🫘', price: 3 },
			{ id: 'pineapple', name: 'Pineapple', emoji: '🍍', price: 1 },
			{ id: 'tuna', name: 'Tuna', emoji: '🐟', price: 1.5 },
			{ id: 'capers', name: 'Capers', emoji: '🫛', price: 0.75 }
		]
	}
];

/** Look up a category by id. */
export function getCategoryById(id: string): Category | undefined {
	return categories.find((c) => c.id === id);
}

/** Look up an ingredient by id across all categories. */
export function getIngredientById(
	categoryId: string,
	ingredientId: string
): { category: Category; ingredient: (typeof categories)[0]['ingredients'][0] } | undefined {
	const category = getCategoryById(categoryId);
	if (!category) return undefined;
	const ingredient = category.ingredients.find((i) => i.id === ingredientId);
	if (!ingredient) return undefined;
	return { category, ingredient };
}

/** Default selections for a new pizza. */
export const defaultSelections: Selections = {
	size: 'medium',
	dough: 'classic',
	sauce: 'tomato',
	cheese: ['mozzarella'],
	toppings: []
};
