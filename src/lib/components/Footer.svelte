<footer class="footer">
	<div class="footer-inner container">
		<div class="footer-brand">
			<span class="footer-logo">🍕 Forno Antico</span>
			<p class="footer-tagline">Handcrafted pizza, made with love since 1987.</p>
		</div>
		<div class="footer-links">
			<a href="/">Home</a>
			<a href="/configurator">Build Pizza</a>
			<a href="/order">Your Order</a>
		</div>
		<p class="footer-copy">
			&copy; {new Date().getFullYear()} Forno Antico &mdash; Demo Application
		</p>
	</div>
</footer>

<style>
	.footer {
		margin-top: auto;
		border-top: 1px solid var(--color-flour-dark);
		background-color: var(--color-mozzarella);
		padding-block: var(--space-2xl);
	}

	.footer-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
		text-align: center;
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
	}

	.footer-logo {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--color-char);
	}

	.footer-tagline {
		font-size: var(--text-sm);
		color: var(--color-smoke);
		font-style: italic;
		margin-bottom: 0;
	}

	.footer-links {
		display: flex;
		gap: var(--space-lg);
	}

	.footer-links a {
		font-size: var(--text-sm);
		color: var(--color-smoke);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer-links a:hover {
		color: var(--color-crust);
	}

	.footer-copy {
		font-size: var(--text-xs);
		color: var(--color-smoke);
		margin-bottom: 0;
	}
</style>
