/**
 * Galaxy Script syntax validator and code utilities.
 * Provides basic validation for common Galaxy patterns.
 */

export interface ValidationIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// Galaxy built-in function names (common subset)
const GALAXY_NATIVE_FUNCTIONS = new Set([
  // Unit operations
  'UnitCreate', 'UnitKill', 'UnitRemove', 'UnitSetPosition', 'UnitGetPosition',
  'UnitGetType', 'UnitGetOwner', 'UnitSetState', 'UnitGetState', 'UnitIssueOrder',
  'UnitGroupFromId', 'UnitGetPropertyFixed', 'UnitSetPropertyFixed',
  'UnitGetPropertyInt', 'UnitSetPropertyInt',
  // Player operations
  'PlayerGetRace', 'PlayerGroupFromId', 'PlayerGetState',
  'PlayerModifyScore', 'PlayerGetScore',
  // Region & Point
  'RegionGetCenter', 'RegionGetType', 'PointFromUnit', 'RegionFromId',
  // Timer
  'TimerCreate', 'TimerGetElapsed', 'TimerGetRemaining', 'TimerPause',
  'TimerResume', 'TimerDestroy',
  // Dialog
  'DialogCreate', 'DialogSetVisible', 'DialogSetPosition', 'DialogControlCreate',
  'DialogControlSetPosition', 'DialogControlSetText', 'DialogControlDestroy',
  // Text & String
  'StringToText', 'IntToText', 'FixedToText', 'TextExpressionAssemble',
  'TextExpressionSetVariable', 'TextExpressionSetGender',
  // UI Messages
  'DisplayTextToPlayer', 'DisplayTimedTextToPlayer', 'DisplayMessage',
  // Camera
  'CameraSetTarget', 'CameraSetDistance', 'CameraSetRotation',
  'CameraPan', 'CameraShake', 'CameraFollowUnitGroup',
  // Sound & Music
  'SoundPlay', 'SoundStop', 'MusicPlayTrack', 'MusicSetVolume',
  // Object Creation
  'DoodadCreate', 'DoodadSetState', 'ModelCreate',
  'PersistentVariableExists', 'PersistentVariableSet',
  // Groups
  'UnitGroupCreate', 'UnitGroupAdd', 'UnitGroupRemove',
  'UnitGroupCount', 'UnitGroupUnitFromIndex',
  'PlayerGroupCreate', 'PlayerGroupAdd', 'PlayerGroupRemove',
  // Orders
  'OrderCreate', 'OrderSetTargetUnit', 'OrderSetTargetPoint',
  'OrderSetAbilityCommand', 'OrderSetType',
  // Effects
  'EffectCreate', 'EffectExecute',
  // Conversions
  'IntToString', 'StringToInt', 'FixedToText', 'IntToFixed',
  'StringToFixed', 'TextToFixed',
  // Math
  'MathAbs', 'MathCeil', 'MathFloor', 'MathMax', 'MathMin',
  'MathMod', 'MathPow', 'MathSin', 'MathCos', 'MathTan',
  'MathAtan2', 'MathSqrt', 'MathLog', 'MathExp',
  'RandomInt', 'RandomFixed',
  // Game state
  'GameGetResult', 'GameGetSpeed', 'GameSetSpeed', 'GameIsPaused',
  'GameIsOnline', 'GameGetTimeOfDay', 'GameSetTimeOfDay',
  // Trigger / Event
  'TriggerCreate', 'TriggerEnable', 'TriggerDisable',
  'TriggerAddEventTimePeriodic', 'TriggerAddEventTimeElapsed',
  'TriggerAddEventUnitCreated', 'TriggerAddEventUnitDies',
  'TriggerAddEventUnitEntersRegion', 'TriggerAddEventUnitUsesAbility',
  'TriggerAddEventPlayerChat', 'TriggerAddEventMapInit',
  'TriggerAddCondition', 'TriggerAddAction',
  'EventUnitGetUnit', 'EventPlayerGetPlayer',
  // AI
  'AITownCreate', 'AIGroupCreate', 'AIGroupSetScript',
  'AIGroupSetState', 'AIPlayerSetState',
  // Transmission
  'TransmissionSend', 'TransmissionPlaySound',
  // Environment
  'TerrainGetHeight', 'TerrainSetHeight', 'TerrainSetType',
  'LightingSetAmbientColor', 'LightingSetDiffuseColor',
  // Catalog
  'CatalogFieldValueGet', 'CatalogFieldExists',
  // Conversations
  'ConvCreate', 'ConvSetModel', 'ConvSetPortrait',
  // Vis / Fog
  'VisSetVisible', 'VisRevealerCreate', 'VisRevealerSetState',
  // Loot
  'LootCreate', 'LootAddItem',
  // Anim / Model
  'AnimPlay', 'AnimSetTime', 'ModelPortraitCreate',
  // Data / Save
  'DataCollectionCreate', 'DataCollectionAddValue',
]);

// Galaxy built-in types
const GALAXY_TYPES = new Set([
  'int', 'fixed', 'string', 'bool', 'void',
  'byte', 'char', 'text', 'point', 'region', 'rect',
  'unit', 'unitgroup', 'player', 'playergroup',
  'doodad', 'marker', 'unitfilter', 'playerfilter',
  'type', 'struct', 'enum',
]);

// Galaxy keywords
const GALAXY_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'const', 'static', 'persistent',
  'true', 'false', 'null', 'struct', 'typedef', 'enum',
  'include', 'include_once',
]);

