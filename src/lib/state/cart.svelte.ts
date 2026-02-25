/**
 * CartState — reactive cart with localStorage persistence.
 *
 * Uses Svelte 5 runes ($state, $derived) in a class pattern.
 * Persistence is handled explicitly — no $effect needed.
 * File must be .svelte.ts for rune compilation.
 */

import type { CartItem, Order, PizzaConfig } from '$lib/domain/types.js';
import { generateId } from '$lib/shared/utils';

const STORAGE_KEY = 'forno-antico-cart';

function loadFromStorage(): CartItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

class CartState {
	/** All items in the cart. */
	items: CartItem[] = $state(loadFromStorage());

	/** Derived total price across all items. */
	totalPrice: number = $derived(
		Math.round(
			this.items.reduce((sum, item) => sum + item.pizza.totalPrice * item.quantity, 0) * 100
		) / 100
	);

	/** Derived total item count. */
	itemCount: number = $derived(this.items.reduce((sum, item) => sum + item.quantity, 0));

	/** Whether the cart has any items. */
	isEmpty: boolean = $derived(this.items.length === 0);

	/** Plain snapshot of cart items without reactive proxies. */
	getItemsSnapshot = (): CartItem[] => {
		return $state.snapshot(this.items);
	};

	/** Plain snapshot of current cart state. */
	getSnapshot = (): {
		itemCount: number;
		totalPrice: number;
		isEmpty: boolean;
		items: CartItem[];
	} => {
		return {
			itemCount: this.itemCount,
			totalPrice: this.totalPrice,
			isEmpty: this.isEmpty,
			items: this.getItemsSnapshot()
		};
	};

	/** Persist current items to localStorage. */
	private persist(): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(this.items)));
		} catch {
			// Storage full or unavailable
		}
	}

	/**
	 * Add a configured pizza to the cart.
	 */
	addPizza = (config: PizzaConfig): void => {
		this.items.push({ pizza: config, quantity: 1 });
		this.persist();
	};

	/**
	 * Remove a pizza from the cart by its config id.
	 */
	removePizza = (pizzaId: string): void => {
		const index = this.items.findIndex((item) => item.pizza.id === pizzaId);
		if (index >= 0) {
			this.items.splice(index, 1);
			this.persist();
		}
	};

	/**
	 * Update quantity for a specific cart item.
	 */
	updateQuantity = (pizzaId: string, quantity: number): void => {
		const item = this.items.find((i) => i.pizza.id === pizzaId);
		if (!item) return;

		if (quantity <= 0) {
			this.removePizza(pizzaId);
		} else {
			item.quantity = quantity;
			this.persist();
		}
	};

	/**
	 * Clear all items from the cart.
	 */
	clear = (): void => {
		this.items = [];
		this.persist();
	};

	/**
	 * Place a dummy order — logs JSON to console and clears cart.
	 * Returns the order for display purposes.
	 */
	placeOrder = (): Order => {
		const order: Order = {
			id: generateId(),
			items: this.getItemsSnapshot(),
			totalPrice: this.totalPrice,
			createdAt: new Date().toISOString()
		};

		console.log('🍕 Order placed!', JSON.stringify(order, null, 2));

		this.clear();
		return order;
	};
}

export const cart = new CartState();
