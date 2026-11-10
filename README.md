# 🚀 MCP GitHub Server (Proyecto M5)

Servidor **Model Context Protocol (MCP)** desarrollado en **TypeScript** que conecta asistentes de inteligencia artificial con la API de GitHub mediante **Octokit**, asegurando validación estricta de esquemas con **Zod**, reintentos inteligentes ante limitaciones de tasa o red (*exponential backoff*) y una arquitectura de errores tipificada y predecible.

---

## 📌 1. Descripción del Proyecto y Qué Hace
Este proyecto implementa un servidor MCP que expone 5 herramientas (*tools*) estandarizadas para interactuar de forma segura y automatizada con GitHub. El servidor opera a través de la entrada/salida estándar (`stdio`), permitiendo que clientes compatibles con MCP ejecuten operaciones directamente sobre repositorios, issues y commits a partir de comandos conversacionales.

---

## 💡 2. Por qué es Útil (Casos de Uso)
* **Automatización del flujo de desarrollo:** Creación de repositorios y despliegue de archivos mediante commits directamente desde el chat con un LLM.
* **Gestión centralizada de incidencias:** Creación y consulta de *issues* en repositorios de forma rápida y estructurada.
* **Resiliencia y robustez:** Abstracción completa de la API de GitHub mediante un wrapper que maneja reintentos automáticos ante *rate limits* o errores transitorios, traduciendo códigos HTTP complejos en sugerencias claras (`hint` y `action`) para el agente.

---

## 💻 3. Requisitos del Sistema
* **Node.js**: Versión `>=22.19.0`
* **npm** (incluido con Node.js)
* Un **GitHub Personal Access Token (PAT)** con permisos de repositorio.

---

## 🛠️ 4. Instalación Paso a Paso

