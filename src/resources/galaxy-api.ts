/**
 * Galaxy native function reference data for MCP Resources.
 */

export const galaxyApiReference = `# Galaxy Native Functions Reference

## Unit Functions

### UnitCreate(int count, string type, fixed x, fixed y, fixed z, int player)
Creates a unit of the specified type at the given position for the specified player.
Returns the first created unit.

### UnitKill(unit u)
Kills the specified unit immediately.

### UnitRemove(unit u, bool kill, bool noScore)
Removes a unit from the game. If kill is true, death events fire.

### UnitGetPosition(unit u) -> point
Returns the current position of the unit.

### UnitSetPosition(unit u, fixed x, fixed y, fixed z)
Teleports a unit to the specified position.

### UnitGetType(unit u) -> string
Returns the unit type ID as a string.

### UnitGetOwner(unit u) -> int
Returns the player ID that owns the unit.

### UnitIssueOrder(unit u, order o)
Issues an order to a unit.

### UnitGetPropertyFixed(unit u, string prop, int player) -> fixed
Gets a fixed-point property value from a unit.

### UnitSetPropertyFixed(unit u, string prop, fixed value, int player)
Sets a fixed-point property on a unit.

### UnitGetPropertyInt(unit u, string prop, int player) -> int
Gets an integer property value from a unit.

## Player Functions

### PlayerGetRace(int player) -> int
Returns the race of the player (0=Human, 1=Protoss, 2=Zerg, 3=Random).

### PlayerGroupFromId(int player) -> playergroup
Converts a player ID to a playergroup.

### PlayerGetState(int player) -> int
Returns the state of the player (playing, defeated, etc.).

### PlayerModifyScore(int player, int scoreType, int value)
Modifies a player score.

### PlayerGetScore(int player, int scoreType) -> int
Gets a player score value.

## Timer Functions

### TimerCreate(string name) -> timer
Creates a new timer and returns it.

### TimerStart(timer t, fixed duration, bool periodic, string onComplete)
Starts a timer with the specified duration.

### TimerGetElapsed(timer t) -> fixed
Returns the elapsed time.

### TimerGetRemaining(timer t) -> fixed
Returns the remaining time.

### TimerPause(timer t) / TimerResume(timer t)
Pauses or resumes a timer.

### TimerDestroy(timer t)
Destroys a timer.

## Display / Text Functions

### DisplayTextToPlayer(int player, fixed x, fixed y, string text)
Displays a text message to a player at screen position.

### DisplayTimedTextToPlayer(int player, fixed x, fixed y, fixed duration, string text)
Displays a timed text message.

### StringToText(string s) -> text
Converts a string to a text value for display.

### IntToText(int i) -> text
Converts an integer to displayable text.

### FixedToText(fixed f, int precision) -> text
Converts a fixed-point number to text with given decimal precision.

## Math Functions

### MathAbs(fixed x) -> fixed / MathAbsInt(int x) -> int
Absolute value.

### MathCeil(fixed x) -> fixed / MathFloor(fixed x) -> fixed
Ceiling and floor.

### MathMax(a, b) / MathMin(a, b)
Returns the maximum or minimum of two values.

### MathPow(fixed base, fixed exp) -> fixed
Power function.

### MathSin(fixed rad) -> fixed / MathCos(fixed rad) -> fixed / MathTan(fixed rad) -> fixed
Trigonometric functions (input in radians).

### MathSqrt(fixed x) -> fixed
Square root.

### RandomInt(int min, int max) -> int
Random integer in range [min, max].

### RandomFixed(fixed min, fixed max) -> fixed
Random fixed-point in range.

## Region / Point Functions

### RegionFromId(string id) -> region
Gets a region by its editor ID.

### RegionGetCenter(region r) -> point
Gets the center point of a region.

### PointFromUnit(unit u) -> point
Gets the position of a unit as a point.

## Dialog Functions

### DialogCreate(string title, fixed width, fixed height) -> dialog
Creates a dialog window.

### DialogSetVisible(dialog d, bool visible, int player)
Shows or hides a dialog.

### DialogSetPosition(dialog d, fixed x, fixed y)
Sets the position of a dialog.

### DialogControlCreate(dialog d, int type, string label) -> dialogcontrol
Creates a control inside a dialog.

### DialogControlSetText(dialogcontrol dc, string text)
Sets the text of a dialog control.

### DialogControlDestroy(dialogcontrol dc)
Destroys a dialog control.

## Camera Functions

### CameraSetTarget(int player, fixed x, fixed y, fixed z)
Sets the camera target for a player.

### CameraSetDistance(int player, fixed distance)
Sets the camera distance.

### CameraSetRotation(int player, fixed angle, fixed time)
Sets camera rotation with optional transition time.

### CameraPan(int player, fixed x, fixed y, fixed z, fixed duration)
Pans the camera smoothly.

### CameraShake(int player, int type, fixed amount, fixed duration, fixed freq)
Shakes the camera.

## Group Functions

### UnitGroupCreate() -> unitgroup
Creates an empty unit group.

### UnitGroupAdd(unitgroup g, unit u)
Adds a unit to a group.

### UnitGroupRemove(unitgroup g, unit u)
Removes a unit from a group.

### UnitGroupCount(unitgroup g) -> int
Returns the number of units in a group.

### UnitGroupUnitFromIndex(unitgroup g, int index) -> unit
Gets a unit by index from a group.

## Order Functions

### OrderCreate(unit u, int cmdType) -> order
Creates a new order for a unit.

### OrderSetTargetUnit(order o, unit target)
Sets the target unit for an order.

### OrderSetTargetPoint(order o, fixed x, fixed y, fixed z)
Sets the target point for an order.

## Trigger / Event Functions

### TriggerCreate(string name) -> trigger
Creates a new trigger.

### TriggerEnable(trigger t, bool enabled)
Enables or disables a trigger.

### TriggerAddEventTimePeriodic(trigger t, fixed interval, string func)
Adds a periodic timer event.

### TriggerAddEventTimeElapsed(trigger t, fixed time, string func)
Adds a one-shot timer event.

### TriggerAddEventUnitCreated(trigger t, string filterFunc)
Fires when a unit is created.

### TriggerAddEventUnitDies(trigger t, string filterFunc)
Fires when a unit dies.

### TriggerAddEventUnitEntersRegion(trigger t, region r, string filterFunc)
Fires when a unit enters a region.

### TriggerAddEventPlayerChat(trigger t, string msg, int player, string filterFunc)
Fires when a player sends a chat message.

### TriggerAddEventMapInit(trigger t)
Fires when the map initializes.

### TriggerAddAction(trigger t, string func)
Adds an action function to a trigger.

### TriggerAddCondition(trigger t, string func)
Adds a condition function to a trigger.

## Game State Functions

### GameGetResult() -> int
Gets the game result.

### GameGetSpeed() -> fixed / GameSetSpeed(fixed speed)
Gets/sets game speed.

### GameIsPaused() -> bool
Checks if the game is paused.

### GameGetTimeOfDay() -> fixed / GameSetTimeOfDay(fixed time)
Gets/sets time of day.

## Environment Functions

### TerrainGetHeight(fixed x, fixed y) -> fixed
Gets terrain height at a point.

### TerrainSetHeight(fixed x, fixed y, fixed height)
Sets terrain height.

## Catalog / Data Functions

### CatalogFieldValueGet(string catalog, string entry, string field, int player) -> string
Gets a field value from the data catalog.

### CatalogFieldExists(string catalog, string entry, string field) -> bool
Checks if a catalog field exists.

## Sound Functions

### SoundPlay(string sound, int player)
Plays a sound for a player.

### SoundStop(string sound, int player)
Stops a sound.

### MusicPlayTrack(string track, int player)
Plays a music track.

### MusicSetVolume(fixed volume, int player)
Sets music volume (0.0 to 1.0).

## AI Functions

### AITownCreate(int player, point location)
Creates an AI town at a location.

### AIGroupCreate() -> aigroup
Creates an AI group.

### AIGroupSetScript(aigroup g, string script)
Sets the AI script for a group.

### AIPlayerSetState(int player, int state)
Sets the AI state for a player.

## Conversion Functions

### IntToString(int value) -> string
Converts integer to string.

### StringToInt(string s) -> int
Converts string to integer.

### IntToFixed(int value) -> fixed
Converts integer to fixed-point.

### StringToFixed(string s) -> fixed
Converts string to fixed-point.

### TextToFixed(text t) -> fixed
Converts text to fixed-point.
`;

