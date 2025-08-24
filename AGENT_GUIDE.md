# Browser MCP Server - Agent Guide

## Overview
This MCP server provides browser automation capabilities using a headed Chromium instance. You can navigate web pages, interact with elements, capture content, and monitor browser activity.

## Connection
- **Transport**: SSE (Server-Sent Events)
- **Default URL**: `http://localhost:3000`
- **SSE Endpoint**: `/sse`
- **Message Endpoint**: `/message`

## Key Concepts

### Browser State
- Uses a **persistent browser context** (saves cookies, localStorage, etc.)
- Maintains **one active page/tab** - tools operate on the current page
- Browser remains **headed** (visible) for debugging and verification
- **Auto-waits** for elements during interactions (5s default timeout)

### Typical Workflows

**Basic Navigation & Inspection:**
```
navigate → getContent → screenshot
```

**Interactive Testing:**
```
navigate → click → getContent → screenshot
```

**Debugging & Monitoring:**
```
navigate → getConsoleLogs → (interact) → getConsoleLogs
```

**Issue Diagnosis & Investigation:**
```
navigate → evaluate → reload → evaluate  (test state persistence)
navigate → evaluate → screenshot         (capture computed state)  
navigate → getConsoleLogs → evaluate     (correlate errors with state)
```

**State Inspection:**
```
navigate → evaluate → getContent → screenshot
(inspect JS state) → (get HTML) → (visual verification)
```

## Diagnostic Tools

### `evaluate` - JavaScript Execution
Execute any JavaScript expression in the page context:
- **DOM Inspection**: `document.querySelectorAll('button').length`
- **State Analysis**: `localStorage.getItem('userToken')`  
- **Computed Values**: `window.getComputedStyle(element).display`
- **Error Detection**: `window.onerror || console.error`
- **Type-aware results**: Handles objects, functions, undefined, null
- **Error handling**: Catches and reports JavaScript errors safely

### `reload` - Page Refresh Testing
Refresh the current page with configurable options:
- **Cache Testing**: Does the issue persist after refresh?
- **State Verification**: Are dynamic elements reloaded correctly?
- **Wait Conditions**: `load`, `domcontentloaded`, `networkidle`, `commit`
- **Change Detection**: Reports URL and title changes
- **Timeout Control**: Prevent hanging on slow pages

## Important Notes

- **CSS Selectors**: Use standard CSS selectors (`#id`, `.class`, `tag[attr="value"]`)
- **Dynamic Content**: Tools capture live DOM state after JavaScript execution
- **Console Logs**: Automatically captured in real-time, can be filtered and cleared
- **Error Handling**: Tools provide detailed error messages with context
- **Memory Management**: Console logs auto-rotate (1000 message limit)
- **JavaScript Evaluation**: `evaluate` runs in page context with full DOM access

## Limitations

- **Single Page**: Only one active browser tab (use `navigate` to switch pages)
- **No File Operations**: Cannot upload/download files
- **No Network Mocking**: Raw browser behavior only
- **Session Based**: Browser state persists between tool calls

## Tips for Effective Usage

1. **Always verify actions**: Use `getContent` or `screenshot` after interactions
2. **Check console logs**: Use `getConsoleLogs` to debug JavaScript issues
3. **Be specific with selectors**: Use IDs or unique attributes when possible
4. **Handle timeouts**: Default 5s, increase for slow-loading elements
5. **Expect real browser behavior**: JavaScript, redirects, and dynamic content all work
6. **Use evaluate for deep inspection**: Check computed styles, JavaScript variables, DOM state
7. **Test with reload**: Verify if issues are state-dependent or persistent
8. **Combine tools effectively**: `evaluate` → `getConsoleLogs` → `screenshot` for comprehensive diagnosis
9. **JavaScript best practices**: Use `try/catch` in complex evaluate expressions
10. **State correlation**: Use `evaluate` to check both before and after page changes

The server automatically handles browser lifecycle, element waiting, and error recovery. Focus on your automation logic - the browser management is handled for you.
