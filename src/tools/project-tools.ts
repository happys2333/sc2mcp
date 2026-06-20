/**
 * Project management tools for SC2 AI Workbench.
 * Supports .SC2Components folder-based projects with scan, backup, diff, rollback.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readdir, stat, readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, basename, dirname, extname } from 'node:path';

interface ProjectScanResult {
  projectPath: string;
  projectType: 'mod' | 'map' | 'campaign' | 'unknown';
  componentName: string;
  hasBaseSC2Data: boolean;
  hasGameData: boolean;
  hasScripts: boolean;
  hasLocale: boolean;
  hasUI: boolean;
  hasAssets: boolean;
  dependencies: string[];
  gameDataFiles: string[];
  scriptFiles: string[];
  localeFiles: string[];
  uiFiles: string[];
  assetFiles: string[];
  totalFiles: number;
  issues: string[];
}

async function scanComponentsFolder(projectPath: string): Promise<ProjectScanResult> {
  const result: ProjectScanResult = {
    projectPath,
    projectType: 'unknown',
    componentName: basename(projectPath),
    hasBaseSC2Data: false,
    hasGameData: false,
    hasScripts: false,
    hasLocale: false,
    hasUI: false,
    hasAssets: false,
    dependencies: [],
    gameDataFiles: [],
    scriptFiles: [],
    localeFiles: [],
    uiFiles: [],
    assetFiles: [],
    totalFiles: 0,
    issues: [],
  };

  try {
    const entries = await readdir(projectPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(projectPath, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === 'Base.SC2Data') {
          result.hasBaseSC2Data = true;
          await scanBaseSC2Data(fullPath, result);
        } else if (entry.name.endsWith('.SC2Data')) {
          result.hasLocale = true;
          result.localeFiles.push(entry.name);
        } else if (entry.name === 'scripts') {
          result.hasScripts = true;
          await scanDirectory(fullPath, result.scriptFiles, '.galaxy');
        } else if (entry.name === 'Assets') {
          result.hasAssets = true;
          await scanDirectory(fullPath, result.assetFiles);
        }
      } else if (entry.isFile()) {
        result.totalFiles++;
        if (entry.name === 'ComponentList.SC2Components') {
          result.componentName = entry.name;
        } else if (entry.name === 'DocumentInfo') {
          await parseDocumentInfo(fullPath, result);
        } else if (entry.name === 'MapInfo') {
          result.projectType = 'map';
        }
      }
    }

    if (result.projectType === 'unknown') {
      result.projectType = result.componentName.includes('.SC2Mod') ? 'mod' : 'map';
    }

    if (!result.hasBaseSC2Data) {
      result.issues.push('Missing Base.SC2Data directory');
    }
    if (!result.hasGameData && result.projectType === 'mod') {
      result.issues.push('Mod project has no GameData XML files');
    }
  } catch (e: any) {
    result.issues.push('Scan error: ' + e.message);
  }

  return result;
}

async function scanBaseSC2Data(basePath: string, result: ProjectScanResult): Promise<void> {
  const entries = await readdir(basePath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === 'GameData') {
        result.hasGameData = true;
        await scanDirectory(fullPath, result.gameDataFiles, '.xml');
      } else if (entry.name === 'UI') {
        result.hasUI = true;
        await scanDirectoryRecursive(fullPath, result.uiFiles);
      }
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      result.hasGameData = true;
      result.gameDataFiles.push(entry.name);
    }
  }
}

async function scanDirectory(dirPath: string, fileList: string[], extFilter?: string): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        if (!extFilter || entry.name.endsWith(extFilter)) {
          fileList.push(entry.name);
        }
      }
    }
  } catch {
    // Directory might not exist
  }
}

async function scanDirectoryRecursive(dirPath: string, fileList: string[]): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await scanDirectoryRecursive(fullPath, fileList);
      } else if (entry.isFile()) {
        fileList.push(entry.name);
      }
    }
  } catch {
    // Directory might not exist
  }
}

async function parseDocumentInfo(filePath: string, result: ProjectScanResult): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const depMatch = content.match(/<Dependencies>([\s\S]*?)<\/Dependencies>/);
    if (depMatch) {
      const modMatches = depMatch[1].match(/<Mod>(.*?)<\/Mod>/g);
      if (modMatches) {
        result.dependencies = modMatches.map(m => m.replace(/<\/?Mod>/g, ''));
      }
    }
  } catch {
    // File might not exist or be readable
  }
}

async function createBackup(projectPath: string, reason: string): Promise<string> {
  const backupDir = join(dirname(projectPath), '.backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupName = basename(projectPath) + '_' + timestamp;
  const backupPath = join(backupDir, backupName);

  await mkdir(backupDir, { recursive: true });
  await mkdir(backupPath, { recursive: true });

  await copyDirectoryRecursive(projectPath, backupPath);

  const metaPath = join(backupPath, '.backup-meta.json');
  await writeFile(metaPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    reason,
    sourcePath: projectPath,
  }, null, 2));

  return backupPath;
}

async function copyDirectoryRecursive(src: string, dest: string): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name === '.backups' || entry.name === '.git') continue;
    
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyDirectoryRecursive(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

export function registerProjectTools(server: McpServer): void {
  server.tool(
    'project.scan',
    'Scan a SC2Components project folder. Returns project type, directory structure, dependencies, key files, and issues.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
    },
    async ({ projectPath }) => {
      try {
        if (!existsSync(projectPath)) {
          return { content: [{ type: 'text' as const, text: 'Error: Project path not found: ' + projectPath }], isError: true as const };
        }

        const statResult = await stat(projectPath);
        if (!statResult.isDirectory()) {
          return { content: [{ type: 'text' as const, text: 'Error: Path is not a directory' }], isError: true as const };
        }

        const result = await scanComponentsFolder(projectPath);
        
        const output: string[] = [
          '=== SC2 Project Scan ===',
          '',
          'Project: ' + result.componentName,
          'Type: ' + result.projectType.toUpperCase(),
          'Path: ' + result.projectPath,
          '',
          'Structure:',
          '  Base.SC2Data: ' + (result.hasBaseSC2Data ? 'YES' : 'NO'),
          '  GameData: ' + (result.hasGameData ? 'YES (' + result.gameDataFiles.length + ' files)' : 'NO'),
          '  Scripts: ' + (result.hasScripts ? 'YES (' + result.scriptFiles.length + ' files)' : 'NO'),
          '  Locale: ' + (result.hasLocale ? 'YES' : 'NO'),
          '  UI: ' + (result.hasUI ? 'YES (' + result.uiFiles.length + ' files)' : 'NO'),
          '  Assets: ' + (result.hasAssets ? 'YES (' + result.assetFiles.length + ' files)' : 'NO'),
          '  Total files: ' + result.totalFiles,
        ];

        if (result.dependencies.length > 0) {
          output.push('');
          output.push('Dependencies:');
          for (const dep of result.dependencies) {
            output.push('  - ' + dep);
          }
        }

        if (result.gameDataFiles.length > 0) {
          output.push('');
          output.push('GameData files:');
          for (const f of result.gameDataFiles.slice(0, 20)) {
            output.push('  - ' + f);
          }
          if (result.gameDataFiles.length > 20) {
            output.push('  ... and ' + (result.gameDataFiles.length - 20) + ' more');
          }
        }

        if (result.scriptFiles.length > 0) {
          output.push('');
          output.push('Script files:');
          for (const f of result.scriptFiles.slice(0, 20)) {
            output.push('  - ' + f);
          }
        }

        if (result.issues.length > 0) {
          output.push('');
          output.push('Issues:');
          for (const issue of result.issues) {
            output.push('  - ' + issue);
          }
        }

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error scanning project: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.create_mod',
    'Create a new .SC2Mod.SC2Components project with proper directory structure.',
    {
      outputPath: z.string().describe('Path where to create the mod'),
      modName: z.string().describe('Mod name'),
      author: z.string().optional().default('SC2 AI Workbench'),
      description: z.string().optional().default(''),
      locales: z.array(z.string()).optional().default(['enUS']),
    },
    async ({ outputPath, modName, author, description, locales }) => {
      try {
        const modPath = outputPath.endsWith('.SC2Mod.SC2Components') 
          ? outputPath 
          : join(outputPath, modName.replace(/\s+/g, '_') + '.SC2Mod.SC2Components');

        await mkdir(modPath, { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data'), { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data', 'GameData'), { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data', 'UI', 'Layout'), { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data', 'Assets', 'Icons'), { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data', 'Assets', 'Textures'), { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data', 'Assets', 'Sounds'), { recursive: true });
        await mkdir(join(modPath, 'Base.SC2Data', 'Assets', 'Music'), { recursive: true });
        await mkdir(join(modPath, 'scripts'), { recursive: true });

        for (const locale of locales) {
          await mkdir(join(modPath, locale + '.SC2Data', 'LocalizedData'), { recursive: true });
          await writeFile(
            join(modPath, locale + '.SC2Data', 'LocalizedData', 'GameStrings.txt'),
            '// GameStrings for ' + modName + '\n'
          );
        }

        await writeFile(
          join(modPath, 'ComponentList.SC2Components'),
          '<?xml version="1.0" encoding="utf-8"?>\n<ComponentList>\n  <Component>Base.SC2Data</Component>\n</ComponentList>'
        );

        await writeFile(
          join(modPath, 'DocumentInfo'),
          `<?xml version="1.0" encoding="utf-8"?>
<DocumentInfo>
  <AuthorName>${author}</AuthorName>
  <DocumentName>${modName}</DocumentName>
  <Description>${description}</Description>
  <Expansion>1</Expansion>
  <IsLocked>false</IsLocked>
  <DependentMods/>
  <Dependencies/>
  <RequiredMods/>
</DocumentInfo>`
        );

        await writeFile(
          join(modPath, 'Base.SC2Data', 'GameData.xml'),
          '<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n  <!-- Add game data entries here -->\n</Catalog>'
        );

        await writeFile(
          join(modPath, 'scripts', 'main.galaxy'),
          '// ' + modName + ' - Main Galaxy Script\n// Generated by SC2 AI Workbench\n\nvoid InitLib() {\n    // Add initialization code here\n}\n'
        );

        return {
          content: [{
            type: 'text' as const,
            text: `SC2Mod created successfully!\n\nPath: ${modPath}\nName: ${modName}\nLocales: ${locales.join(', ')}\n\nDirectory structure:\n- Base.SC2Data/GameData/ (XML data files)\n- Base.SC2Data/UI/Layout/ (UI definitions)\n- Base.SC2Data/Assets/ (icons, textures, sounds)\n- scripts/ (Galaxy scripts)\n- ${locales.map(l => l + '.SC2Data/LocalizedData/').join(', ')}\n\nNext steps:\n1. Add game data to Base.SC2Data/GameData/\n2. Create Galaxy scripts in scripts/\n3. Add icons and sounds to Assets/`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating mod: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.create_test_map',
    'Create a test map with mod dependency for testing.',
    {
      outputPath: z.string().describe('Path for the test map'),
      mapName: z.string().optional().default('TestMap'),
      modPath: z.string().describe('Path to the SC2Mod to depend on'),
      width: z.number().optional().default(96),
      height: z.number().optional().default(96),
      players: z.number().optional().default(2),
    },
    async ({ outputPath, mapName, modPath, width, height, players }) => {
      try {
        const mapPath = outputPath.endsWith('.SC2Map.SC2Components')
          ? outputPath
          : join(outputPath, mapName.replace(/\s+/g, '_') + '.SC2Map.SC2Components');

        await mkdir(mapPath, { recursive: true });
        await mkdir(join(mapPath, 'Base.SC2Data'), { recursive: true });

        let playerSlots = '';
        for (let i = 0; i < players; i++) {
          playerSlots += `
    <Player id="${i}">
      <Name>Player ${i + 1}</Name>
      <Race>0</Race>
      <Type>1</Type>
      <Team>${i % 2}</Team>
      <StartLocX>${(i % 2 === 0) ? 10 : width - 10}</StartLocX>
      <StartLocY>${(i < 2) ? 10 : height - 10}</StartLocY>
    </Player>`;
        }

        const modName = basename(modPath, '.SC2Mod.SC2Components');

        await writeFile(
          join(mapPath, 'DocumentInfo'),
          `<?xml version="1.0" encoding="utf-8"?>
<DocumentInfo>
  <AuthorName>SC2 AI Workbench</AuthorName>
  <DocumentName>${mapName}</DocumentName>
  <Description>Test map for ${modName}</Description>
  <Expansion>1</Expansion>
  <IsLocked>false</IsLocked>
  <DependentMods/>
  <Dependencies>
    <Mod>${modPath}</Mod>
  </Dependencies>
  <RequiredMods/>
</DocumentInfo>`
        );

        await writeFile(
          join(mapPath, 'MapInfo'),
          `<?xml version="1.0" encoding="utf-8"?>
<MapInfo>
  <Name>${mapName}</Name>
  <Width>${width}</Width>
  <Height>${height}</Height>
  <CameraLeft>0</CameraLeft>
  <CameraRight>${width}</CameraRight>
  <CameraTop>0</CameraTop>
  <CameraBottom>${height}</CameraBottom>
  <Players>${playerSlots}
  </Players>
  <Forces>
    <Force id="0"><Name>Force 1</Name><Team>0</Team></Force>
    <Force id="1"><Name>Force 2</Name><Team>1</Team></Force>
  </Forces>
</MapInfo>`
        );

        await writeFile(
          join(mapPath, 'MapScript.galaxy'),
          `// MapScript.galaxy - Test Map for ${modName}
// Generated by SC2 AI Workbench

void InitLib() {
    // Add initialization code here
}

void main() {
    InitLib();
}
`
        );

        await writeFile(
          join(mapPath, 'Base.SC2Data'),
          '<?xml version="1.0" encoding="utf-8"?>\n<Catalog/>'
        );

        return {
          content: [{
            type: 'text' as const,
            text: `Test map created!\n\nPath: ${mapPath}\nSize: ${width}x${height}\nPlayers: ${players}\nMod dependency: ${modPath}\n\nOpen in Galaxy Editor or use run.launch_map to test.`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating test map: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.backup',
    'Create a backup of the project before modifications.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
      reason: z.string().optional().default('Manual backup').describe('Reason for backup'),
    },
    async ({ projectPath, reason }) => {
      try {
        if (!existsSync(projectPath)) {
          return { content: [{ type: 'text' as const, text: 'Error: Project path not found' }], isError: true as const };
        }

        const backupPath = await createBackup(projectPath, reason);
        return {
          content: [{
            type: 'text' as const,
            text: `Backup created successfully!\n\nBackup path: ${backupPath}\nReason: ${reason}\nTimestamp: ${new Date().toISOString()}`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error creating backup: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.diff',
    'Show differences between current project and last backup.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
      format: z.enum(['summary', 'detailed']).optional().default('summary'),
    },
    async ({ projectPath, format }) => {
      try {
        const backupDir = join(dirname(projectPath), '.backups');
        if (!existsSync(backupDir)) {
          return { content: [{ type: 'text' as const, text: 'No backups found for this project.' }] };
        }

        const backups = await readdir(backupDir);
        const projectBackups = backups
          .filter(b => b.startsWith(basename(projectPath)))
          .sort()
          .reverse();

        if (projectBackups.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No backups found for this project.' }] };
        }

        const latestBackup = join(backupDir, projectBackups[0]);
        const changes: string[] = [];
        const added: string[] = [];
        const modified: string[] = [];
        const deleted: string[] = [];

        await compareDirectories(projectPath, latestBackup, '', added, modified, deleted);

        const output: string[] = [
          '=== Project Diff ===',
          '',
          'Current: ' + projectPath,
          'Backup: ' + latestBackup,
          '',
          'Summary:',
          '  Added: ' + added.length + ' files',
          '  Modified: ' + modified.length + ' files',
          '  Deleted: ' + deleted.length + ' files',
        ];

        if (format === 'detailed') {
          if (added.length > 0) {
            output.push('');
            output.push('Added files:');
            for (const f of added) output.push('  + ' + f);
          }
          if (modified.length > 0) {
            output.push('');
            output.push('Modified files:');
            for (const f of modified) output.push('  ~ ' + f);
          }
          if (deleted.length > 0) {
            output.push('');
            output.push('Deleted files:');
            for (const f of deleted) output.push('  - ' + f);
          }
        }

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error computing diff: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.rollback',
    'Rollback project to a previous backup.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
      backupTimestamp: z.string().optional().describe('Specific backup timestamp (YYYY-MM-DDTHH-MM-SS). If omitted, uses latest.'),
      confirm: z.literal(true).describe('Must be true to confirm rollback'),
    },
    async ({ projectPath, backupTimestamp, confirm }) => {
      try {
        if (!confirm) {
          return { content: [{ type: 'text' as const, text: 'Rollback cancelled. Set confirm=true to proceed.' }] };
        }

        const backupDir = join(dirname(projectPath), '.backups');
        if (!existsSync(backupDir)) {
          return { content: [{ type: 'text' as const, text: 'Error: No backups found' }], isError: true as const };
        }

        const backups = await readdir(backupDir);
        const projectBackups = backups
          .filter(b => b.startsWith(basename(projectPath)))
          .sort()
          .reverse();

        let selectedBackup: string;
        if (backupTimestamp) {
          selectedBackup = projectBackups.find(b => b.includes(backupTimestamp)) || '';
          if (!selectedBackup) {
            return { content: [{ type: 'text' as const, text: 'Error: Backup not found for timestamp: ' + backupTimestamp }], isError: true as const };
          }
        } else {
          if (projectBackups.length === 0) {
            return { content: [{ type: 'text' as const, text: 'Error: No backups found' }], isError: true as const };
          }
          selectedBackup = projectBackups[0];
        }

        const backupPath = join(backupDir, selectedBackup);
        
        await createBackup(projectPath, 'Pre-rollback backup');
        
        await rm(projectPath, { recursive: true, force: true });
        await mkdir(projectPath, { recursive: true });
        await copyDirectoryRecursive(backupPath, projectPath);

        const metaPath = join(projectPath, '.backup-meta.json');
        if (existsSync(metaPath)) {
          await rm(metaPath);
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Rollback completed!\n\nRestored from: ${selectedBackup}\nProject: ${projectPath}\n\nA pre-rollback backup was also created.`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error during rollback: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.list_dependencies',
    'List all dependencies of a SC2Components project.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
    },
    async ({ projectPath }) => {
      try {
        const docInfoPath = join(projectPath, 'DocumentInfo');
        if (!existsSync(docInfoPath)) {
          return { content: [{ type: 'text' as const, text: 'No DocumentInfo found.' }] };
        }

        const content = await readFile(docInfoPath, 'utf-8');
        const dependencies: string[] = [];
        const depMatch = content.match(/<Dependencies>([\s\S]*?)<\/Dependencies>/);
        if (depMatch) {
          const modMatches = depMatch[1].match(/<Mod>(.*?)<\/Mod>/g);
          if (modMatches) {
            dependencies.push(...modMatches.map(m => m.replace(/<\/?Mod>/g, '')));
          }
        }

        const output: string[] = [
          '=== Project Dependencies ===',
          '',
          'Project: ' + basename(projectPath),
          '',
        ];

        if (dependencies.length === 0) {
          output.push('No dependencies configured.');
        } else {
          output.push('Dependencies (' + dependencies.length + '):');
          for (const dep of dependencies) {
            const exists = existsSync(dep);
            output.push('  ' + (exists ? '✓' : '✗') + ' ' + dep);
          }
        }

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error listing dependencies: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.add_dependency',
    'Add a mod dependency to a SC2Components project.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
      modPath: z.string().describe('Path or name of the mod to depend on'),
    },
    async ({ projectPath, modPath }) => {
      try {
        const docInfoPath = join(projectPath, 'DocumentInfo');
        if (!existsSync(docInfoPath)) {
          return { content: [{ type: 'text' as const, text: 'Error: DocumentInfo not found' }], isError: true as const };
        }

        let content = await readFile(docInfoPath, 'utf-8');
        
        if (content.includes('<Dependencies/>')) {
          content = content.replace(
            '<Dependencies/>',
            '<Dependencies>\n    <Mod>' + modPath + '</Mod>\n  </Dependencies>'
          );
        } else if (content.includes('<Dependencies>')) {
          if (!content.includes('<Mod>' + modPath + '</Mod>')) {
            content = content.replace(
              '</Dependencies>',
              '    <Mod>' + modPath + '</Mod>\n  </Dependencies>'
            );
          }
        } else {
          content = content.replace(
            '</DocumentInfo>',
            '  <Dependencies>\n    <Mod>' + modPath + '</Mod>\n  </Dependencies>\n</DocumentInfo>'
          );
        }

        await writeFile(docInfoPath, content);
        return { content: [{ type: 'text' as const, text: 'Dependency added: ' + modPath }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error adding dependency: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'project.validate_structure',
    'Validate the project structure and report issues.',
    {
      projectPath: z.string().describe('Path to .SC2Components folder'),
      strict: z.boolean().optional().default(false).describe('Enable strict validation'),
    },
    async ({ projectPath, strict }) => {
      try {
        const result = await scanComponentsFolder(projectPath);
        const issues: string[] = [...result.issues];

        if (strict) {
          if (!result.hasScripts) {
            issues.push('WARNING: No scripts directory found');
          }
          if (result.gameDataFiles.length === 0 && result.projectType === 'mod') {
            issues.push('WARNING: No GameData XML files found in mod');
          }
          for (const dep of result.dependencies) {
            if (!existsSync(dep)) {
              issues.push('ERROR: Missing dependency: ' + dep);
            }
          }
        }

        const output: string[] = [
          '=== Project Validation ===',
          '',
          'Project: ' + result.componentName,
          'Type: ' + result.projectType.toUpperCase(),
          '',
          'Checklist:',
          '  ✓ Base.SC2Data exists: ' + (result.hasBaseSC2Data ? 'YES' : 'NO'),
          '  ✓ GameData files: ' + (result.hasGameData ? 'YES (' + result.gameDataFiles.length + ')' : 'NO'),
          '  ✓ Scripts: ' + (result.hasScripts ? 'YES (' + result.scriptFiles.length + ')' : 'NO'),
          '  ✓ Locale data: ' + (result.hasLocale ? 'YES' : 'NO'),
          '  ✓ UI layouts: ' + (result.hasUI ? 'YES' : 'NO'),
          '',
          'Issues found: ' + issues.length,
        ];

        if (issues.length > 0) {
          output.push('');
          output.push('Issues:');
          for (const issue of issues) {
            output.push('  ' + issue);
          }
        }

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error validating project: ' + e.message }], isError: true as const };
      }
    }
  );
}

async function compareDirectories(
  currentDir: string, 
  backupDir: string, 
  relativePath: string,
  added: string[], 
  modified: string[], 
  deleted: string[]
): Promise<void> {
  const currentEntries = existsSync(currentDir) 
    ? await readdir(currentDir, { withFileTypes: true })
    : [];
  const backupEntries = existsSync(backupDir)
    ? await readdir(backupDir, { withFileTypes: true })
    : [];

  const currentNames = new Set(currentEntries.map(e => e.name));
  const backupNames = new Set(backupEntries.map(e => e.name));

  for (const entry of currentEntries) {
    if (entry.name === '.backups' || entry.name === '.git') continue;
    
    const relPath = relativePath ? relativePath + '/' + entry.name : entry.name;
    
    if (!backupNames.has(entry.name)) {
      added.push(relPath);
    } else if (entry.isDirectory()) {
      await compareDirectories(
        join(currentDir, entry.name),
        join(backupDir, entry.name),
        relPath,
        added, modified, deleted
      );
    } else {
      const currentContent = await readFile(join(currentDir, entry.name), 'utf-8').catch(() => '');
      const backupContent = await readFile(join(backupDir, entry.name), 'utf-8').catch(() => '');
      if (currentContent !== backupContent) {
        modified.push(relPath);
      }
    }
  }

  for (const entry of backupEntries) {
    if (entry.name === '.backup-meta.json') continue;
    
    const relPath = relativePath ? relativePath + '/' + entry.name : entry.name;
    if (!currentNames.has(entry.name)) {
      deleted.push(relPath);
    }
  }
}
