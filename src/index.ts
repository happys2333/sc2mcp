#!/usr/bin/env node
/**
 * SC2MCP - MCP Server for StarCraft II Galaxy Editor
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';
import { registerPrompts } from './prompts/index.js';

async function main() {
  const server = new McpServer({
    name: 'sc2mcp',
    version: '0.1.0',
  });

  registerResources(server);
  registerTools(server);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SC2MCP server started (stdio transport)');
}

main().catch((err) => {
  console.error('SC2MCP server failed to start:', err);
  process.exit(1);
});
