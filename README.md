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
