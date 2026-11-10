import type { McpTool } from "../types.js";
import type { GitHubOperations } from "../github/operations.js";
import { CreateRepositorySchema, toJsonSchema } from "../schemas/index.js";
import { fromZodError, fail } from "../errors/index.js";

export function createRepositoryTool(github: GitHubOperations): McpTool {
    return {
        definition: {
            name: "create_repository",
            description: "Crea un nuevo repositorio en GitHub para el usuario autenticado.",
            inputSchema: toJsonSchema(CreateRepositorySchema),
        },

        async handler(args) {
            const parsed = CreateRepositorySchema.safeParse(args);
            if (!parsed.success) return fail("create_repository", fromZodError(parsed.error));

            try {
                const repository = await github.createRepository(parsed.data);
                const data = { repository };
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
            } catch (err) {
                return fail("create_repository", err);
            }
        },
    };
}