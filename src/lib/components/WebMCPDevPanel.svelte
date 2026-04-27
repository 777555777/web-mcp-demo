<script lang="ts">
	import { onMount } from 'svelte';
	import { cart } from '$lib/state/cart.svelte.js';
	import { configurator } from '$lib/state/configurator.svelte.js';
	import { devToolRegistry } from '$lib/webmcp/tools.js';

	const MAX_AGENT_STEPS = 24;
	const MESSAGES_ELEMENT_ID = 'webmcp-devpanel-messages';

	// ── Persistence ──────────────────────────────────────────────────────────────
	let apiUrl = $state('https://models.inference.ai.azure.com');
	let apiKey = $state('');
	let modelName = $state('gpt-4o-mini');

	// ── UI state ─────────────────────────────────────────────────────────────────
	let open = $state(false);
	let showSettings = $state(false);
	let inputText = $state('');
	let loading = $state(false);

	// ── Chat messages (display only) ─────────────────────────────────────────────
	type Role = 'user' | 'assistant' | 'tool_call' | 'tool_result';
	type ChatMsg = { id: number; role: Role; content: string; toolNames?: string[] };
	let messages = $state<ChatMsg[]>([]);

	// Internal API conversation (not reactive — not needed in template)
	let apiConversation: unknown[] = [];
	let msgCounter = 0;

	function addMsg(role: Role, content: string, toolNames?: string[]): void {
		messages = [...messages, { id: ++msgCounter, role, content, toolNames }];
	}

	// ── Lifecycle ────────────────────────────────────────────────────────────────
	onMount(() => {
		apiUrl = localStorage.getItem('devpanel_url') ?? 'https://models.inference.ai.azure.com';
		apiKey = localStorage.getItem('devpanel_key') ?? '';
		modelName = localStorage.getItem('devpanel_model') ?? 'gpt-4o-mini';

		const onKey = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'D') {
				open = !open;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Auto-scroll to bottom when messages change
	$effect(() => {
		const messagesEl = document.getElementById(MESSAGES_ELEMENT_ID);

		if (messages.length && messagesEl instanceof HTMLDivElement) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	});

	// ── Settings ─────────────────────────────────────────────────────────────────
	function saveSettings() {
		localStorage.setItem('devpanel_url', apiUrl);
		localStorage.setItem('devpanel_key', apiKey);
		localStorage.setItem('devpanel_model', modelName);
		showSettings = false;
	}

	// ── Tool name marshalling ─────────────────────────────────────────────────────
	// OpenAI function names must match [a-zA-Z0-9_-]. We replace "." with "__".
	const toOpenAIName = (n: string) => n.replace(/\./g, '__');
	function fromOpenAIName(n: string): string | undefined {
		for (const key of devToolRegistry.keys()) {
			if (toOpenAIName(key) === n) return key;
		}
	}

	function buildOpenAITools() {
		return [...devToolRegistry.entries()].map(([name, { schema }]) => ({
			type: 'function',
			function: {
				name: toOpenAIName(name),
				description: schema.description,
				parameters: schema.inputSchema
			}
		}));
	}

	function normalizeAssistantContent(content: unknown): string {
		if (typeof content === 'string') return content;

		if (Array.isArray(content)) {
			return content
				.map((part) => {
					if (typeof part === 'string') return part;
					if (
						part &&
						typeof part === 'object' &&
						'type' in part &&
						(part as { type?: string }).type === 'text' &&
						'text' in part &&
						typeof (part as { text?: unknown }).text === 'string'
					) {
						return (part as { text: string }).text;
					}

					return '';
				})
				.join('\n')
				.trim();
		}

		return '';
	}

	// ── System prompt ─────────────────────────────────────────────────────────────
	function buildSystemPrompt(): string {
		const toolList = [...devToolRegistry.keys()].join(', ');
		return [
			'You are an AI assistant embedded directly into "Forno Antico", a pizza ordering web application.',
			'You have access to WebMCP tools that let you read and control the app in real time.',
			`Available tools: ${toolList}.`,
			'The trash-can reset in the dev panel starts a fresh customer session with an empty cart and default configurator state.',
			'',
			'Workflow:',
			'1. You already know the full menu below — no need to call menu__get_catalog unless the user asks for details.',
			'2. For a fresh pizza build, prefer configurator__configure_pizza to apply the full target configuration in one call.',
			'3. Use configurator__set_selection only for small follow-up changes to the current pizza.',
			'4. For multiple pizzas, complete them one at a time. After each finished pizza, prefer cart__add_current_pizza_and_reset before starting the next one.',
			'5. If the user requests repeated identical pizzas up front, prefer quantity on cart__add_current_pizza or cart__add_current_pizza_and_reset instead of repeating the same add flow.',
			'6. If the user changes the amount of a pizza that is already in the cart, prefer cart__get_snapshot followed by cart__update_item_quantity instead of adding a duplicate line item.',
			'7. For a single pizza, call cart__add_current_pizza or cart__add_current_pizza_and_reset to add it to the cart.',
			'8. Call order__place only when the user explicitly asks to order or checkout.',
			'',
			'Always use the tools when the user asks you to do something on the website.',
			'When you start handling a new actionable request, send one short natural-language acknowledgement first, for example "Okay, ich mache das jetzt." or "Alles klar, ich kuemmere mich darum.".',
			'This acknowledgement should happen only once at the beginning of handling that request.',
			'The acknowledgement message must not contain any tool calls.',
			'After that single acknowledgement, perform the necessary tool calls without additional assistant chatter between intermediate tool steps.',
			'Only speak to the user again after the task is complete, if you need clarification, or if a real problem occurred.',
			'Never tell the user you cannot interact with the website — you can, via these tools.',
			'After completing a multi-step task, give a short summary (not a step-by-step log).',
			'After adding items to the cart, always mention the current cart total.',
			'After placing an order, always include the final total and a concise item summary.',
			'Once the pizza matches the request, stop configuring immediately and move to the next step.',
			'For multi-pizza requests, do not go back and reconfigure an earlier pizza after you have already added it to the cart.',
			'Use cart__get_snapshot to verify multi-pizza progress instead of repeatedly calling configurator__get_current.',
			'Do not repeat the same tool call unless the latest tool result shows the requested state is still missing.',
			'Respond in the same language the user writes in.',
			'IMPORTANT: Only call order__place when the user explicitly asks to order, place the order, or checkout.',
			'If the user only says "add to cart", "in den Warenkorb" or similar — stop after cart__add_current_pizza. Do NOT place the order.',
			'After ordering, provide a short confirmation message to the user.',
			'',
			'## Menu knowledge',
			'',
			'Size (single-select): small=Piccola 10" €6 | medium=Media 12" €8 | large=Grande 14" €10 | family=Famiglia 16" €13',
			'Dough (single-select): classic=Classic €0 | thin=Thin Crust €0 | wholewheat=Whole Wheat +€1 | stuffed=Stuffed Crust +€2',
			'Sauce (single-select): tomato=Tomato €0 | white=Alfredo +€0.50 | pesto=Pesto +€0.50 | bbq=BBQ +€0.50 | none=No Sauce €0',
			'Cheese (multi-select): mozzarella €0 | parmesan=Parmigiano +€1 | gorgonzola +€1.50 | burrata +€2 | ricotta +€1 | vegan=Vegan Cheese +€1.50',
			'Toppings (multi-select): pepperoni +€1.50 | ham=Prosciutto +€2 | salami +€1.50 | chicken +€2 | mushrooms +€1 | olives +€1 | peppers=Bell Peppers +€1 | onions=Red Onions +€0.75 | artichokes +€1.50 | arugula +€0.75 | anchovies +€1.50 | jalapenos=Jalapeños +€1 | truffle=Truffle Oil +€3 | pineapple +€1 | tuna +€1.50 | capers +€0.75',
			'',
			'## Classic pizza presets',
			'When a user names a classic pizza, map it to these ingredients using the IDs above.',
			'You may deviate if the user asks for modifications (e.g. "extra cheese", "no onions").',
			'',
			'Margherita: sauce=tomato, cheese=[mozzarella], toppings=[]',
			'Toscana: sauce=tomato, cheese=[mozzarella], toppings=[ham, salami, mushrooms, onions]',
			'Diavola: sauce=tomato, cheese=[mozzarella], toppings=[pepperoni, jalapenos]',
			'Quattro Formaggi: sauce=white, cheese=[mozzarella, parmesan, gorgonzola, ricotta], toppings=[]',
			'Prosciutto e Funghi: sauce=tomato, cheese=[mozzarella], toppings=[ham, mushrooms]',
			'Vegetariana: sauce=pesto, cheese=[mozzarella], toppings=[peppers, onions, olives, artichokes, arugula]',
			'Capricciosa: sauce=tomato, cheese=[mozzarella], toppings=[ham, mushrooms, artichokes, olives]',
			'BBQ Chicken (house special): sauce=bbq, dough=stuffed, cheese=[mozzarella, burrata], toppings=[chicken, onions, peppers]',
			'Tartufo: sauce=white, dough=thin, cheese=[mozzarella, parmesan], toppings=[mushrooms, arugula, truffle]',
			'Hawaii: sauce=tomato, cheese=[mozzarella], toppings=[ham, pineapple]',
			'Pepperoni: sauce=tomato, cheese=[mozzarella], toppings=[pepperoni]',
			'Marinara: sauce=tomato, cheese=[] (no cheese — traditional), toppings=[olives, anchovies, capers, onions]',
			'Napoli: sauce=tomato, cheese=[mozzarella], toppings=[anchovies, capers, olives]',
			'Tonno: sauce=tomato, cheese=[mozzarella], toppings=[tuna, onions, capers]',
			'',
			'## Handling unavailable ingredients',
			'If a user requests an ingredient not in the menu, tell them it is not available and suggest the closest alternative.',
			'Ask whether to proceed with the substitution or skip it before making any tool calls.',
			'Example: "Unfortunately, we don\'t have shrimp, but we do have tuna or anchovies as alternatives. Should I take one of those?"'
		].join('\n');
	}

	// ── Send ──────────────────────────────────────────────────────────────────────
	async function send() {
		const text = inputText.trim();
		if (!text || loading) return;
		inputText = '';

		// Inject system prompt at the start of every fresh conversation
		if (apiConversation.length === 0) {
			apiConversation = [{ role: 'system', content: buildSystemPrompt() }];
		}

		addMsg('user', text);
		apiConversation = [...apiConversation, { role: 'user', content: text }];
		loading = true;

		try {
			await agentLoop();
		} catch (e) {
			addMsg('assistant', `❌ ${String(e)}`);
		} finally {
			loading = false;
		}
	}

	async function agentLoop() {
		for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
			const res = await fetch(`${apiUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: modelName,
					messages: apiConversation,
					tools: buildOpenAITools(),
					tool_choice: 'auto'
				})
			});

			if (!res.ok) {
				throw new Error(`API ${res.status}: ${await res.text()}`);
			}

			const data = await res.json();
			const choice = data.choices?.[0];
			if (!choice) throw new Error('Empty response from API');

			const assistantMsg = choice.message;
			apiConversation = [...apiConversation, assistantMsg];
			const assistantText = normalizeAssistantContent(assistantMsg.content);

			if (choice.finish_reason === 'tool_calls' && assistantMsg.tool_calls?.length) {
				if (assistantText) {
					addMsg('assistant', assistantText);
				}

				const toolNames: string[] = assistantMsg.tool_calls.map(
					(tc: { function: { name: string } }) => tc.function.name
				);
				addMsg('tool_call', '', toolNames);

				for (const toolCall of assistantMsg.tool_calls) {
					const originalName = fromOpenAIName(toolCall.function.name);
					let resultText: string;

					if (originalName && devToolRegistry.has(originalName)) {
						const { execute } = devToolRegistry.get(originalName)!;
						const params = JSON.parse(toolCall.function.arguments || '{}');
						const result = await execute(params);
						resultText = result.content[0]?.text ?? '{}';
					} else {
						resultText = JSON.stringify({
							ok: false,
							error: `Unknown tool: ${toolCall.function.name}`
						});
					}

					apiConversation = [
						...apiConversation,
						{ role: 'tool', tool_call_id: toolCall.id, content: resultText }
					];

					const preview = resultText.length > 200 ? resultText.slice(0, 200) + '…' : resultText;
					addMsg('tool_result', preview);
				}
				// Continue loop to get the model's next response
			} else {
				addMsg('assistant', assistantText || '(empty)');
				return;
			}
		}

		addMsg(
			'assistant',
			'I started the task, but the model stayed in a tool loop and did not finish cleanly. Please try again or use a model with stronger tool-calling reliability.'
		);
	}

	function clearChat() {
		messages = [];
		apiConversation = [];
		inputText = '';
		msgCounter = 0;
		configurator.reset();
		cart.clear();
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<!-- Toggle button (always visible in dev) -->
<button
	class="toggle-btn"
	onclick={() => (open = !open)}
	title="WebMCP Dev Panel (Ctrl+Shift+D)"
	aria-label="Toggle WebMCP Dev Panel"
>
	🤖
</button>

{#if open}
	<div class="panel" role="dialog" aria-label="WebMCP Dev Panel">
		<!-- Header -->
		<div class="panel-header">
			<span class="panel-title">WebMCP Dev Panel</span>
			<div class="header-actions">
				<button class="icon-btn" onclick={() => (showSettings = !showSettings)} title="Settings"
					>⚙️</button
				>
				<button class="icon-btn" onclick={clearChat} title="Start a new customer session">🗑</button
				>
				<button class="icon-btn" onclick={() => (open = false)} title="Close">✕</button>
			</div>
		</div>

		<!-- Settings panel -->
		{#if showSettings}
			<div class="settings">
				<label>
					<span>API Base URL</span>
					<input bind:value={apiUrl} placeholder="https://models.inference.ai.azure.com" />
				</label>
				<label>
					<span>API Key</span>
					<input type="password" bind:value={apiKey} placeholder="GitHub PAT or Ollama key" />
				</label>
				<label>
					<span>Model</span>
					<input bind:value={modelName} placeholder="gpt-4o-mini" />
				</label>
				<div class="settings-hints">
					<p>
						<strong>GitHub Models</strong> (Copilot): keep URL as-is, Key = GitHub PAT, Model =
						<code>gpt-4o-mini</code>
					</p>
					<p>
						<strong>LM Studio</strong>: URL = <code>http://localhost:1234/v1</code>, Key =
						<code>lm-studio</code>, Model = API identifier from LM Studio (e.g.
						<code>qwen/qwen3.5-9b</code>)
					</p>
					<p>
						<strong>Ollama</strong>: URL = <code>http://localhost:11434/v1</code>, Key =
						<code>ollama</code>, Model = <code>qwen2.5:7b</code>
					</p>
					<p>
						GitHub PAT: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener"
							>github.com/settings/tokens</a
						> — no scope required.
					</p>
				</div>
				<button class="save-btn" onclick={saveSettings}>Save</button>
			</div>
		{/if}

		<!-- Messages -->
		<div class="messages" id={MESSAGES_ELEMENT_ID}>
			{#if messages.length === 0}
				<p class="empty-hint">
					Tools registered: <strong>{devToolRegistry.size}</strong><br />Try e.g.
					<em>"Configure a Margherita and add it to the cart"</em>
				</p>
			{/if}
			{#each messages as msg (msg.id)}
				<div class="msg msg--{msg.role}">
					{#if msg.role === 'tool_call'}
						<span class="tool-badge">🔧 {msg.toolNames?.map(fromOpenAIName).join(', ')}</span>
					{:else if msg.role === 'tool_result'}
						<pre class="tool-result-pre">{msg.content}</pre>
					{:else}
						{@const thinkMatch = msg.content.match(/^\s*<think>([\s\S]*?)<\/think>\s*/i)}
						{#if thinkMatch}
							<details class="think-block">
								<summary>Thoughts</summary>
								<pre>{thinkMatch[1].trim()}</pre>
							</details>
						{/if}
						{#if msg.content.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '').trim()}
							<p>{msg.content.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '').trim()}</p>
						{/if}
					{/if}
				</div>
			{/each}
			{#if loading}
				<div class="msg msg--loading">
					<span class="dot-anim">●●●</span>
				</div>
			{/if}
		</div>

		<!-- Input -->
		<div class="input-row">
			<textarea
				bind:value={inputText}
				onkeydown={onInputKeydown}
				placeholder="Type a message… (Enter to send)"
				rows="2"
				disabled={loading}
			></textarea>
			<button class="send-btn" onclick={send} disabled={loading || !inputText.trim()}>➤</button>
		</div>
	</div>
{/if}

<style>
	.toggle-btn {
		position: fixed;
		bottom: 1.25rem;
		right: 1.25rem;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-full);
		background: var(--color-char);
		color: #fff;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		box-shadow: var(--shadow-lg);
		z-index: 9998;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform var(--transition-fast),
			background var(--transition-fast);
	}

	.toggle-btn:hover {
		background: var(--color-crust);
		transform: scale(1.08);
	}

	.panel {
		position: fixed;
		bottom: 5rem;
		right: 1.25rem;
		width: 400px;
		max-height: 620px;
		background: #fff;
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
		z-index: 9997;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		overflow: hidden;
	}

	/* Header */
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.75rem;
		background: var(--color-char);
		color: #fff;
		flex-shrink: 0;
	}

	.panel-title {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	.header-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-btn {
		background: transparent;
		border: none;
		color: #fff;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.15rem 0.3rem;
		border-radius: var(--radius-sm);
		opacity: 0.75;
		transition: opacity var(--transition-fast);
	}

	.icon-btn:hover {
		opacity: 1;
	}

	/* Settings */
	.settings {
		padding: 0.75rem;
		background: var(--color-flour);
		border-bottom: 1px solid var(--color-flour-dark);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.settings label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.settings label span {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-smoke);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.settings input {
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-family: var(--font-body);
		background: #fff;
	}

	.settings-hints {
		font-size: 0.75rem;
		color: var(--color-smoke);
		line-height: 1.4;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.settings-hints p {
		margin: 0;
	}

	.settings-hints code {
		background: var(--color-flour-dark);
		padding: 0.1em 0.25em;
		border-radius: 3px;
	}

	.settings-hints a {
		color: var(--color-crust);
	}

	.save-btn {
		align-self: flex-end;
		padding: 0.35rem 0.9rem;
		background: var(--color-crust);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.save-btn:hover {
		background: var(--color-crust-dark);
	}

	/* Messages */
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		scroll-behavior: smooth;
	}

	.empty-hint {
		margin: auto;
		text-align: center;
		color: var(--color-smoke);
		line-height: 1.6;
		font-size: var(--text-sm);
	}

	.msg {
		max-width: 90%;
	}

	.msg p {
		margin: 0;
		padding: 0.45rem 0.65rem;
		border-radius: var(--radius-md);
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.msg--user {
		align-self: flex-end;
	}

	.msg--user p {
		background: var(--color-crust);
		color: #fff;
	}

	.msg--assistant {
		align-self: flex-start;
	}

	.msg--assistant p {
		background: var(--color-flour);
		color: var(--color-char);
		border: 1px solid var(--color-flour-dark);
	}

	.msg--tool_call {
		align-self: center;
		max-width: 100%;
	}

	.tool-badge {
		display: inline-block;
		background: #fff3cd;
		color: #7a5c00;
		border: 1px solid #f0d070;
		border-radius: var(--radius-full);
		padding: 0.2rem 0.6rem;
		font-size: 0.75rem;
		font-family: monospace;
	}

	.msg--tool_result {
		align-self: stretch;
		max-width: 100%;
	}

	.tool-result-pre {
		margin: 0;
		padding: 0.4rem 0.6rem;
		background: #f4f4f4;
		border-left: 3px solid var(--color-smoke);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		font-size: 0.7rem;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		color: #444;
	}

	.think-block {
		font-size: 0.72rem;
		color: var(--color-smoke);
		margin-bottom: 0.25rem;
	}

	.think-block summary {
		cursor: pointer;
		user-select: none;
		font-style: italic;
		opacity: 0.7;
		padding: 0.1rem 0;
	}

	.think-block pre {
		margin: 0.3rem 0 0 0;
		padding: 0.4rem 0.5rem;
		background: #f9f6f0;
		border-left: 2px dashed var(--color-flour-dark);
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.4;
		color: var(--color-smoke);
	}

	.msg--loading {
		align-self: flex-start;
	}

	.dot-anim {
		display: inline-block;
		color: var(--color-smoke);
		animation: pulse 1s ease-in-out infinite;
		letter-spacing: 0.15em;
		font-size: 0.85rem;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 1;
		}
	}

	/* Input */
	.input-row {
		display: flex;
		gap: 0.4rem;
		padding: 0.5rem 0.6rem;
		border-top: 1px solid var(--color-flour-dark);
		flex-shrink: 0;
		background: var(--color-flour);
	}

	.input-row textarea {
		flex: 1;
		resize: none;
		border: 1px solid var(--color-flour-dark);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.5rem;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		line-height: 1.4;
		background: #fff;
	}

	.input-row textarea:focus {
		outline: 2px solid var(--color-crust-light);
		outline-offset: -1px;
	}

	.send-btn {
		align-self: flex-end;
		padding: 0.4rem 0.7rem;
		background: var(--color-crust);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 1rem;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.send-btn:not(:disabled):hover {
		background: var(--color-crust-dark);
	}
</style>
