import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer): void {
  server.prompt('create-unit', 'Guide through creating a custom unit', {
    unitName: z.string().describe('Unit ID (e.g. CustomMarine)'),
    parentUnit: z.string().describe('Parent unit (e.g. Marine)'),
    description: z.string().describe('What the unit should be like'),
  }, async ({ unitName, parentUnit, description }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Create a custom unit.\nID: ' + unitName + '\nParent: ' + parentUnit + '\nDescription: ' + description + '\n\nUse unit_create_full tool to generate the complete XML pipeline.' }}]
  }));

  server.prompt('create-map', 'Guide through creating a new SC2 map', {
    mapName: z.string().describe('Map name'),
    size: z.string().describe('Map size (e.g. 96x96)'),
    players: z.string().describe('Number of players'),
  }, async ({ mapName, size, players }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Create a new SC2 map.\nName: ' + mapName + '\nSize: ' + size + '\nPlayers: ' + players + '\n\nUse sc2map_create tool.' }}]
  }));

  server.prompt('create-mod', 'Guide through creating a new SC2 mod', {
    modName: z.string().describe('Mod name'),
    description: z.string().describe('What the mod adds'),
  }, async ({ modName, description }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Create a new SC2 mod.\nName: ' + modName + '\nDescription: ' + description + '\n\nUse sc2mod_create tool.' }}]
  }));

  server.prompt('import-asset', 'Guide through importing assets into a map/mod', {
    assetType: z.enum(['model', 'texture', 'sound', 'icon']).describe('Asset type'),
    assetPath: z.string().describe('Path to the asset file'),
    archivePath: z.string().describe('Path to the SC2 archive'),
  }, async ({ assetType, assetPath, archivePath }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Import a ' + assetType + ' into an SC2 archive.\nAsset: ' + assetPath + '\nArchive: ' + archivePath + '\n\nUse asset_import_file to add the file, then generate XML entry.' }}]
  }));

  server.prompt('create-ability', 'Guide through creating a custom ability', {
    abilityName: z.string().describe('Ability ID'),
    abilityType: z.string().describe('Type: EffectTarget, Train, Build, Morph'),
    description: z.string().describe('What the ability should do'),
  }, async ({ abilityName, abilityType, description }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Create ability ' + abilityName + ' (Type: ' + abilityType + ')\n' + description + '\n\nUse unit_generate_ability tool.' }}]
  }));

  server.prompt('create-trigger', 'Guide through creating a Galaxy trigger', {
    triggerName: z.string().describe('Trigger name'),
    description: z.string().describe('What the trigger should do'),
    eventType: z.string().describe('Event type'),
  }, async ({ triggerName, description, eventType }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Create trigger ' + triggerName + '\nEvent: ' + eventType + '\n' + description + '\n\nUse galaxy_generate_code tool.' }}]
  }));

  server.prompt('debug-galaxy-script', 'Debug Galaxy script issues', {
    code: z.string().describe('The Galaxy code'),
    problem: z.string().describe('The problem'),
  }, async ({ code, problem }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Debug Galaxy script.\nProblem: ' + problem + '\nCode:\n' + code }}]
  }));

  server.prompt('create-faction', 'Guide through creating a complete faction/race', {
    factionName: z.string().describe('Faction name (e.g. Mechanical Swarm)'),
    factionId: z.string().describe('Faction ID (e.g. MechanicalSwarm)'),
    theme: z.string().describe('Theme description'),
  }, async ({ factionName, factionId, theme }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Create a new faction.\nName: ' + factionName + '\nID: ' + factionId + '\nTheme: ' + theme + '\n\nUse faction.create tool to generate complete race with units, structures, and upgrades.' }}]
  }));

  server.prompt('generate-blueprint', 'Generate a map blueprint', {
    mapName: z.string().describe('Map name'),
    players: z.string().describe('Number of players'),
    theme: z.string().describe('Map theme (e.g. jungle, desert)'),
    gameMode: z.string().describe('Game mode (melee, coop, campaign)'),
  }, async ({ mapName, players, theme, gameMode }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Generate a map blueprint.\nName: ' + mapName + '\nPlayers: ' + players + '\nTheme: ' + theme + '\nMode: ' + gameMode + '\n\nUse map.generate_blueprint to create layout, then map.save_blueprint to save files.' }}]
  }));

  server.prompt('test-and-report', 'Test a map and generate report', {
    projectPath: z.string().describe('Path to SC2Components project'),
    mapPath: z.string().describe('Path to test map'),
  }, async ({ projectPath, mapPath }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const,
      text: 'Test map and generate report.\nProject: ' + projectPath + '\nMap: ' + mapPath + '\n\nWorkflow:\n1. project.backup\n2. run.launch_map\n3. run.capture_screenshot\n4. run.collect_logs\n5. report.generate' }}]
  }));
}
