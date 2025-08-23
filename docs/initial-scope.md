# Browser MCP Server — Initial Scope & Technical Solution

## Scope (v0.1)

### In Scope
- Basic navigation (`navigate`, `reload`, `goBack`, `goForward`).
- Element interactions (`click`, `type`, `fill`, `pressKey`).
- Wait helpers (`waitForSelector`, `waitForTimeout`).
- Page evaluation (`evaluate` arbitrary JS).
- Content inspection (`getTitle`, `getUrl`, `getContent`).
- Screenshots (`screenshot` full or viewport).
- Lifecycle control (`newPage`, `closePage`).
- One `cdp()` passthrough tool for advanced raw CDP calls.

### Out of Scope (future work)
- File uploads & downloads.
- Network mocking and request interception.
- Multi-context or multi-browser sessions.
- Video recording, tracing, performance metrics.
- Built-in authentication helpers.

---

## Technical Solution

### Language & Runtime
- **Node.js (>=18)** with **TypeScript**.
- MCP SDK: `@modelcontextprotocol/sdk`.
- Browser automation: **Playwright** (`chromium`).

### Architecture
- MCP Server process communicates with the Agent over **stdio** transport.
- On startup, connect to:
  - An existing Chrome session via **CDP** (`chromium.connectOverCDP`), OR
  - Launch a new Chromium instance (headed by default).
- Maintain a singleton **Page** object representing the current tab.

### MCP Tools (v0.1)

| Tool        | Description                                | Input Params |
|-------------|--------------------------------------------|--------------|
| `navigate`  | Navigate to a URL                          | `{ url: string }` |
| `click`     | Click element by selector                  | `{ selector: string }` |
| `type`      | Type text into input                       | `{ selector: string, text: string, clear?: boolean }` |
| `waitFor`   | Wait for selector to match state           | `{ selector: string, state?: "visible"|"attached" }` |
| `evaluate`  | Run JavaScript expression in page context  | `{ expression: string }` |
| `screenshot`| Capture screenshot (PNG base64)            | `{ fullPage?: boolean }` |
| `getTitle`  | Return current page title                  | none |
| `getUrl`    | Return current page URL                    | none |
| `getContent`| Return current HTML                        | none |
| `newPage`   | Open new tab                               | none |
| `closePage` | Close current tab                          | none |
| `cdp`       | Send raw CDP method                        | `{ domain: string, method: string, params?: object }` |

### Example Flow
1. Agent calls `navigate` → MCP instructs Playwright to `page.goto(url)`.
2. Agent calls `waitFor` to ensure a selector is visible.
3. Agent calls `click` or `type` to interact.
4. Agent calls `screenshot` to verify result.

### Security Considerations
- By default, connect only to **localhost Chrome instance**.
- Allow restricting which URLs are navigable.
- Consider adding **read-only mode** (disallow `click/type`) for audit tasks.

---

## Next Steps
- Implement prototype MCP server with Playwright wrapper.
- Test with Cursor Agent by registering as external MCP server.
- Iterate toolset based on real testing scenarios.
