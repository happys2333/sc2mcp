/**
 * Data Editor XML Schema reference.
 */
export const dataXmlSchemaReference = `# SC2 Data Editor XML Schema

## Overview
SC2 Data Editor uses XML with a <Catalog> root element.
Each component has its own tag (<CUnit>, <CWeapon>, <CEffect>, etc.).

## Common Attributes
- **id** - Unique identifier
- **parent** - Parent entry to inherit from

## Core Component Types

### CUnit (Unit)
\`\`\`xml
<Catalog>
  <CUnit id="CustomMarine" parent="Marine">
    <LifeMax value="60.000000"/>
    <LifeArmor value="1.000000"/>
    <Speed value="3.500000"/>
    <SightRange value="11.000000"/>
    <Food value="2.000000"/>
    <WeaponArray Link="CustomMarineWeapon"/>
    <AbilArray Link="CustomMarineAbility"/>
  </CUnit>
</Catalog>
\`\`\`

### CWeapon (Weapon)
\`\`\`xml
<CWeapon id="CustomMarineWeapon" parent="Marine">
  <DisplayEffect Link="CustomMarineDamage"/>
  <Range value="6.000000"/>
  <Period value="0.860800"/>
</CWeapon>
\`\`\`

### CEffect Family
Subtypes: CEffectDamage, CEffectCreatePersistent, CEffectLaunchMissile, CEffectModifyUnit, CEffectSet, CEffectEnumArea
\`\`\`xml
<CEffectDamage id="CustomMarineDamage" parent="Marine">
  <Amount value="8.000000"/>
  <Kind value="Ranged"/>
  <AttributeBonus Attribute="Light" value="2.000000"/>
</CEffectDamage>
\`\`\`

### CAbil Family
Subtypes: CAbilEffectTarget, CAbilTrain, CAbilBuild, CAbilMorph, CAbilRevive
\`\`\`xml
<CAbilEffectTarget id="CustomStimpack">
  <Cost Resource="Energy" value="25.000000"/>
  <CastIntroTime value="0.000000"/>
  <Effect Link="StimpackApplyBehavior"/>
</CAbilEffectTarget>
\`\`\`

### CBehavior Family
Subtypes: CBehaviorBuff, CBehaviorCategory, CBehaviorVeterancy, CBehaviorResource
\`\`\`xml
<CBehaviorBuff id="StimBuff">
  <Duration value="15.000000"/>
  <Period value="0.000000"/>
  <ModificationArray>
    <Mod Speed="1.500000" Period="0.500000"/>
  </ModificationArray>
</CBehaviorBuff>
\`\`\`

### CUpgrade
\`\`\`xml
<CUpgrade id="CustomWeaponUpgrade">
  <MaxLevel value="3"/>
  <ModificationArray>
    <Mod Level="1" Weapon="CustomMarineWeapon" Field="Amount" Value="1.000000"/>
  </ModificationArray>
</CUpgrade>
\`\`\`

### CValidator
Validators check conditions before effects/abilities.
Subtypes: CValidatorUnitCompareField, CValidatorCombine, CValidatorLocationEnum

### CActor Family
Actors control visual/audio representation.
Subtypes: CActorUnit, CActorAction, CActorModel, CActorSound

## Value Modifiers
- **value** - Set absolute value
- **Operation** - Set/Add/Multiply/Divide

## Links
References use Link attribute:
\`\`\`xml
<WeaponArray Link="WeaponID"/>
<Effect Link="EffectID"/>
\`\`\`

## Cost Resources
\`\`\`xml
<CostResource Minerals="50.000000" Vespene="0.000000"/>
<CostResource Time="18.000000"/>
\`\`\`
`;
