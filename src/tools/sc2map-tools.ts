/**
 * SC2Map file tools: read, extract, list, write.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listArchive, extractFile, extractGalaxyScripts, extractXmlData, writeFileToArchive, isSC2Archive } from '../utils/sc2map-utils.js';
import { existsSync } from 'node:fs';

export function registerSc2MapTools(server: McpServer): void {
  server.tool(
    'sc2map_list',
    'List all files inside an SC2Map/SC2Mod/SC2Archive ZIP file.',
    {
      archivePath: z.string().describe('Path to the .sc2map/.sc2mod/.sc2archive file'),
    },
    async ({ archivePath }) => {
      try {
        if (!existsSync(archivePath)) return { content: [{ type: 'text' as const, text: 'Error: File not found: ' + archivePath }], isError: true as const };
        if (!isSC2Archive(archivePath)) return { content: [{ type: 'text' as const, text: 'Error: Not a recognized SC2 archive extension.' }], isError: true as const };
        const info = await listArchive(archivePath);
        const output: string[] = [
          '=== SC2 Archive: ' + archivePath + ' ===',
          'Entries: ' + info.entryCount, '',
        ];
        for (const entry of info.entries) {
          output.push((entry.isDir ? '[DIR] ' : '      ') + entry.path);
        }
        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: 'Error: ' + String(e) }], isError: true as const };
      }
    }
  );

  server.tool(
    'sc2map_read',
    'Read a specific file from an SC2Map/SC2Mod/SC2Archive ZIP file.',
    {
      archivePath: z.string().describe('Path to the archive file'),
      filePath: z.string().describe('Path inside the archive (e.g. "MapScript.galaxy")'),
    },
    async ({ archivePath, filePath }) => {
      try {
        if (!existsSync(archivePath)) return { content: [{ type: 'text' as const, text: 'Error: File not found' }], isError: true as const };
        const content = await extractFile(archivePath, filePath);
        return { content: [{ type: 'text' as const, text: '=== File: ' + filePath + ' ===\n\n' + content }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: 'Error: ' + String(e) }], isError: true as const };
      }
    }
  );

  server.tool(
    'sc2map_read_all_galaxy',
    'Read all Galaxy script (.galaxy) files from an SC2 archive.',
    {
      archivePath: z.string().describe('Path to the archive file'),
    },
    async ({ archivePath }) => {
      try {
        if (!existsSync(archivePath)) return { content: [{ type: 'text' as const, text: 'Error: File not found' }], isError: true as const };
        const scripts = await extractGalaxyScripts(archivePath);
        if (scripts.length === 0) return { content: [{ type: 'text' as const, text: 'No .galaxy files found in archive.' }] };
        const output: string[] = [
          '=== Galaxy Scripts in ' + archivePath + ' ===',
          'Found ' + scripts.length + ' .galaxy file(s)', '',
        ];
        for (const script of scripts) {
          output.push('--- ' + script.path + ' ---');
          output.push(script.content);
          output.push('');
        }
        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: 'Error: ' + String(e) }], isError: true as const };
      }
    }
  );

  server.tool(
    'sc2map_read_all_xml',
    'Read all XML data files from an SC2 archive.',
    {
      archivePath: z.string().describe('Path to the archive file'),
    },
    async ({ archivePath }) => {
      try {
        if (!existsSync(archivePath)) return { content: [{ type: 'text' as const, text: 'Error: File not found' }], isError: true as const };
        const xmlFiles = await extractXmlData(archivePath);
        if (xmlFiles.length === 0) return { content: [{ type: 'text' as const, text: 'No .xml files found in archive.' }] };
        const output: string[] = [
          '=== XML Data Files in ' + archivePath + ' ===',
          'Found ' + xmlFiles.length + ' .xml file(s)', '',
        ];
        for (const f of xmlFiles) {
          output.push('--- ' + f.path + ' ---');
          output.push(f.content.substring(0, 2000));
          if (f.content.length > 2000) output.push('... (truncated, ' + f.content.length + ' chars total)');
          output.push('');
        }
        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: 'Error: ' + String(e) }], isError: true as const };
      }
    }
  );

  server.tool(
    'sc2map_write',
    'Write/update a file inside an SC2Map/SC2Mod ZIP file. Backup your map first!',
    {
      archivePath: z.string().describe('Path to the archive file'),
      filePath: z.string().describe('Path inside the archive to write to'),
      content: z.string().describe('Content to write'),
    },
    async ({ archivePath, filePath, content }) => {
      try {
        if (!existsSync(archivePath)) return { content: [{ type: 'text' as const, text: 'Error: File not found' }], isError: true as const };
        await writeFileToArchive(archivePath, filePath, content);
        return { content: [{ type: 'text' as const, text: 'Successfully wrote ' + content.length + ' chars to ' + filePath + ' in ' + archivePath }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: 'Error writing file: ' + String(e) }], isError: true as const };
      }
    }
  );
}
