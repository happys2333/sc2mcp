import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function generateUnitPipeline(cfg) {
  const L = [];
  L.push('<?xml version="1.0" encoding="utf-8"?>');
  L.push("<Catalog>");
  L.push('  <CUnit id="' + cfg.unitId + '"' + (cfg.parentId ? ' parent="' + cfg.parentId + '"' : "") + ">");
  L.push('    <Name value="' + cfg.name + '"/>');
  L.push('    <Race value="' + cfg.race + '"/>');
  L.push('    <LifeMax value="' + cfg.life.toFixed(1) + '"/>');
  L.push('    <LifeArmor value="' + cfg.armor.toFixed(1) + '"/>');
  if (cfg.shields > 0) { L.push('    <ShieldsMax value="' + cfg.shields.toFixed(1) + '"/>'); }
  L.push('    <Speed value="' + cfg.speed.toFixed(3) + '"/>');
  L.push('    <SightRange value="' + cfg.sightRange.toFixed(1) + '"/>');
  L.push('    <Food value="' + cfg.food.toFixed(1) + '"/>');
  L.push('    <WeaponArray Link="' + cfg.weaponId + '"/>');
  if (cfg.abilities) { for (const a of cfg.abilities) L.push('    <AbilArray Link="' + a + '"/>'); }
  if (cfg.behaviors) { for (const b of cfg.behaviors) L.push('    <BehaviorArray Link="' + b + '"/>'); }
  L.push('    <CostResource Minerals="' + cfg.minerals.toFixed(1) + '" Vespene="' + cfg.vespene.toFixed(1) + '"/>');
  L.push('    <CostResource Time="' + cfg.buildTime.toFixed(1) + '"/>');
  L.push("  </CUnit>");
  L.push('  <CWeapon id="' + cfg.weaponId + '">');
  L.push('    <DisplayEffect Link="' + cfg.weaponId + 'Damage"/>');
  L.push('    <Range value="' + cfg.weaponRange.toFixed(1) + '"/>');
  L.push('    <Period value="' + cfg.weaponPeriod.toFixed(4) + '"/>');
  L.push("  </CWeapon>");
  L.push('  <CEffectDamage id="' + cfg.weaponId + 'Damage">');
  L.push('    <Amount value="' + cfg.weaponDamage.toFixed(1) + '"/>');
  L.push("  </CEffectDamage>");
  L.push("</Catalog>");
  return L.join("\n");
}

export function registerUnitTools(server) {
  server.tool("unit_create_full", "Create a complete unit with weapon and damage effect.", {
    unitId: z.string().describe("Unit ID (e.g. CustomZealot)"),
    parentId: z.string().optional(),
    name: z.string().describe("Display name"),
    race: z.enum(["Terran","Protoss","Zerg"]),
    life: z.number(),
    armor: z.number().optional().default(0),
    shields: z.number().optional().default(0),
    speed: z.number().optional().default(2.25),
    sightRange: z.number().optional().default(11),
    food: z.number().optional().default(2),
    minerals: z.number().optional().default(50),
    vespene: z.number().optional().default(0),
    buildTime: z.number().optional().default(18),
    weaponDamage: z.number().optional().default(6),
    weaponRange: z.number().optional().default(5),
    weaponPeriod: z.number().optional().default(0.86),
    abilities: z.array(z.string()).optional().default([]),
    behaviors: z.array(z.string()).optional().default([]),
  }, async (params) => {
    const cfg = { ...params, weaponId: params.unitId + "Weapon" };
    const xml = generateUnitPipeline(cfg);
    return { content: [{ type: "text", text: "=== Unit Pipeline: " + params.unitId + " ===\n\n" + xml + "\n\nWrite to Base.SC2Data/GameData/UnitData.xml" }] };
  });

  server.tool("unit_modify", "Generate XML override for an existing unit.", {
    unitId: z.string().describe("Unit ID to modify"),
    fields: z.record(z.string(), z.string()).describe("Fields to override (e.g. {LifeMax: 200})"),
  }, async ({ unitId, fields }) => {
    const L = ['<CUnit id="' + unitId + '">'];
    for (const [k, v] of Object.entries(fields)) L.push('  <' + k + ' value="' + v + '"/>');
    L.push("</CUnit>");
    return { content: [{ type: "text", text: L.join("\n") }] };
  });

  server.tool("unit_generate_ability", "Generate ability XML (CAbil + CEffect).", {
    abilityId: z.string(),
    abilityType: z.enum(["EffectTarget","EffectInstant","Train","Build","Morph"]),
    name: z.string(),
    costEnergy: z.number().optional().default(0),
    cooldown: z.number().optional().default(0),
    range: z.number().optional().default(0),
    effectAmount: z.number().optional().default(0),
  }, async ({ abilityId, abilityType, name, costEnergy, cooldown, range, effectAmount }) => {
    const L = ['<?xml version="1.0" encoding="utf-8"?>', "<Catalog>"];
    L.push('  <CAbil' + abilityType + ' id="' + abilityId + '">');
    L.push('    <Name value="' + name + '"/>');
    if (costEnergy > 0) L.push('    <Cost Resource="Energy" value="' + costEnergy + '"/>');
    if (cooldown > 0) L.push('    <Cooldown TimeUse="' + cooldown + '"/>');
    if (range > 0) L.push('    <Range value="' + range + '"/>');
    L.push('    <Effect Link="' + abilityId + 'Effect"/>');
    L.push("  </CAbil" + abilityType + ">");
    L.push('  <CEffectDamage id="' + abilityId + 'Effect">');
    L.push('    <Amount value="' + effectAmount + '"/>');
    L.push("  </CEffectDamage>");
    L.push("</Catalog>");
    return { content: [{ type: "text", text: L.join("\n") }] };
  });

  server.tool("unit_generate_behavior", "Generate behavior/buff XML.", {
    behaviorId: z.string(),
    name: z.string(),
    duration: z.number().optional().default(0),
    speedMult: z.number().optional().default(1),
    damageMult: z.number().optional().default(1),
    armorAdd: z.number().optional().default(0),
  }, async ({ behaviorId, name, duration, speedMult, damageMult, armorAdd }) => {
    const L = ['<?xml version="1.0" encoding="utf-8"?>', "<Catalog>"];
    L.push('  <CBehaviorBuff id="' + behaviorId + '">');
    L.push('    <Name value="' + name + '"/>');
    if (duration > 0) L.push('    <Duration value="' + duration + '"/>');
    L.push("    <ModificationArray>");
    const mods = [];
    if (speedMult !== 1) mods.push('Speed="' + speedMult + '"');
    if (damageMult !== 1) mods.push('DamageDealt="' + damageMult + '"');
    if (armorAdd !== 0) mods.push('ArmorBonus="' + armorAdd + '"');
    L.push("      <Mod " + (mods.length ? mods.join(" ") : "/") + ">");
    L.push("    </ModificationArray>");
    L.push("  </CBehaviorBuff>");
    L.push("</Catalog>");
    return { content: [{ type: "text", text: L.join("\n") }] };
  });
}
