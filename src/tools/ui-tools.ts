/**
 * UI tools - generate dialog/UI layouts for in-game interfaces.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerUiTools(server: McpServer): void {
  server.tool(
    'ui_generate_dialog',
    'Generate Galaxy code for a complete in-game dialog with controls (labels, buttons, images).',
    {
      dialogName: z.string().describe('Dialog identifier'),
      title: z.string().describe('Dialog title'),
      width: z.number().optional().default(600),
      height: z.number().optional().default(400),
      controls: z.array(z.object({
        type: z.enum(['label', 'button', 'image', 'progressBar', 'checkbox']),
        id: z.string(),
        text: z.string().optional().default(''),
        x: z.number().optional().default(0),
        y: z.number().optional().default(0),
        width: z.number().optional().default(200),
        height: z.number().optional().default(30),
      })).optional().describe('Dialog controls'),
    },
    async ({ dialogName, title, width, height, controls }) => {
      const dn = dialogName.replace(/[^a-zA-Z0-9_]/g, '_');
      const lines: string[] = [];
      lines.push('dialog g_' + dn + ';');
      const controlVars: string[] = [];
      for (const ctrl of controls || []) {
        const cid = ctrl.id.replace(/[^a-zA-Z0-9_]/g, '_');
        controlVars.push(cid);
        lines.push('dialogcontrol g_' + dn + '_' + cid + ';');
      }
      lines.push('');
      lines.push('void ui_' + dn + '_Create() {');
      lines.push('    g_' + dn + ' = DialogCreate("' + title + '", ' + width + '.0, ' + height + '.0);');
      lines.push('    DialogSetPosition(g_' + dn + ', 0.5, 0.5);');
      for (const ctrl of controls || []) {
        const cid = ctrl.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const dcType = ctrl.type === 'label' ? 'c_dcLabel'
          : ctrl.type === 'button' ? 'c_dcButton'
          : ctrl.type === 'image' ? 'c_dcImage'
          : ctrl.type === 'progressBar' ? 'c_dcProgressBar'
          : 'c_dcCheckbox';
        lines.push('    g_' + dn + '_' + cid + ' = DialogControlCreate(g_' + dn + ', ' + dcType + ', "' + cid + '");');
        lines.push('    DialogControlSetPosition(g_' + dn + '_' + cid + ', ' + (ctrl.x ?? 0).toFixed(1) + ', ' + (ctrl.y ?? 0).toFixed(1) + ');');
        if (ctrl.text) {
          lines.push('    DialogControlSetText(g_' + dn + '_' + cid + ', "' + ctrl.text + '");');
        }
      }
      lines.push('}');
      lines.push('');
      lines.push('void ui_' + dn + '_Show(int player) {');
      lines.push('    DialogSetVisible(g_' + dn + ', true, player);');
      lines.push('}');
      lines.push('');
      lines.push('void ui_' + dn + '_Hide(int player) {');
      lines.push('    DialogSetVisible(g_' + dn + ', false, player);');
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  server.tool(
    'ui_generate_scoreboard',
    'Generate Galaxy code for a scoreboard display showing player stats.',
    {
      scoreboardName: z.string(),
      columns: z.array(z.object({
        id: z.string(),
        label: z.string(),
      })).describe('Scoreboard columns'),
      updateInterval: z.number().optional().default(1.0),
    },
    async ({ scoreboardName, columns, updateInterval }) => {
      const sn = scoreboardName.replace(/[^a-zA-Z0-9_]/g, '_');
      const lines: string[] = [];
      lines.push('dialog g_' + sn + '_Board;');
      lines.push('dialogcontrol g_' + sn + '_Title;');
      for (const col of columns) {
        lines.push('dialogcontrol g_' + sn + '_' + col.id + ';');
      }
      lines.push('');
      lines.push('void sb_' + sn + '_Create() {');
      lines.push('    g_' + sn + '_Board = DialogCreate("Scoreboard", ' + (columns.length * 120 + 40) + '.0, 300.0);');
      lines.push('    g_' + sn + '_Title = DialogControlCreate(g_' + sn + '_Board, c_dcLabel, "Title");');
      lines.push('    DialogControlSetText(g_' + sn + '_Title, "' + scoreboardName + '");');
      let xOff = 20;
      for (const col of columns) {
        lines.push('    g_' + sn + '_' + col.id + ' = DialogControlCreate(g_' + sn + '_Board, c_dcLabel, "' + col.id + '");');
        lines.push('    DialogControlSetPosition(g_' + sn + '_' + col.id + ', ' + xOff + '.0, 40.0);');
        lines.push('    DialogControlSetText(g_' + sn + '_' + col.id + ', "' + col.label + '");');
        xOff += 120;
      }
      lines.push('}');
      lines.push('');
      lines.push('void sb_' + sn + '_Update() {');
      for (const col of columns) {
        lines.push('    // Update ' + col.label + ' column');
        lines.push('    // DialogControlSetText(g_' + sn + '_' + col.id + ', ...);');
      }
      lines.push('}');
      lines.push('');
      lines.push('void sb_' + sn + '_Init() {');
      lines.push('    sb_' + sn + '_Create();');
      lines.push('    trigger t = TriggerCreate("sb_' + sn + '_Update");');
      lines.push('    TriggerAddEventTimePeriodic(t, ' + updateInterval.toFixed(1) + ', c_timeGame);');
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  server.tool(
    'ui_generate_tooltip',
    'Generate Galaxy code for rich text tooltips with formatted descriptions.',
    {
      tooltipId: z.string(),
      title: z.string(),
      description: z.string(),
      stats: z.array(z.object({
        label: z.string(),
        value: z.string(),
        color: z.string().optional().describe('Color: white, green, red, yellow, blue'),
      })).optional(),
    },
    async ({ tooltipId, title, description, stats }) => {
      const lines: string[] = [];
      lines.push('text tt_' + tooltipId + ' = StringToText("' + title + '\\n' + description + '");');
      if (stats && stats.length > 0) {
        lines.push('text tt_' + tooltipId + '_stats;');
        for (const stat of stats) {
          const colorTag = stat.color ? '<c val="' + stat.color.toUpperCase() + '">' : '';
          const colorEnd = stat.color ? '</c>' : '';
          lines.push('tt_' + tooltipId + '_stats = tt_' + tooltipId + '_stats + StringToText("' + colorTag + stat.label + ': ' + stat.value + colorEnd + '\\n");');
        }
        lines.push('tt_' + tooltipId + ' = tt_' + tooltipId + ' + tt_' + tooltipId + '_stats;');
      }
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
