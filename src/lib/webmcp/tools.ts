import { categories } from '$lib/domain/menu.js';
import type { Selections } from '$lib/domain/types.js';
import { cart } from '$lib/state/cart.svelte.js';
import { configurator } from '$lib/state/configurator.svelte.js';

/** Spec-compliant MCP content item. */
type ContentItem = { type: 'text'; text: string };

/** Spec-compliant tool result with content array. */
type ToolResult = { content: ContentItem[] };

/** Dev-only registry: maps tool name → schema + executable function. */
export const devToolRegistry = new Map<
	string,
	{
		schema: Omit<WebMCPTool, 'execute'>;
		execute: (p: Record<string, unknown>) => Promise<ToolResult>;
	}
>();

function success(message: string, data?: unknown): ToolResult {
	const payload = data !== undefined ? { ok: true, message, data } : { ok: true, message };
	return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

function failure(code: string, details: string): ToolResult {
	return {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ ok: false, error: { code, details } })
			}
		]
	};
}

function getCartSnapshot() {
	const snapshot = cart.getSnapshot();
	return {
		itemCount: snapshot.itemCount,
		totalPrice: snapshot.totalPrice,
		isEmpty: snapshot.isEmpty,
		items: snapshot.items.map((item) => ({
			pizzaId: item.pizza.id,
			quantity: item.quantity,
			totalPrice: item.pizza.totalPrice,
			selections: item.pizza.selections
		}))
	};
}

function getConfiguratorSnapshot() {
	return configurator.getSnapshot();
}

function isCategoryId(value: unknown): value is string {
	return typeof value === 'string' && categories.some((category) => category.id === value);
}

function isIngredientInCategory(categoryId: string, ingredientId: unknown): ingredientId is string {
	if (typeof ingredientId !== 'string') return false;
	const category = categories.find((entry) => entry.id === categoryId);
	if (!category) return false;
	return category.ingredients.some((ingredient) => ingredient.id === ingredientId);
}

function areIngredientIdsInCategory(
	categoryId: string,
	ingredientIds: unknown
): ingredientIds is string[] {
	return (
		Array.isArray(ingredientIds) &&
		ingredientIds.every((entry) => isIngredientInCategory(categoryId, entry))
	);
}

function isPositiveInt(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 20;
}

function isAddQuantity(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 20;
}

const trustedReadOnlyAnnotations: WebMCPToolAnnotations = {
	readOnlyHint: true,
	untrustedContentHint: false
};

const trustedMutationAnnotations: WebMCPToolAnnotations = {
	readOnlyHint: false,
	untrustedContentHint: false
};