/**
 * Validate Galaxy code for common issues.
 */
export function validateGalaxyCode(code: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = code.split('\n');

  let braceDepth = 0;
  let parenDepth = 0;
  let inBlockComment = false;
  const declaredFunctions = new Set<string>();
  const declaredVariables = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    let inLineComment = false;
    let inString = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = j + 1 < line.length ? line[j + 1] : '';

      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          j++;
        }
        continue;
      }

      if (inLineComment) continue;

      if (ch === '/' && next === '/') {
        inLineComment = true;
        continue;
      }

      if (ch === '/' && next === '*') {
        inBlockComment = true;
        j++;
        continue;
      }

      if (ch === '"' && !inString) {
        inString = true;
        continue;
      }

      if (ch === '"' && inString) {
        inString = false;
        continue;
      }

      if (inString) continue;

      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
      if (ch === '(') parenDepth++;
      if (ch === ')') parenDepth--;

      if (braceDepth < 0) {
        issues.push({
          line: lineNum, column: j + 1,
          severity: 'error',
          message: 'Unmatched closing brace "}"',
          rule: 'brace-match',
        });
        braceDepth = 0;
      }

      if (parenDepth < 0) {
        issues.push({
          line: lineNum, column: j + 1,
          severity: 'error',
          message: 'Unmatched closing parenthesis ")"',
          rule: 'paren-match',
        });
        parenDepth = 0;
      }
    }

    // Check for function declarations
    const funcMatch = line.match(/^\s*(\w[\w\s*]+?)\s+(\w+)\s*\(/);
    if (funcMatch && !line.match(/^\s*(if|else|for|while|switch|return)\s*[\({]/)) {
      declaredFunctions.add(funcMatch[2]);
    }

    // Check for variable declarations
    const varMatch = line.match(/^\s*(int|fixed|string|bool|void|byte|char|text)\s+(\w+)/);
    if (varMatch) {
      declaredVariables.add(varMatch[2]);
    }

    // Check for common issues
    const trimmed = line.trim();

    // Warn about C-style printf in Galaxy (should use Debug or print)
    if (trimmed.match(/\bprintf\s*\(/)) {
      issues.push({
        line: lineNum, column: 0,
        severity: 'warning',
        message: 'Galaxy does not have printf(). Use print() or DisplayTextToPlayer() instead.',
        rule: 'no-printf',
      });
    }

    // Warn about malloc/free
    if (trimmed.match(/\b(malloc|free|calloc)\s*\(/)) {
      issues.push({
        line: lineNum, column: 0,
        severity: 'warning',
        message: 'Galaxy does not support manual memory management.',
        rule: 'no-malloc',
      });
    }

    // Warn about == in conditions that might want =
    // (already inside if/while so would need deeper analysis; skip for now)

    // Warn about missing semicolons after statements (simple check)
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith('(') &&
      !trimmed.endsWith(')') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('#') &&
      !trimmed.match(/^\s*$/) &&
      !inBlockComment
    ) {
      // Only warn for lines that look like statements
      if (trimmed.match(/^(int|fixed|string|bool|return|persistent|const)\b/)) {
        issues.push({
          line: lineNum, column: 0,
          severity: 'info',
          message: 'Possible missing semicolon at end of statement.',
          rule: 'missing-semicolon',
        });
      }
    }

    // Warn about long lines
    if (line.length > 200) {
      issues.push({
        line: lineNum, column: 200,
        severity: 'info',
        message: `Line exceeds 200 characters (${line.length}).`,
        rule: 'line-length',
      });
    }
  }

  // Check final brace depth
  if (braceDepth > 0) {
    issues.push({
      line: lines.length, column: 0,
      severity: 'error',
      message: `Unclosed brace(s): ${braceDepth} missing closing brace "}"`,
      rule: 'brace-match',
    });
  }

  if (parenDepth > 0) {
    issues.push({
      line: lines.length, column: 0,
      severity: 'error',
      message: `Unclosed parenthesis: ${parenDepth} missing closing ")"`,
      rule: 'paren-match',
    });
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Extract function signatures from Galaxy code.
 */
export function extractFunctions(code: string): Array<{ name: string; returnType: string; params: string; line: number }> {
  const functions: Array<{ name: string; returnType: string; params: string; line: number }> = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match Galaxy function declaration pattern: ReturnType FuncName(params)
    const match = line.match(/^(\w[\w\s*]*?)\s+(\w+)\s*\(([^)]*)\)\s*\{?\s*$/);
    if (match && !line.match(/^\s*(if|else|for|while|switch|return)\b/)) {
      functions.push({
        returnType: match[1].trim(),
        name: match[2],
        params: match[3].trim(),
        line: i + 1,
      });
    }
  }

  return functions;
}

/**
 * Extract variable declarations from Galaxy code.
 */
export function extractVariables(code: string): Array<{ name: string; type: string; line: number }> {
  const variables: Array<{ name: string; type: string; line: number }> = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*(int|fixed|string|bool|byte|char|text|const\s+\w+|persistent\s+\w+)\s+(\w+)(?:\s*\[.*?\])?\s*[;=]/);
    if (match) {
      variables.push({
        type: match[1].trim(),
        name: match[2],
        line: i + 1,
      });
    }
  }

  return variables;
}

export {
  GALAXY_NATIVE_FUNCTIONS,
  GALAXY_TYPES,
  GALAXY_KEYWORDS,
};
