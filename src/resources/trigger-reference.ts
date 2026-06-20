/**
 * Trigger events, conditions, and actions reference.
 */
export const triggerReference = `# SC2 Trigger System Reference

## Trigger Structure
1. Event registration (what causes trigger to fire)
2. Optional conditions (gate checks)
3. Actions (what happens)

## Basic Trigger Pattern
\`\`\`galaxy
bool gt_MyTrigger_TestConditions() {
    return UnitGroupCount(g_Enemies) > 0;
}

bool gt_MyTrigger_Actions() {
    DisplayTextToPlayer(c_playerAll, 0, 0, "Trigger fired!");
    return true;
}

bool gt_MyTrigger_Func(bool testConds, bool runActions) {
    if (testConds) {
        if (!gt_MyTrigger_TestConditions()) return false;
    }
    if (runActions) {
        return gt_MyTrigger_Actions();
    }
    return true;
}

void gt_MyTrigger_Init() {
    trigger t = TriggerCreate("gt_MyTrigger_Func");
    TriggerAddEventTimePeriodic(t, 1.0, c_timeGame);
}
\`\`\`

## Events

### Time Events
- TriggerAddEventTimePeriodic(trigger, fixed interval, int timeType)
- TriggerAddEventTimeElapsed(trigger, fixed time, int timeType)

### Unit Events
- TriggerAddEventUnitCreated(trigger, string filterFunc)
- TriggerAddEventUnitDies(trigger, string filterFunc)
- TriggerAddEventUnitEntersRegion(trigger, region r, string filterFunc)
- TriggerAddEventUnitLeavesRegion(trigger, region r, string filterFunc)
- TriggerAddEventUnitUsesAbility(trigger, string abilCmd, int cmdType, string filterFunc)

### Player Events
- TriggerAddEventPlayerChat(trigger, string msg, int player, string filterFunc)
- TriggerAddEventPlayerDefeated(trigger, int player)
- TriggerAddEventPlayerVictory(trigger, int player)

### Game Events
- TriggerAddEventMapInit()
- TriggerAddEventGameStart()

## Filter Functions
\`\`\`galaxy
string gf_AnyUnit() { return "Any"; }
string gf_Player1Units() { return "1"; }
string gf_MarinesOnly() { return "Marine"; }
string gf_AlliedUnits() { return "Ally"; }
string gf_EnemyUnits() { return "Enemy"; }
\`\`\`

## Event Data Functions
- EventUnitGetUnit() - Get unit that triggered event
- EventPlayerGetPlayer() - Get player that triggered event

## Common Actions
\`\`\`galaxy
UnitCreate(1, "Marine", x, y, z, player);
DisplayTextToPlayer(player, 0.0, 0.0, "Hello!");
DisplayTimedTextToPlayer(player, 0.0, 0.0, 5.0, "Timed msg");
SoundPlay("Sounds\\Zerg\\Zergling\\ZerglingYes00.wav", player);
UnitSetPropertyFixed(u, c_unitPropLife, 100.0, player);
CameraSetTarget(player, x, y, z);
CameraSetDistance(player, 20.0);
TriggerEnable(triggerHandle, false);
TriggerDestroy(triggerHandle);
\`\`\`
`;
