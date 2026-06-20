import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerTriggerTools(server: McpServer): void {
  server.tool(
    'trigger_generate_full',
    'Generate a complete Galaxy trigger with event, condition, action, and init functions.',
    {
      triggerName: z.string().describe('Trigger name (e.g. "WaveSpawner")'),
      eventType: z.enum([
        'MapInit', 'GameStart', 'TimePeriodic', 'TimeElapsed',
        'UnitCreated', 'UnitDies', 'UnitEntersRegion', 'UnitLeavesRegion',
        'UnitUsesAbility', 'PlayerChat', 'PlayerDefeated', 'PlayerVictory',
      ]).describe('Event type'),
      eventParams: z.object({
        interval: z.number().optional(),
        regionId: z.string().optional(),
        filterFunc: z.string().optional().default('gf_AnyUnit'),
        chatMessage: z.string().optional(),
        player: z.number().optional().default(-1),
      }).optional(),
      conditionDesc: z.string().optional(),
      actionDesc: z.string().optional(),
      actionCode: z.string().optional(),
    },
    async ({ triggerName, eventType, eventParams, conditionDesc, actionDesc, actionCode }) => {
      const lines: string[] = [];
      const tn = triggerName.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push('// Trigger: ' + triggerName + ' | Event: ' + eventType);
      lines.push('');
      lines.push('bool gt_' + tn + '_TestConditions() {');
      lines.push('    return true;');
      lines.push('}');
      lines.push('');
      lines.push('bool gt_' + tn + '_Actions() {');
      if (actionCode) {
        lines.push(actionCode);
      } else {
        lines.push('    // TODO: ' + (actionDesc || 'implement action'));
        lines.push('    return true;');
      }
      lines.push('}');
      lines.push('');
      lines.push('bool gt_' + tn + '_Func(bool testConds, bool runActions) {');
      lines.push('    if (testConds) { if (!gt_' + tn + '_TestConditions()) return false; }');
      lines.push('    if (runActions) { return gt_' + tn + '_Actions(); }');
      lines.push('    return true;');
      lines.push('}');
      lines.push('');
      lines.push('void gt_' + tn + '_Init() {');
      lines.push('    trigger t = TriggerCreate("gt_' + tn + '_Func");');
      const ep = eventParams || {};
      const evMap: Record<string, string> = {
        MapInit: '    TriggerAddEventMapInit(t);',
        GameStart: '    TriggerAddEventGameStart(t);',
        TimePeriodic: '    TriggerAddEventTimePeriodic(t, ' + (ep.interval || 1.0) + ', c_timeGame);',
        TimeElapsed: '    TriggerAddEventTimeElapsed(t, ' + (ep.interval || 5.0) + ', c_timeGame);',
        UnitCreated: '    TriggerAddEventUnitCreated(t, "' + (ep.filterFunc || 'gf_AnyUnit') + '");',
        UnitDies: '    TriggerAddEventUnitDies(t, "' + (ep.filterFunc || 'gf_AnyUnit') + '");',
        UnitEntersRegion: '    TriggerAddEventUnitEntersRegion(t, RegionFromId("' + (ep.regionId || 'SpawnZone') + '"), "' + (ep.filterFunc || 'gf_AnyUnit') + '");',
        PlayerChat: '    TriggerAddEventPlayerChat(t, "' + (ep.chatMessage || '') + '", ' + (ep.player === -1 ? 'c_playerAny' : ep.player) + ', "' + (ep.filterFunc || 'gf_AnyUnit') + '");',
      };
      lines.push(evMap[eventType] || '    // TODO: register event');
      lines.push('}');
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  server.tool(
    'trigger_generate_chain',
    'Generate a chain of triggers that execute sequentially (cinematic sequence, wave progression).',
    {
      chainName: z.string(),
      steps: z.array(z.object({
        name: z.string(),
        delay: z.number().optional().default(0),
        action: z.string(),
      })),
    },
    async ({ chainName, steps }) => {
      const lines: string[] = [];
      lines.push('// Chain: ' + chainName + ' (' + steps.length + ' steps)');
      lines.push('');
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const sn = chainName + '_Step' + i;
        lines.push('bool gt_' + sn + '_Actions() {');
        lines.push('    ' + step.action);
        lines.push('    return true;');
        lines.push('}');
        lines.push('void gt_' + sn + '_Init() {');
        lines.push('    trigger t = TriggerCreate("gt_' + sn + '_Func");');
        if (i === 0) {
          lines.push('    TriggerAddEventMapInit(t);');
        } else {
          lines.push('    TriggerAddEventTimeElapsed(t, ' + (step.delay || 1.0) + ', c_timeGame);');
        }
        lines.push('}');
        lines.push('');
      }
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
