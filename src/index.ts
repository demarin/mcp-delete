┌──(rumpel㉿DESKTOP-IS83QLR)-[~/.npm/_npx/a3241bba59c344f5/node_modules]
└─$ ls
accepts                  ee-first                    hasown                   object-assign           shebang-regex
ajv                      emoji-regex                 has-symbols              object-inspect          side-channel
ansi-regex               encodeurl                   http-errors              once                    side-channel-list
ansi-styles              escape-html                 iconv-lite               on-finished             side-channel-map
balanced-match           es-define-property          inherits                 package-json-from-dist  side-channel-weakmap
body-parser              es-errors                   ipaddr.js                parseurl                signal-exit
brace-expansion          es-object-atoms             @isaacs                  path-key                statuses
bytes                    etag                        isexe                    path-scurry             string-width
call-bind-apply-helpers  eventsource                 is-fullwidth-code-point  path-to-regexp          string-width-cjs
call-bound               eventsource-parser          is-promise               pkce-challenge          strip-ansi
color-convert            express                     jackspeak                @pkgjs                  strip-ansi-cjs
color-name               express-rate-limit          json-schema-traverse     proxy-addr              toidentifier
content-disposition      fast-deep-equal             lru-cache                punycode                type-is
content-type             fast-json-stable-stringify  math-intrinsics          qs                      unpipe
cookie                   finalhandler                media-typer              range-parser            uri-js
cookie-signature         foreground-child            merge-descriptors        raw-body                vary
cors                     forwarded                   mime-db                  router                  which
cross-spawn              fresh                       mime-types               safe-buffer             wrap-ansi
debug                    function-bind               minimatch                safer-buffer            wrap-ansi-cjs
depd                     get-intrinsic               minipass                 send                    wrappy
diff                     get-proto                   @modelcontextprotocol    serve-static            zod
dunder-proto             glob                        ms                       setprototypeof          zod-to-json-schema
eastasianwidth           gopd                        negotiator               shebang-command#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { unlink, rmdir } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import { isAbsolute } from 'path';

/**
 * Create an MCP server with capabilities for file and directory deletion.
 */
const server = new Server(
  {
    name: "mcp-delete-custom",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes "delete_file" and "delete_directory" tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "delete_file",
        description: "Delete a file at the specified absolute path.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "The absolute path to the file to delete."
            }
          },
          required: ["path"]
        }
      },
      {
        name: "delete_directory",
        description: "Delete a directory at the specified absolute path.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "The absolute path to the directory to delete."
            }
          },
          required: ["path"]
        }
      }
    ]
  };
});

/**
 * Handler for the delete_file and delete_directory tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const inputPath = String(args?.path);

  if (!inputPath) {
    throw new McpError(ErrorCode.InvalidParams, "Path is required.");
  }

  if (!isAbsolute(inputPath)) {
    throw new McpError(ErrorCode.InvalidParams, "Only absolute paths are allowed.");
  }

  if (!existsSync(inputPath)) {
    throw new McpError(ErrorCode.InvalidParams, `Path does not exist: ${inputPath}`);
  }

  try {
    switch (name) {
      case "delete_file":
        await unlink(inputPath);
        return {
          content: [{
            type: "text",
            text: `Successfully deleted file: ${inputPath}`
          }]
        };
      case "delete_directory":
        await rmdir(inputPath, { recursive: true });
        return {
          content: [{
            type: "text",
            text: `Successfully deleted directory: ${inputPath}`
          }]
        };
      default:
        throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
    }
  } catch (err) {
    let errorMessage = 'An unknown error occurred';
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to delete ${name === 'delete_file' ? 'file' : 'directory'} ${inputPath}: ${errorMessage}`
    );
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const logStream = createWriteStream('/home/rumpel/prog/mcp-delete/debug.log', { flags: 'a' });
  const logError = (message: any, ...optionalParams: any[]) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    logStream.write(`[${timestamp}] ${formattedMessage} ${optionalParams.join(' ')}\n`);
  };
  console.error = logError;

  process.on('uncaughtException', (err, origin) => {
    logError(`\nFATAL ERROR\nCaught exception: ${err.stack || err}\n` + `Exception origin: ${origin}`);
    logStream.end(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    logError('\nFATAL ERROR\nUnhandled Rejection at:', promise, 'reason:', reason);
    logStream.end(() => process.exit(1));
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Custom file/directory deletion MCP server running on stdio. Logging to debug.log');
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
