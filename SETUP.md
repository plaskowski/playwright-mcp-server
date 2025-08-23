# Browser MCP Server - Setup Guide

## Prerequisites

- **Node.js 18+** 
- **npm** or **yarn**
- **Git**

## Local Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd playwright-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

4. **Build the server:**
   ```bash
   npm run build
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` with:
- **SSE endpoint**: `/sse`  
- **Message endpoint**: `/message`
- **Status page**: `/` (browser-accessible)

## MCP Client Configuration

### Cursor IDE

1. **Open Cursor Settings** (Cmd/Ctrl + ,)

2. **Navigate to Extensions** → **Cursor Tab** → **MCP Servers**

3. **Add new server configuration:**
   ```json
   {
     "browserAutomation": {
       "command": "node",
       "args": ["/path/to/playwright-mcp-server/dist/server.js"],
       "transport": "sse",
       "url": "http://localhost:3000"
     }
   }
   ```

4. **Restart Cursor** to load the MCP server

### Claude Desktop App

1. **Locate Claude config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add server configuration:**
   ```json
   {
     "mcpServers": {
       "browserAutomation": {
         "command": "node",
         "args": ["/path/to/playwright-mcp-server/dist/server.js"],
         "transport": "sse",
         "url": "http://localhost:3000"
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Other MCP-Compatible Clients

For any MCP client supporting SSE transport:

- **Server URL**: `http://localhost:3000`
- **SSE Endpoint**: `/sse`
- **Message Endpoint**: `/message`
- **Protocol**: JSON-RPC over SSE

## Development Setup

### Running in Development Mode

```bash
npm run dev
```

This uses `ts-node` for TypeScript compilation on-the-fly.

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Development mode with ts-node
- `npm start` - Run compiled server
- `npm test` - Run tests (if available)

### Configuration Options

The server accepts these environment variables:

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)

## Verification

1. **Check server status:**
   ```bash
   curl http://localhost:3000/
   ```
   Should return HTML status page showing available tools.

2. **Test MCP connection:**
   In your MCP client, the server should appear as "browserAutomation" with tools:
   - `navigate`
   - `screenshot` 
   - `getConsoleLogs`
   - `click`
   - `getContent`

3. **Test basic functionality:**
   Try navigating to a website and taking a screenshot to verify the browser automation works.

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :3000  # Find process using port 3000
kill -9 <PID>  # Kill the process
```

**Playwright browser not installed:**
```bash
npx playwright install chromium
```

**TypeScript compilation errors:**
```bash
npm run build  # Check for TypeScript errors
```

**MCP client not detecting server:**
- Ensure server is running (`curl http://localhost:3000/`)
- Check client configuration path and syntax
- Restart the MCP client after configuration changes

### Browser Profile

The server creates a persistent browser profile in `./.pw-profile/` to maintain cookies and session data between uses. Delete this directory to reset browser state.

### Logs and Debugging

The server runs in headed mode by default, so you can see the browser window and debug visually. Console output shows server activity and any errors.

## Security Considerations

- Server runs on localhost only by default
- Browser profile is isolated per server instance
- No external network access controls (browser can access any URL)
- Consider firewall rules for production deployments
