# SC2 AI Workbench + MCP

MCP Server for StarCraft II AI-powered Mod/Map development - SC2 AI Workbench.

## Overview

SC2MCP is an MCP (Model Context Protocol) server that enables AI agents to assist with
StarCraft II Mod and Map development. It provides a complete AI-first development workbench
for creating mods, races, units, abilities, icons, music, UI, scripts, and test reports.

**Core Philosophy**: AI handles Mod, Race, Unit, Ability, Icon, Music, UI, Script, Testing, and Reports.  
Humans handle final terrain art, complex terrain editing, and Battle.net publishing.

## Features

### Project Management (9 tools)
- `project.scan` - Scan SC2Components project folder
- `project.create_mod` - Create new SC2Mod with proper structure
- `project.create_test_map` - Create test map with mod dependency
- `project.backup` - Create project backup before modifications
- `project.diff` - Show differences from last backup
- `project.rollback` - Rollback to previous backup
- `project.list_dependencies` - List mod dependencies
- `project.add_dependency` - Add mod dependency
- `project.validate_structure` - Validate project structure

### Template System (5 tools)
- `template.create_unit` - Create unit from template (worker, melee, ranged, caster, flying, hero)
- `template.create_button` - Create button entry for command cards
- `template.create_ability` - Create ability with button, effect, behavior
- `template.create_upgrade` - Create upgrade with level-based costs
- `template.create_localization` - Add localization entries

### Faction Generator (2 tools)
- `faction.create` - Create complete faction with units, structures, upgrades
- `faction.generate_from_schema` - Generate faction from JSON schema

### Galaxy Code (4 tools)
- `galaxy_generate_code` - Generate Galaxy script from description
- `galaxy_validate_code` - Validate Galaxy script syntax
- `galaxy_explain_code` - Explain Galaxy code functionality
- `galaxy_lookup_api` - Look up Galaxy native functions

### Data Editor (5 tools)
- `galaxy_generate_data_xml` - Generate SC2 data XML
- `data_list_components` - List components in archive
- `data_batch_modify` - Batch modify multiple components
- `data_validate_catalog` - Validate data catalog
- `data_generate_upgrade` - Generate upgrade with levels

### SC2Map Files (7 tools)
- `sc2map_list` - List files in archive
- `sc2map_read` - Read specific file from archive
- `sc2map_read_all_galaxy` - Read all Galaxy scripts
- `sc2map_read_all_xml` - Read all XML data
- `sc2map_write` - Write file to archive
- `sc2map_create` - Create new SC2Map
- `sc2mod_create` - Create new SC2Mod

### Unit Operations (4 tools)
- `unit_create_full` - Create complete unit with weapon
- `unit_modify` - Generate XML override for unit
- `unit_generate_ability` - Generate ability XML
- `unit_generate_behavior` - Generate behavior/buff XML

### Asset Management (6 tools)
- `asset_import_file` - Import file into archive
- `asset_import_directory` - Import directory into archive
- `asset_generate_model_actor` - Generate model actor XML
- `asset_generate_sound_entry` - Generate sound XML
- `asset_generate_icon_entry` - Generate icon XML
- `asset_list` - List assets in archive

### Map Blueprint (3 tools)
- `map.generate_blueprint` - Generate map layout blueprint
- `map.save_blueprint` - Save blueprint to files
- `map.validate_blueprint` - Validate blueprint for issues

### Runner & Testing (5 tools)
- `run.launch_map` - Launch map via SC2Switcher
- `run.capture_screenshot` - Capture SC2 window screenshot
- `run.check_sc2_status` - Check if SC2 is running
- `run.close_sc2` - Close SC2 processes
- `run.collect_logs` - Collect SC2 game logs
- `run.detect_sc2` - Detect SC2 installation

### Report System (3 tools)
- `report.generate` - Generate test report (Markdown/HTML)
- `report.create_from_data` - Create report from custom data
- `report.list_reports` - List generated reports

### Editor Automation (7 tools)
- `editor_activate` - Bring editor to foreground
- `editor_open_map` - Open map in editor
- `editor_send_keys` - Send keyboard input
- `editor_click` - Click at coordinates
- `editor_save` - Save current map
- `editor_new_map` - Open New Map dialog
- `editor_screenshot` - Take editor screenshot

### Terrain (4 tools)
- `terrain_generate_heightmap` - Generate terrain height data
- `terrain_set_texture` - Paint terrain texture
- `terrain_create_cliff` - Create cliff edges
- `terrain_create_ramp` - Create ramps

### Object Placement (5 tools)
- `object_place_units` - Place units on map
- `object_place_doodads` - Place decorative doodads
- `object_create_camera` - Setup camera
- `object_create_region` - Define regions
- `object_create_patrol_route` - Create patrol routes

