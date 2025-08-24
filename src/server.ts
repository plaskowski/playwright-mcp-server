#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { chromium, BrowserContext, Page } from "playwright";
import { z } from "zod";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

let context: BrowserContext | null = null;
let page: Page | null = null;
let consoleLogs: Array<{
  type: string;
  text: string;
  timestamp: string;
  location?: string;
}> = [];

/** Ensure we have a Chromium browser and one page (headed in dev, headless in containers) */
async function ensurePage(): Promise<Page> {
  if (page && !page.isClosed()) return page;

  // Auto-detect environment: headless in Docker/CI, headed for local development
  const isContainerEnv = process.env.DOCKER_CONTAINER === 'true' || 
                          process.env.CI === 'true' ||
                          process.env.DISPLAY === ':99' ||
                          !process.env.DISPLAY;
  
  const headlessMode = process.env.BROWSER_HEADLESS === 'true' || isContainerEnv;

  console.log(`Starting browser in ${headlessMode ? 'headless' : 'headed'} mode (container: ${isContainerEnv})`);

  context = await chromium.launchPersistentContext("./.pw-profile", {
    headless: headlessMode,
    // Browser args for better container compatibility
    args: headlessMode ? [
      '--no-sandbox',
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ] : []
  });

  page = context.pages()[0] ?? await context.newPage();
  
  // Set up console listener to capture logs
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    const location = msg.location() ? `${msg.location().url}:${msg.location().lineNumber}:${msg.location().columnNumber}` : undefined;
    
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp,
      location
    });
    
    // Keep only the last 1000 console messages to prevent memory bloat
    if (consoleLogs.length > 1000) {
      consoleLogs = consoleLogs.slice(-1000);
    }
  });
  
  return page;
}

const mcpServer = new McpServer({
  name: "mcp-browser-min", 
  version: "0.1.0"
});

// Register the navigate tool
mcpServer.registerTool("navigate", {
  description: "Navigate the browser to a URL (starts Chromium if needed).",
  inputSchema: {
    url: z.string().describe("Absolute URL, e.g., https://example.com"),
    waitUntil: z.enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .describe("Navigation lifecycle event to await (default: domcontentloaded)")
  },
}, async ({ url, waitUntil }) => {
  const p = await ensurePage();
  await p.goto(url, { waitUntil: waitUntil ?? "domcontentloaded" });
  const title = await p.title();
  return {
    content: [
      { type: "text", text: `Navigated to ${url}\nTitle: ${title}` }
    ]
  };
});

