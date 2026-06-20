/**
 * Template system for SC2 AI Workbench.
 * Provides stable templates for creating units, abilities, buttons, etc.
 * AI fills parameters -> Template generates valid XML -> Validator checks references.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';

interface UnitTemplateConfig {
  id: string;
  displayName: string;
  description: string;
  race: string;
  parent?: string;
  life: number;
  armor: number;
  shields: number;
  speed: number;
  sightRange: number;
  food: number;
  minerals: number;
  vespene: number;
  buildTime: number;
  weaponId: string;
  weaponDamage: number;
  weaponRange: number;
  weaponPeriod: number;
  weaponType: string;
  abilities: string[];
  behaviors: string[];
  iconPath: string;
  modelPath?: string;
}

function generateButtonXml(id: string, name: string, icon: string, tooltip: string, hotkey: string): string {
  return `  <CButton id="${id}">
    <Name value="${name}"/>
    <Icon value="${icon}"/>
    <TooltipTitle value="${name}"/>
    <TooltipBody value="${tooltip}"/>
    <Hotkey value="${hotkey}"/>
  </CButton>`;
}

function generateUnitXml(cfg: UnitTemplateConfig): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<Catalog>');
  
  lines.push(`  <CUnit id="${cfg.id}"${cfg.parent ? ` parent="${cfg.parent}"` : ''}>`);
  lines.push(`    <Name value="${cfg.displayName}"/>`);
  lines.push(`    <Race value="${cfg.race}"/>`);
  lines.push(`    <LifeMax value="${cfg.life.toFixed(1)}"/>`);
  lines.push(`    <LifeArmor value="${cfg.armor.toFixed(1)}"/>`);
  if (cfg.shields > 0) {
    lines.push(`    <ShieldsMax value="${cfg.shields.toFixed(1)}"/>`);
  }
  lines.push(`    <Speed value="${cfg.speed.toFixed(3)}"/>`);
  lines.push(`    <Sight value="${cfg.sightRange.toFixed(1)}"/>`);
  lines.push(`    <Food value="${cfg.food.toFixed(1)}"/>`);
  lines.push(`    <CostResource Minerals="${cfg.minerals.toFixed(1)}" Vespene="${cfg.vespene.toFixed(1)}"/>`);
  lines.push(`    <CostResource Time="${cfg.buildTime.toFixed(1)}"/>`);
  lines.push(`    <WeaponArray Link="${cfg.weaponId}"/>`);
  if (cfg.abilities.length > 0) {
    for (const abil of cfg.abilities) {
      lines.push(`    <AbilArray Link="${abil}"/>`);
    }
  }
  if (cfg.behaviors.length > 0) {
    for (const beh of cfg.behaviors) {
      lines.push(`    <BehaviorArray Link="${beh}"/>`);
    }
  }
  lines.push(`    <Icon value="${cfg.iconPath}"/>`);
  lines.push('  </CUnit>');

  lines.push(`  <CWeapon id="${cfg.weaponId}">`);
  lines.push(`    <DisplayEffect Link="${cfg.weaponId}Damage"/>`);
  lines.push(`    <Range value="${cfg.weaponRange.toFixed(1)}"/>`);
  lines.push(`    <Period value="${cfg.weaponPeriod.toFixed(4)}"/>`);
  lines.push(`    <WeaponType value="${cfg.weaponType}"/>`);
  lines.push('  </CWeapon>');

  lines.push(`  <CEffectDamage id="${cfg.weaponId}Damage">`);
  lines.push(`    <Amount value="${cfg.weaponDamage.toFixed(1)}"/>`);
  lines.push('  </CEffectDamage>');

  lines.push(`  <CActorUnit id="${cfg.id}Actor">`);
  lines.push(`    <UnitName value="${cfg.id}"/>`);
  if (cfg.modelPath) {
    lines.push(`    <Model value="${cfg.modelPath}"/>`);
  }
  lines.push('  </CActorUnit>');

  lines.push('</Catalog>');
  return lines.join('\n');
}

function generateAbilityXml(id: string, name: string, type: string, costEnergy: number, cooldown: number, range: number, effectAmount: number): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<Catalog>');

  lines.push(`  <CAbil${type} id="${id}">`);
  lines.push(`    <Name value="${name}"/>`);
  if (costEnergy > 0) {
    lines.push(`    <Cost Energy="${costEnergy}"/>`);
  }
  if (cooldown > 0) {
    lines.push(`    <Cooldown TimeUse="${cooldown}"/>`);
  }
  if (range > 0) {
    lines.push(`    <Range value="${range}"/>`);
  }
  lines.push(`    <Effect Link="${id}Effect"/>`);
  lines.push(`  </CAbil${type}>`);

  lines.push(`  <CEffectDamage id="${id}Effect">`);
  lines.push(`    <Amount value="${effectAmount}"/>`);
  lines.push('  </CEffectDamage>');

  lines.push('</Catalog>');
  return lines.join('\n');
}

function generateUpgradeXml(id: string, name: string, maxLevel: number, mineralCost: number, vespeneCost: number, timeCost: number): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<Catalog>');

  lines.push(`  <CUpgrade id="${id}">`);
  lines.push(`    <Name value="${name}"/>`);
  lines.push(`    <MaxLevel value="${maxLevel}"/>`);
  lines.push('    <CostArray>');
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    lines.push(`      <Cost Level="${lvl}" Minerals="${mineralCost * lvl}" Vespene="${vespeneCost * lvl}" Time="${timeCost * lvl}"/>`);
  }
  lines.push('    </CostArray>');
  lines.push('  </CUpgrade>');

  lines.push('</Catalog>');
  return lines.join('\n');
}

function generateBehaviorXml(id: string, name: string, duration: number, modifications: Record<string, number>): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<Catalog>');

  lines.push(`  <CBehaviorBuff id="${id}">`);
  lines.push(`    <Name value="${name}"/>`);
  if (duration > 0) {
    lines.push(`    <Duration value="${duration}"/>`);
  }
  if (Object.keys(modifications).length > 0) {
    lines.push('    <ModificationArray>');
    lines.push('      <Mod');
    for (const [key, value] of Object.entries(modifications)) {
      lines.push(`        ${key}="${value}"`);
    }
    lines.push('      />');
    lines.push('    </ModificationArray>');
  }
  lines.push('  </CBehaviorBuff>');

  lines.push('</Catalog>');
  return lines.join('\n');
}

function generateLocalizationEntry(key: string, value: string): string {
  return `${key}=${value}`;
}

export function registerTemplateTools(server: McpServer): void {
  server.tool(
    'template.create_unit',
    'Create a complete unit using template system. Generates UnitData, WeaponData, EffectData, ActorData, and ButtonData.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      template: z.enum(['worker', 'melee_basic', 'ranged_basic', 'caster', 'flying_basic', 'hero']).describe('Unit template type'),
      id: z.string().describe('Unique unit ID (e.g. VoidRanger)'),
      displayName: z.string().describe('Display name'),
      race: z.string().describe('Race name'),
      parent: z.string().optional().describe('Parent unit to inherit from'),
      hp: z.number().optional().default(100),
      armor: z.number().optional().default(0),
      shields: z.number().optional().default(0),
      speed: z.number().optional().default(2.25),
      minerals: z.number().optional().default(50),
      vespene: z.number().optional().default(0),
      buildTime: z.number().optional().default(18),
      weaponDamage: z.number().optional().default(6),
      weaponRange: z.number().optional().default(5),
      weaponPeriod: z.number().optional().default(0.86),
      iconPath: z.string().optional().default('Assets/Icons/icon.dds'),
    },
    async (params) => {
      try {
        const cfg: UnitTemplateConfig = {
          id: params.id,
          displayName: params.displayName,
          description: '',
          race: params.race,
          parent: params.parent,
          life: params.hp,
          armor: params.armor,
          shields: params.shields,
          speed: params.speed,
          sightRange: 11,
          food: params.template === 'worker' ? 1 : 2,
          minerals: params.minerals,
          vespene: params.vespene,
          buildTime: params.buildTime,
          weaponId: params.id + 'Weapon',
          weaponDamage: params.weaponDamage,
          weaponRange: params.weaponRange,
          weaponPeriod: params.weaponPeriod,
          weaponType: params.template === 'melee_basic' ? 'Melee' : 'Ranged',
          abilities: [],
          behaviors: [],
          iconPath: params.iconPath,
        };

        if (params.template === 'worker') {
          cfg.food = 1;
          cfg.minerals = 50;
          cfg.weaponDamage = 5;
          cfg.weaponRange = 2;
        } else if (params.template === 'hero') {
          cfg.life = 500;
          cfg.armor = 3;
          cfg.weaponDamage = 20;
          cfg.weaponRange = 6;
        }

        const unitXml = generateUnitXml(cfg);
        const buttonXml = generateButtonXml(
          params.id + 'Button',
          params.displayName,
          params.iconPath,
          `A ${params.displayName} of the ${params.race}.`,
          ''
        );

        const gameDataDir = join(params.projectPath, 'Base.SC2Data', 'GameData');
        if (!existsSync(gameDataDir)) {
          await mkdir(gameDataDir, { recursive: true });
        }

        const unitFilePath = join(gameDataDir, 'Units.xml');
        const existingUnitXml = existsSync(unitFilePath) ? await readFile(unitFilePath, 'utf-8') : '';
        
        if (existingUnitXml.includes('</Catalog>')) {
          const newXml = existingUnitXml.replace('</Catalog>', 
            `\n  <CUnit id="${cfg.id}"${cfg.parent ? ` parent="${cfg.parent}"` : ''}>\n` +
            `    <Name value="${cfg.displayName}"/>\n` +
            `    <Race value="${cfg.race}"/>\n` +
            `    <LifeMax value="${cfg.life.toFixed(1)}"/>\n` +
            `    <LifeArmor value="${cfg.armor.toFixed(1)}"/>\n` +
            (cfg.shields > 0 ? `    <ShieldsMax value="${cfg.shields.toFixed(1)}"/>\n` : '') +
            `    <Speed value="${cfg.speed.toFixed(3)}"/>\n` +
            `    <Sight value="${cfg.sightRange.toFixed(1)}"/>\n` +
            `    <Food value="${cfg.food.toFixed(1)}"/>\n` +
            `    <CostResource Minerals="${cfg.minerals.toFixed(1)}" Vespene="${cfg.vespene.toFixed(1)}"/>\n` +
            `    <CostResource Time="${cfg.buildTime.toFixed(1)}"/>\n` +
            `    <WeaponArray Link="${cfg.weaponId}"/>\n` +
            `    <Icon value="${cfg.iconPath}"/>\n` +
            '  </CUnit>\n</Catalog>'
          );
          await writeFile(unitFilePath, newXml);
        } else {
          await writeFile(unitFilePath, unitXml);
        }

        const weaponFilePath = join(gameDataDir, 'Weapons.xml');
        const weaponXml = `<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n  <CWeapon id="${cfg.weaponId}">\n    <DisplayEffect Link="${cfg.weaponId}Damage"/>\n    <Range value="${cfg.weaponRange.toFixed(1)}"/>\n    <Period value="${cfg.weaponPeriod.toFixed(4)}"/>\n    <WeaponType value="${cfg.weaponType}"/>\n  </CWeapon>\n  <CEffectDamage id="${cfg.weaponId}Damage">\n    <Amount value="${cfg.weaponDamage.toFixed(1)}"/>\n  </CEffectDamage>\n</Catalog>`;
        
        if (existsSync(weaponFilePath)) {
          const existing = await readFile(weaponFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(weaponFilePath, existing.replace('</Catalog>', 
              `\n  <CWeapon id="${cfg.weaponId}">\n    <DisplayEffect Link="${cfg.weaponId}Damage"/>\n    <Range value="${cfg.weaponRange.toFixed(1)}"/>\n    <Period value="${cfg.weaponPeriod.toFixed(4)}"/>\n    <WeaponType value="${cfg.weaponType}"/>\n  </CWeapon>\n  <CEffectDamage id="${cfg.weaponId}Damage">\n    <Amount value="${cfg.weaponDamage.toFixed(1)}"/>\n  </CEffectDamage>\n</Catalog>`
            ));
          }
        } else {
          await writeFile(weaponFilePath, weaponXml);
        }

        const buttonFilePath = join(gameDataDir, 'Buttons.xml');
        if (existsSync(buttonFilePath)) {
          const existing = await readFile(buttonFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(buttonFilePath, existing.replace('</Catalog>', `\n${buttonXml}\n</Catalog>`));
          }
        } else {
          await writeFile(buttonFilePath, `<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n${buttonXml}\n</Catalog>`);
        }

        const actorFilePath = join(gameDataDir, 'Actors.xml');
        const actorXml = `  <CActorUnit id="${cfg.id}Actor">\n    <UnitName value="${cfg.id}"/>\n  </CActorUnit>`;
        if (existsSync(actorFilePath)) {
          const existing = await readFile(actorFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(actorFilePath, existing.replace('</Catalog>', `\n${actorXml}\n</Catalog>`));
          }
        } else {
          await writeFile(actorFilePath, `<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n${actorXml}\n</Catalog>`);
        }

        const output: string[] = [
          '=== Unit Created from Template ===',
          '',
          'Unit: ' + cfg.displayName + ' (' + cfg.id + ')',
          'Template: ' + params.template,
          'Race: ' + cfg.race,
          '',
          'Stats:',
          '  HP: ' + cfg.life,
          '  Armor: ' + cfg.armor,
          (cfg.shields > 0 ? '  Shields: ' + cfg.shields : ''),
          '  Speed: ' + cfg.speed,
          '  Food: ' + cfg.food,
          '  Cost: ' + cfg.minerals + ' minerals, ' + cfg.vespene + ' vespene',
          '  Build Time: ' + cfg.buildTime + 's',
          '',
          'Weapon: ' + cfg.weaponId,
          '  Damage: ' + cfg.weaponDamage,
          '  Range: ' + cfg.weaponRange,
          '  Period: ' + cfg.weaponPeriod + 's',
          '',
          'Files written:',
          '  - Units.xml',
          '  - Weapons.xml',
          '  - Buttons.xml',
          '  - Actors.xml',
        ];

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating unit: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'template.create_button',
    'Create a button entry for command cards.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      id: z.string().describe('Button ID'),
      name: z.string().describe('Button display name'),
      icon: z.string().describe('Icon path in archive'),
      tooltip: z.string().optional().default('').describe('Tooltip text'),
      hotkey: z.string().optional().default('').describe('Hotkey'),
    },
    async ({ projectPath, id, name, icon, tooltip, hotkey }) => {
      try {
        const gameDataDir = join(projectPath, 'Base.SC2Data', 'GameData');
        if (!existsSync(gameDataDir)) {
          await mkdir(gameDataDir, { recursive: true });
        }

        const buttonXml = generateButtonXml(id, name, icon, tooltip || name, hotkey);
        const buttonFilePath = join(gameDataDir, 'Buttons.xml');

        if (existsSync(buttonFilePath)) {
          const existing = await readFile(buttonFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(buttonFilePath, existing.replace('</Catalog>', `\n${buttonXml}\n</Catalog>`));
          }
        } else {
          await writeFile(buttonFilePath, `<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n${buttonXml}\n</Catalog>`);
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Button created: ${id}\nName: ${name}\nIcon: ${icon}\nWritten to: Buttons.xml`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating button: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'template.create_ability',
    'Create an ability with button, effect, and behavior.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      template: z.enum(['instant', 'target_unit', 'target_point', 'passive', 'toggle', 'aura']).describe('Ability template'),
      id: z.string().describe('Ability ID'),
      displayName: z.string().describe('Display name'),
      description: z.string().optional().default('').describe('Ability description'),
      cooldown: z.number().optional().default(0),
      energyCost: z.number().optional().default(0),
      range: z.number().optional().default(0),
      effectAmount: z.number().optional().default(0),
      iconPath: z.string().optional().default('Assets/Icons/ability.dds'),
    },
    async (params) => {
      try {
        const abilityType = params.template === 'target_unit' ? 'EffectTarget' 
          : params.template === 'target_point' ? 'EffectTarget'
          : params.template === 'instant' ? 'EffectInstant'
          : params.template === 'passive' ? 'Passive'
          : params.template === 'toggle' ? 'Toggle'
          : 'EffectInstant';

        const abilityXml = generateAbilityXml(params.id, params.displayName, abilityType, params.energyCost, params.cooldown, params.range, params.effectAmount);
        
        const buttonXml = generateButtonXml(
          params.id + 'Button',
          params.displayName,
          params.iconPath,
          params.description || params.displayName,
          ''
        );

        const gameDataDir = join(params.projectPath, 'Base.SC2Data', 'GameData');
        if (!existsSync(gameDataDir)) {
          await mkdir(gameDataDir, { recursive: true });
        }

        const abilityFilePath = join(gameDataDir, 'Abilities.xml');
        if (existsSync(abilityFilePath)) {
          const existing = await readFile(abilityFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(abilityFilePath, existing.replace('</Catalog>', 
              `\n  <CAbil${abilityType} id="${params.id}">\n` +
              `    <Name value="${params.displayName}"/>\n` +
              (params.energyCost > 0 ? `    <Cost Energy="${params.energyCost}"/>\n` : '') +
              (params.cooldown > 0 ? `    <Cooldown TimeUse="${params.cooldown}"/>\n` : '') +
              (params.range > 0 ? `    <Range value="${params.range}"/>\n` : '') +
              `    <Effect Link="${params.id}Effect"/>\n` +
              `  </CAbil${abilityType}>\n` +
              `  <CEffectDamage id="${params.id}Effect">\n` +
              `    <Amount value="${params.effectAmount}"/>\n` +
              '  </CEffectDamage>\n</Catalog>'
            ));
          }
        } else {
          await writeFile(abilityFilePath, abilityXml);
        }

        const buttonFilePath = join(gameDataDir, 'Buttons.xml');
        if (existsSync(buttonFilePath)) {
          const existing = await readFile(buttonFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(buttonFilePath, existing.replace('</Catalog>', `\n${buttonXml}\n</Catalog>`));
          }
        } else {
          await writeFile(buttonFilePath, `<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n${buttonXml}\n</Catalog>`);
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Ability created: ${params.id}\nType: ${abilityType}\nCooldown: ${params.cooldown}s\nEnergy: ${params.energyCost}\nWritten to: Abilities.xml, Buttons.xml`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating ability: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'template.create_upgrade',
    'Create an upgrade with level-based costs.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      id: z.string().describe('Upgrade ID'),
      displayName: z.string().describe('Display name'),
      maxLevel: z.number().optional().default(3),
      mineralCostPerLevel: z.number().optional().default(100),
      vespeneCostPerLevel: z.number().optional().default(100),
      timePerLevel: z.number().optional().default(60),
    },
    async (params) => {
      try {
        const upgradeXml = generateUpgradeXml(params.id, params.displayName, params.maxLevel, params.mineralCostPerLevel, params.vespeneCostPerLevel, params.timePerLevel);

        const gameDataDir = join(params.projectPath, 'Base.SC2Data', 'GameData');
        if (!existsSync(gameDataDir)) {
          await mkdir(gameDataDir, { recursive: true });
        }

        const upgradeFilePath = join(gameDataDir, 'Upgrades.xml');
        if (existsSync(upgradeFilePath)) {
          const existing = await readFile(upgradeFilePath, 'utf-8');
          if (existing.includes('</Catalog>')) {
            await writeFile(upgradeFilePath, existing.replace('</Catalog>',
              `\n  <CUpgrade id="${params.id}">\n` +
              `    <Name value="${params.displayName}"/>\n` +
              `    <MaxLevel value="${params.maxLevel}"/>\n` +
              '    <CostArray>\n' +
              Array.from({ length: params.maxLevel }, (_, i) => i + 1)
                .map(lvl => `      <Cost Level="${lvl}" Minerals="${params.mineralCostPerLevel * lvl}" Vespene="${params.vespeneCostPerLevel * lvl}" Time="${params.timePerLevel * lvl}"/>`)
                .join('\n') + '\n' +
              '    </CostArray>\n' +
              '  </CUpgrade>\n</Catalog>'
            ));
          }
        } else {
          await writeFile(upgradeFilePath, upgradeXml);
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Upgrade created: ${params.id}\nMax Level: ${params.maxLevel}\nCost per level: ${params.mineralCostPerLevel} minerals, ${params.vespeneCostPerLevel} vespene\nWritten to: Upgrades.xml`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating upgrade: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'template.create_localization',
    'Add localization entries to GameStrings.txt.',
    {
      projectPath: z.string().describe('Path to SC2Components project'),
      locale: z.string().optional().default('enUS').describe('Locale code (enUS, zhCN, etc.)'),
      entries: z.array(z.object({
        key: z.string(),
        value: z.string(),
      })).describe('Localization key-value pairs'),
    },
    async ({ projectPath, locale, entries }) => {
      try {
        const localeDir = join(projectPath, locale + '.SC2Data', 'LocalizedData');
        if (!existsSync(localeDir)) {
          await mkdir(localeDir, { recursive: true });
        }

        const gameStringsPath = join(localeDir, 'GameStrings.txt');
        let existing = '';
        if (existsSync(gameStringsPath)) {
          existing = await readFile(gameStringsPath, 'utf-8');
        }

        const newEntries = entries.map(e => generateLocalizationEntry(e.key, e.value)).join('\n');
        
        if (existing) {
          await writeFile(gameStringsPath, existing + '\n' + newEntries);
        } else {
          await writeFile(gameStringsPath, newEntries);
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Added ${entries.length} localization entries to ${locale}/GameStrings.txt\n` +
              entries.map(e => `  ${e.key} = ${e.value}`).join('\n')
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error adding localization: ' + e.message }], isError: true as const };
      }
    }
  );
}
