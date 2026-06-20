/**
 * Data XML tools: generate SC2 data editor XML.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateCatalogSkeleton, COMPONENT_FIELD_MAP } from '../utils/xml-utils.js';

export function registerDataXmlTools(server: McpServer): void {
  server.tool(
    'galaxy_generate_data_xml',
    'Generate SC2 Data Editor XML for a component (unit, weapon, effect, ability, behavior, upgrade, etc.).',
    {
      componentType: z.enum([
        'CUnit', 'CWeapon', 'CEffectDamage', 'CEffectCreatePersistent', 'CEffectLaunchMissile',
        'CAbilEffectTarget', 'CAbilTrain', 'CAbilBuild', 'CAbilMorph',
        'CBehaviorBuff', 'CUpgrade', 'CValidator', 'CActorUnit', 'CActorModel',
        'CRace', 'CItem', 'CSkin', 'CDoodad', 'CSound', 'CTerrain',
      ]).describe('SC2 data component type'),
      id: z.string().describe('Unique ID for the entry'),
      parentId: z.string().optional().describe('Parent entry ID to inherit from'),
      description: z.string().describe('Natural language description of the component'),
      fields: z.record(z.string(), z.string()).optional().describe('Field values to set (e.g. {"LifeMax": "100"})'),
    },
    async ({ componentType, id, parentId, description, fields }) => {
      const knownFields = COMPONENT_FIELD_MAP[componentType] || [];
      const output: string[] = [
        '=== SC2 Data XML Generation ===',
        '',
        'Component: ' + componentType,
        'ID: ' + id,
      ];
      if (parentId) output.push('Parent: ' + parentId);
      output.push('Description: ' + description);
      output.push('');
      output.push('Generated XML:');
      output.push(generateCatalogSkeleton(componentType, id, parentId));
      output.push('');
      if (knownFields.length > 0) {
        output.push('Available fields for ' + componentType + ':');
        for (const f of knownFields) {
          const val = fields?.[f];
          output.push('  <' + f + ' value="..."/>' + (val ? ' => Suggested: ' + val : ''));
        }
      }
      if (fields && Object.keys(fields).length > 0) {
        output.push('');
        output.push('Full XML with fields:');
        let filledXml = '<Catalog>\n  <' + componentType + ' id="' + id + '"';
        if (parentId) filledXml += ' parent="' + parentId + '"';
        filledXml += '>';
        for (const [key, val] of Object.entries(fields)) {
          filledXml += '\n    <' + key + ' value="' + val + '"/>';
        }
        filledXml += '\n  </' + componentType + '>\n</Catalog>';
        output.push(filledXml);
      }
      return { content: [{ type: 'text' as const, text: output.join('\n') }] };
    }
  );
}
