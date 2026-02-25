import { json } from '@sveltejs/kit';

export function GET() {
	return json(
		{
			spec: 'webmcp/0.1',
			site: {
				name: 'Forno Antico',
				version: '2026.02-demo',
				description: 'Pizza configurator demo with WebMCP-compatible agent tools.',
				pages: [
					{
						url: '/configurator',
						intents: [
							'menu.get_catalog',
							'configurator.get_current',
							'configurator.set_selection',
							'configurator.reset',
							'cart.add_current_pizza'
						]
					},
					{
						url: '/order',
						intents: [
							'cart.get_snapshot',
							'cart.update_item_quantity',
							'cart.remove_item',
							'cart.clear',
							'order.place'
						]
					}
				],
				flows: [
					{
						id: 'build_and_order_pizza',
						description:
							'Discover menu, configure pizza, add to cart, review cart, and place order.',
						steps: [
							{ intent: 'menu.get_catalog', page: '/configurator' },
							{ intent: 'configurator.set_selection', page: '/configurator' },
							{ intent: 'cart.add_current_pizza', page: '/configurator' },
							{ intent: 'cart.get_snapshot', page: '/order' },
							{ intent: 'order.place', page: '/order' }
						]
					}
				]
			}
		},
		{
			headers: {
				'cache-control': 'public, max-age=300'
			}
		}
	);
}
