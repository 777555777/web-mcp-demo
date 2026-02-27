<script lang="ts">
	import { onMount } from 'svelte';

	let name = $state('');
	let rating = $state('');
	let comment = $state('');
	let submitted = $state(false);
	let agentActive = $state(false);
	let lastReview: { name: string; rating: string; comment: string } | null = $state(null);

	onMount(() => {
		const handleActivated = (e: Event) => {
			const { toolName } = e as Event & { toolName: string };
			if (toolName === 'submit_review') {
				agentActive = true;
				console.log('[WebMCP] Agent is filling the review form');
			}
		};

		const handleCancel = (e: Event) => {
			const { toolName } = e as Event & { toolName: string };
			if (toolName === 'submit_review') {
				agentActive = false;
				console.log('[WebMCP] Agent cancelled the review form');
			}
		};

		window.addEventListener('toolactivated', handleActivated);
		window.addEventListener('toolcancel', handleCancel);

		return () => {
			window.removeEventListener('toolactivated', handleActivated);
			window.removeEventListener('toolcancel', handleCancel);
		};
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const review = {
			name: (formData.get('reviewer_name') as string) || 'Anonymous',
			rating: formData.get('rating') as string,
			comment: (formData.get('comment') as string) || ''
		};

		lastReview = review;
		submitted = true;
		agentActive = false;

		console.log('⭐ Review submitted!', JSON.stringify(review, null, 2));

		// Respond to the agent if it triggered the submission
		const submitEvent = e as SubmitEvent & {
			agentInvoked?: boolean;
			respondWith?: (p: Promise<unknown>) => void;
		};

		if (submitEvent.agentInvoked && submitEvent.respondWith) {
			submitEvent.respondWith(
				Promise.resolve(
					JSON.stringify({
						ok: true,
						message: `Review submitted by ${review.name} with rating ${review.rating}/5.`
					})
				)
			);
		}

		// Reset after a delay
		setTimeout(() => {
			submitted = false;
			name = '';
			rating = '';
			comment = '';
			(e.target as HTMLFormElement)?.reset();
		}, 4000);
	}
</script>

<section class="review-section">
	<div class="review-inner container">
		<h2 class="review-heading">Leave a Review</h2>
		<p class="review-subtitle">Tell us about your experience — or let an AI agent do it for you.</p>

		{#if submitted && lastReview}
			<div class="review-confirmation">
				<span class="confirmation-star">⭐</span>
				<p class="confirmation-text">
					Thanks{lastReview.name !== 'Anonymous' ? `, ${lastReview.name}` : ''}! You rated us
					<strong>{lastReview.rating}/5</strong>.
				</p>
			</div>
		{:else}
			<form
				class="review-form"
				class:agent-active={agentActive}
				toolname="submit_review"
				tooldescription="Submit a customer review for the Forno Antico pizza restaurant. Accepts a reviewer name, a star rating from 1 to 5, and an optional comment."
				toolautosubmit
				onsubmit={handleSubmit}
			>
				<div class="form-row">
					<div class="form-group">
						<label for="reviewer_name">Your Name</label>
						<input
							type="text"
							id="reviewer_name"
							name="reviewer_name"
							placeholder="e.g. Mario Rossi"
							toolparamdescription="The reviewer's display name. Use 'Anonymous' if no name is provided."
							bind:value={name}
						/>
					</div>

					<div class="form-group">
						<label for="rating">Rating</label>
						<select
							id="rating"
							name="rating"
							required
							toolparamtitle="rating"
							toolparamdescription="Star rating from 1 (poor) to 5 (excellent)."
							bind:value={rating}
						>
							<option value="" disabled>Pick a rating</option>
							<option value="5">⭐⭐⭐⭐⭐ Excellent (5)</option>
							<option value="4">⭐⭐⭐⭐ Great (4)</option>
							<option value="3">⭐⭐⭐ Good (3)</option>
							<option value="2">⭐⭐ Fair (2)</option>
							<option value="1">⭐ Poor (1)</option>
						</select>
					</div>
				</div>

				<div class="form-group">
					<label for="comment">Comment <span class="optional">(optional)</span></label>
					<textarea
						id="comment"
						name="comment"
						rows="3"
						placeholder="What did you love about your pizza?"
						toolparamdescription="An optional free-text comment about the dining or ordering experience."
						bind:value={comment}
					></textarea>
				</div>

				<div class="form-actions">
					<button type="submit" class="submit-btn">Submit Review</button>
				</div>
			</form>
		{/if}
	</div>
</section>

<style>
	/* ── Section ── */
	.review-section {
		padding-block: var(--space-3xl) var(--space-4xl);
		background:
			radial-gradient(ellipse at 60% 30%, rgba(74, 103, 65, 0.04) 0%, transparent 50%),
			radial-gradient(ellipse at 30% 70%, rgba(194, 112, 62, 0.04) 0%, transparent 50%);
	}

	.review-inner {
		max-width: 640px;
	}

	.review-heading {
		text-align: center;
		margin-bottom: var(--space-sm);
	}

	.review-subtitle {
		text-align: center;
		font-size: var(--text-lg);
		color: var(--color-smoke);
		margin-bottom: var(--space-xl);
	}

	/* ── Form card ── */
	.review-form {
		background-color: var(--color-mozzarella);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		transition:
			box-shadow var(--transition-base),
			border-color var(--transition-base);
	}

	.review-form:hover {
		box-shadow: var(--shadow-md);
	}

	/* ── Agent-active visual feedback (mirrors :tool-form-active) ── */
	.review-form.agent-active {
		border-color: var(--color-basil);
		box-shadow:
			0 0 0 2px var(--color-basil-light),
			var(--shadow-lg);
		animation: agent-pulse 1.6s ease-in-out infinite;
	}

	/* ── WebMCP CSS pseudo-classes (browser-applied for declarative tools) ── */
	.review-form:tool-form-active {
		border-color: var(--color-basil);
		box-shadow:
			0 0 0 2px var(--color-basil-light),
			var(--shadow-lg);
		animation: agent-pulse 1.6s ease-in-out infinite;
	}

	.submit-btn:tool-submit-active {
		background-color: var(--color-basil);
		box-shadow: 0 0 0 2px var(--color-basil-light);
		animation: agent-pulse 1.6s ease-in-out infinite;
	}

	@keyframes agent-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.85;
		}
	}

	/* ── Form layout ── */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
	}

	@media (max-width: 520px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-group label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-char);
	}

	.optional {
		font-weight: 400;
		color: var(--color-smoke);
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		font-family: var(--font-body);
		font-size: var(--text-base);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-md);
		background-color: var(--color-flour);
		color: var(--color-char);
		transition: border-color var(--transition-fast);
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-crust);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	/* ── Submit button ── */
	.form-actions {
		display: flex;
		justify-content: flex-end;
	}

	.submit-btn {
		font-family: var(--font-body);
		font-size: var(--text-base);
		font-weight: 600;
		padding: var(--space-sm) var(--space-xl);
		border: none;
		border-radius: var(--radius-md);
		background-color: var(--color-crust);
		color: var(--color-mozzarella);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform var(--transition-fast);
	}

	.submit-btn:hover {
		background-color: var(--color-crust-dark);
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}

	.submit-btn:active {
		transform: translateY(0);
	}

	/* ── Confirmation ── */
	.review-confirmation {
		text-align: center;
		background-color: var(--color-mozzarella);
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		padding: var(--space-2xl) var(--space-xl);
	}

	.confirmation-star {
		display: block;
		font-size: 2.5rem;
		margin-bottom: var(--space-md);
	}

	.confirmation-text {
		font-size: var(--text-lg);
		color: var(--color-char);
		margin-bottom: 0;
	}
</style>
