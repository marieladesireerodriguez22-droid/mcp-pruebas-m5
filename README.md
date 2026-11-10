# 🚀 MCP GitHub Server (Proyecto M5)

Servidor **Model Context Protocol (MCP)** desarrollado en **TypeScript** que conecta asistentes de inteligencia artificial (como Antigravity y Claude Desktop) con la API de GitHub mediante **Octokit**. Asegura validación estricta de esquemas en tiempo de ejecución con **Zod**, reintentos inteligentes ante limitaciones de tasa o fallos de red transitorios (*exponential backoff*), y una arquitectura de errores tipificada y predecible.

---

## 📌 1. Descripción del Proyecto y Qué Hace

Este proyecto implementa un servidor MCP que expone **5 herramientas (*tools*) estandarizadas** para interactuar de forma segura y automatizada con GitHub. 

El servidor opera a través del protocolo estándar de entrada/salida (`stdio`), permitiendo que cualquier cliente compatible con MCP (Antigravity, Claude Desktop, Cursor, etc.) ejecute operaciones directamente sobre repositorios, incidencias (*issues*) y archivos de código (*commits*) a partir de instrucciones en lenguaje natural.

---

## 💡 2. Por qué es Útil (Casos de Uso)

* **Automatización del flujo de desarrollo:** Creación de repositorios, configuración de ramas y despliegue de archivos mediante commits directamente desde el chat con un asistente de IA.
* **Gestión ágil de incidencias:** Consulta, filtrado y creación automatizada de *issues* en repositorios sin cambiar de ventana o contexto.
* **Resiliencia ante fallos de red y Rate Limits:** Abstracción completa de la API de GitHub con un wrapper que maneja reintentos automáticos ante *rate limits* (códigos HTTP 403/429) o errores de red (500/502/503/504) usando retroceso exponencial (*exponential backoff*).
* **Seguridad y Tipado Estricto:** Validación rigurosa de entradas antes de realizar peticiones HTTP, evitando llamadas innecesarias o malformadas hacia la API de GitHub.

---

## 💻 3. Requisitos del Sistema

* **Node.js**: Versión `>=22.19.0` (recomendado Node 22 LTS).
* **npm**: Versión `>=10.0.0` (incluido con Node.js).
* **GitHub Personal Access Token (PAT)**: Con permisos de lectura y escritura sobre repositorios.

---

## 🛠️ 4. Instalación Paso a Paso

