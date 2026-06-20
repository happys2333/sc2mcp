/**
 * Runner tools - SC2Switcher integration, screenshot, and test execution.
 * Enables automated testing of SC2 maps/mods.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';

const DEFAULT_SC2_PATH = 'C:\\Program Files (x86)\\StarCraft II';
const DEFAULT_SWITCHER = 'Support64\\SC2Switcher_x64.exe';
const DEFAULT_EDITOR = 'Support64\\SC2Editor_x64.exe';

interface SC2Config {
  installPath: string;
  switcherPath: string;
  editorPath: string;
  region: string;
  language: string;
}

async function loadConfig(): Promise<SC2Config> {
  const configPath = join(process.cwd(), 'sc2-workbench.json');
  const defaultConfig: SC2Config = {
    installPath: DEFAULT_SC2_PATH,
    switcherPath: join(DEFAULT_SC2_PATH, DEFAULT_SWITCHER),
    editorPath: join(DEFAULT_SC2_PATH, DEFAULT_EDITOR),
    region: 'US',
    language: 'enUS',
  };

  try {
    if (existsSync(configPath)) {
      const config = JSON.parse(await readFile(configPath, 'utf-8'));
      return { ...defaultConfig, ...config.sc2 };
    }
  } catch {
    // Use defaults
  }
  return defaultConfig;
}

function ps(cmd: string): string {
  try {
    return execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 30000 }
    ).trim();
  } catch (e: any) {
    return 'Error: ' + (e.message || String(e));
  }
}

export function registerRunnerTools(server: McpServer): void {
  server.tool(
    'run.launch_map',
    'Launch a SC2 map for testing using SC2Switcher. Supports windowed mode and trigger debug.',
    {
      mapPath: z.string().describe('Path to .sc2map file'),
      modPath: z.string().optional().describe('Path to .sc2mod file to load as dependency'),
      windowed: z.boolean().optional().default(true).describe('Run in windowed mode'),
      triggerDebug: z.boolean().optional().default(true).describe('Enable trigger debugger'),
      displayMode: z.enum(['fullscreen', 'windowed', 'borderless']).optional().default('windowed'),
    },
    async ({ mapPath, modPath, windowed, triggerDebug, displayMode }) => {
      try {
        const config = await loadConfig();
        
        if (!existsSync(config.switcherPath)) {
          return { 
            content: [{ 
              type: 'text' as const, 
              text: `Error: SC2Switcher not found at: ${config.switcherPath}\nPlease configure sc2-workbench.json with correct SC2 install path.` 
            }], 
            isError: true as const 
          };
        }

        if (!existsSync(mapPath)) {
          return { 
            content: [{ type: 'text' as const, text: 'Error: Map file not found: ' + mapPath }], 
            isError: true as const 
          };
        }

        const args: string[] = ['-run', mapPath];
        
        if (displayMode === 'windowed' || windowed) {
          args.push('-displaymode', '0');
        } else if (displayMode === 'fullscreen') {
          args.push('-displaymode', '1');
        }
        
        if (triggerDebug) {
          args.push('-trigdebug');
        }

        if (modPath && existsSync(modPath)) {
          args.push('-testmod', modPath);
        }

        const cmd = `"${config.switcherPath}" ${args.join(' ')}`;
        
        const child = spawn(config.switcherPath, args, {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();

        return {
          content: [{
            type: 'text' as const,
            text: `SC2 launching...\n\nMap: ${mapPath}${modPath ? '\nMod: ' + modPath : ''}\nWindowed: ${windowed || displayMode === 'windowed'}\nTrigger Debug: ${triggerDebug}\n\nCommand: ${cmd}\n\nNote: SC2 will start in a new process. Use run.capture_screenshot to capture the game window.`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error launching SC2: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'run.capture_screenshot',
    'Capture a screenshot of the SC2 game window.',
    {
      outputPath: z.string().optional().describe('Output file path'),
      label: z.string().optional().default('screenshot').describe('Label for the screenshot'),
      waitForWindow: z.number().optional().default(5).describe('Seconds to wait for SC2 window'),
    },
    async ({ outputPath, label, waitForWindow }) => {
      try {
        const outputDir = join(process.cwd(), 'test-output');
        if (!existsSync(outputDir)) {
          await mkdir(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filePath = outputPath || join(outputDir, `${label}_${timestamp}.png`);

        await new Promise(resolve => setTimeout(resolve, waitForWindow * 1000));

        const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$sc2Process = Get-Process -Name SC2_x64 -ErrorAction SilentlyContinue
if (-not $sc2Process) {
    Write-Output "Error: SC2 process not found"
    exit 1
}

$hwnd = $sc2Process.MainWindowHandle
if ($hwnd -eq [IntPtr]::Zero) {
    Write-Output "Error: SC2 window not found"
    exit 1
}

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$rect = New-Object Win32+RECT
[Win32]::GetWindowRect($hwnd, [ref]$rect)
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[Win32]::PrintWindow($hwnd, $hdc, 2)
$g.ReleaseHdc($hdc)
$bmp.Save('${filePath.replace(/'/g, "''")}')
$g.Dispose()
$bmp.Dispose()

Write-Output "Screenshot saved: ${filePath.replace(/'/g, "''")}"
`;

        const tempPsPath = join(outputDir, 'capture.ps1');
        await writeFile(tempPsPath, psScript);
        
        const result = execSync(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPsPath}"`,
          { encoding: 'utf-8', timeout: 30000 }
        ).trim();

        return {
          content: [{
            type: 'text' as const,
            text: result.includes('Error') ? result : `Screenshot captured!\n\nFile: ${filePath}\nLabel: ${label}\nTimestamp: ${timestamp}`
          }]
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error capturing screenshot: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'run.check_sc2_status',
    'Check if StarCraft II is currently running.',
    {},
    async () => {
      try {
        const result = ps(`Get-Process -Name SC2_x64 -ErrorAction SilentlyContinue | Select-Object Id,MainWindowTitle,StartTime | Format-List`);
        const editorResult = ps(`Get-Process -Name SC2Editor_x64 -ErrorAction SilentlyContinue | Select-Object Id,MainWindowTitle,StartTime | Format-List`);
        
        const output: string[] = [
          '=== SC2 Status ===',
          '',
          'StarCraft II:',
          result || '  Not running',
          '',
          'Galaxy Editor:',
          editorResult || '  Not running',
        ];

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error checking SC2 status: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'run.close_sc2',
    'Close StarCraft II and/or Galaxy Editor processes.',
    {
      target: z.enum(['game', 'editor', 'both']).optional().default('both'),
      force: z.boolean().optional().default(false).describe('Force kill without saving'),
    },
    async ({ target, force }) => {
      try {
        const results: string[] = [];

        if (target === 'game' || target === 'both') {
          const gameResult = ps(`Get-Process -Name SC2_x64 -ErrorAction SilentlyContinue | ${force ? 'Stop-Process -Force' : 'ForEach-Object { $_.CloseMainWindow() }'}`);
          results.push('SC2 Game: ' + (gameResult || (force ? 'Killed' : 'Close signal sent')));
        }

        if (target === 'editor' || target === 'both') {
          const editorResult = ps(`Get-Process -Name SC2Editor_x64 -ErrorAction SilentlyContinue | ${force ? 'Stop-Process -Force' : 'ForEach-Object { $_.CloseMainWindow() }'}`);
          results.push('SC2 Editor: ' + (editorResult || (force ? 'Killed' : 'Close signal sent')));
        }

        return { content: [{ type: 'text' as const, text: results.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error closing SC2: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'run.collect_logs',
    'Collect SC2 game logs for debugging.',
    {
      logType: z.enum(['all', 'trigger', 'game', 'error']).optional().default('all'),
      lines: z.number().optional().default(100).describe('Number of recent lines to read'),
    },
    async ({ logType, lines }) => {
      try {
        const logDir = join(process.env.APPDATA || '', '..', 'Local', 'StarCraft II', 'Beta', 'Logs');
        
        if (!existsSync(logDir)) {
          return { content: [{ type: 'text' as const, text: 'Log directory not found: ' + logDir }] };
        }

        const logFiles = await readdir(logDir);
        const output: string[] = ['=== SC2 Logs ===', ''];

        const filterMap: Record<string, RegExp> = {
          all: /.*/i,
          trigger: /trigger/i,
          game: /game/i,
          error: /error|exception|fail/i,
        };
        const filter = filterMap[logType] || filterMap.all;

        for (const logFile of logFiles.slice(0, 5)) {
          if (!logFile.endsWith('.log')) continue;
          
          const logPath = join(logDir, logFile);
          const content = await readFile(logPath, 'utf-8');
          const logLines = content.split('\n')
            .filter(line => filter.test(line))
            .slice(-lines);

          if (logLines.length > 0) {
            output.push(`--- ${logFile} (${logLines.length} matching lines) ---`);
            output.push(...logLines);
            output.push('');
          }
        }

        return { content: [{ type: 'text' as const, text: output.join('\n') }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error collecting logs: ' + e.message }], isError: true as const };
      }
    }
  );

  server.tool(
    'run.detect_sc2',
    'Detect StarCraft II installation path and validate configuration.',
    {},
    async () => {
      const possiblePaths = [
        'C:\\Program Files (x86)\\StarCraft II',
        'D:\\StarCraft II',
        'C:\\Program Files\\StarCraft II',
        'D:\\Games\\StarCraft II',
        'C:\\Games\\StarCraft II',
      ];

      const output: string[] = ['=== SC2 Detection ===', ''];
      let foundPath = '';

      for (const testPath of possiblePaths) {
        const switcherPath = join(testPath, 'Support64', 'SC2Switcher_x64.exe');
        const editorPath = join(testPath, 'Support64', 'SC2Editor_x64.exe');
        
        if (existsSync(switcherPath) || existsSync(editorPath)) {
          foundPath = testPath;
          output.push('Found SC2 at: ' + testPath);
          output.push('  SC2Switcher: ' + (existsSync(switcherPath) ? 'YES' : 'NO'));
          output.push('  SC2Editor: ' + (existsSync(editorPath) ? 'YES' : 'NO'));
          break;
        }
      }

      if (!foundPath) {
        output.push('SC2 not found in common locations.');
        output.push('');
        output.push('Please create sc2-workbench.json with your SC2 path:');
        output.push('{');
        output.push('  "sc2": {');
        output.push('    "installPath": "C:\\\\Program Files (x86)\\\\StarCraft II"');
        output.push('  }');
        output.push('}');
      }

      return { content: [{ type: 'text' as const, text: output.join('\n') }] };
    }
  );
}
