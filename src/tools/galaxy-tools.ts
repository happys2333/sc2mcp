/**
 * Galaxy code tools: generate, validate, explain, lookup.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validateGalaxyCode, extractFunctions, extractVariables } from '../utils/galaxy-validator.js';
import { galaxyApiLookup } from '../resources/galaxy-api.js';

export function registerGalaxyTools(server: McpServer): void {
  server.tool(
    'galaxy_generate_code',
    'Generate Galaxy script code from a natural language description.',
    {
      description: z.string().describe('Natural language description of what the code should do'),
      context: z.string().optional().describe('Additional context about existing code or map'),
    },
    async ({ description, context }) => {
      const parts: string[] = [
        '=== Galaxy Code Generation Request ===',
        '',
        'Task: ' + description,
      ];
      if (context) parts.push('Context: ' + context);
      parts.push('');
      parts.push('Galaxy Code Guidelines:');
      parts.push('- Types: int, fixed, string, bool, unit, unitgroup, trigger, timer, dialog');
      parts.push('- Functions: UnitCreate, DisplayTextToPlayer, TriggerCreate, etc.');
      parts.push('- Use persistent keyword for save-safe globals');
      parts.push('- Prefix trigger functions with gt_ (e.g. gt_MyTrigger_Func)');
      parts.push('- Include Init function to register triggers');
      parts.push('- Use fixed for decimal numbers, not float/double');
      parts.push('- Galaxy has no classes - use structs and free functions');
      parts.push('');
      parts.push('Write complete Galaxy script code with all declarations and initialization.');
      return { content: [{ type: 'text' as const, text: parts.join('\n') }] };
    }
  );

  server.tool(
    'galaxy_validate_code',
    'Validate Galaxy script code for syntax errors and common issues.',
    {
      code: z.string().describe('Galaxy script code to validate'),
    },
    async ({ code }) => {
      const result = validateGalaxyCode(code);
      const funcs = extractFunctions(code);
      const vars = extractVariables(code);
      const output: string[] = [
        '=== Galaxy Code Validation Results ===',
        '',
        'Status: ' + (result.valid ? 'VALID' : 'HAS ISSUES'),
        'Functions found: ' + funcs.length,
        'Variables found: ' + vars.length,
        '',
      ];
      if (result.issues.length === 0) {
        output.push('No issues found.');
      } else {
        output.push('Issues:');
        for (const issue of result.issues) {
          output.push('  [' + issue.severity.toUpperCase() + '] Line ' + issue.line + ': ' + issue.message);
        }
      }
      if (funcs.length > 0) {
        output.push('');
        output.push('Functions:');
        for (const f of funcs) {
          output.push('  ' + f.returnType + ' ' + f.name + '(' + f.params + ') @ line ' + f.line);
        }
      }
      return { content: [{ type: 'text' as const, text: output.join('\n') }] };
    }
  );

  server.tool(
    'galaxy_explain_code',
    'Explain what a piece of Galaxy script code does.',
    {
      code: z.string().describe('Galaxy script code to explain'),
    },
    async ({ code }) => {
      const funcs = extractFunctions(code);
      const vars = extractVariables(code);
      const output: string[] = [
        '=== Galaxy Code Explanation ===',
        '',
        'Lines: ' + code.split('\n').length,
        '',
      ];
      if (vars.length > 0) {
        output.push('Global Variables (' + vars.length + '):');
        for (const v of vars) output.push('  ' + v.type + ' ' + v.name + ' (line ' + v.line + ')');
        output.push('');
      }
      if (funcs.length > 0) {
        output.push('Functions (' + funcs.length + '):');
        for (const f of funcs) output.push('  ' + f.returnType + ' ' + f.name + '(' + f.params + ')');
        output.push('');
      }
      const patterns: string[] = [];
      if (code.includes('TriggerCreate')) patterns.push('Trigger registration');
      if (code.includes('TriggerAddEvent')) patterns.push('Event handling');
      if (code.includes('TimerCreate') || code.includes('TimerStart')) patterns.push('Timer management');
      if (code.includes('DialogCreate')) patterns.push('Dialog UI');
      if (code.includes('UnitCreate')) patterns.push('Unit creation');
      if (code.includes('UnitIssueOrder')) patterns.push('Unit ordering');
      if (code.includes('DisplayTextToPlayer')) patterns.push('Player messages');
      if (code.includes('persistent')) patterns.push('Save-safe persistent state');
      if (patterns.length > 0) {
        output.push('Detected Patterns:');
        for (const p of patterns) output.push('  - ' + p);
        output.push('');
      }
      output.push('Raw Code:');
      output.push(code);
      return { content: [{ type: 'text' as const, text: output.join('\n') }] };
    }
  );

  server.tool(
    'galaxy_lookup_api',
    'Look up a Galaxy native function by name.',
    {
      functionName: z.string().describe('Function name (e.g. UnitCreate)'),
      category: z.string().optional().describe('Category filter: unit, timer, trigger, math, etc.'),
    },
    async ({ functionName }) => {
      const lookup = galaxyApiLookup[functionName];
      const output: string[] = [
        '=== Galaxy API Lookup: ' + functionName + ' ===',
        '',
      ];
      if (lookup) {
        output.push('Signature: ' + lookup.signature);
        output.push('Description: ' + lookup.description);
        output.push('Category: ' + lookup.category);
      } else {
        output.push('Function "' + functionName + '" not found in built-in reference.');
        output.push('');
        output.push('Available functions (partial list):');
        const allNames = Object.keys(galaxyApiLookup);
        for (const name of allNames.slice(0, 30)) {
          output.push('  - ' + name + ': ' + galaxyApiLookup[name].description);
        }
        if (allNames.length > 30) output.push('  ... and ' + (allNames.length - 30) + ' more');
      }
      return { content: [{ type: 'text' as const, text: output.join('\n') }] };
    }
  );
}
