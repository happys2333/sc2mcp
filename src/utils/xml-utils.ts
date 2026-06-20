/**
 * XML utilities for parsing and generating SC2 Data Editor XML.
 */
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseAttributeValue: true,
  trimValues: true,
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressBooleanAttributes: false,
};

export function parseSC2Xml(xmlString: string): Record<string, unknown> {
  const parser = new XMLParser(parserOptions);
  return parser.parse(xmlString) as Record<string, unknown>;
}

export function buildSC2Xml(data: Record<string, unknown>): string {
  const builder = new XMLBuilder(builderOptions);
  return '<?xml version="1.0" encoding="utf-8"?>\n' + builder.build(data);
}

export const COMPONENT_FIELD_MAP: Record<string, string[]> = {
  CUnit: [
    'Name', 'Race', 'LifeMax', 'LifeArmor', 'ShieldsMax', 'ShieldArmor',
    'EnergyMax', 'Speed', 'Acceleration', 'Deceleration', 'TurningRate',
    'SightRange', 'WeaponArray', 'AbilArray', 'BehaviorArray',
    'CostResource', 'ScoreValue', 'Food',
  ],
  CAbil: ['Name', 'Cost', 'Range', 'CastIntroTime', 'CastOutroTime', 'Duration', 'Cooldown', 'InfoArray'],
  CAbilEffectTarget: ['Name', 'Cost', 'Range', 'CastIntroTime', 'Effect'],
  CAbilTrain: ['Name', 'InfoArray', 'Cost', 'Time'],
  CAbilBuild: ['Name', 'InfoArray', 'Cost', 'Time'],
  CEffect: ['Name', 'Amount', 'RandomPointMin', 'RandomPointMax', 'PeriodCount', 'PeriodDur', 'SearchFilters', 'SearchAreaArray'],
  CEffectDamage: ['Name', 'Amount', 'Kind', 'AttributeBonus', 'Random'],
  CEffectCreatePersistent: ['Name', 'PeriodCount', 'PeriodDur', 'PeriodEffect'],
  CEffectLaunchMissile: ['Name', 'ImpactEffect', 'LaunchEffect', 'Movers'],
  CWeapon: ['Name', 'DisplayEffect', 'Range', 'Period', 'MinScanRange', 'MaxScanRange', 'Options'],
  CBehavior: ['Name', 'Duration', 'Period', 'BuffDuration', 'Modifications'],
  CBehaviorBuff: ['Name', 'Duration', 'Period', 'ModificationArray'],
  CValidator: ['Name', 'ValidatorArray'],
  CUpgrade: ['Name', 'MaxLevel', 'Modifications'],
  CRace: ['Name', 'AttributeId'],
  CItem: ['Name', 'Cost', 'Description'],
  CSkin: ['Name', 'UnitLink', 'VariationArray'],
  CModel: ['Name', 'Model', 'Scale', 'Rotation'],
  CActor: ['Name', 'HostSiteOps'],
  CAlert: ['Name', 'Text', 'Icon'],
  CDoodad: ['Name', 'Model', 'Footprint'],
  CSound: ['Name', 'Sound', 'Volume'],
  CTerrain: ['Name', 'TextureSets'],
  CPathing: ['Name'],
  CFootprint: ['Name', 'Shapes'],
  CHero: ['Name', 'AbilArray', 'AttributeArray'],
  CEffectMorph: ['Name', 'MorphUnit'],
};

export function generateCatalogSkeleton(componentType: string, id: string, parentId?: string): string {
  const parentAttr = parentId ? ` parent="${parentId}"` : '';
  return `<Catalog>\n  <${componentType} id="${id}"${parentAttr}>\n  </${componentType}>\n</Catalog>`;
}