1. **Clonar el repositorio:**
   ```bash
   git clone <url-de-tu-repositorio>
   cd PROYECTO.M5
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Compilar el proyecto TypeScript:**
   ```bash
   npm run build
   ```
   *(Esto compila el código fuente de `src/` y genera los artefactos ejecutables en `dist/`)*.

---

## ⚙️ 5. Configuración

### 5.1. Cómo obtener un GitHub Personal Access Token (PAT)
1. Inicia sesión en tu cuenta de GitHub.
2. Ve a **Settings** > **Developer settings** (al final del menú lateral izquierdo).
3. Selecciona **Personal access tokens** > **Tokens (classic)** (o *Fine-grained tokens*).
4. Haz clic en **Generate new token (classic)**.
5. Asigna una descripción (por ejemplo: `MCP-Server-M5`) y selecciona la expiración deseada.

### 5.2. Qué scopes necesita el token
* Marca la casilla **`repo`** (Control total de repositorios privados y públicos). Esto otorga permisos para:
  * `repo:status`
  * `repo_deployment`
  * `public_repo`
  * `repo:invite`
* Haz clic en **Generate token** y copia el token generado inmediatamente (no volverá a mostrarse).

### 5.3. Cómo configurar `.env`
Copia la plantilla `.env.example` en un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Abre `.env` y pega tu token:
```env
GITHUB_TOKEN=ghp_tuTokenPersonalDeGitHubAqui123456789
```

### 5.4. Cómo configurar el MCP Server en Antigravity

Antigravity lee su configuración global de MCP desde el archivo `mcp_config.json` ubicado en:
* **Windows:** `C:\Users\<TuUsuario>\.gemini\config\mcp_config.json`
* **macOS / Linux:** `~/.gemini/config/mcp_config.json`

Añade tu servidor bajo la clave `"mcpServers"`:

```json
{
  "mcpServers": {
    "mcp-pruebas-m5": {
      "command": "node",
      "args": [
        "C:/Users/Nahuel/Desktop/PROYECTO.M5/dist/server.js"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_tuTokenPersonalDeGitHubAqui123456789"
      }
    }
  }
}
```

> [!IMPORTANT]
> **Nota sobre rutas en Windows:** Usa siempre barras diagonales estándar `/` o dobles barras invertidas `\\` en las rutas del JSON (por ejemplo: `"C:/Users/Nahuel/Desktop/PROYECTO.M5/dist/server.js"`). Usar una sola barra invertida `\` provocará un error de sintaxis JSON (`Invalid escape character`).

*(Opcional: Si utilizas Claude Desktop, agrega este mismo bloque en `%APPDATA%\Claude\claude_desktop_config.json`)*.

---

## 📚 6. Documentación de Tools

Todas las entradas son validadas estrictamente con **Zod** antes de ser procesadas.

### 1. `list_repositories`
* **Descripción:** Lista los repositorios del usuario u organización autenticada según filtros de visibilidad y orden.
* **Parámetros (`ListRepositoriesInput`):**
  * `type` *(opcional, string)*: `"all"` | `"public"` | `"private"` (Por defecto: `"all"`).
  * `sort` *(opcional, string)*: `"created"` | `"updated"` | `"pushed"` | `"full_name"` (Por defecto: `"updated"`).
  * `per_page` *(opcional, number)*: Entero entre 1 y 100 (Por defecto: `30`).
* **Ejemplo de prompt:**
  > *"Lista mis últimos 5 repositorios actualizados en GitHub."*

---

### 2. `create_repository`
* **Descripción:** Crea un nuevo repositorio en GitHub para el usuario autenticado. Valida restricciones de longitud y caracteres permitidos.
* **Parámetros (`CreateRepositoryInput`):**
  * `name` *(requerido, string)*: Nombre del repositorio (entre 3 y 100 caracteres; solo alfanuméricos, guiones y guiones bajos).
  * `description` *(opcional, string)*: Descripción del repositorio (máximo 500 caracteres).
  * `private` *(opcional, boolean)*: Define si es privado (`true`) o público (`false`, por defecto).
* **Ejemplo de prompt:**
  > *"Crea un repositorio público llamado 'api-evaluacion-m5' con la descripción 'API de pruebas para módulo 5'."*

---

### 3. `create_issue`
* **Descripción:** Crea un nuevo *issue* en un repositorio específico. Realiza un *preflight check* previo para verificar que el repositorio exista y tenga las incidencias activadas.
* **Parámetros (`CreateIssueInput`):**
  * `owner` *(requerido, string)*: Dueño u organización del repositorio (ej: `"octocat"`).
  * `repo` *(requerido, string)*: Nombre del repositorio (ej: `"Hello-World"`).
  * `title` *(requerido, string)*: Título del issue (de 3 a 256 caracteres).
  * `body` *(opcional, string)*: Descripción detallada en formato Markdown.
  * `labels` *(opcional, string[])*: Lista de etiquetas existentes en el repositorio (máximo 10).
* **Ejemplo de prompt:**
  > *"Crea un issue en el repositorio 'api-evaluacion-m5' del owner 'mi-usuario' con el título 'Corregir validación de DNI' y la etiqueta 'bug'."*

---

### 4. `list_issues`
* **Descripción:** Obtiene la lista de *issues* de un repositorio filtrando por estado de apertura.
* **Parámetros (`ListIssuesInput`):**
  * `owner` *(requerido, string)*: Dueño u organización del repositorio.
  * `repo` *(requerido, string)*: Nombre del repositorio.
  * `state` *(opcional, string)*: `"open"` | `"closed"` | `"all"` (Por defecto: `"open"`).
  * `per_page` *(opcional, number)*: Entero entre 1 y 100 (Por defecto: `30`).
* **Ejemplo de prompt:**
  > *"Muéstrame los issues abiertos del repositorio 'api-evaluacion-m5' del usuario 'mi-usuario'."*

---

### 5. `create_commit`
* **Descripción:** Crea o actualiza un archivo de texto en una rama realizando un commit atómico completo. Abstrae internamente los 6 pasos requeridos por la Git Data API de GitHub:
  1. `getRef`: Obtiene la referencia y el SHA base de la rama.
  2. `getCommit`: Obtiene el árbol (`tree`) base del commit actual.
  3. `createBlob`: Sube el contenido codificado en Base64.
  4. `createTree`: Genera el nuevo árbol incorporando el nuevo blob.
  5. `createCommit`: Crea el objeto commit apuntando al árbol y a su commit padre.
  6. `updateRef`: Actualiza la referencia de la rama hacia el nuevo commit.
* **Parámetros (`CreateCommitInput`):**
  * `owner` *(requerido, string)*: Dueño del repositorio.
  * `repo` *(requerido, string)*: Nombre del repositorio.
  * `path` *(requerido, string)*: Ruta interna del archivo sin barra inicial (ej: `"src/index.ts"`, `"README.md"`).
  * `content` *(requerido, string)*: Contenido completo del archivo.
  * `message` *(requerido, string)*: Mensaje del commit.
  * `branch` *(opcional, string)*: Rama de destino. Si se omite, usa la rama por defecto del repositorio.
* **Ejemplo de prompt:**
  > *"Crea un archivo 'README.md' en el repositorio 'api-evaluacion-m5' del usuario 'mi-usuario' con el contenido '# Bienvenido a mi API' y mensaje de commit 'docs: add readme'."*

---

## 🎯 7. Ejemplos de Uso Extremo a Extremo (Flujos Completos)

Para demostrar cómo interactúan las herramientas en escenarios reales, el asistente puede encadenar las tools en los siguientes flujos de trabajo:

### Flujo A: Inicialización y Despliegue de un Proyecto
1. **Paso 1 (Inspección previa):** El usuario pide revisar si el repositorio ya existe:
   > *"Verifica en mi lista de repositorios si ya tengo alguno llamado 'frontend-dashboard'."*  
   *(Ejecuta `list_repositories`)*.
2. **Paso 2 (Creación):** Al confirmar que no existe, se solicita crearlo:
   > *"Crea el repositorio público 'frontend-dashboard' con la descripción 'Panel administrativo en React'."*  
   *(Ejecuta `create_repository`)*.
3. **Paso 3 (Primer commit):** Se sube el archivo de inicio:
   > *"Crea el archivo 'index.html' en 'frontend-dashboard' con una estructura básica HTML5 y mensaje 'feat: initial template'."*  
   *(Ejecuta `create_commit`)*.

---

### Flujo B: Gestión y Seguimiento de Incidencias
1. **Paso 1 (Auditoría de tareas):**
   > *"¿Cuáles son los issues abiertos en mi repositorio 'frontend-dashboard'?"*  
   *(Ejecuta `list_issues`)*.
2. **Paso 2 (Registro de nuevo bug detectado):**
   > *"Crea un nuevo issue en 'frontend-dashboard' titulado 'Fallo en renderizado móvil' con la descripción 'Los botones no responden en pantallas menores a 480px'."*  
   *(Ejecuta `create_issue` tras validar con preflight que el repo existe y tiene issues habilitados)*.

---

## 🏗️ 8. Arquitectura del Proyecto

### Diagrama de Arquitectura de Componentes

```mermaid
flowchart TD
    subgraph Cliente["Cliente MCP (Host)"]
        IA["Asistente LLM (Antigravity / Claude)"]
    end

    subgraph MCP["Servidor MCP (PROYECTO.M5)"]
        direction TB
        Transport["StdioServerTransport\n(stdin / stdout)"]
        Router["Request Router\n(tools/list & tools/call)"]
        Validation["Esquemas Zod\n(Parse & Preflight Checks)"]
        Logger["Logger del Sistema\n(Salida estricta a stderr)"]
        Ops["GitHub Operations\n(Abstracción de bajo nivel con Exponential Backoff)"]
    end

    subgraph GitHub["GitHub Cloud API"]
        Octokit["@octokit/rest"]
        API["REST & Git Data API"]
    end

    IA <-->|"JSON-RPC por stdio"| Transport
    Transport <--> Router
    Router --> Validation
    Validation --> Ops
    Ops --> Logger
    Ops <-->|"Reintentos con Backoff"| Octokit
    Octokit <-->|"HTTPS"| API
