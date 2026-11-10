# MCreator Java to Block Translator

A high-performance AST compilation engine and visual procedure translator designed for Minecraft modders. It converts raw Minecraft Java source code (NeoForge 1.21.1+ / 26.3+) directly into authentic MCreator 2026.1+ Blockly visual blocks and exportable XML templates (`.ptpl`, `.aitpl`, `.cmdtpl`, `.ftpl`).

---

## Key Features

- **1:1 AST Mapping Engine**: Converts complex NeoForge Java constructs—including entity tag checks (`TagKey.create`), world difficulty comparisons, spatial cube iterations (`getEntitiesOfClass(...).inflate(...)`), persistent NBT tag modifications (`putDouble`, `putBoolean`, `putString`), and custom code snippets—into native MCreator 2026.1 procedure block structures.
- **Authentic MCreator Blockly UI**: Features pixel-accurate visual block rendering with exact MCreator color themes, puzzle notches, C-block cavities, inline getter pills, and real-time procedure warning/error strips.
- **Multi-Element Template Support**: Translates procedures (`.ptpl`), custom AI tasks (`.aitpl`), command templates (`.cmdtpl`), and feature placement templates (`.ftpl`).
- **FreeMarker Pattern Synchronization**: Derived directly from the official MCreator repository FreeMarker templates (`neoforge-1.21.1` and `neoforge-26.3`), guaranteeing 100% compatibility when importing `.ptpl` XML files back into MCreator.

---

## Technical Architecture

1. **Parser & Lexer (`src/lib/mcreatorConverter.ts`)**: Fast token-based AST generator that identifies method entrypoints (`execute(...)` and `@SubscribeEvent` listeners), unifies variable scopes, extracts spatial bounding boxes (`new AABB(_center, _center).inflate(r / 2d)`), and constructs structured `BlockASTNode` graphs.
2. **Blockly XML Generator**: Converts `BlockASTNode` graphs into standardized MCreator Blockly XML specifications, adhering to `xml.xml` element hierarchies and variable declarations (`local:var_name`).
3. **Canvas Renderer (`src/components/VisualBlockCanvas.tsx`)**: Virtualized React canvas rendering Blockly blocks, puzzle connections, nested DO/ELSE cavities, dropdown fields, and custom code snippet sockets (`#7b5ba5`).
