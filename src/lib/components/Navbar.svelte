<script lang="ts">
	import { cart } from '$lib/state/cart.svelte.js';

	let { currentPath = '/' }: { currentPath?: string } = $props();

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/configurator', label: 'Build Pizza' },
		{ href: '/order', label: 'Cart' }
	];
</script>

<nav class="navbar">
	<div class="navbar-inner container">
		<a href="/" class="logo">
			<span class="logo-emoji">🍕</span>
			<span class="logo-text">Forno Antico</span>
		</a>

		<ul class="nav-links">
			{#each links as link}
				<li>
					<a href={link.href} class="nav-link" class:active={currentPath === link.href}>
						{link.label}
						{#if link.href === '/order' && cart.itemCount > 0}
							<span class="cart-badge">{cart.itemCount}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		height: var(--nav-height);
		background-color: var(--color-mozzarella);
		border-bottom: 1px solid var(--color-flour-dark);
		box-shadow: var(--shadow-sm);
	}

	.navbar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		text-decoration: none;
		color: var(--color-char);
	}

	.logo:hover {
		color: var(--color-crust);
	}

	.logo-emoji {
		font-size: 1.6rem;
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.nav-links {
		display: flex;
		list-style: none;
		gap: var(--space-xs);
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-smoke);
		text-decoration: none;
		transition:
			color var(--transition-fast),
			background-color var(--transition-fast);
	}

	.nav-link:hover {
		color: var(--color-char);
		background-color: var(--color-flour);
	}

	.nav-link.active {
		color: var(--color-crust);
		background-color: rgba(194, 112, 62, 0.08);
		font-weight: 600;
	}

	.cart-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: var(--radius-full);
		background-color: var(--color-crust);
		color: var(--color-mozzarella);
		font-size: 0.7rem;
		font-weight: 700;
		line-height: 1;
	}
</style>
