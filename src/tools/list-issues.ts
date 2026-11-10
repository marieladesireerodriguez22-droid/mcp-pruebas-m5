import type { McpTool } from "../types.js";
import type { GitHubOperations } from "../github/operations.js";
import { ListIssuesSchema, toJsonSchema } from "../schemas/index.js";
import { fromZodError, fail } from "../errors/index.js";

export function listIssuesTool(github: GitHubOperations): McpTool {
    return {
        definition: {
            name: "list_issues",
            description: "Lista los issues de un repositorio de GitHub con filtros opcionales por estado.",
            inputSchema: toJsonSchema(ListIssuesSchema),
        },

        async handler(args) {
            const parsed = ListIssuesSchema.safeParse(args);
            if (!parsed.success) return fail("list_issues", fromZodError(parsed.error));

            try {
                const issues = await github.listIssues(parsed.data);
                const data = { issues };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
            } catch (err) {
                return fail("list_issues", err);
            }
        },
    };
}