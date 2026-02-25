# WebMCP Integration Strategy for Forno Antico (Concept)

## 1) What is known vs. still moving

### Confirmed signals

- WebMCP is publicly announced by Chrome as an **early preview** (not broadly stable yet).
- Public messaging describes two API styles:
  - **Declarative** (form-based exposure)
  - **Imperative** (`navigator.modelContext.registerTool(...)` style registration)
- Goal is structured agent interaction that is faster and more reliable than DOM-only automation.

### Not yet fully stable (treat as provisional)

- Exact API names, attribute names, and event contract may evolve before stable launch.
- Manifest shape and discovery behavior may change.
- Cross-agent interoperability outside Chrome ecosystem is uncertain.

## 2) Product fit for this app

For this app, WebMCP is a strong fit because your UX already maps to explicit actions:

- Configure pizza selections
- Price preview
- Add to cart
- Modify cart quantity
- Clear cart
- Place order

These actions are deterministic, schema-friendly, and already represented in `configurator` and `cart` state modules.

## 3) Recommended architecture

Use a **dual-path architecture**:

1. **Declarative path (Phase 1)**
   - Expose key user forms/controls as declarative WebMCP tools.
   - Fastest to prototype; lowest engineering cost.

2. **Imperative path (Phase 2)**
   - Register explicit high-value tools for robust agent execution.
   - Best for dynamic interactions and batching.

3. **Manifest discovery (Phase 3)**
   - Add site-level and page-level manifests for pre-navigation planning.

### Internal adapter layer (important)

Create one internal abstraction (example: `src/lib/webmcp/adapter.ts`) so the app never directly depends everywhere on unstable preview APIs.

This adapter should:

- Feature-detect WebMCP availability.
- Register/unregister tools in one place.
- Validate input/output with schemas.
- Map tool calls to your existing state actions.

## 4) Tool inventory for this app

Keep tool surface minimal and task-oriented.

## 4.1 Read/Discovery tools

### `menu.get_catalog`

**Description:** Return categories, ingredients, prices, and selection rules.

### `cart.get_snapshot`

**Description:** Return current cart items, totals, and item count.

### `configurator.get_current`

**Description:** Return current in-progress pizza selections and computed total.

## 4.2 Mutation tools

### `configurator.set_selection`

**Description:** Set or toggle an ingredient in a given category.

### `configurator.reset`

**Description:** Reset configurator to defaults.

### `cart.add_current_pizza`

**Description:** Convert current configurator state to pizza config and add to cart.

### `cart.update_item_quantity`

**Description:** Update quantity for a cart item.

### `cart.remove_item`

**Description:** Remove a cart item from cart.

### `cart.clear`

**Description:** Clear entire cart.

### `order.place`

**Description:** Place order from cart and return order summary.

## 4.3 Optional convenience tools (later)

### `order.build_and_add_pizza`

Single high-level action that applies selections and adds to cart in one call.

### `cart.bulk_update`

Batch quantity updates for multiple cart lines in one tool call.

## 5) Proposed schema strategy

Use JSON Schema 2020-12 style (or whichever final WebMCP expects) and keep schemas strict.

## 5.1 Shared primitives

```json
{
	"$defs": {
		"CategoryId": { "type": "string", "enum": ["size", "dough", "sauce", "cheese", "toppings"] },
		"IngredientId": { "type": "string" },
		"PizzaId": { "type": "string" },
		"CartQuantity": { "type": "integer", "minimum": 0, "maximum": 20 }
	}
}
```

## 5.2 Example input schemas

### `configurator.set_selection` input

```json
{
	"type": "object",
	"additionalProperties": false,
	"properties": {
		"categoryId": { "$ref": "#/$defs/CategoryId" },
		"ingredientId": { "$ref": "#/$defs/IngredientId" },
		"mode": { "type": "string", "enum": ["set", "toggle"] }
	},
	"required": ["categoryId", "ingredientId"]
}
```

### `cart.update_item_quantity` input

```json
{
	"type": "object",
	"additionalProperties": false,
	"properties": {
		"pizzaId": { "$ref": "#/$defs/PizzaId" },
		"quantity": { "$ref": "#/$defs/CartQuantity" }
	},
	"required": ["pizzaId", "quantity"]
}
```

## 5.3 Example output envelope (all tools)

