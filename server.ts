import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

app.use(express.json({ limit: "10mb" }));

// System instructions for MCreator 2026.1 + NeoForge 1.21.1 Java to Blockly conversion
const MCREATOR_SYSTEM_INSTRUCTION = `You are an expert MCreator 2026.1+ and Minecraft NeoForge 1.21.1+ mod development assistant.
Your task is to analyze Java code (event listeners, procedural methods, conditionals, math, entity/world interactions) and translate it into valid MCreator 2026.1 Blockly XML procedure structure and a visual AST representation.

Target Environment:
- MCreator 2026.1+
- NeoForge 1.21.1+

MCreator Blockly XML Specs:
- Root element: <xml xmlns="https://developers.google.com/blockly/xml">
- Root trigger block: <block type="event_trigger" deletable="false" x="40" y="40"><field name="trigger">EVENT_TRIGGER_NAME</field><next>...</next></block>
- Valid Event Triggers for MCreator 2026.1:
  - no_ext_trigger (for manual static procedures)
  - player_ticks
  - entity_attacked
  - block_break
  - right_clicked_item
  - entity_spawns
  - player_joins
  - craft_item
  - explosion_occurs
  - block_right_clicked
  - entity_ticks
  - entity_dies

Common MCreator Blockly Blocks:
1. Controls / Flow:
   - controls_if (<value name="IF0">...</value><statement name="DO0">...</statement>)
   - controls_repeat_ext (<value name="TIMES">...</value><statement name="DO">...</statement>)
   - controls_whileUntil (<field name="MODE">WHILE</field><value name="BOOL">...</value><statement name="DO">...</statement>)
2. Logic & Math:
   - logic_binary (<field name="OP">AND</field> or OR)
   - logic_compare (<field name="OP">EQ</field>, NEQ, LT, LTE, GT, GTE)
   - logic_boolean (<field name="BOOL">TRUE</field> or FALSE)
   - logic_negate
   - math_binary (<field name="OP">ADD</field>, MINUS, MULTIPLY, DIVIDE)
   - math_number (<field name="NUM">10</field>)
   - math_java_constants (<field name="CONSTANT">RANDOM</field>)
3. Entity Actions:
   - entity_send_chat (<value name="text"><block type="text">...</block></value><value name="actbar"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value><value name="entity"><block type="entity_from_deps"></block></value>)
   - deal_damage (<value name="amount">...</value><value name="entity">...</value><value name="damagesource">...</value>)
   - entity_add_potion (<field name="potion">regeneration</field><value name="level">...</value><value name="duration">...</value><value name="entity">...</value>)
   - entity_set_health (<value name="health">...</value><value name="entity">...</value>)
   - entity_from_deps
   - source_entity_from_deps
   - immediate_source_entity_from_deps
4. World & Coordinates:
   - coord_x, coord_y, coord_z
   - world_data_isremote (returns boolean)
   - world_send_chat
   - play_sound (<field name="sound">...</field><field name="soundcategory">ambient</field><value name="x">...</value><value name="y">...</value><value name="z">...</value><value name="level">...</value><value name="pitch">...</value>)
   - spawn_particle (<field name="particle">...</field><value name="x">...</value><value name="y">...</value><value name="z">...</value><value name="xs">...</value><value name="ys">...</value><value name="zs">...</value>)
   - block_add (<value name="block">...</value><value name="x">...</value><value name="y">...</value><value name="z">...</value>)
5. Variables:
   - variables_get_number, variables_set_number
   - variables_get_logic, variables_set_logic
   - variables_get_string, variables_set_string

Visual AST Format:
Return a recursive visual tree representing the generated Blockly blocks:
- id: string
- type: string (e.g. "controls_if", "entity_send_chat")
- category: "event" | "control" | "logic" | "math" | "action" | "variable" | "world" | "entity"
- title: concise human-friendly label (e.g. "If [Condition]", "Send Chat Message")
- fields: key-value map of parameters (e.g. { OP: "EQ", NUM: "5" })
- values: array of input sockets [{ name: "IF0", block: {...} }]
- statements: array of statement bodies [{ name: "DO0", block: {...} }]
- next: pointer to the next statement block in flow sequence

You MUST format output as JSON following the requested schema.`;

app.post("/api/translate", async (req, res) => {
  try {
    const { code, targetEvent } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ error: "Java code input is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in settings/environment.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const userPrompt = `Translate the following Java code (NeoForge 1.21.1+ / MCreator 2026.1+) into MCreator procedure blocks.
User suggested target event trigger: "${targetEvent || 'auto'}"

Java Code:
\`\`\`java
${code}
\`\`\`

Return a valid JSON object strictly matching the following keys:
1. procedureName: string (e.g., "LifeStealProcedure")
2. eventTrigger: string (e.g., "entity_attacked", "player_ticks", "block_break", "right_clicked_item", or "no_ext_trigger")
3. dependencies: array of strings (e.g., ["entity", "x", "y", "z", "world", "itemstack"])
4. variables: array of variable objects [{ name: "healAmount", type: "number", initialValue: 0 }]
5. blocklyXml: valid MCreator 2026.1 Blockly XML string starting with <xml xmlns="https://developers.google.com/blockly/xml"> and containing <block type="event_trigger">
6. visualAST: root BlockASTNode matching { id, type, category, title, fields, values, statements, next }
7. translationBreakdown: array of [{ javaLine: string, mcreatorBlock: string, explanation: string }]
8. neoForgeCompatibilityNote: string explaining how NeoForge 1.21.1 API calls (e.g. Level, ServerLevel, LivingDamageEvent, Component) are handled in MCreator 2026.1 blocks
9. warnings: array of strings if any Java features cannot be directly represented as MCreator blocks`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction: MCREATOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "";
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      // Fallback clean if code blocks were returned
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error("Translation API error:", error);
    return res.status(500).json({
      error: error.message || "Failed to translate Java code into MCreator blocks.",
    });
  }
});

// XML validation endpoint
app.post("/api/validate-xml", (req, res) => {
  const { xml } = req.body;
  if (!xml || typeof xml !== "string") {
    return res.status(400).json({ valid: false, message: "No XML content provided" });
  }

  const hasXmlTag = xml.includes("<xml");
  const hasTrigger = xml.includes('type="event_trigger"');
  const isClosed = xml.includes("</xml>");

  if (hasXmlTag && hasTrigger && isClosed) {
    return res.json({
      valid: true,
      message: "Valid MCreator 2026.1 Blockly XML procedure structure.",
    });
  } else {
    return res.json({
      valid: false,
      message: "XML missing standard MCreator root tags or event_trigger block.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
