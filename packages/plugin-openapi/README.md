# @rspress/plugin-openapi

Generate API reference pages from OpenAPI with native Rspress navigation, a responsive two-column layout, schema details, request examples, and an interactive playground.

## Usage

```bash
pnpm add @rspress/plugin-openapi
```

```ts
import { defineConfig } from '@rspress/core';
import { pluginOpenAPI } from '@rspress/plugin-openapi';

export default defineConfig({
  plugins: [
    pluginOpenAPI({
      input: './openapi.yaml',
      outDir: 'api',
    }),
  ],
});
```

`input` accepts a JSON/YAML path relative to the working directory, an HTTP(S) URL, or an OpenAPI 3 document object. External references are bundled at build time. Swagger 2.0 files are upgraded using Scalar's OpenAPI upgrader. OpenAPI 3.0 and 3.1 are supported; this is not a complete JSON Schema validator.

The plugin generates one page per operation and groups the sidebar under section headers using the operation's first tag. Routes use a lowercase, URL-safe operation ID, falling back to the method and path. Conflicting IDs or slugs fail the build. Generated MDX pages and `_meta.json` are written into `api` under the documentation root and discovered by Rspress's normal file-based routing.

| Option             | Default  | Description                                         |
| ------------------ | -------- | --------------------------------------------------- |
| `input`            | Required | Local file, URL, or document object                 |
| `allowPrivateUrls` | `false`  | Allow localhost/private network specification URLs  |
| `outDir`           | `api`    | Output directory relative to the documentation root |
| `sidebar`          | `true`   | Generate _meta.json in the output directory         |
| `playground`       | `true`   | Show editable request inputs and Send button        |

The plugin does not change `themeConfig.sidebar`. Use file-based `_nav.json` / `_meta.json` navigation to discover the generated sidebar, or configure links manually if your site uses `themeConfig.nav` or `themeConfig.sidebar`. Use `sidebar: false` to disable `_meta.json` generation.

Generated MDX pages are refreshed on each start/build, and removed operations are cleaned up. Handwritten pages are preserved; filename collisions fail the build. Unmodified `_meta.json` is refreshed automatically. User-edited metadata is preserved, so maintain its links yourself when operations change. Delete `_meta.json` to resume automatic generation.

Add generated MDX and `.openapi-manifest.json` to `.gitignore`; keep a customized `_meta.json` in Git. If no files need customization, ignore the entire output directory. Use separate output directories for separate specifications. Restart the dev server after changing a specification or a referenced file.

## Playground

The Send button sends a request directly from the browser. Path/query/header parameters, server URLs, JSON/text/URL-encoded bodies, API keys in headers or query strings, Bearer tokens, and Basic authentication are supported. Alternative security requirements can be selected; credentials for schemes in the selected requirement are combined.

For OAuth/OpenID Connect, paste an existing access token. Credentials remain in page memory and are never persisted. Requests time out after 30 seconds and can be cancelled. HTTP status, elapsed time, response body, and accessible response headers are displayed. API servers must allow the documentation site's origin through CORS.

Code examples use `@scalar/snippetz` for cURL, JavaScript, Go, Python, Java, C#, and Rust. Examples are generated from the same prepared request used by Send. Rspress's `CodeBlockRuntime` provides syntax highlighting and copying.

## Current limitations

- No built-in proxy, OAuth login flow, cookie authentication, or file upload UI.
- The playground supports simple path parameters, form/deepObject query parameters, and delimited query arrays. Unsupported styles produce an explicit error.
- Schema descriptions are rendered as text; embedded HTML or MDX is never executed.
- Schema trees show properties, arrays, enums, defaults, and composition branches. Recursive display and synthesized examples have bounded depth. Synthesized examples are illustrative and are not guaranteed to satisfy all constraints.
- Webhooks, callbacks, OpenAPI 3.2, and full JSON Schema validation are not implemented.
- Generated pages currently include the bundled specification. Very large specifications may increase page chunk size.

## Development example

```bash
pnpm --filter @rspress/plugin-openapi build
pnpm --filter @rspress-fixture/openapi dev
```

Open `/api/getallplanets`. The example uses `example.com` as a placeholder server; replace Server URL with an API you control. Browser tests intercept this URL and verify Send without contacting an external API.
