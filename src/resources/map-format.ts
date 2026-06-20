export const mapFormatReference = `# SC2 Map/Mod File Format Reference

## File Extensions
- .sc2map - Map files (playable maps)
- .sc2mod - Mod files (reusable data libraries)
- .sc2archive - Archive bundles

## Archive Structure (ZIP)
All SC2 files are ZIP archives containing:

### Required Files
- DocumentHeader - Binary file with version/metadata
- DocumentInfo - XML with author, dependencies
- MapInfo - XML with map name, size, players (maps only)
- MapScript.galaxy - Main Galaxy script (maps only)

### Data Directory
- Base.SC2Data/ - Game data directory
  - GameData/ - XML data files (UnitData.xml, WeaponData.xml, etc.)
  - TriggerLibs/ - Trigger library files

### Asset Directories
- Assets/Models/ - .m3 model files
- Assets/Textures/ - .dds/.tga texture files
- Assets/Sounds/ - .ogg/.wav sound files

## Race Values
- 0 = Human/Terran
- 1 = Protoss
- 2 = Zerg
- 3 = Random

## Common Operations
1. Open .sc2map in Galaxy Editor to edit visually
2. Use sc2map_read/sc2map_write to modify via MCP
3. Import assets by adding files to Assets/ directory
4. Add mod dependencies in DocumentInfo Dependencies
`;
