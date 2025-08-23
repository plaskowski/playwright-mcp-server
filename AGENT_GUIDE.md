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

## Important Notes

- **CSS Selectors**: Use standard CSS selectors (`#id`, `.class`, `tag[attr="value"]`)
- **Dynamic Content**: Tools capture live DOM state after JavaScript execution
- **Console Logs**: Automatically captured in real-time, can be filtered and cleared
- **Error Handling**: Tools provide detailed error messages with context
- **Memory Management**: Console logs auto-rotate (1000 message limit)

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

The server automatically handles browser lifecycle, element waiting, and error recovery. Focus on your automation logic - the browser management is handled for you.
