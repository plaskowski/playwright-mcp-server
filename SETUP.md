# Browser MCP Server - Setup Guide

## 🚀 Quick Start (Recommended)

### Global Installation
The easiest way to get started is installing the package globally:

```bash
# Install globally from npm registry (when published)
npm install -g playwright-mcp-server

# Or install from local distribution
npm install -g ./playwright-mcp-server-0.1.0.tgz
```

### Usage
```bash
# Start the server anywhere
playwright-mcp-server
```

**Benefits:**
- ✅ Automatic browser installation
- ✅ Available as system command  
- ✅ No need to clone repository
- ✅ Optimized for AI agent integration

---

## Prerequisites (Development)

- **Node.js 18+** 
- **npm** or **yarn**
- **Git**

## Local Development Installation

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

The server will start with:
- **Default port**: `3000` (configurable via CLI arguments)
- **SSE endpoint**: `http://localhost:PORT/sse`  
- **Message endpoint**: `http://localhost:PORT/message`
- **Status page**: `http://localhost:PORT/` (browser-accessible)
- **Multi-instance support**: Run multiple servers on different ports simultaneously

## MCP Client Configuration

### Cursor IDE

#### Option 1: Global Installation (Recommended)

1. **Install the server globally:**
   ```bash
   npm install -g ./playwright-mcp-server-0.1.0.tgz
   ```

2. **Start the MCP server** (in background or separate terminal):
   ```bash
   # Default port 3000
   playwright-mcp-server &
   
   # Or specify a port (useful for multiple instances)
   playwright-mcp-server 3001 &
   ```

3. **Open Cursor Settings** (Cmd/Ctrl + ,)

4. **Navigate to Extensions** → **Cursor Tab** → **MCP Servers**

5. **Add new server configuration:**
   ```json
   {
     "browserAutomation": {
       "command": "curl",
       "args": ["-N", "-H", "Accept: text/event-stream", "http://localhost:3000/sse"],
       "transport": "sse",
       "url": "http://localhost:3000"
     }
   }
   ```
   
   **For custom port (e.g., 3001):**
   ```json
   {
     "browserAutomation": {
       "command": "curl",
       "args": ["-N", "-H", "Accept: text/event-stream", "http://localhost:3001/sse"],
       "transport": "sse", 
       "url": "http://localhost:3001"
     }
   }
   ```

6. **Restart Cursor** to load the MCP server

#### Option 2: Local Development

1. **Start the MCP server** (in background or separate terminal):
   ```bash
   cd /path/to/playwright-mcp-server
   
   # Default port 3000
   npm start &
   
   # Or specify a port
   npm start -- 3001 &
   ```

2. **Open Cursor Settings** (Cmd/Ctrl + ,)

3. **Navigate to Extensions** → **Cursor Tab** → **MCP Servers**

4. **Add new server configuration:**
   ```json
   {
     "browserAutomation": {
       "command": "curl",
       "args": ["-N", "-H", "Accept: text/event-stream", "http://localhost:3000/sse"],
       "transport": "sse",
       "url": "http://localhost:3000"
     }
   }
   ```

5. **Restart Cursor** to load the MCP server

### Claude Code (CLI Tool)

#### Option 1: Global Installation (Recommended)

1. **Install both tools globally:**
   ```bash
   npm install -g @anthropic-ai/claude-code
   npm install -g ./playwright-mcp-server-0.1.0.tgz
   ```

2. **Create MCP configuration file:**
   ```bash
   mkdir -p ~/.config/claude-code
   ```

3. **Add server configuration** (`~/.config/claude-code/config.json`):
   ```json
   {
     "mcpServers": {
       "browserAutomation": {
         "transport": "sse",
         "url": "http://localhost:3000"
       }
     }
   }
   ```
   
   **For multi-instance setup (different ports):**
   ```json
   {
     "mcpServers": {
       "browserAutomation": {
         "transport": "sse",
         "url": "http://localhost:3001"
       }
     }
   }
   ```

4. **Usage workflow:**
   ```bash
   # Terminal 1: Start the MCP server
   playwright-mcp-server          # Port 3000 (default)
   # OR
   playwright-mcp-server 3001     # Custom port
   
   # Terminal 2: Start Claude Code CLI
   claude-code --mcp-config ~/.config/claude-code/config.json
   ```

#### Option 2: Local Development

1. **Install Claude Code CLI:**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Create MCP configuration file:**
   ```bash
   mkdir -p ~/.config/claude-code
   ```

