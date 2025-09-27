# @demarin/mcp-delete

A Model Context Protocol (MCP) server that provides file and directory deletion capabilities. This server allows AI assistants to safely delete files and directories when needed.

## Features

- Delete files and directories using absolute paths.
- Safe existence checks before deletion.
- Works with Cline and other MCP-compatible AI assistants.

## Installation & Configuration

This server can be run directly from its GitHub repository using `npx`.

Add the following configuration to your `cline_mcp_settings.json` file:

```json
{
  "mcpServers": {
    "demarin/mcp-delete": {
      "command": "npx",
      "args": [
        "-y",
        "github:demarin/mcp-delete"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### delete_file

Deletes a file at the specified absolute path.

**Parameters:**
- `path` (string, required): The absolute path to the file to delete.

### delete_directory

Deletes a directory at the specified absolute path.

**Parameters:**
- `path` (string, required): The absolute path to the directory to delete.

## Development

Clone the repository to get started with development:
```bash
git clone https://github.com/demarin/mcp-delete.git
cd mcp-delete
```

The source code is located in the `src/` directory and is written in TypeScript.

### Build Process

To make changes, modify the `.ts` files and then run the build script. This will compile the TypeScript into JavaScript in the `build/` directory.
```bash
./build.sh
```
**Important:** After building, you must commit and push the updated `build/` directory to the GitHub repository for the changes to take effect when running via `npx`.

## License

MIT

## Author

demarin
