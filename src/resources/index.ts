/**
 * Resource registration for MCP server.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { galaxyApiReference } from './galaxy-api.js';
import { galaxyTypesReference } from './galaxy-types.js';
import { dataXmlSchemaReference } from './data-xml-schema.js';
import { triggerReference } from './trigger-reference.js';
import { commonPatternsReference } from './common-patterns.js';
import { mapFormatReference } from './map-format.js';
import { assetFormatsReference } from './asset-formats.js';

export function registerResources(server: McpServer): void {
  server.resource('galaxy-api-reference', 'galaxy://reference/api', async (uri) => ({
    contents: [{ uri: uri.href, text: galaxyApiReference, mimeType: 'text/plain' }],
  }));
  server.resource('galaxy-types-reference', 'galaxy://reference/types', async (uri) => ({
    contents: [{ uri: uri.href, text: galaxyTypesReference, mimeType: 'text/plain' }],
  }));
  server.resource('data-xml-schema', 'galaxy://reference/data-xml-schema', async (uri) => ({
    contents: [{ uri: uri.href, text: dataXmlSchemaReference, mimeType: 'text/plain' }],
  }));
  server.resource('trigger-reference', 'galaxy://reference/triggers', async (uri) => ({
    contents: [{ uri: uri.href, text: triggerReference, mimeType: 'text/plain' }],
  }));
  server.resource('common-patterns', 'galaxy://examples/common-patterns', async (uri) => ({
    contents: [{ uri: uri.href, text: commonPatternsReference, mimeType: 'text/plain' }],
  }));
  server.resource('map-format', 'galaxy://reference/map-format', async (uri) => ({
    contents: [{ uri: uri.href, text: mapFormatReference, mimeType: 'text/plain' }],
  }));
  server.resource('asset-formats', 'galaxy://reference/asset-formats', async (uri) => ({
    contents: [{ uri: uri.href, text: assetFormatsReference, mimeType: 'text/plain' }],
  }));
}