// Register the screenshot tool
mcpServer.registerTool("screenshot", {
  description: "Capture a screenshot of the current page as PNG base64.",
  inputSchema: {
    fullPage: z.boolean().optional().describe("Capture full page including content below the fold (default: false)"),
    quality: z.number().min(1).max(100).optional().describe("JPEG quality 1-100, only applies if format is jpeg (default: 80)")
  },
}, async ({ fullPage, quality }) => {
  const p = await ensurePage();
  
  try {
    // Take screenshot as PNG buffer
    const screenshotBuffer = await p.screenshot({ 
      fullPage: fullPage ?? false,
      type: 'png'
    });
    
    // Convert to base64
    const base64Screenshot = screenshotBuffer.toString('base64');
    const currentUrl = p.url();
    const pageTitle = await p.title();
    
    return {
      content: [
        { 
          type: "text", 
          text: `Screenshot captured from: ${currentUrl}\nPage title: ${pageTitle}\nFull page: ${fullPage ?? false}\nSize: ${Math.round(screenshotBuffer.length / 1024)}KB` 
        },
        {
          type: "image",
          data: base64Screenshot,
          mimeType: "image/png"
        }
      ]
    };
  } catch (error) {
    throw new Error(`Screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Register console logs tool
mcpServer.registerTool("getConsoleLogs", {
  description: "Retrieve console logs from the browser page",
  inputSchema: {
    clear: z.boolean().optional().describe("Whether to clear the logs after retrieving them (default: false)"),
    logType: z.enum(["log", "info", "warn", "warning", "error", "debug"]).optional().describe("Filter by log type (optional)"),
    limit: z.number().min(1).max(1000).optional().describe("Maximum number of recent logs to return (default: 100)")
  },
}, async ({ clear, logType, limit }) => {
  await ensurePage(); // Ensure page exists and console listener is set up
  
  let logs = consoleLogs;
  
  // Filter by log type if specified
  if (logType) {
    logs = logs.filter(log => log.type === logType);
  }
  
  // Limit the number of logs returned
  const maxLogs = limit ?? 100;
  logs = logs.slice(-maxLogs);
  
  const logText = logs.length > 0 
    ? logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.text}${log.location ? ` (${log.location})` : ''}`).join('\n')
    : "No console logs found.";
  
  // Clear logs if requested
  if (clear) {
    consoleLogs = [];
  }
  
  return {
    content: [
      {
        type: "text",
        text: `Console Logs (${logs.length} entries):\n\n${logText}`
      }
    ]
  };
});

// Register click tool
mcpServer.registerTool("click", {
  description: "Click on an element identified by a CSS selector",
  inputSchema: {
    selector: z.string().describe("CSS selector to identify the element to click"),
    button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button to use (default: left)"),
    clickCount: z.number().min(1).max(3).optional().describe("Number of clicks (default: 1)"),
    timeout: z.number().min(0).max(30000).optional().describe("Maximum time to wait for element in milliseconds (default: 5000)")
  },
}, async ({ selector, button, clickCount, timeout }) => {
  const p = await ensurePage();
  
  try {
    // Wait for element to be available and click it
    await p.click(selector, {
      button: button ?? "left",
      clickCount: clickCount ?? 1,
      timeout: timeout ?? 5000
    });
    
    const currentUrl = p.url();
    const pageTitle = await p.title();
    
    // Try to get some info about the clicked element
    const elementInfo = await p.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      return {
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent?.trim().substring(0, 100) || '',
        className: element.className || '',
        id: element.id || ''
      };
    }, selector);
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully clicked element: ${selector}
Page: ${currentUrl}
Title: ${pageTitle}
Element: <${elementInfo?.tagName}${elementInfo?.id ? ` id="${elementInfo.id}"` : ''}${elementInfo?.className ? ` class="${elementInfo.className}"` : ''}>${elementInfo?.textContent ? elementInfo.textContent + '...' : ''}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Click failed: ${error instanceof Error ? error.message : 'Unknown error'}. Selector: ${selector}`);
  }
});

// Register getContent tool
mcpServer.registerTool("getContent", {
  description: "Get the full HTML content of the current page",
  inputSchema: {
    includeMetadata: z.boolean().optional().describe("Whether to include page metadata like title and URL (default: true)")
  },
}, async ({ includeMetadata }) => {
  const p = await ensurePage();
  
  try {
    const htmlContent = await p.content();
    const currentUrl = p.url();
    const pageTitle = await p.title();
    const contentLength = htmlContent.length;
    
    const shouldIncludeMetadata = includeMetadata ?? true;
    
    if (shouldIncludeMetadata) {
      return {
        content: [
          {
            type: "text",
            text: `Page Content:
URL: ${currentUrl}
Title: ${pageTitle}
Content Length: ${contentLength} characters

${htmlContent}`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: htmlContent
          }
        ]
      };
    }
  } catch (error) {
    throw new Error(`Failed to get page content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Register evaluate tool
mcpServer.registerTool("evaluate", {
  description: "Execute JavaScript expression in the page context and return the result",
  inputSchema: {
    expression: z.string().describe("JavaScript expression to evaluate in the page context"),
    returnType: z.enum(["json", "string"]).optional().describe("How to format the return value (default: json)")
  },
}, async ({ expression, returnType }) => {
  const p = await ensurePage();
  
  try {
    const result = await p.evaluate((expr) => {
      // Create a function that returns the evaluated expression
      try {
        // Use indirect eval to evaluate in global scope
        const evalResult = (0, eval)(expr);
        
        // Handle different return types
        if (evalResult === undefined) return { type: 'undefined', value: 'undefined' };
        if (evalResult === null) return { type: 'null', value: 'null' };
        if (typeof evalResult === 'function') return { type: 'function', value: evalResult.toString() };
        if (typeof evalResult === 'object') {
          try {
            return { type: 'object', value: JSON.stringify(evalResult, null, 2) };
          } catch {
            return { type: 'object', value: '[Object - cannot serialize]' };
          }
        }
        
        return { type: typeof evalResult, value: String(evalResult) };
      } catch (error) {
        return { 
          type: 'error', 
          value: error instanceof Error ? error.message : String(error) 
        };
      }
    }, expression);
    
    const currentUrl = p.url();
    const pageTitle = await p.title();
    const shouldReturnJson = returnType === "json" || returnType === undefined;
    
    if (result.type === 'error') {
      return {
        content: [
          {
            type: "text",
            text: `JavaScript Evaluation Error:
Expression: ${expression}
Page: ${currentUrl}
Title: ${pageTitle}

Error: ${result.value}`
          }
        ]
      };
    }
    
    const resultText = shouldReturnJson && result.type === 'object' 
      ? result.value 
      : `${result.value}`;
    
    return {
      content: [
        {
          type: "text",
          text: `JavaScript Evaluation Result:
Expression: ${expression}
Page: ${currentUrl}
Title: ${pageTitle}
Type: ${result.type}

Result:
${resultText}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`JavaScript evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Register reload tool
mcpServer.registerTool("reload", {
  description: "Reload the current page",
  inputSchema: {
    waitUntil: z.enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .describe("Navigation lifecycle event to await after reload (default: domcontentloaded)"),
    timeout: z.number().min(0).max(60000).optional().describe("Maximum time to wait for reload in milliseconds (default: 30000)")
  },
}, async ({ waitUntil, timeout }) => {
  const p = await ensurePage();
  
  try {
    const urlBeforeReload = p.url();
    const titleBeforeReload = await p.title();
    
    await p.reload({ 
      waitUntil: waitUntil ?? "domcontentloaded",
      timeout: timeout ?? 30000
    });
    
    const urlAfterReload = p.url();
    const titleAfterReload = await p.title();
    
    return {
      content: [
        {
          type: "text",
          text: `Page reloaded successfully:
URL: ${urlAfterReload}${urlBeforeReload !== urlAfterReload ? ` (was: ${urlBeforeReload})` : ''}
Title: ${titleAfterReload}${titleBeforeReload !== titleAfterReload ? ` (was: ${titleBeforeReload})` : ''}
Wait condition: ${waitUntil ?? "domcontentloaded"}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Page reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

async function main() {
  const shutdown = async () => {
    try {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const messageEndpoint = "/message";
  
  // Store single active transport
  let activeTransport: SSEServerTransport | null = null;
  let mcpServerConnected = false;
  
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (url.pathname === "/sse" && req.method === "GET") {
      try {
        // Handle SSE connection - only one at a time
        if (activeTransport) {
          res.writeHead(409, { 'Content-Type': 'text/plain' });
          res.end('Another SSE connection is already active');
          return;
        }
        
        const transport = new SSEServerTransport(messageEndpoint, res);
        activeTransport = transport;
        
        // Clean up when connection closes
        transport.onclose = () => {
          activeTransport = null;
        };
        
        // Connect the mcpServer - this automatically starts the transport
        await mcpServer.connect(transport);
        console.log('SSE connection established');
      } catch (error) {
        console.error('SSE connection error:', error);
        activeTransport = null;
        // Don't try to write headers if they're already sent
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('SSE connection failed');
        }
      }
    } else if (url.pathname === messageEndpoint && req.method === "POST") {
      // Handle incoming messages
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          const parsedBody = JSON.parse(body);
          
          // Use the active transport to handle the message
          if (activeTransport) {
            await activeTransport.handlePostMessage(req, res, parsedBody);
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No active SSE connection' }));
          }
        } catch (error) {
          console.error('POST message error:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON or processing error' }));
        }
      });
    } else if (url.pathname === "/") {
      // Serve a simple info page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Browser MCP Server</title></head>
          <body>
            <h1>Browser MCP Server</h1>
            <p>Server is running on port ${port}</p>
            <p>SSE endpoint: <code>/sse</code></p>
            <p>Message endpoint: <code>${messageEndpoint}</code></p>
            <p>Available tools: navigate, screenshot, getConsoleLogs, click, getContent, evaluate, reload</p>
            <p>Connection status: ${activeTransport ? 'Connected' : 'Disconnected'}</p>
          </body>
        </html>
      `);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`MCP Browser Server is running on http://localhost:${port}`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
    console.log(`Message endpoint: http://localhost:${port}${messageEndpoint}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