### Triggers (2 tools)
- `trigger_generate_full` - Generate complete trigger
- `trigger_generate_chain` - Generate trigger chain

### UI (3 tools)
- `ui_generate_dialog` - Generate dialog UI
- `ui_generate_scoreboard` - Generate scoreboard
- `ui_generate_tooltip` - Generate tooltips

**Total: 69 tools**

### Resources (7)
- Galaxy native function reference (50+ functions)
- Galaxy types and keywords reference
- Data Editor XML schema documentation
- Trigger system reference
- Common Galaxy patterns (8 patterns)
- Map format documentation
- Asset format reference

### Prompts (9)
- create-unit, create-map, create-mod, import-asset
- create-ability, create-trigger, debug-galaxy-script
- create-faction, generate-blueprint

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server (stdio)

```bash
npm start
```

### With Claude Desktop / OpenCode

Add to your MCP client config:

```json
{
  "mcpServers": {
    "sc2mcp": {
      "command": "node",
      "args": ["D:\\path\\to\\sc2mcp\\dist\\index.js"]
    }
  }
}
```

### Development

```bash
npm run dev    # Run with tsx (no build step)
npm run build  # Compile TypeScript
npm run inspect # Run with MCP Inspector
```

## Configuration

Create `sc2-workbench.json` in your project root:

```json
{
  "sc2": {
    "installPath": "C:\\Program Files (x86)\\StarCraft II",
    "region": "US",
    "language": "enUS"
  },
  "workspace": {
    "projectsRoot": "D:\\SC2Projects",
    "backupRoot": "D:\\SC2Projects\\.backups",
    "reportsRoot": "D:\\SC2Projects\\.reports"
  }
}
```

## SC2Components Project Structure

The workbench supports `.SC2Components` folder-based projects:

```
MyRace.SC2Mod.SC2Components/
├── ComponentList.SC2Components
├── Base.SC2Data/
│   ├── GameData.xml
│   ├── GameData/
│   │   ├── Units.xml
│   │   ├── Weapons.xml
│   │   ├── Abilities.xml
│   │   ├── Buttons.xml
│   │   └── Actors.xml
│   ├── UI/Layout/
│   └── Assets/
│       ├── Icons/
│       ├── Sounds/
│       └── Music/
├── enUS.SC2Data/
│   └── LocalizedData/GameStrings.txt
└── scripts/
    ├── main.galaxy
    └── race_init.galaxy
```

## Example Workflow

```
User: "Create a new race called Mechanical Swarm with worker, melee, ranged units, and a turret"

AI Workflow:
1. project.scan - Check current project
2. project.backup - Create backup
3. faction.create - Generate complete faction
4. template.create_unit - Create specialized units
5. template.create_ability - Add special abilities
6. map.generate_blueprint - Create test map layout
7. run.launch_map - Test in SC2
8. run.capture_screenshot - Capture results
9. report.generate - Create test report
```

## Project Structure

```
src/
  index.ts              # MCP server entry point
  resources/
    index.ts            # Resource registration
    galaxy-api.ts       # Galaxy native function reference
    galaxy-types.ts     # Galaxy types reference
    data-xml-schema.ts  # Data Editor XML schema
    trigger-reference.ts # Trigger system reference
    common-patterns.ts  # Common Galaxy patterns
    map-format.ts       # Map format docs
    asset-formats.ts    # Asset format docs
  tools/
    index.ts            # Tool registration
    project-tools.ts    # Project management (scan, backup, diff, rollback)
    template-tools.ts   # Template system (unit, button, ability, upgrade)
    faction-tools.ts    # Faction/race generator
    blueprint-tools.ts  # Map blueprint system
    runner-tools.ts     # SC2Switcher, screenshot, logs
    report-tools.ts     # Report generation
    galaxy-tools.ts     # Galaxy code tools
    data-xml-tools.ts   # Data XML tools
    data-tools.ts       # Data management tools
    sc2map-tools.ts     # SC2Map file tools
    map-creation.ts     # Map/Mod creation
    unit-operations.ts  # Unit operations
    asset-management.ts # Asset management
    terrain-tools.ts    # Terrain editing
    object-tools.ts     # Object placement
    trigger-tools.ts    # Trigger generation
    ui-tools.ts         # UI generation
    editor-automation.ts # Editor UI automation
  prompts/
    index.ts            # Prompt templates
  utils/
    galaxy-validator.ts # Galaxy code validator
    xml-utils.ts        # XML parsing utilities
    sc2map-utils.ts     # SC2Map ZIP archive utilities
```

## Testing with Galaxy Editor

1. Use `project.create_mod` to create a new mod
2. Use `faction.create` to generate a complete race
3. Use `project.create_test_map` to create a test map
4. Use `run.launch_map` to test in SC2
5. Use `run.capture_screenshot` to verify results
6. Use `report.generate` to create test report

## License

MIT
