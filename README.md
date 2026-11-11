# MCreator Java to Block Translator

A specialized AST compiler and visual procedure converter for Minecraft mod developers. It translates raw Minecraft Java source code (NeoForge 1.21.1+ / 26.3+) directly into authentic MCreator 2026.1+ Blockly visual blocks and exportable XML element templates (`.ptpl`, `.aitpl`, `.cmdtpl`, `.ftpl`).

---

## What Does This App Do?

Writing custom Minecraft procedures, commands, and AI tasks in Java often requires translating that logic back into MCreator for team workflows or visual maintenance. This application bridges that gap:

1. **Automatic Java Code Parsing**: Paste any Minecraft NeoForge Java method, event listener (`@SubscribeEvent`), command handler, or helper procedure.
2. **Auto-Detected Event Triggers**: Automatically identifies which event listener triggers the code (e.g., `PlayerTickEvent`, `LivingDamageEvent`, `BlockEvent.BreakEvent`, `EntityJoinLevelEvent`, and 100+ global MCreator triggers) without requiring manual configuration.
3. **Interactive MCreator Blockly Canvas**: Renders the translated code as pixel-accurate MCreator 2026.1 visual Blockly blocks featuring authentic category colors, notches, C-block cavities, and inline arguments.
4. **Exportable Templates**: Generates valid MCreator Blockly XML ready for direct export into `.ptpl` (Procedure Template), `.aitpl` (Entity AI Task), `.cmdtpl` (Command Template), or `.ftpl` (Feature Template) files for immediate import into MCreator workspaces.
5. **AST Line Mapping**: Inspect an interactive line-by-line breakdown mapping each Java expression directly to its corresponding MCreator Blockly block ID and parameters.

---

## What Is It For?

- **Minecraft Modders & MCreator Users**: Quickly convert custom written Java algorithms into visual Blockly procedures that can be shared, edited, and imported directly into MCreator.
- **Porting & Reverse Engineering**: Analyze existing mod source code and convert its event triggers, conditionals, math routines, inventory manipulations, and entity logic into clean MCreator procedure blocks.
- **Learning & Compatibility**: Understand how modern NeoForge 1.21.1+ constructs (such as `DataComponents`, `ResourceKey`, `LevelAccessor`, item capabilities, and modern damage sources) map to MCreator 2026.1 blockly abstractions.
