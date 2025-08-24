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

The server organizes all files under `~/.playwright-mcp-server/`:

```
~/.playwright-mcp-server/
├── instances/                           # Instance-specific data
│   ├── port-3000/                      # Instance on port 3000
│   │   ├── browser/                     # Playwright browser profile
│   │   ├── logs/                        # Instance-specific logs
│   │   │   └── mcp-server-2025-08-24.log
│   │   └── instance.json                # Instance metadata (port, PID, etc)
│   ├── port-3001/                      # Instance on port 3001
│   │   ├── browser/
│   │   ├── logs/
│   │   └── instance.json
│   └── port-3002/                      # Instance on port 3002
│       ├── browser/
│       ├── logs/
│       └── instance.json
├── logs/                                # Global startup logs
│   └── startup-2025-08-24.log
└── config/                             # Future configuration files
```

### Instance Management

Each instance is completely isolated:
- **Separate browser profiles**: No session conflicts between instances
- **Separate log files**: Easy debugging and monitoring per instance  
- **Separate metadata**: Track PID, port, startup time per instance
- **Automatic cleanup**: Instance metadata removed on shutdown

### Instance Commands

```bash
# Check all running instances
ls ~/.playwright-mcp-server/instances/

# View instance metadata
cat ~/.playwright-mcp-server/instances/port-3000/instance.json

# Monitor specific instance logs
tail -f ~/.playwright-mcp-server/instances/port-3000/logs/mcp-server-$(date +%Y-%m-%d).log

# Clean up stopped instances (if needed)
find ~/.playwright-mcp-server/instances -name "instance.json" -exec cat {} \; | grep -v "$(ps aux | grep playwright-mcp-server)"
```

## Documentation

📋 **[Setup Guide](SETUP.md)** - Complete installation and configuration instructions for local development and MCP client integration.

🤖 **[Agent Guide](AGENT_GUIDE.md)** - Essential concepts and workflows for AI agents using this server.
