/**
 * Common Galaxy patterns and examples.
 */
export const commonPatternsReference = `# Common Galaxy Patterns

## 1. Map Initialization
\`\`\`galaxy
bool gf_MapInit_Actions() {
    UnitCreate(5, "Marine", 10.0, 10.0, 0.0, 0);
    PlayerSetPropertyInt(0, c_playerPropMinerals, 500);
    DisplayTextToPlayer(0, 0.0, 0.0, "Welcome!");
    return true;
}

void gf_MapInit_Init() {
    trigger t = TriggerCreate("gf_MapInit_Func");
    TriggerAddEventMapInit(t);
}
\`\`\`

## 2. Periodic Timer
\`\`\`galaxy
bool gt_PeriodicTimer_Actions() {
    int count = UnitGroupCount(g_Enemies);
    DisplayTextToPlayer(0, 0.0, 0.0,
        StringToText("Enemies: ") + IntToText(count));
    return true;
}

void gt_PeriodicTimer_Init() {
    trigger t = TriggerCreate("gt_PeriodicTimer_Func");
    TriggerAddEventTimePeriodic(t, 5.0, c_timeGame);
}
\`\`\`

## 3. Region Enter Detection
\`\`\`galaxy
bool gt_RegionEnter_Actions() {
    unit u = EventUnitGetUnit();
    int owner = UnitGetOwner(u);
    DisplayTextToPlayer(owner, 0.0, 0.0, "Unit entered zone!");
    return true;
}

void gt_RegionEnter_Init() {
    trigger t = TriggerCreate("gt_RegionEnter_Func");
    TriggerAddEventUnitEntersRegion(t, RegionFromId("SpawnZone"), "gf_AnyUnit");
}
\`\`\`

## 4. Chat Command Handler
\`\`\`galaxy
bool gt_ChatCommand_Actions() {
    string msg = EventPlayerChatGetMessage();
    int player = EventPlayerGetPlayer();
    if (StringCompare(msg, "help") == 0) {
        DisplayTextToPlayer(player, 0.0, 0.0, "Commands: help, spawn");
    } else if (StringStartsWith(msg, "spawn") == true) {
        point pos = PointFromUnit(PlayerGroupUnitFromId(player));
        UnitCreate(1, "Marine", PointGetX(pos), PointGetY(pos), 0.0, player);
    }
    return true;
}

void gt_ChatCommand_Init() {
    trigger t = TriggerCreate("gt_ChatCommand_Func");
    TriggerAddEventPlayerChat(t, "", c_playerAny, "Any");
}
\`\`\`

## 5. Kill Counter
\`\`\`galaxy
persistent int g_KillCount = 0;

bool gt_KillCounter_Actions() {
    g_KillCount = g_KillCount + 1;
    int player = UnitGetOwner(EventUnitGetUnit());
    DisplayTextToPlayer(player, 0.0, 0.0,
        StringToText("Kills: ") + IntToText(g_KillCount));
    return true;
}

void gt_KillCounter_Init() {
    trigger t = TriggerCreate("gt_KillCounter_Func");
    TriggerAddEventUnitDies(t, "gf_AnyUnit");
}
\`\`\`

## 6. Wave Spawn System
\`\`\`galaxy
persistent int g_WaveNum = 0;

bool gt_WaveSpawn_Actions() {
    g_WaveNum = g_WaveNum + 1;
    int spawnCount = g_WaveNum * 3;
    DisplayTextToPlayer(c_playerAll, 0.0, 0.0,
        StringToText("Wave ") + IntToText(g_WaveNum));
    for (int i = 0; i < spawnCount; i++) {
        fixed rx = RandomFixed(10.0, 50.0);
        fixed ry = RandomFixed(10.0, 50.0);
        UnitCreate(1, "Zergling", rx, ry, 0.0, 1);
    }
    return true;
}

void gt_WaveSpawn_Init() {
    trigger t = TriggerCreate("gt_WaveSpawn_Func");
    TriggerAddEventTimePeriodic(t, 30.0, c_timeGame);
}
\`\`\`

## 7. Dialog UI
\`\`\`galaxy
dialog g_InfoDialog;

bool gt_ShowDialog_Actions() {
    g_InfoDialog = DialogCreate("Info Panel", 400.0, 200.0);
    DialogSetPosition(g_InfoDialog, 0.5, 0.5);
    dialogcontrol titleLabel = DialogControlCreate(g_InfoDialog, c_dcLabel, "Title");
    DialogControlSetText(titleLabel, "Game Status");
    DialogSetVisible(g_InfoDialog, true, 0);
    return true;
}
\`\`\`

## 8. Victory/Defeat Check
\`\`\`galaxy
bool gt_VictoryCheck_Actions() {
    if (UnitGroupCount(g_EnemyBase) == 0) {
        DisplayTextToPlayer(c_playerAll, 0.0, 0.0, "Victory!");
    }
    return true;
}

void gt_GameEndCheck_Init() {
    trigger t1 = TriggerCreate("gt_VictoryCheck_Func");
    TriggerAddEventTimePeriodic(t1, 2.0, c_timeGame);
}
\`\`\`
`;
