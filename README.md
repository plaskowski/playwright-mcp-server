# Browser MCP Server — Project Overview

## Goal
Build a **Model Context Protocol (MCP) server** that allows AI agents (e.g. Cursor Agent) to interact with a **real browser tab** running a web application (e.g. a SvelteKit app).  
The server will expose **browser automation commands** as MCP tools, so the agent can:
- Navigate pages
- Interact with DOM elements (click, type, select)
- Evaluate JavaScript in the page
- Wait for selectors or events
- Capture screenshots
- Inspect URL, title, and HTML content

## Motivation
- Enable **AI-assisted end-to-end testing**: the agent can drive the app like a human tester.
- Support **AI exploratory analysis** of web apps (UX audits, accessibility checks, performance experiments).
- Provide **safe sandbox automation** without giving the agent full system control.
- Reuse existing developer tools (Playwright / Chrome DevTools Protocol).

## Key Design Choices
- **MCP Protocol**: standardized interface so any compliant agent can talk to the browser.
- **Playwright as automation engine**: provides stable, high-level commands and robust waiting logic.
- **Attach to real Chrome tab via CDP**: lets developers observe what the agent does.
- **Optional raw CDP passthrough**: for advanced use cases not covered by Playwright API.

## Deliverables
- An MCP server executable (Node.js/TypeScript).
- A defined set of MCP tools (navigate, click, type, evaluate, screenshot, etc.).
- Example configuration for use in Cursor Agent.
- Documentation and usage examples.

## Quick Start

### Install & Run (Recommended)
```bash
# Install globally from the package
npm install -g ./playwright-mcp-server-0.1.0.tgz

# Start the server (auto-detects available port)
playwright-mcp-server

# Or specify a port
playwright-mcp-server 3005
playwright-mcp-server --port 3010
```

### Multi-Instance Support
Run multiple instances simultaneously for different IDEs:
```bash
# Start multiple instances
playwright-mcp-server 3000 &  # For Cursor
playwright-mcp-server 3001 &  # For Claude Code CLI  
playwright-mcp-server 3002 &  # For another client

# Check running instances
ps aux | grep playwright-mcp-server
```

### Build from Source
```bash
# Clone and setup
git clone <repository-url>
cd playwright-mcp-server
npm install

# Build and run
npm run build
npm start

# Or with specific port
npm start -- 3005
npm start -- --port 3010
```

## Directory Structure

The server organizes all files under `~/.playwright-mcp-server/` with complete instance isolation:

```
~/.playwright-mcp-server/
├── instances/                           # Instance-specific data (isolated by port)
│   ├── port-3000/                      # Instance running on port 3000
│   │   ├── browser/                     # Chromium browser profile & user data
│   │   │   ├── Default/                 # Browser session data, cookies, localStorage
│   │   │   └── ...                      # Playwright browser profile files
│   │   ├── logs/                        # Instance-specific detailed logs
│   │   │   └── mcp-server-2025-08-24.log  # Daily log file with all MCP requests/responses
│   │   └── instance.json                # Runtime metadata for this instance
│   ├── port-3001/                      # Instance running on port 3001
│   │   ├── browser/                     # Separate browser profile (no session conflicts)
│   │   ├── logs/                        # Separate log files
│   │   └── instance.json                # Separate runtime metadata
│   └── port-3002/                      # Instance running on port 3002
│       ├── browser/
│       ├── logs/
│       └── instance.json
├── logs/                                # Global server startup logs
│   └── startup-2025-08-24.log          # High-level startup/shutdown events
└── config/                             # Future: global configuration files
    └── (reserved for future features)
```

### Instance Metadata Format

Each `instance.json` contains runtime information:

```json
{
  "port": 3000,
  "pid": 12345,
  "startTime": "2025-08-24T12:01:23.854Z",
  "browserProfile": "/Users/user/.playwright-mcp-server/instances/port-3000/browser",
  "logFile": "/Users/user/.playwright-mcp-server/instances/port-3000/logs/mcp-server-2025-08-24.log",
  "version": "0.1.0"
}
```

### Instance Management

Each instance runs completely isolated with no conflicts:

- **🔒 Separate browser profiles**: Each instance has its own Chromium profile with independent:
  - Cookies and session storage
  - Local storage and IndexedDB
  - Browser cache and history
  - Extensions and preferences

- **📝 Separate log files**: Each instance writes detailed logs including:
  - All incoming MCP requests and responses  
  - Tool execution results and errors
  - Browser automation events
  - Performance metrics and timestamps

- **📊 Runtime metadata**: Track operational details per instance:
  - Process ID (PID) for process management
  - Startup time and version information
  - File system paths for debugging
  - Port binding for network isolation

- **🧹 Automatic cleanup**: Instance metadata is automatically:
  - Created on startup with current runtime info
  - Updated during operation if needed
  - Removed on graceful shutdown
  - Left behind only if process crashes (for debugging)

### Instance Commands

```bash
# List all instances (running and stopped)
ls ~/.playwright-mcp-server/instances/

# Check which instances are currently running
ps aux | grep "[n]ode dist/server.js"

# View instance metadata and status
cat ~/.playwright-mcp-server/instances/port-3000/instance.json

# Monitor real-time logs for specific instance
tail -f ~/.playwright-mcp-server/instances/port-3000/logs/mcp-server-$(date +%Y-%m-%d).log

# Check instance directory size (browser cache can grow)
du -sh ~/.playwright-mcp-server/instances/port-*/

# Manual cleanup of stopped instances (if metadata left behind)
for dir in ~/.playwright-mcp-server/instances/port-*; do
  if [ -f "$dir/instance.json" ]; then
    pid=$(cat "$dir/instance.json" | grep '"pid"' | cut -d: -f2 | tr -d ' ,')
    if ! ps -p $pid > /dev/null 2>&1; then
      echo "Cleaning up stopped instance: $dir"
      rm "$dir/instance.json"
    fi
  fi
done
```

## Documentation

📋 **[Setup Guide](SETUP.md)** - Complete installation and configuration instructions for local development and MCP client integration.

🤖 **[Agent Guide](AGENT_GUIDE.md)** - Essential concepts and workflows for AI agents using this server.