3. **Add server configuration** (`~/.config/claude-code/config.json`):
   ```json
   {
     "mcpServers": {
       "browserAutomation": {
         "transport": "sse",
         "url": "http://localhost:3000"
       }
     }
   }
   ```

4. **Usage workflow:**
   ```bash
   # Terminal 1: Start the MCP server
   cd /path/to/playwright-mcp-server  
   npm start                          # Port 3000 (default)
   # OR
   npm start -- 3001                  # Custom port
   
   # Terminal 2: Start Claude Code CLI
   claude-code --mcp-config ~/.config/claude-code/config.json
   ```

   **Note:** Keep both terminals running - Claude Code CLI connects to the MCP server via HTTP/SSE. Update the port in the config file if using a custom port.

### Other MCP-Compatible Clients

For any MCP client supporting SSE transport:

- **Server URL**: `http://localhost:PORT` (default PORT is 3000)
- **SSE Endpoint**: `/sse`
- **Message Endpoint**: `/message`
- **Protocol**: JSON-RPC over SSE
- **Content-Type**: `text/event-stream` for SSE connections
- **Multi-instance**: Each server instance runs on a separate port

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

The server can be configured via command-line arguments:

```bash
# Default port 3000
playwright-mcp-server

# Specify port via positional argument
playwright-mcp-server 3001

# Specify port via flag
playwright-mcp-server --port 3001
playwright-mcp-server -p 3001

# Show help
playwright-mcp-server --help
```

**Environment variables (optional):**
- `PORT` - Fallback port if no CLI argument provided (default: 3000)

### Multi-Instance Setup Examples

**Running multiple instances for different IDEs:**

```bash
# Instance 1: For Cursor IDE
playwright-mcp-server 3000 &

# Instance 2: For Claude Code CLI  
playwright-mcp-server 3001 &

# Instance 3: For other MCP client
playwright-mcp-server 3002 &

# Check all running instances
ps aux | grep "[n]ode dist/server.js"
```

**Configure each client with its dedicated port:**

- **Cursor**: Use `http://localhost:3000` in MCP config
- **Claude Code**: Use `http://localhost:3001` in config.json
- **Other client**: Use `http://localhost:3002`

**Benefits of multi-instance:**
- ✅ **No conflicts** between different IDE sessions
- ✅ **Isolated browser profiles** - separate cookies/sessions
- ✅ **Independent logging** - easier debugging per client
- ✅ **Different configurations** possible per instance

## Verification

1. **Check server status:**
   ```bash
   curl http://localhost:3000/
   ```
   Should return HTML status page showing available tools.

2. **Test MCP connection:**
   
   **For Cursor/IDE clients:**
   The server should appear as "browserAutomation" with tools: `navigate`, `screenshot`, `getConsoleLogs`, `click`, `getContent`, `evaluate`, `reload`
   
   **For Claude Code CLI:**
   ```bash
   # Start the MCP server first
   npm start
   
   # In another terminal, start Claude Code
   claude-code --mcp-config ~/.config/claude-code/config.json
   
   # Claude should show available MCP tools on startup
   ```

3. **Test basic functionality:**
   Try asking Claude to navigate to a website and take a screenshot to verify the browser automation works.

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

### Browser Profiles & Instance Management

The server creates isolated browser profiles for each instance in `~/.playwright-mcp-server/instances/port-PORT/browser/` to maintain cookies and session data. Each instance has:

- **Separate browser profile**: No session conflicts between instances
- **Instance-specific logs**: `~/.playwright-mcp-server/instances/port-PORT/logs/`
- **Runtime metadata**: `~/.playwright-mcp-server/instances/port-PORT/instance.json`

**Managing instances:**
```bash
# List all instances
ls ~/.playwright-mcp-server/instances/

# View instance metadata
cat ~/.playwright-mcp-server/instances/port-3000/instance.json

# Check running instances
ps aux | grep "[n]ode dist/server.js"

# Reset browser state for specific instance
rm -rf ~/.playwright-mcp-server/instances/port-3000/browser/

# Clean up stopped instances
find ~/.playwright-mcp-server/instances -name "instance.json" -exec rm {} \;
```

### Logs and Debugging

- **Server runs in headed mode** by default - browser window is visible for debugging
- **Instance-specific logging** - Each server writes to its own log file
- **Console output** shows server activity, port binding, and errors
- **Real-time log monitoring**: `tail -f ~/.playwright-mcp-server/instances/port-PORT/logs/mcp-server-$(date +%Y-%m-%d).log`

## Security Considerations

- Server runs on localhost only by default
- Browser profile is isolated per server instance
- No external network access controls (browser can access any URL)
- Consider firewall rules for production deployments
