#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
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
    const error = err;
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to delete ${name === 'delete_file' ? 'file' : 'directory'} ${inputPath}: ${error.message}`
    );
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Custom file/directory deletion MCP server running on stdio');
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
