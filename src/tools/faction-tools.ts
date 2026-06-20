/**
 * Faction/Race generator tools - create complete SC2 factions with all required components.
 * Generates units, structures, abilities, upgrades, buttons, and localization.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface FactionConfig {
  id: string;
  displayName: string;
  description: string;
  theme: string;
  race: string;
  economy: {
    worker: string;
    townHall: string;
    supply: string;
    primaryResource: string;
    secondaryResource: string;
  };
  units: UnitConfig[];
  structures: StructureConfig[];
  upgrades: UpgradeConfig[];
  colors: {
    primary: string;
    secondary: string;
  };
}

interface UnitConfig {
  id: string;
  role: string;
  displayName: string;
  parent?: string;
  hp: number;
  armor: number;
  shields: number;
  speed: number;
  food: number;
  minerals: number;
  vespene: number;
  buildTime: number;
  weaponDamage: number;
  weaponRange: number;
  weaponPeriod: number;
  abilities: string[];
  icon: string;
}

interface StructureConfig {
  id: string;
  role: string;
  displayName: string;
  parent?: string;
  hp: number;
  armor: number;
  minerals: number;
  vespene: number;
  buildTime: number;
  produces: string[];
  icon: string;
}

interface UpgradeConfig {
  id: string;
  displayName: string;
  type: string;
  maxLevel: number;
  mineralCost: number;
  vespeneCost: number;
  timeCost: number;
}

function generateFactionXml(faction: FactionConfig): string {
  const lines: string[] = [];
  
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<Catalog>');
  
  lines.push(`  <CRace id="${faction.id}">`);
  lines.push(`    <Name value="${faction.displayName}"/>`);
  lines.push(`    <Description value="${faction.description}"/>`);
  lines.push('  </CRace>');
  lines.push('');
  
  for (const unit of faction.units) {
    lines.push(`  <CUnit id="${unit.id}"${unit.parent ? ` parent="${unit.parent}"` : ''}>`);
    lines.push(`    <Name value="${unit.displayName}"/>`);
    lines.push(`    <Race value="${faction.race}"/>`);
    lines.push(`    <LifeMax value="${unit.hp.toFixed(1)}"/>`);
    lines.push(`    <LifeArmor value="${unit.armor.toFixed(1)}"/>`);
    if (unit.shields > 0) {
      lines.push(`    <ShieldsMax value="${unit.shields.toFixed(1)}"/>`);
    }
    lines.push(`    <Speed value="${unit.speed.toFixed(3)}"/>`);
    lines.push(`    <Food value="${unit.food.toFixed(1)}"/>`);
    lines.push(`    <CostResource Minerals="${unit.minerals.toFixed(1)}" Vespene="${unit.vespene.toFixed(1)}"/>`);
    lines.push(`    <CostResource Time="${unit.buildTime.toFixed(1)}"/>`);
    lines.push(`    <WeaponArray Link="${unit.id}Weapon"/>`);
    for (const abil of unit.abilities) {
      lines.push(`    <AbilArray Link="${abil}"/>`);
    }
    lines.push(`    <Icon value="${unit.icon}"/>`);
    lines.push('  </CUnit>');
    lines.push('');
    
    lines.push(`  <CWeapon id="${unit.id}Weapon">`);
    lines.push(`    <DisplayEffect Link="${unit.id}Damage"/>`);
    lines.push(`    <Range value="${unit.weaponRange.toFixed(1)}"/>`);
    lines.push(`    <Period value="${unit.weaponPeriod.toFixed(4)}"/>`);
    lines.push('  </CWeapon>');
    lines.push(`  <CEffectDamage id="${unit.id}Damage">`);
    lines.push(`    <Amount value="${unit.weaponDamage.toFixed(1)}"/>`);
    lines.push('  </CEffectDamage>');
    lines.push('');
    
    lines.push(`  <CActorUnit id="${unit.id}Actor">`);
    lines.push(`    <UnitName value="${unit.id}"/>`);
    lines.push('  </CActorUnit>');
    lines.push('');
    
    lines.push(`  <CButton id="${unit.id}Button">`);
    lines.push(`    <Name value="${unit.displayName}"/>`);
    lines.push(`    <Icon value="${unit.icon}"/>`);
    lines.push('  </CButton>');
    lines.push('');
  }
  
  for (const struct of faction.structures) {
    lines.push(`  <CUnit id="${struct.id}"${struct.parent ? ` parent="${struct.parent}"` : ''}>`);
    lines.push(`    <Name value="${struct.displayName}"/>`);
    lines.push(`    <Race value="${faction.race}"/>`);
    lines.push(`    <LifeMax value="${struct.hp.toFixed(1)}"/>`);
    lines.push(`    <LifeArmor value="${struct.armor.toFixed(1)}"/>`);
    lines.push(`    <CostResource Minerals="${struct.minerals.toFixed(1)}" Vespene="${struct.vespene.toFixed(1)}"/>`);
    lines.push(`    <CostResource Time="${struct.buildTime.toFixed(1)}"/>`);
    lines.push(`    <Icon value="${struct.icon}"/>`);
    lines.push('  </CUnit>');
    lines.push('');
    
    lines.push(`  <CButton id="${struct.id}Button">`);
    lines.push(`    <Name value="${struct.displayName}"/>`);
    lines.push(`    <Icon value="${struct.icon}"/>`);
    lines.push('  </CButton>');
    lines.push('');
  }
  
  for (const upgrade of faction.upgrades) {
    lines.push(`  <CUpgrade id="${upgrade.id}">`);
    lines.push(`    <Name value="${upgrade.displayName}"/>`);
    lines.push(`    <MaxLevel value="${upgrade.maxLevel}"/>`);
    lines.push('    <CostArray>');
    for (let lvl = 1; lvl <= upgrade.maxLevel; lvl++) {
      lines.push(`      <Cost Level="${lvl}" Minerals="${upgrade.mineralCost * lvl}" Vespene="${upgrade.vespeneCost * lvl}" Time="${upgrade.timeCost * lvl}"/>`);
    }
    lines.push('    </CostArray>');
    lines.push('  </CUpgrade>');
    lines.push('');
  }
  
  lines.push('</Catalog>');
  return lines.join('\n');
}

function generateFactionScripts(faction: FactionConfig): string {
  const lines: string[] = [];
  
  lines.push(`// ${faction.displayName} - Faction Initialization`);
  lines.push(`// Generated by SC2 AI Workbench`);
  lines.push('');
  lines.push(`// Race: ${faction.race}`);
  lines.push(`// Theme: ${faction.theme}`);
  lines.push('');
  
  lines.push('// Starting Units');
  lines.push(`void ${faction.id}_GiveStartingUnits(int player) {`);
  lines.push(`    UnitCreate(1, "${faction.economy.townHall}", 64.0, 64.0, 0.0, player);`);
  lines.push(`    for (int i = 0; i < 6; i++) {`);
  lines.push(`        UnitCreate(1, "${faction.economy.worker}", 64.0 + (i * 2.0), 64.0, 0.0, player);`);
  lines.push(`    }`);
  lines.push('}');
  lines.push('');
  
  lines.push('// Initialization');
  lines.push(`void ${faction.id}_Init() {`);
  lines.push(`    // Register starting units trigger`);
  lines.push(`    trigger t = TriggerCreate("gt_${faction.id}_GameStart_Func");`);
  lines.push('    TriggerAddEventGameStart(t);');
  lines.push('}');
  lines.push('');
  
  return lines.join('\n');
}

function generateGameStrings(faction: FactionConfig): string {
  const lines: string[] = [];
  
  lines.push(`// ${faction.displayName} - Game Strings`);
  lines.push('');
  lines.push(`Race/${faction.id}=${faction.displayName}`);
  lines.push(`Race/${faction.id}/Description=${faction.description}`);
  lines.push('');
  
  for (const unit of faction.units) {
    lines.push(`Unit/${unit.id}=${unit.displayName}`);
    lines.push(`Unit/${unit.id}/Description=A ${unit.role} unit of the ${faction.displayName}`);
  }
  lines.push('');
  
  for (const struct of faction.structures) {
    lines.push(`Unit/${struct.id}=${struct.displayName}`);
    lines.push(`Unit/${struct.id}/Description=A ${struct.role} structure of the ${faction.displayName}`);
  }
  lines.push('');
  
  for (const upgrade of faction.upgrades) {
    lines.push(`Upgrade/${upgrade.id}=${upgrade.displayName}`);
  }
  
  return lines.join('\n');
}

export function registerFactionTools(server: McpServer): void {
  server.tool(
    'faction.create',
    'Create a complete faction/race with units, structures, upgrades, and localization.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      id: z.string().describe('Faction ID (e.g. MechanicalSwarm)'),
      displayName: z.string().describe('Display name'),
      description: z.string().optional().default('').describe('Faction description'),
      theme: z.string().optional().default('standard').describe('Theme description'),
      race: z.string().optional().default('Terran').describe('Base race for mechanics'),
      workerId: z.string().optional().describe('Worker unit ID'),
      townHallId: z.string().optional().describe('Town hall structure ID'),
      supplyId: z.string().optional().describe('Supply structure ID'),
      includeUnits: z.boolean().optional().default(true),
      includeUpgrades: z.boolean().optional().default(true),
    },
    async (params) => {
      try {
        const factionId = params.id;
        const workerId = params.workerId || factionId + 'Worker';
        const townHallId = params.townHallId || factionId + 'Base';
        const supplyId = params.supplyId || factionId + 'Supply';
        
        const faction: FactionConfig = {
          id: factionId,
          displayName: params.displayName,
          description: params.description || `The ${params.displayName} faction`,
          theme: params.theme,
          race: params.race,
          economy: {
            worker: workerId,
            townHall: townHallId,
            supply: supplyId,
            primaryResource: 'minerals',
            secondaryResource: 'vespene',
          },
          units: [
            {
              id: workerId,
              role: 'worker',
              displayName: params.displayName + ' Worker',
              parent: 'SCV',
              hp: 45,
              armor: 0,
              shields: 0,
              speed: 2.8,
              food: 1,
              minerals: 50,
              vespene: 0,
              buildTime: 12,
              weaponDamage: 5,
              weaponRange: 2,
              weaponPeriod: 1.0,
              abilities: [],
              icon: 'Assets/Icons/icon-worker.dds',
            },
            {
              id: factionId + 'Melee',
              role: 'melee_basic',
              displayName: params.displayName + ' Warrior',
              parent: 'Marine',
              hp: 100,
              armor: 1,
              shields: 0,
              speed: 2.25,
              food: 2,
              minerals: 75,
              vespene: 0,
              buildTime: 20,
              weaponDamage: 10,
              weaponRange: 2,
              weaponPeriod: 0.86,
              abilities: [],
              icon: 'Assets/Icons/icon-melee.dds',
            },
            {
              id: factionId + 'Ranged',
              role: 'ranged_basic',
              displayName: params.displayName + ' Marksman',
              parent: 'Marine',
              hp: 80,
              armor: 0,
              shields: 0,
              speed: 2.25,
              food: 2,
              minerals: 100,
              vespene: 25,
              buildTime: 25,
              weaponDamage: 12,
              weaponRange: 6,
              weaponPeriod: 1.1,
              abilities: [],
              icon: 'Assets/Icons/icon-ranged.dds',
            },
          ],
          structures: [
            {
              id: townHallId,
              role: 'townhall',
              displayName: params.displayName + ' Base',
              parent: 'CommandCenter',
              hp: 1500,
              armor: 1,
              minerals: 400,
              vespene: 0,
              buildTime: 71,
              produces: [workerId],
              icon: 'Assets/Icons/icon-base.dds',
            },
            {
              id: supplyId,
              role: 'supply',
              displayName: params.displayName + ' Supply',
              parent: 'SupplyDepot',
              hp: 500,
              armor: 1,
              minerals: 100,
              vespene: 0,
              buildTime: 21,
              produces: [],
              icon: 'Assets/Icons/icon-supply.dds',
            },
            {
              id: factionId + 'Barracks',
              role: 'production',
              displayName: params.displayName + ' Barracks',
              parent: 'Barracks',
              hp: 1000,
              armor: 1,
              minerals: 150,
              vespene: 0,
              buildTime: 46,
              produces: [factionId + 'Melee', factionId + 'Ranged'],
              icon: 'Assets/Icons/icon-barracks.dds',
            },
            {
              id: factionId + 'Turret',
              role: 'defense',
              displayName: params.displayName + ' Turret',
              parent: 'MissileTurret',
              hp: 300,
              armor: 1,
              minerals: 100,
              vespene: 0,
              buildTime: 21,
              produces: [],
              icon: 'Assets/Icons/icon-turret.dds',
            },
          ],
          upgrades: [
            {
              id: factionId + 'AttackLevel1',
              displayName: params.displayName + ' Attack Level 1',
              type: 'attack',
              maxLevel: 3,
              mineralCost: 100,
              vespeneCost: 100,
              timeCost: 60,
            },
            {
              id: factionId + 'ArmorLevel1',
              displayName: params.displayName + ' Armor Level 1',
              type: 'armor',
              maxLevel: 3,
              mineralCost: 100,
              vespeneCost: 100,
              timeCost: 60,
            },
          ],
          colors: {
            primary: '#00ff00',
            secondary: '#008800',
          },
        };
        
        const gameDataDir = join(params.projectPath, 'Base.SC2Data', 'GameData');
        const scriptsDir = join(params.projectPath, 'scripts');
        const localeDir = join(params.projectPath, 'enUS.SC2Data', 'LocalizedData');
        
        if (!existsSync(gameDataDir)) await mkdir(gameDataDir, { recursive: true });
        if (!existsSync(scriptsDir)) await mkdir(scriptsDir, { recursive: true });
        if (!existsSync(localeDir)) await mkdir(localeDir, { recursive: true });
        
        const factionXml = generateFactionXml(faction);
        await writeFile(join(gameDataDir, `${factionId}Data.xml`), factionXml);
        
        const factionScript = generateFactionScripts(faction);
        await writeFile(join(scriptsDir, `${factionId}_init.galaxy`), factionScript);
        
        const gameStrings = generateGameStrings(faction);
        const existingStrings = existsSync(join(localeDir, 'GameStrings.txt')) 
          ? await readFile(join(localeDir, 'GameStrings.txt'), 'utf-8')
          : '';
        await writeFile(join(localeDir, 'GameStrings.txt'), existingStrings + '\n' + gameStrings);
        
        const output: string[] = [
          '=== Faction Created ===',
          '',
          `Faction: ${faction.displayName} (${faction.id})`,
          `Theme: ${faction.theme}`,
          `Race: ${faction.race}`,
          '',
          'Units (' + faction.units.length + '):',
          ...faction.units.map(u => `  - ${u.displayName} (${u.role})`),
          '',
          'Structures (' + faction.structures.length + '):',
          ...faction.structures.map(s => `  - ${s.displayName} (${s.role})`),
          '',
          'Upgrades (' + faction.upgrades.length + '):',
          ...faction.upgrades.map(u => `  - ${u.displayName}`),
          '',
          'Files created:',
          `  - GameData/${factionId}Data.xml`,
          `  - scripts/${factionId}_init.galaxy`,
          `  - enUS.SC2Data/LocalizedData/GameStrings.txt`,
          '',
          'Next steps:',
          '1. Create icons for units and structures',
          '2. Test the faction in a map',
          '3. Adjust stats as needed',
        ];
        
        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating faction: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'faction.generate_from_schema',
    'Generate a faction from a detailed JSON schema.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      schema: z.object({
        id: z.string(),
        displayName: z.object({
          enUS: z.string(),
          zhCN: z.string().optional(),
        }),
        theme: z.string(),
        economy: z.object({
          worker: z.string(),
          townHall: z.string(),
          supply: z.string(),
        }),
        units: z.array(z.object({
          role: z.string(),
          id: z.string(),
          displayName: z.string(),
          hp: z.number().optional(),
          armor: z.number().optional(),
          speed: z.number().optional(),
          weaponDamage: z.number().optional(),
          weaponRange: z.number().optional(),
        })),
        structures: z.array(z.object({
          role: z.string(),
          id: z.string(),
          displayName: z.string(),
          hp: z.number().optional(),
          minerals: z.number().optional(),
        })),
        upgrades: z.array(z.object({
          id: z.string(),
          type: z.string(),
          level: z.number().optional(),
        })).optional(),
      }),
    },
    async ({ projectPath, schema }) => {
      try {
        const faction: FactionConfig = {
          id: schema.id,
          displayName: schema.displayName.enUS,
          description: `The ${schema.displayName.enUS} faction`,
          theme: schema.theme,
          race: 'Terran',
          economy: {
            worker: schema.economy.worker,
            townHall: schema.economy.townHall,
            supply: schema.economy.supply,
            primaryResource: 'minerals',
            secondaryResource: 'vespene',
          },
          units: schema.units.map(u => ({
            id: u.id,
            role: u.role,
            displayName: u.displayName,
            hp: u.hp || 100,
            armor: u.armor || 0,
            shields: 0,
            speed: u.speed || 2.25,
            food: u.role === 'worker' ? 1 : 2,
            minerals: u.role === 'worker' ? 50 : 100,
            vespene: 0,
            buildTime: u.role === 'worker' ? 12 : 20,
            weaponDamage: u.weaponDamage || 6,
            weaponRange: u.weaponRange || 5,
            weaponPeriod: 0.86,
            abilities: [],
            icon: `Assets/Icons/icon-${u.id.toLowerCase()}.dds`,
          })),
          structures: schema.structures.map(s => ({
            id: s.id,
            role: s.role,
            displayName: s.displayName,
            hp: s.hp || 1000,
            armor: 1,
            minerals: s.minerals || 150,
            vespene: 0,
            buildTime: 46,
            produces: [],
            icon: `Assets/Icons/icon-${s.id.toLowerCase()}.dds`,
          })),
          upgrades: (schema.upgrades || []).map(u => ({
            id: u.id,
            displayName: u.id,
            type: u.type,
            maxLevel: u.level || 1,
            mineralCost: 100,
            vespeneCost: 100,
            timeCost: 60,
          })),
          colors: {
            primary: '#00ff00',
            secondary: '#008800',
          },
        };
        
        const gameDataDir = join(projectPath, 'Base.SC2Data', 'GameData');
        const localeDir = join(projectPath, 'enUS.SC2Data', 'LocalizedData');
        
        if (!existsSync(gameDataDir)) await mkdir(gameDataDir, { recursive: true });
        if (!existsSync(localeDir)) await mkdir(localeDir, { recursive: true });
        
        const factionXml = generateFactionXml(faction);
        await writeFile(join(gameDataDir, `${schema.id}Data.xml`), factionXml);
        
        const gameStrings = generateGameStrings(faction);
        const existingStrings = existsSync(join(localeDir, 'GameStrings.txt'))
          ? await readFile(join(localeDir, 'GameStrings.txt'), 'utf-8')
          : '';
        await writeFile(join(localeDir, 'GameStrings.txt'), existingStrings + '\n' + gameStrings);
        
        return {
          content: [{
            type: 'text' as const,
            text: `Faction generated from schema!\n\nID: ${schema.id}\nName: ${schema.displayName.enUS}\nUnits: ${faction.units.length}\nStructures: ${faction.structures.length}\n\nWritten to: ${gameDataDir}/${schema.id}Data.xml`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error generating faction: ' + e.message }], isError: true as const };
      }
    }
  );
}
