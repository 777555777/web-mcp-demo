// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface WebMCPTool {
		name: string;
		description: string;
		inputSchema: {
			type: 'object';
			additionalProperties?: boolean;
			properties?: Record<
				string,
				{
					type?: string;
					description?: string;
					enum?: string[];
					minimum?: number;
					maximum?: number;
				}
			>;
			required?: string[];
		};
		annotations?: Record<string, unknown>;
		execute: (params: Record<string, unknown>) => unknown | Promise<unknown>;
	}

	interface ModelContext {
		registerTool: (tool: WebMCPTool) => void;
		unregisterTool: (toolName: string) => void;
		provideContext: (context: { tools: WebMCPTool[] }) => void;
		clearContext: () => void;
	}

	interface Navigator {
		modelContext?: ModelContext;
	}

	// WebMCP declarative HTML attributes
	// See: https://developer.chrome.com/docs/web-platform/webmcp
	interface WebMCPFormAttributes {
		toolname?: string;
		tooldescription?: string;
		toolautosubmit?: boolean | '';
	}

	interface WebMCPParamAttributes {
		toolparamtitle?: string;
		toolparamdescription?: string;
	}

	namespace svelteHTML {
		// Extend Svelte's HTML attributes to include WebMCP attributes for forms and parameters
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		interface HTMLAttributes<T> extends WebMCPFormAttributes, WebMCPParamAttributes {}
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
