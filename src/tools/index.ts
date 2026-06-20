import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGalaxyTools } from './galaxy-tools.js';
import { registerDataXmlTools } from './data-xml-tools.js';
import { registerSc2MapTools } from './sc2map-tools.js';
import { registerMapCreationTools } from './map-creation.js';
import { registerUnitTools } from './unit-operations.js';
import { registerAssetTools } from './asset-management.js';
import { registerTerrainTools } from './terrain-tools.js';
import { registerObjectTools } from './object-tools.js';
import { registerTriggerTools } from './trigger-tools.js';
import { registerDataTools } from './data-tools.js';
import { registerUiTools } from './ui-tools.js';
import { registerProjectTools } from './project-tools.js';
import { registerTemplateTools } from './template-tools.js';
import { registerRunnerTools } from './runner-tools.js';
import { registerReportTools } from './report-tools.js';
import { registerBlueprintTools } from './blueprint-tools.js';
import { registerFactionTools } from './faction-tools.js';

export function registerTools(server: McpServer): void {
  registerProjectTools(server);
  registerGalaxyTools(server);
  registerDataXmlTools(server);
  registerSc2MapTools(server);
  registerMapCreationTools(server);
  registerUnitTools(server);
  registerAssetTools(server);
  registerTerrainTools(server);
  registerObjectTools(server);
  registerTriggerTools(server);
  registerDataTools(server);
  registerUiTools(server);
  registerTemplateTools(server);
  registerRunnerTools(server);
  registerReportTools(server);
  registerBlueprintTools(server);
  registerFactionTools(server);
}
