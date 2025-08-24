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

| Tool        | Description                                | Input Params | Status |
|-------------|--------------------------------------------|--------------| ------- |
| `navigate`  | Navigate to a URL                          | `{ url: string }` | ✅ Implemented |
| `click`     | Click element by selector                  | `{ selector: string }` | ✅ Implemented |
| `type`      | Type text into input                       | `{ selector: string, text: string, clear?: boolean }` | ⏳ Planned |
| `waitFor`   | Wait for selector to match state           | `{ selector: string, state?: "visible"|"attached" }` | ⏳ Planned |
| `evaluate`  | Run JavaScript expression in page context  | `{ expression: string }` | ✅ Implemented |
| `reload`    | Reload the current page                    | `{ waitUntil?: string, timeout?: number }` | ✅ Implemented |
| `screenshot`| Capture screenshot (PNG base64)            | `{ fullPage?: boolean }` | ✅ Implemented |
| `getTitle`  | Return current page title                  | none | ⏳ Planned |
| `getUrl`    | Return current page URL                    | none | ⏳ Planned |
| `getContent`| Return current HTML                        | none | ✅ Implemented |
| `newPage`   | Open new tab                               | none | ⏳ Planned |
| `closePage` | Close current tab                          | none | ⏳ Planned |
| `cdp`       | Send raw CDP method                        | `{ domain: string, method: string, params?: object }` | ⏳ Planned |

### Additional Implemented Tools
| Tool            | Description                                | Input Params | 
|-----------------|--------------------------------------------|--------------| 
| `getConsoleLogs`| Retrieve browser console messages         | `{ clear?: boolean, logType?: string }` |

### Implementation Status
**✅ Completed (7/13 core tools):** `navigate`, `click`, `evaluate`, `reload`, `screenshot`, `getContent`, plus `getConsoleLogs`

**🎯 Focus Areas Completed:**
- **Navigation**: Basic page navigation and refresh
- **Content Inspection**: HTML content, screenshots, console logs
- **Diagnostic Tools**: JavaScript evaluation, page state inspection  
- **Basic Interaction**: Element clicking

**⏳ Remaining Priority Tools:**
- **Information Gathering**: `getTitle`, `getUrl` (quick wins)
- **Advanced Interaction**: `type`, `waitFor` (form handling)
- **Tab Management**: `newPage`, `closePage` (multi-tab scenarios)
- **Advanced**: `cdp` (raw browser control)

### Example Flows

**Original Vision (Testing Focus):**
1. Agent calls `navigate` → MCP instructs Playwright to `page.goto(url)`.
2. Agent calls `waitFor` to ensure a selector is visible.  
3. Agent calls `click` or `type` to interact.
4. Agent calls `screenshot` to verify result.

**Current Implementation (Diagnostic Focus):**
1. Agent calls `navigate` → Navigate to problematic page
2. Agent calls `evaluate` → Inspect JavaScript state and DOM  
3. Agent calls `getConsoleLogs` → Check for runtime errors
4. Agent calls `reload` → Test persistence of issues
5. Agent calls `screenshot` → Capture visual evidence

### Security Considerations
- By default, connect only to **localhost Chrome instance**.
- Allow restricting which URLs are navigable.
- Consider adding **read-only mode** (disallow `click/type`) for audit tasks.

---

## Next Steps
- Implement prototype MCP server with Playwright wrapper.
- Test with Cursor Agent by registering as external MCP server.
- Iterate toolset based on real testing scenarios.
