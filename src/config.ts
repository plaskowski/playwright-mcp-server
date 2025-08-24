import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createServer as createNetServer } from "net";
import { parseArgs } from "util";

export interface ServerConfig {
  port: number;
  BASE_DIR: string;
  INSTANCE_DIR: string;
  BROWSER_PROFILE: string;
  INSTANCE_LOGS_DIR: string;
  INSTANCE_LOG_FILE: string;
  INSTANCE_METADATA_FILE: string;
  GLOBAL_LOGS_DIR: string;
  GLOBAL_LOG_FILE: string;
  CONFIG_DIR: string;
}

export interface InstanceMetadata {
  port: number;
  pid: number;
  startTime: string;
  browserProfile: string;
  logFile: string;
  version: string;
}

// Command line argument parsing using Node.js built-in parseArgs
function parseCommandLineArgs(): { port?: number; help?: boolean } {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        port: {
          type: 'string',
          short: 'p',
          description: 'Port number to bind to'
        },
        help: {
          type: 'boolean',
          short: 'h',
          description: 'Show help message'
        }
      },
      allowPositionals: true,
      strict: true
    });

    const result: { port?: number; help?: boolean } = {};
    
    // Handle --port flag
    if (values.port) {
      const portNum = Number(values.port);
      if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
        console.error('Error: --port must be a valid port number (1-65535)');
        process.exit(1);
      }
      result.port = portNum;
    }
    
    // Handle positional argument for port (if no --port flag was provided)
    if (!result.port && positionals.length > 0) {
      const portNum = Number(positionals[0]);
      if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
        result.port = portNum;
      } else if (isNaN(portNum)) {
        console.error(`Error: Invalid positional argument '${positionals[0]}'. Expected a port number.`);
        process.exit(1);
      }
    }
    
    result.help = values.help || false;
    
    return result;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export function showHelp() {
  console.log(`
Browser MCP Server - Multi-instance support

Usage:
  playwright-mcp-server [PORT] [OPTIONS]
  
Arguments:
  PORT                    Port number to bind to (default: 3000)
  
Options:
  -p, --port PORT         Port number to bind to
  -h, --help             Show this help message

Examples:
  playwright-mcp-server                    # Use default port 3000
  playwright-mcp-server 3005               # Use port 3005
  playwright-mcp-server --port 3010        # Use port 3010
  
Multiple instances:
  playwright-mcp-server 3000 &             # Instance 1 on port 3000
  playwright-mcp-server 3001 &             # Instance 2 on port 3001
  playwright-mcp-server 3002 &             # Instance 3 on port 3002
  
Each instance gets:
  - Separate browser profile (~/.playwright-mcp-server/instances/port-PORT/browser/)
  - Separate log file (~/.playwright-mcp-server/instances/port-PORT/logs/)
  - Isolated browser session
`);
}

// Auto-detect available port
export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const testPort = (port: number) => {
      const server = createNetServer();
      
      server.listen(port, () => {
        server.close(() => {
          resolve(port);
        });
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          if (port < startPort + 100) { // Try up to 100 ports
            testPort(port + 1);
          } else {
            reject(new Error(`No available ports found between ${startPort} and ${startPort + 100}`));
          }
        } else {
          reject(err);
        }
      });
    };
    
    testPort(startPort);
  });
}

// Initialize configuration based on port
export async function initializeConfig(): Promise<ServerConfig> {
  const args = parseCommandLineArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  // Determine port - default to 3000
  const port = args.port ?? (process.env.PORT ? parseInt(process.env.PORT) : 3000);
  
  // Base directory structure
  const BASE_DIR = join(homedir(), '.playwright-mcp-server');
  const INSTANCE_DIR = join(BASE_DIR, 'instances', `port-${port}`);
  const GLOBAL_LOGS_DIR = join(BASE_DIR, 'logs');
  const CONFIG_DIR = join(BASE_DIR, 'config');
  
  // Instance-specific paths
  const BROWSER_PROFILE = join(INSTANCE_DIR, 'browser');
  const INSTANCE_LOGS_DIR = join(INSTANCE_DIR, 'logs');
  const INSTANCE_LOG_FILE = join(INSTANCE_LOGS_DIR, `mcp-server-${new Date().toISOString().slice(0, 10)}.log`);
  const INSTANCE_METADATA_FILE = join(INSTANCE_DIR, 'instance.json');
  
  // Global paths
  const GLOBAL_LOG_FILE = join(GLOBAL_LOGS_DIR, `startup-${new Date().toISOString().slice(0, 10)}.log`);
  
  return {
    port,
    BASE_DIR,
    INSTANCE_DIR,
    BROWSER_PROFILE,
    INSTANCE_LOGS_DIR,
    INSTANCE_LOG_FILE,
    INSTANCE_METADATA_FILE,
    GLOBAL_LOGS_DIR,
    GLOBAL_LOG_FILE,
    CONFIG_DIR
  };
}

export async function ensureDirectories(config: ServerConfig): Promise<void> {
  try {
    // Create all necessary directories
    await fs.mkdir(config.INSTANCE_LOGS_DIR, { recursive: true });
    await fs.mkdir(config.GLOBAL_LOGS_DIR, { recursive: true });
    await fs.mkdir(config.CONFIG_DIR, { recursive: true });
    await fs.mkdir(config.BROWSER_PROFILE, { recursive: true });
  } catch (error) {
    console.error('Failed to create directories:', error);
  }
}

export async function writeInstanceMetadata(config: ServerConfig): Promise<void> {
  const metadata: InstanceMetadata = {
    port: config.port,
    pid: process.pid,
    startTime: new Date().toISOString(),
    browserProfile: config.BROWSER_PROFILE,
    logFile: config.INSTANCE_LOG_FILE,
    version: "0.1.0"
  };
  
  try {
    await fs.writeFile(config.INSTANCE_METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Failed to write instance metadata:', error);
  }
}

export async function cleanupInstanceMetadata(config: ServerConfig): Promise<void> {
  try {
    await fs.unlink(config.INSTANCE_METADATA_FILE);
  } catch (error) {
    // Ignore errors - file might not exist
  }
}