function registerTools(modelContext: ModelContext | null, signal?: AbortSignal): string[] {
	const registered: string[] = [];

	const register = (
		tool: Omit<WebMCPTool, 'execute'> & {
			execute: (params: Record<string, unknown>) => Promise<ToolResult>;
		}
	) => {
		const wrappedExecute = async (params: Record<string, unknown>): Promise<ToolResult> => {
			try {
				return await tool.execute(params);
			} catch (error) {
				console.error(`[WebMCP] Tool ${tool.name} failed`, error);
				return failure('UNEXPECTED_ERROR', String(error));
			}
		};

		if (modelContext) {
			modelContext.registerTool(
				{ ...tool, execute: wrappedExecute },
				signal ? { signal } : undefined
			);
		}

		const { execute: __execute, ...schema } = tool;
		void __execute; // intentionally discarded — wrapped version is stored below
		devToolRegistry.set(tool.name, { schema, execute: wrappedExecute });
		registered.push(tool.name);
	};

	register({
		name: 'menu.get_catalog',
		description:
			'Return all pizza categories, ingredient IDs, names, prices, and selection rules. Use this first to discover valid values.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {}
		},
		annotations: trustedReadOnlyAnnotations,
		execute: async () => {
			return success('Catalog returned', {
				categories
			});
		}
	});

	register({
		name: 'configurator.get_current',
		description: 'Return current configurator selections and live total price.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {}
		},
		annotations: trustedReadOnlyAnnotations,
		execute: async () => success('Configurator snapshot returned', getConfiguratorSnapshot())
	});

	register({
		annotations: trustedMutationAnnotations,
		name: 'configurator.configure_pizza',
		description:
			'Replace the current pizza configuration in one call. Prefer this for a new pizza or named preset. Omit fields you want to keep at their defaults.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {
				sizeId: {
					type: 'string',
					description: 'Optional size ID (small, medium, large, family).'
				},
				doughId: {
					type: 'string',
					description: 'Optional dough ID (classic, thin, wholewheat, stuffed).'
				},
				sauceId: {
					type: 'string',
					description: 'Optional sauce ID (tomato, white, pesto, bbq, none).'
				},
				cheeseIds: {
					type: 'array',
					description: 'Optional full cheese list to apply from scratch.',
					items: {
						type: 'string'
					}
				},
				toppingIds: {
					type: 'array',
					description: 'Optional full toppings list to apply from scratch.',
					items: {
						type: 'string'
					}
				}
			}
		},
		execute: async (params) => {
			const { sizeId, doughId, sauceId, cheeseIds, toppingIds } = params;

			if (sizeId !== undefined && !isIngredientInCategory('size', sizeId)) {
				return failure('INVALID_SIZE', 'sizeId is invalid.');
			}

			if (doughId !== undefined && !isIngredientInCategory('dough', doughId)) {
				return failure('INVALID_DOUGH', 'doughId is invalid.');
			}

			if (sauceId !== undefined && !isIngredientInCategory('sauce', sauceId)) {
				return failure('INVALID_SAUCE', 'sauceId is invalid.');
			}

			if (cheeseIds !== undefined && !areIngredientIdsInCategory('cheese', cheeseIds)) {
				return failure('INVALID_CHEESE', 'cheeseIds must only contain valid cheese IDs.');
			}

			if (toppingIds !== undefined && !areIngredientIdsInCategory('toppings', toppingIds)) {
				return failure('INVALID_TOPPINGS', 'toppingIds must only contain valid topping IDs.');
			}

			const nextSelections: Selections = {
				...configurator.getSelectionsSnapshot(),
				size: typeof sizeId === 'string' ? sizeId : 'medium',
				dough: typeof doughId === 'string' ? doughId : 'classic',
				sauce: typeof sauceId === 'string' ? sauceId : 'tomato',
				cheese: Array.isArray(cheeseIds) ? [...cheeseIds] : ['mozzarella'],
				toppings: Array.isArray(toppingIds) ? [...toppingIds] : []
			};

			configurator.replaceSelections(nextSelections);
			return success('Pizza configured from scratch', getConfiguratorSnapshot());
		}
	});

	register({
		annotations: trustedMutationAnnotations,
		name: 'configurator.set_selection',
		description:
			'Set or toggle an ingredient in a category. Use mode="set" for single-select categories and mode="toggle" for multi-select categories.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {
				categoryId: {
					type: 'string',
					description: 'Category ID (size, dough, sauce, cheese, toppings).'
				},
				ingredientId: {
					type: 'string',
					description: 'Ingredient ID from menu.get_catalog.'
				},
				mode: {
					type: 'string',
					enum: ['set', 'toggle'],
					description: 'Optional override; defaults based on category mode.'
				}
			},
			required: ['categoryId', 'ingredientId']
		},
		execute: async (params) => {
			const { categoryId, ingredientId, mode } = params;

			if (!isCategoryId(categoryId)) {
				return failure('INVALID_CATEGORY', 'categoryId is missing or invalid.');
			}

			if (!isIngredientInCategory(categoryId, ingredientId)) {
				return failure(
					'INVALID_INGREDIENT',
					'ingredientId does not belong to the provided category.'
				);
			}

			const category = categories.find((entry) => entry.id === categoryId);
			if (!category) {
				return failure('INVALID_CATEGORY', 'Category not found.');
			}

			const operation =
				typeof mode === 'string' && (mode === 'set' || mode === 'toggle')
					? mode
					: category.selectionMode === 'single'
						? 'set'
						: 'toggle';

			if (operation === 'set' && category.selectionMode !== 'single') {
				return failure('INVALID_MODE', 'Use toggle mode for this multi-select category.');
			}

			if (operation === 'toggle' && category.selectionMode !== 'multi') {
				return failure('INVALID_MODE', 'Use set mode for this single-select category.');
			}

			if (operation === 'set') {
				configurator.selectSingle(categoryId, ingredientId);
			} else {
				configurator.toggleMulti(categoryId, ingredientId);
			}

			return success('Selection updated', getConfiguratorSnapshot());
		}
	});

	register({
		name: 'configurator.reset',
		description: 'Reset configurator selections to defaults.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {}
		},
		annotations: trustedMutationAnnotations,
		execute: async () => {
			configurator.reset();
			return success('Configurator reset to defaults', getConfiguratorSnapshot());
		}
	});

	register({
		name: 'cart.add_current_pizza',
		description:
			'Create a pizza config from current selections and add it to cart. Use quantity > 1 for repeated identical pizzas in the same request. Keeps the configurator as-is and returns the updated cart snapshot.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {
				quantity: {
					type: 'number',
					minimum: 1,
					maximum: 20,
					description: 'Optional quantity to add for this exact pizza configuration. Defaults to 1.'
				}
			}
		},
		annotations: trustedMutationAnnotations,
		execute: async (params) => {
			const quantity = params.quantity === undefined ? 1 : params.quantity;
			if (!isAddQuantity(quantity)) {
				return failure('INVALID_QUANTITY', 'quantity must be an integer between 1 and 20.');
			}

			const config = configurator.toConfig();
			cart.addPizza(config, quantity);
			return success('Pizza added to cart', getCartSnapshot());
		}
	});

	register({
		name: 'cart.add_current_pizza_and_reset',
		description:
			'Add the currently configured pizza to the cart, then reset the configurator to defaults for the next pizza. Use quantity > 1 for repeated identical pizzas in the same request. Prefer this when building multiple pizzas in one request.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {
				quantity: {
					type: 'number',
					minimum: 1,
					maximum: 20,
					description: 'Optional quantity to add for this exact pizza configuration. Defaults to 1.'
				}
			}
		},
		annotations: trustedMutationAnnotations,
		execute: async (params) => {
			const quantity = params.quantity === undefined ? 1 : params.quantity;
			if (!isAddQuantity(quantity)) {
				return failure('INVALID_QUANTITY', 'quantity must be an integer between 1 and 20.');
			}

			const config = configurator.toConfig();
			cart.addPizza(config, quantity);
			configurator.reset();
			return success('Pizza added to cart and configurator reset', {
				cart: getCartSnapshot(),
				configurator: getConfiguratorSnapshot()
			});
		}
	});

	register({
		name: 'cart.get_snapshot',
		description:
			'Return cart items, totals, and item count. Use this before changing the quantity of an existing pizza, especially for references like "that pizza" or "make it two".',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {}
		},
		annotations: trustedReadOnlyAnnotations,
		execute: async () => success('Cart snapshot returned', getCartSnapshot())
	});

	register({
		annotations: trustedMutationAnnotations,
		name: 'cart.update_item_quantity',
		description:
			'Update quantity for a cart pizza item by pizzaId. Prefer this when the user changes the amount of a pizza already in the cart, for example "make it two of that pizza". Set quantity to 0 to remove the item.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {
				pizzaId: {
					type: 'string',
					description: 'Pizza config ID from cart snapshot.'
				},
				quantity: {
					type: 'number',
					minimum: 0,
					maximum: 20,
					description: 'New quantity, 0-20.'
				}
			},
			required: ['pizzaId', 'quantity']
		},
		execute: async (params) => {
			const { pizzaId, quantity } = params;

			if (typeof pizzaId !== 'string' || pizzaId.length === 0) {
				return failure('INVALID_PIZZA_ID', 'pizzaId must be a non-empty string.');
			}

			if (!isPositiveInt(quantity)) {
				return failure('INVALID_QUANTITY', 'quantity must be an integer between 0 and 20.');
			}

			const exists = cart.items.some((item) => item.pizza.id === pizzaId);
			if (!exists) {
				return failure('ITEM_NOT_FOUND', 'No cart item found for the provided pizzaId.');
			}

			cart.updateQuantity(pizzaId, quantity);
			return success('Cart quantity updated', getCartSnapshot());
		}
	});

	register({
		name: 'cart.remove_item',
		description: 'Remove one pizza item from the cart by pizzaId.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {
				pizzaId: {
					type: 'string',
					description: 'Pizza config ID from cart snapshot.'
				}
			},
			required: ['pizzaId']
		},
		execute: async (params) => {
			const pizzaId = params.pizzaId;
			if (typeof pizzaId !== 'string' || pizzaId.length === 0) {
				return failure('INVALID_PIZZA_ID', 'pizzaId must be a non-empty string.');
			}

			cart.removePizza(pizzaId);
			return success('Item removed from cart', getCartSnapshot());
		}
	});

	register({
		name: 'cart.clear',
		description: 'Clear the entire cart.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {}
		},
		annotations: trustedMutationAnnotations,
		execute: async () => {
			cart.clear();
			return success('Cart cleared', getCartSnapshot());
		}
	});

	register({
		name: 'order.place',
		description: 'Place an order from the current cart and return the order summary.',
		inputSchema: {
			type: 'object',
			additionalProperties: false,
			properties: {}
		},
		annotations: trustedMutationAnnotations,
		execute: async () => {
			if (cart.isEmpty) {
				return failure('CART_EMPTY', 'Cannot place order because cart is empty.');
			}

			const order = cart.placeOrder();
			return success('Order placed', order);
		}
	});

	return registered;
}

let alreadyInitialized = false;
let abortController: AbortController | null = null;

export function initWebMCPTools(): { enabled: boolean; tools: string[]; cleanup: () => void } {
	const noop = () => {};

	if (alreadyInitialized) {
		return { enabled: true, tools: [], cleanup: noop };
	}
	alreadyInitialized = true;

	if (typeof window === 'undefined') {
		return { enabled: false, tools: [], cleanup: noop };
	}

	const modelContext = navigator.modelContext ?? null;

	if (!modelContext && !import.meta.env.DEV) {
		return { enabled: false, tools: [], cleanup: noop };
	}

	abortController = new AbortController();
	const tools = registerTools(modelContext, abortController.signal);

	const cleanup = () => {
		abortController?.abort();
		abortController = null;
		alreadyInitialized = false;
		devToolRegistry.clear();
	};

	if (modelContext) {
		console.info('[WebMCP] Registered tools:', tools.join(', '));
		return { enabled: true, tools, cleanup };
	}

	console.info(
		'[WebMCP] navigator.modelContext not available — dev registry populated for test panel.'
	);
	return { enabled: false, tools, cleanup };
}