```

### Estructura de Directorios

```plaintext
PROYECTO.M5/
├── dist/                      # Código JavaScript compilado (salida de build)
├── src/
│   ├── errors/                # Jerarquía de errores (AppError, ValidationError, GitHubAPIError)
│   ├── github/
│   │   ├── client.ts          # Creación del cliente Octokit con configuración de autenticación
│   │   └── operations.ts      # Operaciones sobre GitHub y lógica de commit de 6 pasos
│   ├── schemas/               # Esquemas Zod y tipado estricto de cada tool
│   ├── tools/                 # Implementación modular de las 5 tools MCP
│   │   ├── create-commit.ts
│   │   ├── create-issue.ts
│   │   ├── create-repository.ts
│   │   ├── list-issues.ts
│   │   └── list-repositories.ts
│   ├── utils/
│   │   ├── logging.ts         # Logging seguro hacia stderr (sin corromper stdout)
│   │   └── retry.ts           # Algoritmo de reintentos exponenciales
│   ├── server.ts              # Punto de entrada principal y registro de handlers MCP
│   └── types.ts               # Definición de interfaces comunes
├── tests/                     # Suite de pruebas unitarias con Vitest
│   ├── errors.test.ts
│   ├── github.test.ts
│   └── tools.test.ts
├── .env                       # Credenciales locales (ignorado en git)
├── .env.example               # Plantilla pública sin datos sensibles
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración de TypeScript para Node.js
└── vitest.config.ts           # Configuración de pruebas
```

---

## 🧪 9. Cómo Ejecutar Tests

El proyecto implementa una suite de pruebas unitarias completa con **Vitest**, que valida esquemas Zod, transformación de errores y mocking de respuestas de Octokit.

* **Ejecutar todos los tests (modo CI):**
  ```bash
  npm run test
  ```

* **Ejecutar tests en modo interactivo (watch):**
  ```bash
  npm run test:watch
  ```

* **Verificación de tipos (Linting / Typecheck):**
  ```bash
  npm run lint
  ```

> [!NOTE]
> La suite de pruebas cuenta con **29 tests unitarios pasando exitosamente** distribuidos en 3 archivos de prueba (`tools.test.ts`, `github.test.ts`, `errors.test.ts`), superando el mínimo requerido de 8 tests.

---

## 🛠️ 10. Troubleshooting Común

1. **Error de sintaxis JSON en `mcp_config.json`:**
   * *Causa:* En Windows se utilizó una sola barra invertida `\` (ej: `C:\Users\...`).
   * *Solución:* Reemplaza por barras normales `/` (`C:/Users/...`) o escapa con doble barra `\\` (`C:\\Users\\...`).

2. **Error `Bad credentials` o `AUTH_ERROR`:**
   * *Causa:* El token de GitHub en `.env` o en la configuración MCP ha expirado o le falta el scope `repo`.
   * *Solución:* Genera un nuevo Personal Access Token (classic) con el scope `repo` marcado y actualiza la variable `GITHUB_TOKEN`.

3. **Desconexión o congelamiento del cliente MCP:**
   * *Causa:* Enviar información de logs o texto no JSON por `stdout`.
   * *Solución:* El servidor garantiza que todo log pasa por `logger` hacia `stderr` (`src/utils/logging.ts`). Nunca uses `console.log` directamente en el código del servidor.

4. **Error `Cannot find module dist/server.js`:**
   * *Causa:* Intentar iniciar el servidor sin haber compilado previamente el código TypeScript.
   * *Solución:* Ejecuta `npm run build` antes de conectar el servidor.

---

## 🎓 11. Presentación y Defensa del Proyecto

### 11.1. Estructura Sugerida de Diapositivas (Slides)
* **Slide 1: Portada:** Título del proyecto, tu nombre y fecha.
* **Slide 2: Problema y Solución:** Limitaciones de un LLM aislado vs. integración con herramientas reales vía Model Context Protocol (MCP).
* **Slide 3: Arquitectura Técnica:** Presentación del diagrama de arquitectura (stdio, Zod, Octokit, stderr).
* **Slide 4: Catálogo de Tools:** Detalle de las 5 herramientas (2 de lectura y 3 de escritura).
* **Slide 5: Robustez y Resiliencia:** Estrategia de reintentos (*exponential backoff*), preflight checks y jerarquía de errores.
* **Slide 6: Calidad de Software:** 29 tests unitarios con Vitest y validación estricta de esquemas.

### 11.2. Guion para la Demostración en Vivo (Live Demo)
1. Abrir Antigravity o Claude Desktop y mostrar que el servidor `mcp-pruebas-m5` está activo en el menú de tools.
2. Pedir al modelo: *"Lista mis repositorios más recientes"* (`list_repositories`).
3. Solicitar la creación de un nuevo issue o consulta de issues en uno de tus repos (`create_issue` o `list_issues`).
4. Demostrar el manejo de errores pidiendo una operación con parámetros inválidos (ej. un nombre de repositorio inválido) para evidenciar que Zod rechaza la petición con un mensaje de error claro y estructurado.

### 11.3. Preguntas Técnicas Clave y Respuestas
* **P: ¿Por qué los logs se envían estrictamente a `stderr`?**
  * *R:* El protocolo MCP utiliza `stdout` como canal de comunicación exclusivo para tramas JSON-RPC. Cualquier salida de texto plano en `stdout` corrompe el mensaje y aborta la conexión con el cliente.
* **P: ¿Cómo funciona el proceso de 6 pasos en `create_commit`?**
  * *R:* La Git Data API no tiene un endpoint "subir archivo y commitear". Requiere: 1) `getRef` para leer el SHA de la rama, 2) `getCommit` para obtener el árbol base, 3) `createBlob` con el contenido en base64, 4) `createTree` para incorporar el blob en el árbol, 5) `createCommit` para asociar el nuevo commit al commit padre, y 6) `updateRef` para mover el puntero de la rama.

---

## 📄 12. Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](file:///c:/Users/Nahuel/Desktop/PROYECTO.M5/LICENSE) para más detalles.