1. **Clonar el repositorio:**
   ```bash
   git clone <url-de-tu-repositorio>
   cd PROYECTO.M5
Instalar dependencias:

Bash
npm install
Compilar el proyecto TypeScript:

Bash
npm run build
⚙️ 5. Configuración
1. Cómo obtener un GitHub Personal Access Token (PAT)
Dirígete a tu cuenta de GitHub en Settings > Developer settings > Personal access tokens.

Selecciona Tokens (classic) o Fine-grained tokens.

2. Qué scopes necesita el token
repo (Control total de repositorios públicos y privados, necesario para crear repos, issues y commits).

3. Cómo configurar .env
Crea un archivo .env en la raíz del proyecto basándote en .env.example:

Fragmento de código
GITHUB_TOKEN=tu_token_personal_de_github_aqui
4. Cómo configurar el MCP Server en tu cliente (ej. Antigravity)
Añade la configuración del servidor en el archivo JSON de tu cliente MCP:

JSON
{
  "mcpServers": {
    "github-mcp": {
      "command": "node",
      "args": ["C:/ruta/a/PROYECTO.M5/dist/server.js"],
      "env": {
        "GITHUB_TOKEN": "tu_token_personal_de_github_aqui"
      }
    }
  }
}
📚 6. Documentación de Tools
Todas las entradas de las herramientas se validan estrictamente en tiempo de ejecución utilizando Zod (src/schemas/index.ts).

1. list_repositories
Descripción: Lista los repositorios del usuario u organización autenticada según filtros de tipo y orden.

Parámetros (ListRepositoriesInput):

type (opcional): "all" | "public" | "private" (Por defecto: "all")

sort (opcional): "created" | "updated" | "pushed" | "full_name" (Por defecto: "updated")

per_page (opcional): number entre 1 y 100 (Por defecto: 30)

Prompt que funciona bien: "Lista mis últimos 10 repositorios actualizados en GitHub."

2. create_repository
Descripción: Crea un nuevo repositorio en GitHub con validación estricta de nombres.

Parámetros (CreateRepositoryInput):

name (requerido): string (3-100 caracteres; solo alfanuméricos, guiones y guiones bajos).

description (opcional): string (máximo 500 caracteres).

private (opcional): boolean (Por defecto: false).

Prompt que funciona bien: "Crea un repositorio público llamado mi-nueva-app-m5 con la descripción 'Servidor MCP de prueba'."

3. create_issue
Descripción: Crea un nuevo issue en un repositorio específico.

Parámetros (CreateIssueInput):

owner (requerido): string (Dueño u organización, ej: octocat).

repo (requerido): string (Nombre del repositorio, ej: Hello-World).

title (requerido): string (Título del issue, de 3 a 256 caracteres).

body (opcional): string (Descripción en formato Markdown).

labels (opcional): string[] (Etiquetas existentes en el repo, máx. 10).

Prompt que funciona bien: "Crea un issue en mi repositorio mi-nueva-app-m5 del usuario tu-usuario con el título 'Bug en la autenticación' y etiqueta 'bug'."

4. list_issues
Descripción: Obtiene la lista de issues de un repositorio filtrando por estado.

Parámetros (ListIssuesInput):

owner (requerido): string.

repo (requerido): string.

state (opcional): "open" | "closed" | "all" (Por defecto: "open").

per_page (opcional): number (1 a 100).

Prompt que funciona bien: "Muéstrame todos los issues abiertos en el repositorio Hello-World de octocat."

5. create_commit
Descripción: Crea o actualiza un archivo de texto realizando un commit completo. Abstrae internamente los 6 pasos de Git de bajo nivel (src/github/operations.ts):

getRef (obtiene el SHA base de la rama).

getCommit (obtiene el tree de referencia).

createBlob (sube el contenido en Base64).

createTree (genera el nuevo árbol de archivos).

createCommit (registra el commit con su padre).

updateRef (actualiza la referencia de la rama de forma segura).

Parámetros (CreateCommitInput):

owner (requerido): string.

repo (requerido): string.

path (requerido): string (Ruta interna sin / al inicio, ej: docs/notas.md).

content (requerido): string (Contenido de texto completo del archivo).

message (requerido): string (Mensaje del commit).

branch (opcional): string (Rama de destino; si se omite, utiliza la rama principal por defecto).

Prompt que funciona bien: "Crea un commit en el repositorio mi-nueva-app-m5 en el archivo README.md con el texto '# Hola Mundo' y el mensaje 'Commit inicial'."

🧪 7. Cómo Ejecutar Tests
El proyecto cuenta con una amplia suite de pruebas utilizando Vitest (validación de schemas, operaciones con mocks y transformación de errores):

Ejecutar tests una vez:

Bash
npm run test
Ejecutar tests en modo watch (desarrollo):

Bash
npm run test:watch
📐 8. Estructura y Arquitectura del Proyecto
Plaintext
PROYECTO.M5/
├── src/
│   ├── errors/           # Jerarquía de errores (AppError, ValidationError, etc.)
│   ├── github/           # Cliente Octokit y operaciones de bajo nivel (6 pasos)
│   ├── schemas/          # Contratos Zod e inferencia de tipos
│   ├── tools/            # Implementación de cada herramienta MCP expuesta
│   └── utils/            # Utilidades (logging a stderr, retry, server y types)
├── .env                  # Variables locales (ignoradas por git)
├── .env.example          # Plantilla de variables de entorno
└── package.json          # Configuración de dependencias y scripts de ejecución
🛠️ 9. Troubleshooting Común
Error de compilación TypeScript: Asegúrate de ejecutar npm run build para compilar los tipos actualizados en la carpeta dist/.

Error de Autenticación (AuthenticationError / Bad credentials): Verifica que la variable GITHUB_TOKEN esté configurada correctamente en tu archivo .env o en la configuración de tu cliente MCP y que el token no haya vencido.

Interferencia en la comunicación MCP: Todo registro de log del servidor se envía estrictamente a stderr (src/utils/logging.ts) para evitar corromper los mensajes JSON-RPC que fluyen por stdout.

📄 10. Licencia
Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.