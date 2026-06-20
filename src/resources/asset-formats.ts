export const assetFormatsReference = `# SC2 Asset Formats Reference

## Model Files (.m3)
- Blizzard M3 proprietary 3D format
- Tools: 3ds Max/Blender with M3 plugin
- Path: Assets/Models/
- Needs CActorModel XML entry

## Texture Files (.dds)
- DirectDraw Surface format
- Compression: DXT1, DXT5, BC7
- Tools: GIMP+DDS, Paint.NET
- Path: Assets/Textures/

## Sound Files (.ogg/.wav)
- OGG Vorbis or WAV
- Path: Assets/Sounds/
- Needs CSound XML entry

## Icon Files (.tga/.dds)
- TGA or DDS, 256x256
- Path: Assets/Textures/Icons/

## Actor System
- CActorModel - 3D model display
- CActorAction - Animation triggers
- CActorSound - Sound playback

## Workflow
1. Prepare asset in correct format
2. Use asset_import_file to add to archive
3. Generate XML entry
4. Use sc2map_write to add XML
5. Test in Galaxy Editor
`;
