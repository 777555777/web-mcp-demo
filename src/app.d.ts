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
		execute: (params: Record<string, unknown>) => unknown | Promise<unknown>;
	}

	interface ModelContext {
		registerTool: (tool: WebMCPTool) => void;
		unregisterTool?: (toolName: string) => void;
	}

	interface Navigator {
		modelContext?: ModelContext;
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
