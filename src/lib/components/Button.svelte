<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		href,
		disabled = false,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

{#if href}
	<a {href} class="btn btn-{variant} btn-{size}" class:disabled>
		{@render children()}
	</a>
{:else}
	<button class="btn btn-{variant} btn-{size}" {disabled} {onclick}>
		{@render children()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-body);
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform var(--transition-fast);
		white-space: nowrap;
	}

	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	/* Sizes */
	.btn-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: var(--text-sm);
		border-radius: var(--radius-sm);
	}

	.btn-md {
		padding: var(--space-sm) var(--space-lg);
		font-size: var(--text-base);
	}

	.btn-lg {
		padding: var(--space-md) var(--space-xl);
		font-size: var(--text-lg);
		border-radius: var(--radius-lg);
	}

	/* Primary */
	.btn-primary {
		background-color: var(--color-crust);
		color: var(--color-mozzarella);
		box-shadow: var(--shadow-sm);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--color-crust-dark);
		box-shadow: var(--shadow-md);
	}

	/* Secondary */
	.btn-secondary {
		background-color: transparent;
		color: var(--color-crust);
		border: 2px solid var(--color-crust);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: rgba(194, 112, 62, 0.08);
	}

	/* Ghost */
	.btn-ghost {
		background-color: transparent;
		color: var(--color-char);
	}

	.btn-ghost:hover:not(:disabled) {
		background-color: var(--color-flour-dark);
	}

	/* Danger */
	.btn-danger {
		background-color: var(--color-tomato);
		color: var(--color-mozzarella);
	}

	.btn-danger:hover:not(:disabled) {
		background-color: var(--color-tomato-light);
	}

	/* Disabled */
	.btn:disabled,
	.btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
