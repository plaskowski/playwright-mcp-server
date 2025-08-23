import { Server, Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { chromium, BrowserContext, Page } from "playwright";

let context: BrowserContext | null = null;
let page: Page | null = null;

/** Ensure we have a headed Chromium and one visible page */
async function ensurePage(): Promise<Page> {
  if (page && !page.isClosed()) return page;

  context = await chromium.launchPersistentContext("./.pw-profile", {
    headless: false
  });

  page = context.pages()[0] ?? await context.newPage();
  return page;
}

const tools: Tool[] = [
  {
    name: "navigate",
    description: "Navigate the browser to a URL (starts Chromium if needed).",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Absolute URL, e.g., https://example.com" },
        waitUntil: {
          type: "string",
          enum: ["load", "domcontentloaded", "networkidle", "commit"],
          description: "Navigation lifecycle event to await (default: domcontentloaded)"
        }
      },
      required: ["url"]
    },
    handler: async ({ input }) => {
      const { url, waitUntil } = input as { url: string; waitUntil?: "load"|"domcontentloaded"|"networkidle"|"commit" };
      const p = await ensurePage();
      await p.goto(url, { waitUntil: waitUntil ?? "domcontentloaded" });
      const title = await p.title();
      return {
        content: [
          { type: "text", text: `Navigated to ${url}\nTitle: ${title}` }
        ]
      };
    }
  }
];

async function main() {
  const server = new Server(
    { name: "mcp-browser-min", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  for (const t of tools) server.tool(t);

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

  const transport = new StdioServerTransport();
  server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});