export const galaxyApiLookup: Record<string, { signature: string; description: string; category: string }> = {
  UnitCreate: { signature: 'int UnitCreate(int count, string type, fixed x, fixed y, fixed z, int player)', description: 'Creates units at a position for a player.', category: 'unit' },
  UnitKill: { signature: 'void UnitKill(unit u)', description: 'Kills a unit.', category: 'unit' },
  UnitRemove: { signature: 'void UnitRemove(unit u, bool kill, bool noScore)', description: 'Removes a unit from the game.', category: 'unit' },
  UnitGetPosition: { signature: 'point UnitGetPosition(unit u)', description: 'Returns the position of a unit.', category: 'unit' },
  UnitSetPosition: { signature: 'void UnitSetPosition(unit u, fixed x, fixed y, fixed z)', description: 'Teleports a unit.', category: 'unit' },
  UnitGetType: { signature: 'string UnitGetType(unit u)', description: 'Returns the unit type ID.', category: 'unit' },
  UnitGetOwner: { signature: 'int UnitGetOwner(unit u)', description: 'Returns the owning player ID.', category: 'unit' },
  UnitIssueOrder: { signature: 'void UnitIssueOrder(unit u, order o)', description: 'Issues an order to a unit.', category: 'unit' },
  UnitGetPropertyFixed: { signature: 'fixed UnitGetPropertyFixed(unit u, string prop, int player)', description: 'Gets a fixed property from a unit.', category: 'unit' },
  UnitSetPropertyFixed: { signature: 'void UnitSetPropertyFixed(unit u, string prop, fixed value, int player)', description: 'Sets a fixed property on a unit.', category: 'unit' },
  TimerCreate: { signature: 'timer TimerCreate(string name)', description: 'Creates a new timer.', category: 'timer' },
  TimerStart: { signature: 'void TimerStart(timer t, fixed duration, bool periodic, string onComplete)', description: 'Starts a timer.', category: 'timer' },
  TimerGetElapsed: { signature: 'fixed TimerGetElapsed(timer t)', description: 'Gets elapsed time.', category: 'timer' },
  TimerGetRemaining: { signature: 'fixed TimerGetRemaining(timer t)', description: 'Gets remaining time.', category: 'timer' },
  DisplayTextToPlayer: { signature: 'void DisplayTextToPlayer(int player, fixed x, fixed y, string text)', description: 'Displays text to a player.', category: 'ui' },
  DisplayTimedTextToPlayer: { signature: 'void DisplayTimedTextToPlayer(int player, fixed x, fixed y, fixed duration, string text)', description: 'Displays timed text.', category: 'ui' },
  DialogCreate: { signature: 'dialog DialogCreate(string title, fixed width, fixed height)', description: 'Creates a dialog.', category: 'dialog' },
  DialogSetVisible: { signature: 'void DialogSetVisible(dialog d, bool visible, int player)', description: 'Shows/hides a dialog.', category: 'dialog' },
  CameraSetTarget: { signature: 'void CameraSetTarget(int player, fixed x, fixed y, fixed z)', description: 'Sets camera target.', category: 'camera' },
  CameraPan: { signature: 'void CameraPan(int player, fixed x, fixed y, fixed z, fixed duration)', description: 'Pans camera smoothly.', category: 'camera' },
  TriggerCreate: { signature: 'trigger TriggerCreate(string name)', description: 'Creates a trigger.', category: 'trigger' },
  TriggerAddEventMapInit: { signature: 'void TriggerAddEventMapInit(trigger t)', description: 'Adds map init event.', category: 'trigger' },
  TriggerAddEventTimePeriodic: { signature: 'void TriggerAddEventTimePeriodic(trigger t, fixed interval, string func)', description: 'Adds periodic event.', category: 'trigger' },
  TriggerAddEventUnitDies: { signature: 'void TriggerAddEventUnitDies(trigger t, string filterFunc)', description: 'Adds unit death event.', category: 'trigger' },
  TriggerAddEventUnitEntersRegion: { signature: 'void TriggerAddEventUnitEntersRegion(trigger t, region r, string filterFunc)', description: 'Adds region enter event.', category: 'trigger' },
  TriggerAddEventPlayerChat: { signature: 'void TriggerAddEventPlayerChat(trigger t, string msg, int player, string filterFunc)', description: 'Adds chat event.', category: 'trigger' },
  TriggerAddAction: { signature: 'void TriggerAddAction(trigger t, string func)', description: 'Adds action to trigger.', category: 'trigger' },
  TriggerAddCondition: { signature: 'void TriggerAddCondition(trigger t, string func)', description: 'Adds condition to trigger.', category: 'trigger' },
  TriggerEnable: { signature: 'void TriggerEnable(trigger t, bool enabled)', description: 'Enables/disables trigger.', category: 'trigger' },
  UnitGroupCreate: { signature: 'unitgroup UnitGroupCreate()', description: 'Creates empty unit group.', category: 'group' },
  UnitGroupAdd: { signature: 'void UnitGroupAdd(unitgroup g, unit u)', description: 'Adds unit to group.', category: 'group' },
  UnitGroupRemove: { signature: 'void UnitGroupRemove(unitgroup g, unit u)', description: 'Removes unit from group.', category: 'group' },
  UnitGroupCount: { signature: 'int UnitGroupCount(unitgroup g)', description: 'Returns group size.', category: 'group' },
  RandomInt: { signature: 'int RandomInt(int min, int max)', description: 'Random integer.', category: 'math' },
  RandomFixed: { signature: 'fixed RandomFixed(fixed min, fixed max)', description: 'Random fixed.', category: 'math' },
  MathSin: { signature: 'fixed MathSin(fixed rad)', description: 'Sine.', category: 'math' },
  MathCos: { signature: 'fixed MathCos(fixed rad)', description: 'Cosine.', category: 'math' },
  MathSqrt: { signature: 'fixed MathSqrt(fixed x)', description: 'Square root.', category: 'math' },
  MathAbs: { signature: 'fixed MathAbs(fixed x)', description: 'Absolute value.', category: 'math' },
  StringToText: { signature: 'text StringToText(string s)', description: 'Converts string to text.', category: 'conversion' },
  IntToText: { signature: 'text IntToText(int i)', description: 'Converts int to text.', category: 'conversion' },
  IntToString: { signature: 'string IntToString(int value)', description: 'Converts int to string.', category: 'conversion' },
  StringToInt: { signature: 'int StringToInt(string s)', description: 'Converts string to int.', category: 'conversion' },
  GameGetSpeed: { signature: 'fixed GameGetSpeed()', description: 'Gets game speed.', category: 'game' },
  GameSetSpeed: { signature: 'void GameSetSpeed(fixed speed)', description: 'Sets game speed.', category: 'game' },
  GameGetTimeOfDay: { signature: 'fixed GameGetTimeOfDay()', description: 'Gets time of day.', category: 'game' },
  SoundPlay: { signature: 'void SoundPlay(string sound, int player)', description: 'Plays a sound.', category: 'sound' },
  MusicPlayTrack: { signature: 'void MusicPlayTrack(string track, int player)', description: 'Plays music.', category: 'sound' },
  CatalogFieldValueGet: { signature: 'string CatalogFieldValueGet(string catalog, string entry, string field, int player)', description: 'Gets catalog data field.', category: 'catalog' },
  CatalogFieldExists: { signature: 'bool CatalogFieldExists(string catalog, string entry, string field)', description: 'Checks catalog field exists.', category: 'catalog' },
  RegionFromId: { signature: 'region RegionFromId(string id)', description: 'Gets region by editor ID.', category: 'region' },
  RegionGetCenter: { signature: 'point RegionGetCenter(region r)', description: 'Gets region center point.', category: 'region' },
  PointFromUnit: { signature: 'point PointFromUnit(unit u)', description: 'Gets unit position as point.', category: 'region' },
  PlayerGetRace: { signature: 'int PlayerGetRace(int player)', description: 'Gets player race.', category: 'player' },
  PlayerGetState: { signature: 'int PlayerGetState(int player)', description: 'Gets player state.', category: 'player' },
  AITownCreate: { signature: 'void AITownCreate(int player, point location)', description: 'Creates AI town.', category: 'ai' },
  AIGroupCreate: { signature: 'aigroup AIGroupCreate()', description: 'Creates AI group.', category: 'ai' },
  AIGroupSetScript: { signature: 'void AIGroupSetScript(aigroup g, string script)', description: 'Sets AI script.', category: 'ai' },
};