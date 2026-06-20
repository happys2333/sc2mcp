/**
 * Galaxy language types and keywords reference.
 */
export const galaxyTypesReference = `# Galaxy Types Reference

## Primitive Types
- **int** - 32-bit signed integer
- **fixed** - 32-bit fixed-point number (16.16)
- **string** - Null-terminated character string
- **bool** - Boolean (true/false)
- **void** - No return value
- **byte** - 8-bit unsigned integer
- **char** - 8-bit character
- **text** - Localized text (multi-language)

## Game Object Types
- **unit** - A game unit reference
- **unitgroup** - A group of units
- **player** - A player reference
- **playergroup** - A group of players
- **doodad** - A doodad/decoration object
- **order** - An order for a unit
- **timer** - A timer object
- **trigger** - A trigger object
- **dialog** - A UI dialog window
- **dialogcontrol** - A UI control inside a dialog
- **region** - Named region on the map
- **point** - 3D point (x, y, z)
- **rect** - Rectangle defined by two points
- **marker** - A marker on the map
- **camera** - Camera controller
- **sound** - A sound reference

## Type Modifiers
- **const** - Constant value
- **static** - Static variable (persists across function calls)
- **persistent** - Persists across game saves (global only)

## Arrays
\`\`\`galaxy
int[] myArray;       // Dynamic array
int[10] myFixedArr;  // Fixed-size array
\`\`\`

## Structs
\`\`\`galaxy
struct TMyStruct {
    int x;
    int y;
    string name;
};
\`\`\`

## Enums
\`\`\`galaxy
enum EMyEnum {
    c_enumValue0,
    c_enumValue1,
    c_enumValue2
};
\`\`\`

## Type Casting
- Implicit: int -> fixed (safe)
- Explicit: IntToFixed(int), FixedToInt(fixed), IntToString(int), StringToInt(string), StringToFixed(string)
`;

export const galaxyKeywords = [
  "if", "else", "for", "while", "do", "switch", "case", "default",
  "break", "continue", "return", "const", "static", "persistent",
  "true", "false", "null", "struct", "enum", "typedef",
  "include", "include_once", "auto",
];

export const galaxyTypes = [
  "int", "fixed", "string", "bool", "void",
  "byte", "char", "text",
  "point", "region", "rect",
  "unit", "unitgroup", "player", "playergroup",
  "doodad", "order", "timer", "trigger",
  "dialog", "dialogcontrol", "camera", "marker",
  "sound",
];
