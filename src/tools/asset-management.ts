import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import JSZip from "jszip";

export function registerAssetTools(server: McpServer): void {
  server.tool("asset_import_file", "Import any file into an SC2 archive (model, texture, sound, etc.).", {
    archivePath: z.string().describe("Path to .sc2map/.sc2mod file"),
    sourceFilePath: z.string().describe("Path to the file to import"),
    archiveInternalPath: z.string().describe("Path inside archive (e.g. Assets/Models/MyModel.m3)"),
  }, async ({ archivePath, sourceFilePath, archiveInternalPath }) => {
    try {
      if (!existsSync(archivePath)) return { content: [{ type: "text" as const, text: "Error: Archive not found" }], isError: true as const };
      if (!existsSync(sourceFilePath)) return { content: [{ type: "text" as const, text: "Error: Source file not found" }], isError: true as const };
      const zip = await JSZip.loadAsync(await readFile(archivePath));
      const fileData = await readFile(sourceFilePath);
      zip.file(archiveInternalPath, fileData);
      const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
      await writeFile(archivePath, output);
      return { content: [{ type: "text" as const, text: "Imported " + sourceFilePath + " -> " + archiveInternalPath + " (" + fileData.length + " bytes)" }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: "Error: " + String(e) }], isError: true as const };
    }
  });

  server.tool("asset_import_directory", "Import all files from a local directory into an SC2 archive.", {
    archivePath: z.string(),
    sourceDirPath: z.string().describe("Directory to import"),
    prefix: z.string().optional().default(""),
  }, async ({ archivePath, sourceDirPath, prefix }) => {
    try {
      const { readdir } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const zip = await JSZip.loadAsync(await readFile(archivePath));
      let count = 0;
      async function walk(dir, pfx) {
        for (const e of await readdir(dir, { withFileTypes: true })) {
          const fp = join(dir, e.name);
          const rp = pfx ? pfx + "/" + e.name : e.name;
          if (e.isDirectory()) { await walk(fp, rp); }
          else { zip.file(rp, await readFile(fp)); count++; }
        }
      }
      await walk(sourceDirPath, prefix);
      const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
      await writeFile(archivePath, output);
      return { content: [{ type: "text" as const, text: "Imported " + count + " files into " + archivePath }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: "Error: " + String(e) }], isError: true as const };
    }
  });

  server.tool("asset_generate_model_actor", "Generate CActorModel XML for a custom model.", {
    actorId: z.string(),
    modelPath: z.string().describe("Model path in archive (e.g. Assets/Models/MyModel.m3)"),
    scale: z.number().optional().default(1),
  }, async ({ actorId, modelPath, scale }) => {
    const xml = '<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n  <CActorModel id="' + actorId + '">\n    <Model value="' + modelPath + '"/>\n    <Scale value="' + scale + '"/>\n  </CActorModel>\n</Catalog>';
    return { content: [{ type: "text" as const, text: xml + "\n\nAdd to ActorData.xml" }] };
  });

  server.tool("asset_generate_sound_entry", "Generate CSound XML for a custom sound.", {
    soundId: z.string(),
    soundPath: z.string().describe("Sound path in archive"),
    volume: z.number().optional().default(1),
    category: z.enum(["Effect","Music","Ambience","UI","Voice"]).optional().default("Effect"),
  }, async ({ soundId, soundPath, volume, category }) => {
    const xml = '<?xml version="1.0" encoding="utf-8"?>\n<Catalog>\n  <CSound id="' + soundId + '">\n    <Sound value="' + soundPath + '"/>\n    <Volume value="' + volume + '"/>\n    <Category value="' + category + '"/>\n  </CSound>\n</Catalog>';
    return { content: [{ type: "text" as const, text: xml }] };
  });

  server.tool("asset_generate_icon_entry", "Generate icon XML for a custom icon.", {
    iconId: z.string(),
    iconPath: z.string().describe("Icon path in archive"),
    componentType: z.enum(["CUnit","CAbil","CBehavior","CUpgrade"]).optional().default("CUnit"),
    componentId: z.string().optional(),
  }, async ({ iconId, iconPath, componentType, componentId }) => {
    const L = ['<?xml version="1.0" encoding="utf-8"?>', "<Catalog>"];
    L.push('  <CIcon id="' + iconId + '">\n    <Icon value="' + iconPath + '"/>\n  </CIcon>');
    if (componentId) { L.push('  <' + componentType + ' id="' + componentId + '">\n    <Icon value="' + iconId + '"/>\n  </' + componentType + '>'); }
    L.push("</Catalog>");
    return { content: [{ type: "text" as const, text: L.join("\n") }] };
  });

  server.tool("asset_list", "List asset files in an SC2 archive.", {
    archivePath: z.string(),
    filter: z.enum(["all","models","textures","sounds","scripts","xml"]).optional().default("all"),
  }, async ({ archivePath, filter }) => {
    try {
      const zip = await JSZip.loadAsync(await readFile(archivePath));
      const pats: Record<string, RegExp> = { all: /.*/, models: /\.m3$/i, textures: /\.(dds|tga|png|jpg)$/i, sounds: /\.(ogg|wav|mp3)$/i, scripts: /\.galaxy$/i, xml: /\.xml$/i };
      const pat = pats[filter] || pats.all;
      const entries: string[] = [];
      zip.forEach((p, e) => { if (!e.dir && pat.test(p)) entries.push(p); });
      return { content: [{ type: "text" as const, text: entries.sort().join("\n") || "No matching files found." }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: "Error: " + String(e) }], isError: true as const };
    }
  });
}
