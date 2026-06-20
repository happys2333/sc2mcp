/**
 * Terrain editing tools - generate terrain height, textures, cliffs, and map layout.
 * SC2 terrain is stored as a grid of cells with height values and texture layers.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerTerrainTools(server: McpServer): void {
  // terrain_generate_heightmap
  server.tool(
    'terrain_generate_heightmap',
    'Generate terrain height data XML for a map. Creates height values for a grid region.',
    {
      regionName: z.string().describe('Region name (e.g. "MainBase")'),
      startX: z.number().describe('Start X coordinate'),
      startY: z.number().describe('Start Y coordinate'),
      endX: z.number().describe('End X coordinate'),
      endY: z.number().describe('End Y coordinate'),
      baseHeight: z.number().optional().describe('Base height value').default(10),
      variation: z.number().optional().describe('Height variation amount').default(2),
      pattern: z.enum(['flat', 'hill', 'valley', 'ridge', 'random']).optional().describe('Height pattern').default('flat'),
    },
    async ({ regionName, startX, startY, endX, endY, baseHeight, variation, pattern }) => {
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);
      const lines: string[] = [];
      lines.push('<!-- Terrain Heightmap: ' + regionName + ' -->');
      lines.push('<!-- Size: ' + width + 'x' + height + ' cells -->');
      lines.push('<!-- Pattern: ' + pattern + ', Base: ' + baseHeight + ', Variation: ' + variation + ' -->');
      lines.push('');
      lines.push('// Galaxy code to set terrain heights:');
      lines.push('void tg_' + regionName + '_GenerateTerrain() {');
      lines.push('    fixed baseHeight = ' + baseHeight.toFixed(1) + ';');
      lines.push('    fixed variation = ' + variation.toFixed(1) + ';');
      lines.push('');

      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);

      for (let y = minY; y <= Math.max(startY, endY); y += 4) {
        for (let x = minX; x <= Math.max(startX, endX); x += 4) {
          let h = baseHeight;
          if (pattern === 'hill') {
            const cx = (minX + Math.max(startX, endX)) / 2;
            const cy = (minY + Math.max(startY, endY)) / 2;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const maxDist = Math.sqrt(width ** 2 + height ** 2) / 2;
            h = baseHeight + variation * (1 - dist / maxDist);
          } else if (pattern === 'valley') {
            const cx = (minX + Math.max(startX, endX)) / 2;
            const dist = Math.abs(x - cx);
            const halfW = width / 2;
            h = baseHeight - variation * (1 - dist / halfW);
          } else if (pattern === 'ridge') {
            const cy = (minY + Math.max(startY, endY)) / 2;
            const dist = Math.abs(y - cy);
            const halfH = height / 2;
            h = baseHeight + variation * (1 - dist / halfH);
          } else if (pattern === 'random') {
            h = baseHeight + (Math.random() * 2 - 1) * variation;
          }
          lines.push('    TerrainSetHeight(' + x.toFixed(1) + ', ' + y.toFixed(1) + ', ' + h.toFixed(2) + ');');
        }
      }
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // terrain_set_texture
  server.tool(
    'terrain_set_texture',
    'Generate Galaxy code to paint terrain texture on a region.',
    {
      regionName: z.string().describe('Region name'),
      startX: z.number(),
      startY: z.number(),
      endX: z.number(),
      endY: z.number(),
      textureId: z.string().describe('Texture layer ID (e.g. "Dirt", "Grass", "Rock", "Sand")'),
      layer: z.number().optional().describe('Texture layer (0-3)').default(0),
    },
    async ({ regionName, startX, startY, endX, endY, textureId, layer }) => {
      const lines: string[] = [];
      lines.push('<!-- Terrain Texture: ' + regionName + ' -->');
      lines.push('void tg_' + regionName + '_PaintTexture() {');
      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);
      const maxX = Math.max(startX, endX);
      const maxY = Math.max(startY, endY);
      for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
          lines.push('    TerrainSetType(' + x + ', ' + y + ', "' + textureId + '", ' + layer + ');');
        }
      }
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // terrain_create_cliff
  server.tool(
    'terrain_create_cliff',
    'Generate Galaxy code to create cliff edges between height levels.',
    {
      regionName: z.string().describe('Region name'),
      startX: z.number(),
      startY: z.number(),
      endX: z.number(),
      endY: z.number(),
      cliffHeight: z.number().optional().describe('Cliff height difference').default(4),
      cliffType: z.string().optional().describe('Cliff mesh type').default('Default'),
    },
    async ({ regionName, startX, startY, endX, endY, cliffHeight }) => {
      const lines: string[] = [];
      lines.push('<!-- Cliff: ' + regionName + ' -->');
      lines.push('void tg_' + regionName + '_CreateCliff() {');
      lines.push('    // Set lower area');
      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);
      const maxX = Math.max(startX, endX);
      const midX = Math.floor((minX + maxX) / 2);
      for (let y = minY; y <= Math.max(startY, endY); y += 4) {
        for (let x = minX; x <= midX; x += 4) {
          lines.push('    TerrainSetHeight(' + x + '.0, ' + y + '.0, 8.0);');
        }
        for (let x = midX + 4; x <= maxX; x += 4) {
          lines.push('    TerrainSetHeight(' + x + '.0, ' + y + '.0, ' + (8 + cliffHeight).toFixed(1) + ');');
        }
      }
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  // terrain_create_ramp
  server.tool(
    'terrain_create_ramp',
    'Generate Galaxy code to create a ramp between two height levels.',
    {
      regionName: z.string().describe('Region name'),
      startX: z.number(),
      startY: z.number(),
      endX: z.number(),
      endY: z.number(),
      lowHeight: z.number().optional().default(8),
      highHeight: z.number().optional().default(12),
      rampWidth: z.number().optional().describe('Width of the ramp transition').default(8),
    },
    async ({ regionName, startX, startY, endX, endY, lowHeight, highHeight, rampWidth }) => {
      const lines: string[] = [];
      lines.push('<!-- Ramp: ' + regionName + ' -->');
      lines.push('void tg_' + regionName + '_CreateRamp() {');
      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);
      const maxX = Math.max(startX, endX);
      const maxY = Math.max(startY, endY);
      const heightDiff = highHeight - lowHeight;
      for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
          const progress = (x - minX) / Math.max(1, maxX - minX);
          const h = lowHeight + heightDiff * progress;
          lines.push('    TerrainSetHeight(' + x + '.0, ' + y + '.0, ' + h.toFixed(2) + ');');
        }
      }
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
