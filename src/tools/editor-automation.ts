/**
 * Editor Automation - UI control for the running SC2 Galaxy Editor.
 * Uses Windows API via PowerShell to send keystrokes, mouse clicks, and take screenshots.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function ps(cmd: string): string {
  try {
    return execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 15000 }
    ).trim();
  } catch (e: any) {
    return 'Error: ' + (e.message || String(e));
  }
}

const SC2_EDITOR_EXE = 'D:\\StarCraft II\\StarCraft II Editor_x64.exe';

export function registerEditorAutomationTools(server: McpServer): void {
  // --- Activate editor window ---
  server.tool(
    'editor_activate',
    'Bring the SC2 Galaxy Editor window to the foreground.',
    {},
    async () => {
      const result = ps(`Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);[DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string win);'; $h=[Native.Win]::FindWindow($null,'StarCraft II Editor'); if($h -ne [IntPtr]::Zero){[Native.Win]::SetForegroundWindow($h);'OK - Editor activated'} else {'Editor window not found'}`);
      return { content: [{ type: 'text' as const, text: result }] };
    }
  );

  // --- Open a map file in the editor ---
  server.tool(
    'editor_open_map',
    'Open a .sc2map file in the SC2 Galaxy Editor (launches or uses File>Open).',
    {
      mapPath: z.string().describe('Full path to the .sc2map file'),
    },
    async ({ mapPath }) => {
      if (!existsSync(mapPath)) return { content: [{ type: 'text' as const, text: 'Error: Map file not found: ' + mapPath }], isError: true };
      try {
        execSync(`Start-Process -FilePath "${SC2_EDITOR_EXE}" -ArgumentList "-load","${mapPath}"`, { shell: 'powershell.exe', timeout: 10000 });
        return { content: [{ type: 'text' as const, text: 'Opening map in editor: ' + mapPath }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: 'Error opening map: ' + e.message }], isError: true };
      }
    }
  );

  // --- Send keyboard input ---
  server.tool(
    'editor_send_keys',
    'Send keyboard input to the SC2 Galaxy Editor. Use SendKeys format: ^s = Ctrl+S, ^n = Ctrl+N, ^o = Ctrl+O, ^z = Ctrl+Z, {ENTER}, {TAB}, etc.',
    {
      keys: z.string().describe('Keys to send in SendKeys format (e.g. "^s" for Ctrl+S, "^n" for Ctrl+N)'),
      activateFirst: z.boolean().optional().default(true).describe('Bring editor to foreground first'),
    },
    async ({ keys, activateFirst }) => {
      if (activateFirst) {
        ps(`Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);[DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string win);'; $h=[Native.Win]::FindWindow($null,'StarCraft II Editor'); if($h -ne [IntPtr]::Zero){[Native.Win]::SetForegroundWindow($h)}`);
      }
      // Small delay to let window focus
      ps('Start-Sleep -Milliseconds 300');
      const result = ps(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys.replace(/'/g, "''")}'); 'Sent: ${keys}'`);
      return { content: [{ type: 'text' as const, text: result }] };
    }
  );

  // --- Click at screen coordinates ---
  server.tool(
    'editor_click',
    'Click the mouse at specific screen coordinates in the Galaxy Editor.',
    {
      x: z.number().describe('Screen X coordinate'),
      y: z.number().describe('Screen Y coordinate'),
      button: z.enum(['left', 'right', 'middle']).optional().default('left'),
      activateFirst: z.boolean().optional().default(true),
    },
    async ({ x, y, button, activateFirst }) => {
      if (activateFirst) {
        ps(`Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);[DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string win);'; $h=[Native.Win]::FindWindow($null,'StarCraft II Editor'); if($h -ne [IntPtr]::Zero){[Native.Win]::SetForegroundWindow($h)}`);
      }
      ps('Start-Sleep -Milliseconds 200');
      const btnDown = button === 'right' ? 0x0008 : button === 'middle' ? 0x0020 : 0x0002;
      const btnUp = button === 'right' ? 0x0010 : button === 'middle' ? 0x0040 : 0x0004;
      const result = ps(`Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetCursorPos(int X,int Y);[DllImport("user32.dll")] public static extern void mouse_event(int flags,int dx,int dy,int data,int extra);' -Name Mouse -Namespace Win; [Win.Mouse]::SetCursorPos(${x},${y}); Start-Sleep -Milliseconds 50; [Win.Mouse]::mouse_event(${btnDown},0,0,0,0); Start-Sleep -Milliseconds 50; [Win.Mouse]::mouse_event(${btnUp},0,0,0,0); 'Clicked ${button} at (${x},${y})'`);
      return { content: [{ type: 'text' as const, text: result }] };
    }
  );

  // --- Save current map ---
  server.tool(
    'editor_save',
    'Save the current map in the Galaxy Editor (Ctrl+S).',
    {},
    async () => {
      ps(`Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);[DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string win);'; $h=[Native.Win]::FindWindow($null,'StarCraft II Editor'); if($h -ne [IntPtr]::Zero){[Native.Win]::SetForegroundWindow($h)}`);
      ps('Start-Sleep -Milliseconds 300');
      ps(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^s')`);
      return { content: [{ type: 'text' as const, text: 'Sent Ctrl+S (Save) to editor' }] };
    }
  );

  // --- New Map dialog ---
  server.tool(
    'editor_new_map',
    'Open the New Map dialog in the Galaxy Editor (Ctrl+N).',
    {},
    async () => {
      ps(`Add-Type -Name Win -Namespace Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);[DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string win);'; $h=[Native.Win]::FindWindow($null,'StarCraft II Editor'); if($h -ne [IntPtr]::Zero){[Native.Win]::SetForegroundWindow($h)}`);
      ps('Start-Sleep -Milliseconds 300');
      ps(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^n')`);
      return { content: [{ type: 'text' as const, text: 'Sent Ctrl+N (New Map) to editor' }] };
    }
  );

  // --- Editor status ---
  server.tool(
    'editor_status',
    'Check if the SC2 Galaxy Editor is running and get its window info.',
    {},
    async () => {
      const result = ps(`Get-Process -Name SC2Editor_x64 -ErrorAction SilentlyContinue | Select-Object Id,MainWindowTitle,StartTime | Format-List`);
      return { content: [{ type: 'text' as const, text: result || 'SC2 Editor is not running.' }] };
    }
  );

  // --- Screenshot (saves to file) ---
  server.tool(
    'editor_screenshot',
    'Take a screenshot of the SC2 Galaxy Editor window and save it to a file.',
    {
      outputPath: z.string().optional().default('D:\\codeWork\\sc2mcp\\test-output\\editor-screenshot.png').describe('Where to save the screenshot'),
    },
    async ({ outputPath }) => {
      const result = ps(`Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screens=[System.Windows.Forms.Screen]::AllScreens; $bounds=[System.Drawing.Rectangle]::Empty; foreach($s in $screens){$bounds=[System.Drawing.Rectangle]::Union($bounds,$s.Bounds)}; $bmp=New-Object System.Drawing.Bitmap($bounds.Width,$bounds.Height); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size); $bmp.Save('${outputPath.replace(/'/g, "''")}'); $g.Dispose(); $bmp.Dispose(); "Screenshot saved: ${outputPath.replace(/'/g, "''")}"`);
      return { content: [{ type: 'text' as const, text: result }] };
    }
  );
}
