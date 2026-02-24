/**
 * Domain types for the Forno Antico Pizza Configurator.
 *
 * These types are framework-agnostic — no Svelte imports.
 */

/** A single ingredient option within a category. */
export interface Ingredient {
	id: string;
	name: string;
	emoji: string;
	price: number;
}

/** How many items the user can pick from a category. */
export type SelectionMode = 'single' | 'multi';

/** A group of ingredients the user selects from. */
export interface Category {
	id: string;
	name: string;
	emoji: string;
	description: string;
	selectionMode: SelectionMode;
	ingredients: Ingredient[];
}

/**
 * A single selection value:
 * - `string` for single-select categories (one ingredient id)
 * - `string[]` for multi-select categories (zero or more ingredient ids)
 */
export type SelectionValue = string | string[];

/** Map of category id → selected ingredient id(s). */
export type Selections = Record<string, SelectionValue>;

/** A fully configured pizza ready to be added to the cart. */
export interface PizzaConfig {
	id: string;
	selections: Selections;
	totalPrice: number;
}

/** A pizza in the cart with quantity tracking. */
export interface CartItem {
	pizza: PizzaConfig;
	quantity: number;
}

/** A placed order (dummy — printed as JSON). */
export interface Order {
	id: string;
	items: CartItem[];
	totalPrice: number;
	createdAt: string;
}