```json
{
	"type": "object",
	"additionalProperties": false,
	"properties": {
		"ok": { "type": "boolean" },
		"message": { "type": "string" },
		"data": {},
		"error": {
			"type": "object",
			"properties": {
				"code": { "type": "string" },
				"details": { "type": "string" }
			},
			"required": ["code"]
		}
	},
	"required": ["ok"]
}
```

Recommendation: standardize on this envelope so agents get predictable success/error handling.

## 6) Naming and description conventions

Use `domain.verb_noun` pattern and descriptions that say:

1. when to use the tool,
2. what side effects occur,
3. what success looks like.

Example:

- Name: `cart.add_current_pizza`
- Description: "Adds the currently configured pizza to the cart, increments cart item count, and returns updated cart totals. Use after setting desired selections."

## 7) Agent workflow design

A robust default workflow for this app:

1. `menu.get_catalog`
2. `configurator.get_current`
3. One or more `configurator.set_selection`
4. `cart.add_current_pizza`
5. `cart.get_snapshot`
6. Optional `cart.update_item_quantity`
7. `order.place`

## 7.1 Example natural-language task mapping

User: “Add a large thin crust pizza with mozzarella, mushrooms, olives, and truffle oil, quantity 2, then place order.”

Agent plan:

- Discover valid category + ingredient ids via `menu.get_catalog`
- Apply selections via repeated `configurator.set_selection`
- Add configured pizza to cart via `cart.add_current_pizza`
- Set quantity via `cart.update_item_quantity`
- Place order via `order.place`

## 8) Security and governance model

Even for a demo app, define guardrails now:

- Tool allowlist per page/route.
- Input validation before state mutation.
- Rate limit mutation tools.
- Idempotency key support for `order.place`.
- No exposure of sensitive fields/secrets.
- Return minimal data needed for next action.

For future production e-commerce:

- Require authenticated session + CSRF/session checks.
- Add policy checks per tool (can user perform action?).
- Add audit logs for all agent-invoked mutations.

## 9) Observability and evaluation

Track these metrics from day one:

- Tool discovery success rate
- Tool call success/error rate by tool name
- Median tool latency
- Multi-step task completion rate
- User correction rate after agent actions

Also store a lightweight "agent trace" (sequence of tool calls + results) for debugging.

## 10) Implementation roadmap (phased)

## Phase 0 — Design hardening (1–2 days)

- Finalize tool list and schemas.
- Define stable tool naming + error code taxonomy.
- Build adapter API shape in code (behind feature flag).

## Phase 1 — Declarative MVP (2–3 days)

- Annotate key UI forms/controls for declarative tooling.
- Add page-level metadata for configurator and order pages.
- Add basic agent feedback channel handling.

Success criteria:

- Agent can discover and complete “build pizza + add to cart” via declarative path.

## Phase 2 — Imperative core tools (3–5 days)

- Implement `navigator.modelContext` registration via adapter.
- Register 6–8 core tools (listed above).
- Add strict runtime validation and uniform result envelope.

Success criteria:

- Agent can complete end-to-end order flow without DOM fallback.

## Phase 3 — Manifest + workflow optimization (2–4 days)

- Add site-level `.well-known` manifest (if/when supported shape is stable).
- Add route-level intent metadata.
- Add optional batch tools (`order.build_and_add_pizza`, `cart.bulk_update`).

Success criteria:

- Agent pre-plans tasks with fewer discovery roundtrips.

## Phase 4 — Hardening (ongoing)

- Rate limiting, audit logging, policy enforcement.
- Regression tests for tool contracts.
- Backward compatibility versioning for schemas.

## 11) Suggested initial tool contract set (v0.1)

- `menu.get_catalog`
- `configurator.get_current`
- `configurator.set_selection`
- `configurator.reset`
- `cart.add_current_pizza`
- `cart.get_snapshot`
- `cart.update_item_quantity`
- `cart.remove_item`
- `cart.clear`
- `order.place`

This is enough to support high-value workflows while keeping integration manageable.

## 12) Key strategic decisions to make now

1. **Canonical source of truth** for schemas (single TS/JSON source, generated where needed).
2. **Versioning policy** (`v0.1`, `v0.2`...) for tool compatibility.
3. **Fallback policy** when WebMCP unavailable (normal UI path).
4. **Scope policy** for what should never be exposed as tools.

---

## Sources reviewed

- Local summary: `webmcp-video.md`
- Local article: `webmcp-article-1.txt`
- Public signal: Chrome blog early preview post and related Chrome 146 pages
