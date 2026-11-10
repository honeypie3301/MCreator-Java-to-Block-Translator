import {
  BlockASTNode,
  BlockCategory,
  DetectedMethod,
  MCreatorElementType,
  NeoForgeVersion,
  TranslationBreakdownItem,
  TranslationResult,
  VariableDecl,
} from '../types';
import { ELEMENT_CONFIGS } from '../data/mcreatorBlocksDatabase';

export const GLOBAL_TRIGGERS: Record<string, string> = {
  no_ext_trigger: 'No additional trigger',
  player_ticks: 'On player tick update',
  entity_ticks: 'On entity tick update',
  world_ticks: 'On world tick update',
  entity_attacked: 'When entity is attacked',
  block_break: 'When block is broken',
  right_clicked_item: 'When right clicked with item',
  right_clicked_block: 'When right clicked on block',
  entity_spawns: 'When entity spawns',
  entity_dies: 'When entity dies',
  player_joins: 'When player logs in',
  player_useitem_finish: 'When player finishes using item',
  craft_item: 'When item is crafted',
  explosion_occurs: 'When explosion occurs',
  entity_dimension_changed: 'When entity changes dimension',
};

export function translateJavaToMCreator(
  code: string,
  elementType: MCreatorElementType = 'procedure',
  neoForgeVersion: NeoForgeVersion = '1.21.1',
  userEventOverride?: string,
  selectedMethodName?: string
): TranslationResult {
  const elementConfig = ELEMENT_CONFIGS[elementType] || ELEMENT_CONFIGS.procedure;
  const warnings: string[] = [];
  const breakdown: { javaLine: string; mcreatorBlock: string; explanation: string }[] = [];
  const variables: VariableDecl[] = [];
  const dependencies = new Set<string>();

  // 1. Extract all methods from the Java class (robustly with balanced braces and comments removed)
  const detectedMethods = extractClassMethods(code);

  let activeMethodName = selectedMethodName;
  let activeBody = '';
  let activeMethod: DetectedMethod | undefined;

  // Find candidate execute methods that contain real logic (not just 1-line delegators)
  const executeMethods = detectedMethods.filter(m => m.name === 'execute');
  const realExecuteMethod = executeMethods.length > 0
    ? [...executeMethods].sort((a, b) => b.body.length - a.body.length)[0]
    : undefined;

  let bridgeTrigger: string | undefined;

  if (detectedMethods.length > 0) {
    if (activeMethodName) {
      activeMethod = detectedMethods.find(m => m.signature === activeMethodName || m.name === activeMethodName);
    }

    // Check if the selected method is merely an MCreator event bridge or delegator calling execute(...)
    // e.g. "onPlayerTick" that only contains "execute(event, event.getEntity());" or "execute(null, entity);"
    const isDelegator = activeMethod && (
      /^execute\s*\([\s\S]*?\);?$/.test(activeMethod.body.trim().replace(/\/\/.*$/gm, '').trim())
    );

    if (isDelegator && realExecuteMethod && realExecuteMethod.body.length > activeMethod.body.length) {
      // Inherit the event trigger from the subscriber method if it had one
      if (activeMethod.eventTrigger) {
        bridgeTrigger = activeMethod.eventTrigger;
      }
      activeMethod = realExecuteMethod;
    }

    if (!activeMethod) {
      if (realExecuteMethod && realExecuteMethod.body.length > 20) {
        activeMethod = realExecuteMethod;
      } else {
        // Prioritize method with largest body
        activeMethod = [...detectedMethods].sort((a, b) => b.body.length - a.body.length)[0];
      }
    }

    if (activeMethod) {
      activeMethodName = activeMethod.signature;
      activeBody = activeMethod.body;
    }
  }

  if (!activeBody) {
    activeBody = extractFallbackMethodBody(code);
    activeMethodName = activeMethodName || 'execute';
  }

  // 2. Detect Event Listener & Dependencies from Java code and active method
  let detectedEventTrigger = userEventOverride && userEventOverride !== 'auto'
    ? userEventOverride
    : 'no_ext_trigger';

  if (elementType === 'procedure') {
    if (bridgeTrigger && (!userEventOverride || userEventOverride === 'auto')) {
      detectedEventTrigger = bridgeTrigger;
    } else if (activeMethod?.eventTrigger && (!userEventOverride || userEventOverride === 'auto')) {
      detectedEventTrigger = activeMethod.eventTrigger;
    } else if (code.includes('PlayerTickEvent') || code.includes('onPlayerTick') || code.includes('player_ticks')) {
      detectedEventTrigger = 'player_ticks';
    } else if (code.includes('LivingDamageEvent') || code.includes('LivingIncomingDamageEvent') || code.includes('entity_attacked')) {
      detectedEventTrigger = 'entity_attacked';
    } else if (code.includes('BlockEvent.BreakEvent') || code.includes('block_break')) {
      detectedEventTrigger = 'block_break';
    } else if (code.includes('PlayerInteractEvent') || code.includes('right_clicked_item')) {
      detectedEventTrigger = 'right_clicked_item';
    } else if (code.includes('EntityJoinLevelEvent') || code.includes('entity_spawns')) {
      detectedEventTrigger = 'entity_spawns';
    } else if (code.includes('LivingDeathEvent') || code.includes('entity_dies')) {
      detectedEventTrigger = 'entity_dies';
    }

    // Populate dependencies based on trigger and code references
    if (code.includes('LevelAccessor') || code.includes('world') || code.includes('level')) {
      dependencies.add('world');
    }
    if (code.includes('double x') || code.includes('double y') || code.includes('double z') || code.includes('x, y, z')) {
      dependencies.add('x');
      dependencies.add('y');
      dependencies.add('z');
    }
    if (code.includes('Entity entity') || code.includes('entity') || code.includes('LivingEntity')) {
      dependencies.add('entity');
    }
    if (detectedEventTrigger === 'entity_attacked') {
      dependencies.add('entity');
      dependencies.add('sourceentity');
      dependencies.add('amount');
      dependencies.add('damagesource');
      dependencies.add('world');
    } else if (detectedEventTrigger === 'block_break') {
      dependencies.add('blockstate');
      dependencies.add('world');
    } else if (detectedEventTrigger === 'right_clicked_item') {
      dependencies.add('itemstack');
    }
  } else if (elementType === 'ai_task') {
    detectedEventTrigger = 'aitask_wrapper';
    dependencies.add('entity');
  } else if (elementType === 'command') {
    detectedEventTrigger = 'command_trigger';
    dependencies.add('entity');
    dependencies.add('x');
    dependencies.add('y');
    dependencies.add('z');
    dependencies.add('world');
  } else if (elementType === 'feature') {
    detectedEventTrigger = 'feature_container';
    dependencies.add('x');
    dependencies.add('y');
    dependencies.add('z');
    dependencies.add('world');
  }

  // 3. Create Root Node
  let rootNode: BlockASTNode;
  if (elementType === 'procedure') {
    rootNode = {
      id: 'root_trigger',
      type: 'event_trigger',
      category: 'event',
      title: 'Event trigger',
      fields: { trigger: detectedEventTrigger },
    };
  } else if (elementType === 'ai_task') {
    rootNode = {
      id: 'root_ai',
      type: 'aitask_wrapper',
      category: 'ai',
      title: 'Entity AI Task Container',
      statements: [],
    };
  } else if (elementType === 'command') {
    rootNode = {
      id: 'root_cmd',
      type: 'command_trigger',
      category: 'command',
      title: 'Mod Command Listener',
      fields: { command_name: 'customcommand' },
      statements: [],
    };
  } else {
    rootNode = {
      id: 'root_feat',
      type: 'feature_container',
      category: 'feature',
      title: 'Worldgen Feature Root',
      statements: [],
    };
  }

  // 4. Parse statements into structurally faithful AST nodes
  let bodyBaseLine = 1;
  if (activeMethod?.bodyStartLine) {
    bodyBaseLine = activeMethod.bodyStartLine;
  } else {
    const bodyIndex = code.indexOf(activeBody);
    if (bodyIndex !== -1) {
      bodyBaseLine = code.substring(0, bodyIndex).split('\n').length;
    }
  }

  const rawStatementsWithLoc = splitStatementsWithLocations(activeBody, bodyBaseLine);
  const statementsWithLoc: StatementWithLocation[] = [];

  for (let idx = 0; idx < rawStatementsWithLoc.length; idx++) {
    const stmtObj = rawStatementsWithLoc[idx];
    const s = stmtObj.text.trim();

    // Skip MCreator preamble null-guard clauses (e.g. if (entity == null) return; or if (entity == null) return false; etc.)
    const isNullGuard =
      /^if\s*\((?:\s*(?:entity|world|level|_level|sourceentity|immediatesourceentity|itemstack|blockstate|null)\s*==\s*null\s*(?:\|\|\s*)?)+\)\s*(?:return(?:\s+(?:false|true|null|0))?;|\{\s*return(?:\s+(?:false|true|null|0))?;\s*\})$/.test(s) ||
      /^if\s*\((?:entity|world|level|_level|sourceentity)\s*==\s*null\)/.test(s);

    if (isNullGuard) {
      if (s.includes('entity')) dependencies.add('entity');
      if (s.includes('sourceentity')) dependencies.add('sourceentity');
      if (s.includes('immediatesourceentity')) dependencies.add('immediatesourceentity');
      if (s.includes('world') || s.includes('level')) dependencies.add('world');
      if (s.includes('itemstack')) dependencies.add('itemstack');
      if (s.includes('blockstate')) dependencies.add('blockstate');
      continue;
    }

    // Check for MCreator local variable initial declaration e.g. "double slot = 0;"
    const varDeclMatch = s.match(/^(?:double|float|int|long|boolean|String|ItemStack)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);?$/);
    if (varDeclMatch) {
      const vName = varDeclMatch[1];
      const vTypeStr = s.split(/\s+/)[0];
      const vInitial = varDeclMatch[2].trim();

      let vType: VariableDecl['type'] = 'number';
      if (vTypeStr === 'boolean') vType = 'logic';
      else if (vTypeStr === 'String') vType = 'string';
      else if (vTypeStr === 'ItemStack') vType = 'itemstack';

      if (!variables.some(v => v.name === vName)) {
        variables.push({ name: vName, type: vType, initialValue: vInitial });
      }

      // If a subsequent statement in this procedure re-assigns or sets this variable,
      // skip the declaration line so only the explicit setter or logic block is visually placed.
      const hasSubsequentAssignment = rawStatementsWithLoc.slice(idx + 1).some(sub => {
        return sub.text.includes(`${vName} =`) || sub.text.includes(`${vName}=`);
      });

      if (hasSubsequentAssignment) {
        continue;
      }
    }

    statementsWithLoc.push(stmtObj);
  }

  let idCounter = 1;
  const nodes: BlockASTNode[] = [];

  for (const stmtObj of statementsWithLoc) {
    const parsed = parseJavaStatement(
      stmtObj.text,
      idCounter++,
      variables,
      breakdown,
      elementType,
      stmtObj.startLine,
      stmtObj.endLine
    );
    if (parsed) {
      nodes.push(parsed);
    }
  }

  // Connect nodes linearly or in statements
  if (elementType === 'ai_task') {
    rootNode.statements = [{ name: 'tasks', block: nodes.length > 0 ? chainNodes(nodes) : undefined }];
  } else if (nodes.length > 0) {
    rootNode.next = chainNodes(nodes);
  } else {
    rootNode.next = {
      id: 'default_exec',
      type: 'custom_code_snippet',
      category: 'code',
      title: 'Custom code snippet',
      fields: { CODE: '// Verbatim Java logic' },
    };
  }

  // 5. Generate Valid Blockly XML
  const blocklyXml = generateBlocklyXmlFromAST(rootNode, elementConfig.extension, detectedEventTrigger, variables);

  // 6. Version Info
  const neoForgeVersionNotes = getNeoForgeVersionInfo(neoForgeVersion);

  return {
    procedureName: extractProcedureClassName(code) || 'ParanoiaAudioLogic',
    elementType,
    fileExtension: elementConfig.extension,
    targetNeoForgeVersion: neoForgeVersion,
    eventTrigger: detectedEventTrigger,
    dependencies: Array.from(dependencies),
    variables,
    blocklyXml,
    visualAST: rootNode,
    translationBreakdown: breakdown,
    neoForgeVersionNotes,
    matchedBlocksCount: countTotalBlocks(rootNode),
    warnings,
    detectedMethods: detectedMethods.length > 0 ? detectedMethods : undefined,
    activeMethodName,
  };
}

/* -------------------------------------------------------------------------- */
/*                       Statement Extractor & Parser                         */
/* -------------------------------------------------------------------------- */

export interface StatementWithLocation {
  text: string;
  startLine: number;
  endLine: number;
}

/**
 * Robustly extracts all class methods, balancing braces and safely ignoring comments and strings.
 */
export function extractClassMethods(code: string): DetectedMethod[] {
  const classIdx = code.search(/\bclass\s+[A-Za-z0-9_]+/);
  if (classIdx === -1) return [];
  const classBrace = code.indexOf('{', classIdx);
  if (classBrace === -1) return [];

  const methods: DetectedMethod[] = [];
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let i = classBrace + 1;
  let headerBuffer = '';
  let headerStartChar = i;

  while (i < code.length) {
    const ch = code[i];
    const nextCh = i + 1 < code.length ? code[i + 1] : '';

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && nextCh === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (!inString && ch === '/' && nextCh === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (!inString && ch === '/' && nextCh === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (!inString && (ch === '"' || ch === "'")) {
      inString = true;
      stringChar = ch;
    } else if (inString && ch === stringChar && code[i - 1] !== '\\') {
      inString = false;
    } else if (!inString) {
      if (ch === '{') {
        if (depth === 0) {
          const header = headerBuffer.trim();
          const methodMatch = header.match(/(?:@SubscribeEvent\s+)?(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(?:void|[a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)$/);
          if (methodMatch) {
            const mName = methodMatch[1];
            const mParams = methodMatch[2].trim();
            let eventTrigger: string | undefined;
            if (header.includes('LivingIncomingDamageEvent') || header.includes('LivingDamageEvent')) {
              eventTrigger = 'entity_attacked';
            } else if (header.includes('EntityTickEvent')) {
              eventTrigger = 'entity_ticks';
            } else if (header.includes('PlayerTickEvent')) {
              eventTrigger = 'player_ticks';
            } else if (header.includes('LivingDeathEvent')) {
              eventTrigger = 'entity_dies';
            } else if (header.includes('BlockEvent.BreakEvent')) {
              eventTrigger = 'block_break';
            }

            const startLine = code.substring(0, headerStartChar).split('\n').length;
            const bodyStartLine = code.substring(0, i + 1).split('\n').length;

            methods.push({
              name: mName,
              signature: `${mName}(${mParams})`,
              params: mParams,
              header: methodMatch[0].trim(),
              bodyStart: i + 1,
              startLine,
              bodyStartLine,
              eventTrigger,
              isMainProcedure: mName === 'execute',
              body: '',
              statementCount: 0,
            } as DetectedMethod & { bodyStart: number });
          }
        }
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          if (methods.length > 0) {
            const last = methods[methods.length - 1] as DetectedMethod & { bodyStart: number };
            if (!last.body) {
              last.body = code.substring(last.bodyStart, i).trim();
              last.statementCount = last.body.split(';').filter(s => s.trim().length > 0).length;
            }
          }
          headerBuffer = '';
          headerStartChar = i + 1;
        } else if (depth < 0) {
          break;
        }
      } else if (depth === 0) {
        if (ch === ';') {
          headerBuffer = '';
          headerStartChar = i + 1;
        } else {
          if (headerBuffer.length === 0 && !/\s/.test(ch)) {
            headerStartChar = i;
          }
          headerBuffer += ch;
        }
      }
    }
    i++;
  }

  return methods.filter(m => m.body && m.body.length > 0);
}

function extractFallbackMethodBody(code: string): string {
  const methodMatch = code.match(/public\s+(?:void|[a-zA-Z0-9_<>[\]]+)\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{([\s\S]*)\}/);
  if (methodMatch) {
    return methodMatch[1].trim();
  }
  return code.trim();
}

/**
 * Splits Java statements cleanly using a balanced scanner that respects braces,
 * strings, comments, and chained else if / else statements, providing accurate line locations.
 */
export function splitStatementsWithLocations(code: string, baseLineNumber: number = 1): StatementWithLocation[] {
  const result: StatementWithLocation[] = [];
  let buffer = '';
  let depth = 0;
  let parenDepth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let i = 0;
  let stmtStartChar = 0;

  const getLineFromChar = (charIdx: number) => {
    return baseLineNumber + code.substring(0, charIdx).split('\n').length - 1;
  };

  while (i < code.length) {
    const ch = code[i];
    const nextCh = i + 1 < code.length ? code[i + 1] : '';

    if (buffer.length === 0 && !/\s/.test(ch)) {
      stmtStartChar = i;
    }

    if (inLineComment) {
      if (ch === '\n') { inLineComment = false; buffer += ' '; }
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && nextCh === '/') { inBlockComment = false; i += 2; continue; }
      i++;
      continue;
    }
    if (!inString && ch === '/' && nextCh === '/') { inLineComment = true; i += 2; continue; }
    if (!inString && ch === '/' && nextCh === '*') { inBlockComment = true; i += 2; continue; }

    if (!inString && (ch === '"' || ch === "'")) {
      inString = true;
      stringChar = ch;
      buffer += ch;
    } else if (inString && ch === stringChar && code[i - 1] !== '\\') {
      inString = false;
      buffer += ch;
    } else if (!inString) {
      if (ch === '(') {
        parenDepth++;
        buffer += ch;
      } else if (ch === ')') {
        if (parenDepth > 0) parenDepth--;
        buffer += ch;
      } else if (ch === '{') {
        depth++;
        buffer += ch;
      } else if (ch === '}') {
        depth--;
        buffer += ch;
        if (depth === 0) {
          const rest = code.substring(i + 1).trimStart();
          if (!rest.startsWith('else')) {
            const trimmed = buffer.trim();
            if (trimmed && trimmed !== '}') {
              const startLine = getLineFromChar(stmtStartChar);
              const endLine = startLine + (trimmed.split('\n').length - 1);
              result.push({ text: trimmed, startLine, endLine });
            }
            buffer = '';
          }
        }
      } else if (ch === ';' && depth === 0 && parenDepth === 0) {
        buffer += ch;
        const rest = code.substring(i + 1).trimStart();
        if (!rest.startsWith('else')) {
          const trimmed = buffer.trim();
          if (trimmed && trimmed !== '}') {
            const startLine = getLineFromChar(stmtStartChar);
            const endLine = startLine + (trimmed.split('\n').length - 1);
            result.push({ text: trimmed, startLine, endLine });
          }
          buffer = '';
        }
      } else {
        buffer += ch;
      }
    } else {
      buffer += ch;
    }
    i++;
  }

  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed && trimmed !== '}') {
      const startLine = getLineFromChar(stmtStartChar);
      const endLine = startLine + (trimmed.split('\n').length - 1);
      result.push({ text: trimmed, startLine, endLine });
    }
  }

  return result;
}

export function splitStatementsSmart(code: string): string[] {
  return splitStatementsWithLocations(code, 1).map(s => s.text);
}

/**
 * Backward compatibility alias for splitIntoStatements
 */
function splitIntoStatements(code: string): string[] {
  return splitStatementsSmart(code);
}

function formatItemDisplayName(rawItem: string): string {
  const clean = rawItem.replace(/\.asItem\(\)/g, '').replace(/\.get\(\)/g, '').trim();
  const parts = clean.split('.');
  const last = parts[parts.length - 1];
  return last
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatItemFieldValue(rawItem: string): string {
  const clean = rawItem.replace(/\.asItem\(\)/g, '').replace(/\.get\(\)/g, '').trim();
  if (clean.startsWith('Blocks.') || clean.startsWith('Items.')) {
    return clean;
  }
  const parts = clean.split('.');
  const last = parts[parts.length - 1];
  const pascal = last
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return `CUSTOM:${pascal}`;
}

function isInventoryForeach(stmt: string): boolean {
  const s = stmt.trim();
  const hasCapability = s.includes('Capabilities.ItemHandler') || s.includes('ItemHandler') || s.includes('IItemHandlerModifiable');
  const hasForeach = s.includes('getSlots()') || s.includes('getStackInSlot') || s.includes('itemstackiterator');
  return (hasCapability && s.includes('for') && hasForeach) || (s.startsWith('for') && hasForeach);
}

function isInventorySetSlot(stmt: string): boolean {
  const s = stmt.trim();
  if (s.startsWith('if')) {
    const isCapabilityWrapper =
      s.includes('instanceof IItemHandlerModifiable') ||
      s.includes('instanceof IItemHandler') ||
      (s.includes('Capabilities.ItemHandler') && s.includes('setStackInSlot'));
    if (s.includes('getItem()') || s.includes('==') || s.includes('!=') || s.includes('&&') || s.includes('||')) {
      return false;
    }
    return isCapabilityWrapper;
  }
  return s.includes('setStackInSlot');
}

function parseInventoryForeachStatement(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: { javaLine: string; lineNumber?: number; blockId?: string; mcreatorBlock: string; explanation: string }[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode {
  const isBlock = stmt.includes('Capabilities.ItemHandler.BLOCK') || stmt.includes('ItemHandler.BLOCK');

  // Extract body of the for loop
  const forIdx = stmt.indexOf('for');
  const forCode = forIdx !== -1 ? stmt.substring(forIdx) : stmt;
  const loopBody = extractBlockBody(forCode);

  let bodyLine = startLine !== undefined ? startLine : undefined;
  if (startLine !== undefined && loopBody) {
    const loopBodyIdx = stmt.indexOf(loopBody);
    if (loopBodyIdx !== -1) {
      const linesBefore = stmt.substring(0, loopBodyIdx).split('\n').length - 1;
      bodyLine = startLine + linesBefore;
    }
  }

  const rawLoopStmts = splitStatementsWithLocations(loopBody, bodyLine);
  // Filter out the initial iterator copy assignment:
  // e.g. "ItemStack itemstackiterator = _modHandlerIter.getStackInSlot(_idx).copy();"
  const innerStmts = rawLoopStmts.filter(s => {
    const trimmed = s.text.trim();
    return !trimmed.startsWith('ItemStack itemstackiterator') && !trimmed.startsWith('ItemStack _setstack');
  });

  const innerNodes = innerStmts
    .map((s, idx) => parseJavaStatement(s.text, idSeq * 1000 + idx, variables, breakdown, elementType, s.startLine, s.endLine))
    .filter((n): n is BlockASTNode => n !== null);

  const blockType = isBlock ? 'block_inventory_foreach' : 'entity_inventory_foreach';
  const label = isBlock ? 'For each slot of block inventory' : 'For each slot of inventory';

  breakdown.push({
    javaLine: stmt.split('{')[0].trim() || 'For each slot of inventory',
    lineNumber: startLine,
    blockId: `inv_foreach_${idSeq}`,
    mcreatorBlock: blockType,
    explanation: 'Iterate through each slot of inventory capability',
  });

  if (isBlock) {
    return {
      id: `inv_foreach_${idSeq}`,
      type: blockType,
      category: 'gui',
      title: label,
      values: [
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
      statements: [
        { name: 'do', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined },
      ],
    };
  }

  return {
    id: `inv_foreach_${idSeq}`,
    type: blockType,
    category: 'gui',
    title: label,
    values: [
      {
        name: 'entity',
        block: {
          id: `ent_dep_${idSeq}`,
          type: 'entity_from_deps',
          category: 'entity',
          title: 'Event/target entity',
        },
      },
    ],
    statements: [
      { name: 'do', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined },
    ],
  };
}

function parseInventorySetSlotStatement(
  stmt: string,
  idSeq: number,
  breakdown: { javaLine: string; mcreatorBlock: string; explanation: string }[]
): BlockASTNode {
  const isBlock = stmt.includes('Capabilities.ItemHandler.BLOCK') || stmt.includes('ItemHandler.BLOCK');

  // 1. Extract Slot Index e.g. _modHandler.setStackInSlot((int) slot, _setstack);
  let slotNode: BlockASTNode = {
    id: `num_slot_${idSeq}`,
    type: 'math_number',
    category: 'math',
    title: '0',
    fields: { NUM: '0' },
  };
  const slotMatch = stmt.match(/setStackInSlot\s*\(\s*(?:\(int\)\s*)?([^,]+),/);
  if (slotMatch) {
    const rawSlot = slotMatch[1].trim();
    slotNode = parseExpressionToAST(rawSlot, idSeq * 10 + 1);
  }

  // 2. Extract Amount e.g. _setstack.setCount(itemstackiterator.getCount());
  let amountNode: BlockASTNode = {
    id: `num_cnt_${idSeq}`,
    type: 'math_number',
    category: 'math',
    title: '1',
    fields: { NUM: '1' },
  };
  const countMatch = stmt.match(/(?:_setstack|stack)\.setCount\s*\(([\s\S]+?)\);/);
  if (countMatch) {
    const rawCount = countMatch[1].trim();
    amountNode = parseExpressionToAST(rawCount, idSeq * 10 + 2);
  }

  // 3. Extract Item e.g. new ItemStack(TheBackwoodsModBlocks.PETRIFIED_ROTTEN_OAK_WOOD.get()).copy()
  let itemNode: BlockASTNode = {
    id: `item_slot_${idSeq}`,
    type: 'mcitem_all',
    category: 'item',
    title: 'Air',
    fields: { value: 'Blocks.AIR' },
  };
  const itemIdx = stmt.indexOf('new ItemStack(');
  if (itemIdx !== -1) {
    const after = stmt.substring(itemIdx + 'new ItemStack('.length);
    let depth = 1;
    let rawItem = '';
    for (let i = 0; i < after.length; i++) {
      if (after[i] === '(') depth++;
      else if (after[i] === ')') {
        depth--;
        if (depth === 0) {
          rawItem = after.substring(0, i).trim();
          break;
        }
      }
    }
    if (rawItem) {
      const title = formatItemDisplayName(rawItem);
      const value = formatItemFieldValue(rawItem);
      itemNode = {
        id: `item_slot_${idSeq}`,
        type: 'mcitem_all',
        category: 'item',
        title,
        fields: { value },
      };
    }
  }

  const blockType = isBlock ? 'block_set_slot' : 'entity_set_slot';
  const label = isBlock ? 'Set slot in block inventory' : 'Set slot in entity inventory';

  breakdown.push({
    javaLine: 'setStackInSlot(...)',
    mcreatorBlock: blockType,
    explanation: 'Set itemstack and amount in target inventory slot',
  });

  if (isBlock) {
    return {
      id: `set_slot_${idSeq}`,
      type: blockType,
      category: 'gui',
      title: label,
      values: [
        { name: 'amount', block: amountNode },
        { name: 'item', block: itemNode },
        { name: 'slot', block: slotNode },
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
    };
  }

  return {
    id: `set_slot_${idSeq}`,
    type: blockType,
    category: 'gui',
    title: label,
    values: [
      { name: 'amount', block: amountNode },
      { name: 'item', block: itemNode },
      { name: 'slot', block: slotNode },
      {
        name: 'entity',
        block: {
          id: `ent_dep_${idSeq}`,
          type: 'entity_from_deps',
          category: 'entity',
          title: 'Event/target entity',
        },
      },
    ],
  };
}

function parseAdvancementStatement(
  stmt: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[]
): BlockASTNode {
  const isRevoke = stmt.includes('.revoke(');

  // Extract advancement ResourceLocation
  let advId = 'CUSTOM:Advancement';
  const resMatch =
    stmt.match(/ResourceLocation\.parse\("([^"]+)"\)/) ||
    stmt.match(/ResourceLocation\.fromNamespaceAndPath\("([^"]+)",\s*"([^"]+)"\)/) ||
    stmt.match(/new\s+ResourceLocation\("([^"]+)"(?:,\s*"([^"]+)")?\)/) ||
    stmt.match(/"([a-zA-Z0-9_:]+)"/);

  if (resMatch) {
    let rawPath = '';
    if (resMatch[2]) {
      rawPath = resMatch[2];
    } else {
      const full = resMatch[1];
      const colonIdx = full.indexOf(':');
      rawPath = colonIdx !== -1 ? full.substring(colonIdx + 1) : full;
    }
    const pascal = rawPath
      .split(/[/_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    advId = `CUSTOM:${pascal}`;
  }

  // Extract target entity
  let targetEntity: BlockASTNode = {
    id: `src_ent_${idSeq}`,
    type: 'source_entity_from_deps',
    category: 'entity',
    title: 'Source entity',
  };

  if (stmt.includes('sourceentity')) {
    targetEntity = {
      id: `src_ent_${idSeq}`,
      type: 'source_entity_from_deps',
      category: 'entity',
      title: 'Source entity',
    };
  } else if (stmt.includes('entity') && !stmt.includes('sourceentity')) {
    targetEntity = {
      id: `ent_${idSeq}`,
      type: 'entity_from_deps',
      category: 'entity',
      title: 'Event/target entity',
    };
  }

  const blockType = isRevoke ? 'entity_remove_achievement' : 'entity_add_achievement';
  const blockTitle = isRevoke ? `Remove advancement ${advId.replace('CUSTOM:', '')}` : `Add advancement ${advId.replace('CUSTOM:', '')}`;

  breakdown.push({
    javaLine: stmt.split('\n')[0].trim() || 'Advancement trigger',
    mcreatorBlock: blockType,
    explanation: `${isRevoke ? 'Revoke' : 'Award'} advancement '${advId}'`,
  });

  return {
    id: `adv_${idSeq}`,
    type: blockType,
    category: 'player',
    title: blockTitle,
    fields: { achievement: advId },
    values: [{ name: 'entity', block: targetEntity }],
  };
}

/**
 * Parses a single statement into an AST block
 */
function parseJavaStatement(
  rawStmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: TranslationBreakdownItem[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode | null {
  const stmt = rawStmt.trim();
  if (!stmt || stmt === '}') return null;

  const node = parseJavaStatementInternal(stmt, idSeq, variables, breakdown, elementType, startLine, endLine);
  if (node) {
    if (startLine !== undefined) node.sourceLine = startLine;
    if (endLine !== undefined) node.sourceEndLine = endLine;
    node.rawJava = stmt;
  }
  return node;
}

function parseJavaStatementInternal(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: TranslationBreakdownItem[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode | null {
  // 0.1 INVENTORY FOREACH: For each slot of inventory of entity or block
  if (isInventoryForeach(stmt)) {
    return parseInventoryForeachStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  // 0.2 INVENTORY SET SLOT: Set item in slot of inventory
  if (isInventorySetSlot(stmt)) {
    return parseInventorySetSlotStatement(stmt, idSeq, breakdown);
  }

  // 0.3 ADVANCEMENTS: Award or revoke advancement
  if (stmt.includes('AdvancementHolder') || stmt.includes('getAdvancements()')) {
    return parseAdvancementStatement(stmt, idSeq, breakdown);
  }

  // 1. IF / ELSE IF / ELSE
  if (stmt.startsWith('if ') || stmt.startsWith('if(')) {
    return parseIfStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  // 2. FOR LOOP: for (int i = 0; i < size; i++) or for (Entity e : ...)
  if (stmt.startsWith('for ') || stmt.startsWith('for(')) {
    return parseForLoopStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  // 3. WHILE LOOP: while (...) { ... }
  if (stmt.startsWith('while ') || stmt.startsWith('while(')) {
    return parseWhileStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  // 4. AI TASK GOAL ADDITIONS: goalSelector.addGoal(...) or targetSelector.addGoal(...)
  if (stmt.includes('goalSelector.addGoal') || stmt.includes('targetSelector.addGoal')) {
    return parseAIGoalStatement(stmt, idSeq, breakdown);
  }

  // 5. RETURN STATEMENTS: return [expr];
  if (stmt.startsWith('return ') || stmt === 'return;') {
    return parseReturnStatement(stmt, idSeq, breakdown);
  }

  // 6. BREAK / CONTINUE
  if (stmt === 'break;' || stmt === 'break') {
    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `break_${idSeq}`, mcreatorBlock: 'controls_flow_statements', explanation: 'Break statement' });
    return {
      id: `break_${idSeq}`,
      type: 'controls_flow_statements',
      category: 'control',
      title: 'Break out of loop',
      fields: { FLOW: 'BREAK' },
    };
  }
  if (stmt === 'continue;' || stmt === 'continue') {
    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `continue_${idSeq}`, mcreatorBlock: 'controls_flow_statements', explanation: 'Continue statement' });
    return {
      id: `continue_${idSeq}`,
      type: 'controls_flow_statements',
      category: 'control',
      title: 'Continue loop iteration',
      fields: { FLOW: 'CONTINUE' },
    };
  }

  // 7. DELAY / WAIT TICKS
  if (stmt.includes('queueServerWork') || stmt.includes('wait(') || stmt.includes('wait_ticks')) {
    const ticksMatch = stmt.match(/(?:queueServerWork|wait)\s*\(\s*([0-9]+)/);
    const ticks = ticksMatch ? ticksMatch[1] : '20';
    const innerBody = extractBlockBody(stmt);
    const innerStmts = splitIntoStatements(innerBody);
    const innerNodes = innerStmts
      .map((s, idx) => parseJavaStatement(s, idSeq * 100 + idx, variables, breakdown, elementType))
      .filter((n): n is BlockASTNode => n !== null);

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'wait_ticks', explanation: `Wait ${ticks} ticks before execution` });
    return {
      id: `wait_${idSeq}`,
      type: 'wait_ticks',
      category: 'control',
      title: 'Wait ticks',
      values: [{ name: 'ticks', block: { id: `ticks_${idSeq}`, type: 'math_number', category: 'math', title: ticks, fields: { NUM: ticks } } }],
      statements: [{ name: 'do', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
    };
  }

  // 8. LOCAL VARIABLE DECLARATION: Type var = expr;
  const declMatch = stmt.match(/^(?:final\s+)?(double|float|int|long|boolean|String|ItemStack|Entity|Player|Vec3|BlockPos|BlockState)\s+([a-zA-Z0-9_]+)\s*=\s*([\s\S]+?);?$/);
  if (declMatch) {
    const typeStr = declMatch[1];
    const varName = declMatch[2];
    const valExpr = declMatch[3].trim();

    let varType: VariableDecl['type'] = 'number';
    let blockType = 'variables_set_number';
    let category: BlockCategory = 'variable';

    if (typeStr === 'boolean') {
      varType = 'logic';
      blockType = 'variables_set_logic';
    } else if (typeStr === 'String') {
      varType = 'string';
      blockType = 'variables_set_string';
    } else if (typeStr === 'ItemStack') {
      varType = 'itemstack';
      blockType = 'variables_set_itemstack';
    } else if (typeStr === 'Entity' || typeStr === 'Player') {
      varType = 'entity';
      blockType = 'variables_set_entity';
    }

    variables.push({ name: varName, type: varType, initialValue: valExpr });
    const valAST = parseExpressionToAST(valExpr, idSeq * 10);

    breakdown.push({ javaLine: stmt, mcreatorBlock: blockType, explanation: `Declared and assigned variable '${varName}'` });
    return {
      id: `var_set_${idSeq}`,
      type: blockType,
      category,
      title: `Set variable ${varName}`,
      fields: { VAR: `local:${varName}` },
      values: [{ name: 'VAL', block: valAST }],
    };
  }

  // 9. COMPOUND VARIABLE UPDATES: var += expr, var -= expr, var *= expr, var /= expr, var++, var--
  const compMatch = stmt.match(/^([a-zA-Z0-9_]+)\s*(\+=|-=|\*=|\/=)\s*([\s\S]+?);?$/);
  if (compMatch) {
    const varName = compMatch[1];
    const op = compMatch[2].charAt(0);
    const valExpr = compMatch[3].trim();

    const currentVarGet: BlockASTNode = {
      id: `var_get_${idSeq}`,
      type: 'variables_get_number',
      category: 'variable',
      title: varName,
      fields: { VAR: `local:${varName}` },
    };
    const operandAST = parseExpressionToAST(valExpr, idSeq * 10);

    const mathBinary: BlockASTNode = {
      id: `math_op_${idSeq}`,
      type: 'math_binary',
      category: 'math',
      title: op,
      fields: { OP: op === '+' ? 'ADD' : op === '-' ? 'MINUS' : op === '*' ? 'MULTIPLY' : 'DIVIDE' },
      values: [
        { name: 'A', block: currentVarGet },
        { name: 'B', block: operandAST },
      ],
    };

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'variables_set_number', explanation: `Compound assignment '${stmt}'` });
    return {
      id: `var_comp_${idSeq}`,
      type: 'variables_set_number',
      category: 'variable',
      title: `Set variable ${varName}`,
      fields: { VAR: `local:${varName}` },
      values: [{ name: 'VAL', block: mathBinary }],
    };
  }

  const incMatch = stmt.match(/^([a-zA-Z0-9_]+)(\+\+|--);?$/) || stmt.match(/^(\+\+|--)([a-zA-Z0-9_]+);?$/);
  if (incMatch) {
    const varName = incMatch[1] || incMatch[2];
    const isInc = (incMatch[1] === '++' || incMatch[2] === '++' || stmt.includes('++'));
    const op = isInc ? 'ADD' : 'MINUS';

    const currentVarGet: BlockASTNode = {
      id: `var_get_${idSeq}`,
      type: 'variables_get_number',
      category: 'variable',
      title: varName,
      fields: { VAR: `local:${varName}` },
    };

    const mathBinary: BlockASTNode = {
      id: `math_inc_${idSeq}`,
      type: 'math_binary',
      category: 'math',
      title: isInc ? '+' : '-',
      fields: { OP: op },
      values: [
        { name: 'A', block: currentVarGet },
        { name: 'B', block: { id: `one_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
      ],
    };

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'variables_set_number', explanation: `Increment/decrement '${varName}'` });
    return {
      id: `var_inc_${idSeq}`,
      type: 'variables_set_number',
      category: 'variable',
      title: `Set variable ${varName}`,
      fields: { VAR: `local:${varName}` },
      values: [{ name: 'VAL', block: mathBinary }],
    };
  }

  // 10. REASSIGNMENT: var = expr;
  const reassignMatch = stmt.match(/^([a-zA-Z0-9_]+)\s*=\s*([\s\S]+?);?$/);
  if (reassignMatch && !stmt.startsWith('if') && !stmt.startsWith('for')) {
    const varName = reassignMatch[1];
    const valExpr = reassignMatch[2].trim();
    const valAST = parseExpressionToAST(valExpr, idSeq * 10);

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'variables_set_number', explanation: `Reassigned variable '${varName}'` });
    return {
      id: `var_re_${idSeq}`,
      type: 'variables_set_number',
      category: 'variable',
      title: `Set variable ${varName}`,
      fields: { VAR: `local:${varName}` },
      values: [{ name: 'VAL', block: valAST }],
    };
  }

  // 11. NBT PUT & REMOVE OPERATIONS (Entity, Block, Item, and CompoundTag)
  if (stmt.includes('.putInt(') || stmt.includes('.putDouble(') || stmt.includes('.putFloat(') || stmt.includes('.putBoolean(') || stmt.includes('.putString(') || (stmt.includes('.remove(') && (stmt.includes('PersistentData') || stmt.includes('Tag') || stmt.includes('CUSTOM_DATA')))) {
    const isNum = stmt.includes('.putInt(') || stmt.includes('.putDouble(') || stmt.includes('.putFloat(');
    const isBool = stmt.includes('.putBoolean(');
    const isStr = stmt.includes('.putString(');
    const isRemove = stmt.includes('.remove(');

    let keyExpr = '"key"';
    let valExpr = '0';
    if (isRemove) {
      const rmMatch = stmt.match(/\.remove\s*\(([^)]+)\)/);
      if (rmMatch) keyExpr = rmMatch[1].trim();
    } else {
      const putMatch = stmt.match(/\.(?:putInt|putDouble|putFloat|putBoolean|putString)\s*\(([^,]+),([\s\S]+)\);?$/);
      if (putMatch) {
        keyExpr = putMatch[1].trim();
        valExpr = putMatch[2].trim().replace(/;$/, '');
      }
    }

    const keyAST = parseExpressionToAST(keyExpr, idSeq * 10 + 1);
    const valAST = !isRemove ? parseExpressionToAST(valExpr, idSeq * 10 + 2) : undefined;

    // Detect target context: item, block, custom CompoundTag, or entity
    const isItem = stmt.includes('itemstack') || stmt.includes('itemStack') || stmt.includes('item') || stmt.includes('CUSTOM_DATA') || stmt.includes('CustomData');
    const isBlock = stmt.includes('_blockEntity') || stmt.includes('getBlockEntity') || stmt.includes('blockEntity') || stmt.includes('BlockEntity');
    const isCustomTag = (stmt.match(/^(?:tag|compoundTag|customTag|nbt|_nbt)\./) != null) || (stmt.includes('CompoundTag') && !stmt.includes('PersistentData'));

    if (isItem) {
      const itemTarget = stmt.includes('itemstack') ? 'itemstack' : stmt.includes('item') ? 'item' : 'itemstack';
      const itemAST = parseExpressionToAST(itemTarget, idSeq * 10);
      if (isRemove) {
        breakdown.push({ javaLine: stmt, mcreatorBlock: 'item_nbt_tag_remove', explanation: 'Remove NBT tag from ItemStack' });
        return {
          id: `item_nbt_rm_${idSeq}`,
          type: 'item_nbt_tag_remove',
          category: 'item',
          title: 'Remove itemstack NBT tag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'item', block: itemAST },
          ],
        };
      }
      const type = isNum ? 'item_nbt_num_set' : isBool ? 'item_nbt_logic_set' : 'item_nbt_text_set';
      const title = isNum ? 'Set itemstack NBT number tag' : isBool ? 'Set itemstack NBT logic tag' : 'Set itemstack NBT text tag';
      breakdown.push({ javaLine: stmt, mcreatorBlock: type, explanation: `Set ItemStack NBT tag (${isNum ? 'number' : isBool ? 'logic' : 'text'})` });
      return {
        id: `item_nbt_set_${idSeq}`,
        type,
        category: 'item',
        title,
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'item', block: itemAST },
          { name: 'tagValue', block: valAST },
        ],
      };
    }

    if (isBlock) {
      if (isRemove) {
        breakdown.push({ javaLine: stmt, mcreatorBlock: 'block_nbt_tag_remove', explanation: 'Remove NBT tag from BlockEntity' });
        return {
          id: `block_nbt_rm_${idSeq}`,
          type: 'block_nbt_tag_remove',
          category: 'block',
          title: 'Remove block NBT tag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'x', block: parseExpressionToAST('x', idSeq * 10) },
            { name: 'y', block: parseExpressionToAST('y', idSeq * 10 + 3) },
            { name: 'z', block: parseExpressionToAST('z', idSeq * 10 + 4) },
          ],
        };
      }
      const type = isNum ? 'block_nbt_num_set' : isBool ? 'block_nbt_logic_set' : 'block_nbt_text_set';
      const title = isNum ? 'Set block NBT number tag' : isBool ? 'Set block NBT logic tag' : 'Set block NBT text tag';
      breakdown.push({ javaLine: stmt, mcreatorBlock: type, explanation: `Set BlockEntity NBT tag (${isNum ? 'number' : isBool ? 'logic' : 'text'})` });
      return {
        id: `block_nbt_set_${idSeq}`,
        type,
        category: 'block',
        title,
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'x', block: parseExpressionToAST('x', idSeq * 10) },
          { name: 'y', block: parseExpressionToAST('y', idSeq * 10 + 3) },
          { name: 'z', block: parseExpressionToAST('z', idSeq * 10 + 4) },
          { name: 'tagValue', block: valAST },
        ],
      };
    }

    if (isCustomTag) {
      const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
      const target = targetMatch ? targetMatch[1] : 'tag';
      const tagAST = parseExpressionToAST(target, idSeq * 10);
      if (isRemove) {
        breakdown.push({ javaLine: stmt, mcreatorBlock: 'custom_nbt_remove', explanation: 'Remove NBT tag from CompoundTag' });
        return {
          id: `custom_nbt_rm_${idSeq}`,
          type: 'custom_nbt_remove',
          category: 'advanced',
          title: 'Remove NBT tag from CompoundTag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'tag', block: tagAST },
          ],
        };
      }
      const type = isNum ? 'custom_nbt_num_set' : isBool ? 'custom_nbt_logic_set' : 'custom_nbt_text_set';
      const title = isNum ? 'Set NBT number tag of CompoundTag' : isBool ? 'Set NBT logic tag of CompoundTag' : 'Set NBT text tag of CompoundTag';
      breakdown.push({ javaLine: stmt, mcreatorBlock: type, explanation: `Set CompoundTag NBT tag (${isNum ? 'number' : isBool ? 'logic' : 'text'})` });
      return {
        id: `custom_nbt_set_${idSeq}`,
        type,
        category: 'advanced',
        title,
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'tag', block: tagAST },
          { name: 'tagValue', block: valAST },
        ],
      };
    }

    // Default: Entity NBT
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const entityAST = parseExpressionToAST(target, idSeq * 10);
    if (isRemove) {
      breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_nbt_tag_remove', explanation: 'Remove NBT tag from entity' });
      return {
        id: `entity_nbt_rm_${idSeq}`,
        type: 'entity_nbt_tag_remove',
        category: 'entity',
        title: 'Remove entity NBT tag',
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'entity', block: entityAST },
        ],
      };
    }
    const type = isNum ? 'entity_nbt_num_set' : isBool ? 'entity_nbt_logic_set' : 'entity_nbt_text_set';
    const title = isNum ? 'Set entity NBT number tag' : isBool ? 'Set entity NBT logic tag' : 'Set entity NBT text tag';
    breakdown.push({ javaLine: stmt, mcreatorBlock: type, explanation: `Set Entity NBT tag (${isNum ? 'number' : isBool ? 'logic' : 'text'})` });
    return {
      id: `entity_nbt_set_${idSeq}`,
      type,
      category: 'entity',
      title,
      values: [
        { name: 'tagName', block: keyAST },
        { name: 'entity', block: entityAST },
        { name: 'tagValue', block: valAST },
      ],
    };
  }

  // 11.25 ENTITY DATA PARAMETER SETTERS
  // if (entity instanceof LignumPalusEntity _datEntSetI) _datEntSetI.getEntityData().set(LignumPalusEntity.DATA_mouth_state, val);
  const dataParamSetMatch = stmt.match(
    /(?:if\s*\(\s*([a-zA-Z0-9_]+)\s+instanceof\s+([a-zA-Z0-9_]+)\s+[a-zA-Z0-9_]+\s*\)\s*)?[a-zA-Z0-9_.]*getEntityData\(\)\.set\(\s*([a-zA-Z0-9_]+)\.DATA_([a-zA-Z0-9_]+)\s*,\s*([\s\S]+)\);?$/
  );
  if (dataParamSetMatch) {
    const rawEntity = dataParamSetMatch[1] || 'entity';
    const entityClass = dataParamSetMatch[3] || dataParamSetMatch[2] || 'LivingEntity';
    const accessor = dataParamSetMatch[4];
    const valExpr = dataParamSetMatch[5].replace(/;$/, '').trim();
    const cleanEntityName = entityClass.replace(/Entity$/, '');

    const isNum = !isNaN(Number(valExpr)) || valExpr.includes('toInt(') || valExpr.includes('int');
    const isBool = valExpr === 'true' || valExpr === 'false' || valExpr.startsWith('!');
    const isStr = valExpr.startsWith('"');

    const blockType = isBool ? 'entity_data_logic_set' : isStr ? 'entity_data_string_set' : 'entity_data_integer_set';
    const category = isBool ? 'logic' : isStr ? 'text' : 'math';
    const typeLabel = isBool ? 'logic' : isStr ? 'string' : 'integer';

    breakdown.push({
      javaLine: stmt,
      mcreatorBlock: blockType,
      explanation: `For custom entity ${rawEntity} of type ${cleanEntityName} set ${typeLabel} data parameter ${accessor}`,
    });

    return {
      id: `ent_data_set_${idSeq}`,
      type: blockType,
      category: category as BlockCategory,
      title: `For custom entity [${rawEntity}] of type [${cleanEntityName}] set ${typeLabel} data parameter [${accessor}] value to:`,
      fields: {
        customEntity: `CUSTOM:${cleanEntityName}`,
        accessor: accessor,
      },
      values: [
        { name: 'entity', block: parseExpressionToAST(rawEntity, idSeq * 10 + 1) },
        { name: 'value', block: parseExpressionToAST(valExpr.replace(/opt\.toInt\(([^)]+)\)/, '$1'), idSeq * 10 + 2) },
      ],
    };
  }

  // 11.5 DEAL DAMAGE / HURT: entity.hurt(...)
  if (stmt.includes('.hurt(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.hurt/);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const hurtMatch = stmt.match(/\.hurt\s*\(([^,]+)(?:,([\s\S]+))?\)/);
    let dsExpr = hurtMatch ? hurtMatch[1].trim() : 'damagesource';
    let amtExpr = hurtMatch && hurtMatch[2] ? hurtMatch[2].trim() : '1';

    if (!hurtMatch || !hurtMatch[2]) {
      // Single argument hurt(amount) fallback
      amtExpr = dsExpr;
      dsExpr = 'damagesource';
    }

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'deal_damage', explanation: 'Deal damage to entity' });
    return {
      id: `damage_${idSeq}`,
      type: 'deal_damage',
      category: 'damage',
      title: 'Deal damage',
      values: [
        { name: 'amount', block: parseExpressionToAST(amtExpr, idSeq * 10 + 1) },
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 2) },
        { name: 'damagesource', block: parseExpressionToAST(dsExpr, idSeq * 10 + 3) },
      ],
    };
  }

  // 11.6 SPAWN PARTICLES: _level.sendParticles(...) / world.addParticle(...)
  if (stmt.includes('.sendParticles(') || stmt.includes('.addParticle(')) {
    const partMatch = stmt.match(/(?:sendParticles|addParticle)\s*\(([^)]+)\)/);
    const params = partMatch ? partMatch[1].split(',').map(s => s.trim()) : [];
    const partType = params[0] || 'ParticleTypes.POOF';
    const px = params[1] || 'x';
    const py = params[2] || 'y';
    const pz = params[3] || 'z';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'spawn_particle', explanation: 'Spawn particle in world' });
    return {
      id: `part_${idSeq}`,
      type: 'spawn_particle',
      category: 'world',
      title: 'Spawn particle',
      fields: { particle: partType.replace(/ParticleTypes\./, '') },
      values: [
        { name: 'x', block: parseExpressionToAST(px, idSeq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(py, idSeq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(pz, idSeq * 10 + 3) },
        { name: 'xs', block: { id: `xs_${idSeq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'ys', block: { id: `ys_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'zs', block: { id: `zs_${idSeq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
      ],
    };
  }

  // 11.7 EXPLODE: _level.explode(...) / world.explode(...)
  if (stmt.includes('.explode(')) {
    const expMatch = stmt.match(/\.explode\s*\([^,]+,([^,]+),([^,]+),([^,]+),([^,]+)/);
    const px = expMatch ? expMatch[1].trim() : 'x';
    const py = expMatch ? expMatch[2].trim() : 'y';
    const pz = expMatch ? expMatch[3].trim() : 'z';
    const pPower = expMatch ? expMatch[4].trim() : '4';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'explode', explanation: 'Create explosion at position' });
    return {
      id: `exp_${idSeq}`,
      type: 'explode',
      category: 'world',
      title: 'Explode',
      fields: { mode: 'NONE' },
      values: [
        { name: 'power', block: parseExpressionToAST(pPower, idSeq * 10 + 1) },
        { name: 'x', block: parseExpressionToAST(px, idSeq * 10 + 2) },
        { name: 'y', block: parseExpressionToAST(py, idSeq * 10 + 3) },
        { name: 'z', block: parseExpressionToAST(pz, idSeq * 10 + 4) },
      ],
    };
  }

  // 11.8 EXECUTE COMMAND: performPrefixedCommand(...)
  if (stmt.includes('performPrefixedCommand')) {
    const cmdMatch = stmt.match(/performPrefixedCommand\s*\([^,]+,([\s\S]+?)\);?$/);
    const rawCmd = cmdMatch ? cmdMatch[1].trim() : '"say Hello"';
    const isEntityCmd = stmt.includes('entity') || stmt.includes('_ent');

    const blockType = isEntityCmd ? 'entity_execute_command' : 'world_execute_command';
    breakdown.push({ javaLine: stmt, mcreatorBlock: blockType, explanation: 'Execute Minecraft command' });

    if (isEntityCmd) {
      return {
        id: `cmd_${idSeq}`,
        type: blockType,
        category: 'command',
        title: 'Execute command in name of entity',
        values: [
          { name: 'command', block: parseExpressionToAST(rawCmd, idSeq * 10 + 1) },
          { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
        ],
      };
    }

    return {
      id: `cmd_${idSeq}`,
      type: blockType,
      category: 'command',
      title: 'Execute command in world',
      values: [
        { name: 'command', block: parseExpressionToAST(rawCmd, idSeq * 10 + 1) },
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
    };
  }

  // 11.9 SET FIRE / EXTINGUISH / DESPAWN
  if (stmt.includes('setSecondsOnFire') || stmt.includes('igniteForSeconds') || stmt.includes('setRemainingFireTicks')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const secMatch = stmt.match(/(?:setSecondsOnFire|igniteForSeconds|setRemainingFireTicks)\s*\(([^)]+)\)/);
    const secVal = secMatch ? secMatch[1].trim() : '5';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_set_fire', explanation: 'Set entity on fire' });
    return {
      id: `fire_${idSeq}`,
      type: 'entity_set_fire',
      category: 'action',
      title: 'Set entity on fire',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'seconds', block: parseExpressionToAST(secVal, idSeq * 10 + 2) },
      ],
    };
  }

  if (stmt.includes('.clearFire()') || stmt.includes('.extinguish()')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_extinguish', explanation: 'Extinguish entity fire' });
    return {
      id: `ext_${idSeq}`,
      type: 'entity_extinguish',
      category: 'action',
      title: 'Extinguish entity',
      values: [{ name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) }],
    };
  }

  if (stmt.includes('.discard()') || stmt.includes('.remove(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_despawn', explanation: 'Despawn / remove entity' });
    return {
      id: `despawn_${idSeq}`,
      type: 'entity_despawn',
      category: 'action',
      title: 'Despawn entity',
      values: [{ name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) }],
    };
  }

  // 12. WORLD BLOCK OPERATIONS: world.setBlock(...) / level.setBlock(...)
  if (stmt.includes('.setBlock(') || stmt.includes('.setBlockAndUpdate(')) {
    const setMatch = stmt.match(/\.setBlock(?:AndUpdate)?\s*\(([^,]+),([^,]+)/);
    const posExpr = setMatch ? setMatch[1].trim() : 'pos';
    const stateExpr = setMatch ? setMatch[2].trim() : 'state';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'block_add', explanation: 'Place block in world at position' });
    return {
      id: `block_add_${idSeq}`,
      type: 'block_add',
      category: 'block',
      title: 'Place block at',
      values: [
        { name: 'block', block: parseExpressionToAST(stateExpr, idSeq * 10 + 1) },
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
    };
  }

  // 13. WORLD DESTROY BLOCK: world.destroyBlock(...) / world.removeBlock(...)
  if (stmt.includes('.destroyBlock(') || stmt.includes('.removeBlock(')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'block_remove', explanation: 'Destroy block at position' });
    return {
      id: `block_rem_${idSeq}`,
      type: 'block_remove',
      category: 'block',
      title: 'Remove block at',
      values: [
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
    };
  }

  // 14. PLAY SOUND
  if (stmt.includes('playSound') || stmt.includes('play_sound')) {
    const soundMatch = stmt.match(/playSound\(([^)]+)\)/);
    const params = soundMatch ? soundMatch[1].split(',').map(s => s.trim()) : [];
    const soundName = params[0] ? params[0].replace(/"/g, '') : 'wood_creak_paranoia';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'play_sound', explanation: `Play sound '${soundName}'` });
    return {
      id: `play_sound_${idSeq}`,
      type: 'play_sound',
      category: 'world',
      title: 'Play sound',
      fields: { sound: soundName, soundcategory: params[6] ? params[6].replace(/"/g, '') : 'ambient' },
      values: [
        { name: 'x', block: parseExpressionToAST(params[1] || 'x', idSeq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(params[2] || 'y', idSeq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(params[3] || 'z', idSeq * 10 + 3) },
        { name: 'level', block: parseExpressionToAST(params[4] || '1', idSeq * 10 + 4) },
        { name: 'pitch', block: parseExpressionToAST(params[5] || '1', idSeq * 10 + 5) },
      ],
    };
  }

  // 15. HEAL / SET HEALTH
  if (stmt.includes('.heal(') || stmt.includes('.setHealth(')) {
    const amtMatch = stmt.match(/(?:heal|setHealth)\(([^)]+)\)/);
    const amtExpr = amtMatch ? amtMatch[1].trim() : '1';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_set_health', explanation: 'Set entity health or heal' });
    return {
      id: `heal_${idSeq}`,
      type: 'entity_set_health',
      category: 'action',
      title: 'Set health / Heal',
      values: [
        { name: 'health', block: parseExpressionToAST(amtExpr, idSeq * 10 + 1) },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      ],
    };
  }

  // 16. ADD POTION / EFFECT
  if (stmt.includes('.addEffect(') || stmt.includes('MobEffectInstance')) {
    const potMatch = stmt.match(/MobEffectInstance\(([^,]+),([^,]+),?([^)]*)\)/);
    const potType = potMatch ? potMatch[1].trim() : 'MobEffects.REGENERATION';
    const durExpr = potMatch ? potMatch[2].trim() : '60';
    const lvlExpr = potMatch && potMatch[3] ? potMatch[3].trim() : '0';
    const cleanPot = potType.replace(/MobEffects\./, '').toLowerCase();

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_add_potion', explanation: 'Add potion effect to entity' });
    return {
      id: `potion_${idSeq}`,
      type: 'entity_add_potion',
      category: 'action',
      title: 'Add potion effect',
      fields: { potion: cleanPot },
      values: [
        { name: 'level', block: parseExpressionToAST(lvlExpr, idSeq * 10 + 1) },
        { name: 'duration', block: parseExpressionToAST(durExpr, idSeq * 10 + 2) },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      ],
    };
  }

  // 17. SET DELTA MOVEMENT / VELOCITY
  if (stmt.includes('.setDeltaMovement(')) {
    const vecMatch = stmt.match(/setDeltaMovement\(([\s\S]+)\);?$/);
    const vecExpr = vecMatch ? vecMatch[1].trim() : 'new Vec3(0, 0, 0)';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `set_mov_${idSeq}`, mcreatorBlock: 'entity_set_movement', explanation: 'Set entity velocity movement vector' });
    return {
      id: `set_mov_${idSeq}`,
      type: 'entity_set_movement',
      category: 'entity',
      title: 'Set velocity',
      values: [
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
        { name: 'vx', block: parseExpressionToAST(vecExpr, idSeq * 10 + 1) },
      ],
    };
  }

  // 18. ITEM PROCEDURES & STACK MANIPULATIONS
  // 18.1 ITEM SHRINK
  if (stmt.includes('.shrink(')) {
    const amtMatch = stmt.match(/shrink\(([^)]+)\)/);
    const amt = amtMatch ? amtMatch[1].trim() : '1';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `shrink_${idSeq}`, mcreatorBlock: 'itemstack_shrink', explanation: 'Shrink itemstack count' });
    return {
      id: `shrink_${idSeq}`,
      type: 'itemstack_shrink',
      category: 'item',
      title: 'Shrink itemstack',
      values: [
        { name: 'item', block: { id: `item_${idSeq}`, type: 'provided_itemstack', category: 'item', title: 'Provided itemstack' } },
        { name: 'amount', block: parseExpressionToAST(amt, idSeq * 10 + 1) },
      ],
    };
  }

  // 18.2 ITEM GROW
  if (stmt.includes('.grow(')) {
    const amtMatch = stmt.match(/grow\(([^)]+)\)/);
    const amt = amtMatch ? amtMatch[1].trim() : '1';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `grow_${idSeq}`, mcreatorBlock: 'itemstack_grow', explanation: 'Grow itemstack count' });
    return {
      id: `grow_${idSeq}`,
      type: 'itemstack_grow',
      category: 'item',
      title: 'Grow itemstack',
      values: [
        { name: 'item', block: { id: `item_${idSeq}`, type: 'provided_itemstack', category: 'item', title: 'Provided itemstack' } },
        { name: 'amount', block: parseExpressionToAST(amt, idSeq * 10 + 1) },
      ],
    };
  }

  // 18.3 ITEM SET COUNT
  if (stmt.includes('.setCount(') && !stmt.includes('_setstack')) {
    const amtMatch = stmt.match(/setCount\(([^)]+)\)/);
    const amt = amtMatch ? amtMatch[1].trim() : '1';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.setCount/);
    const targetName = targetMatch ? targetMatch[1] : 'itemstack';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `set_cnt_${idSeq}`, mcreatorBlock: 'item_set_count', explanation: 'Set itemstack count' });
    return {
      id: `set_cnt_${idSeq}`,
      type: 'item_set_count',
      category: 'item',
      title: 'Set item count',
      values: [
        { name: 'item', block: parseExpressionToAST(targetName, idSeq * 10 + 1) },
        { name: 'amount', block: parseExpressionToAST(amt, idSeq * 10 + 2) },
      ],
    };
  }

  // 18.4 ITEM SET DAMAGE / DAMAGE ITEM
  if (stmt.includes('.setDamageValue(') || stmt.includes('.setDamage(')) {
    const dmgMatch = stmt.match(/(?:setDamageValue|setDamage)\(([^)]+)\)/);
    const dmg = dmgMatch ? dmgMatch[1].trim() : '1';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.(?:setDamageValue|setDamage)/);
    const targetName = targetMatch ? targetMatch[1] : 'itemstack';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `set_dmg_${idSeq}`, mcreatorBlock: 'item_set_damage', explanation: 'Set item damage value' });
    return {
      id: `set_dmg_${idSeq}`,
      type: 'item_set_damage',
      category: 'item',
      title: 'Set damage of item',
      values: [
        { name: 'item', block: parseExpressionToAST(targetName, idSeq * 10 + 1) },
        { name: 'amount', block: parseExpressionToAST(dmg, idSeq * 10 + 2) },
      ],
    };
  }

  if (stmt.includes('.hurtAndBreak(')) {
    const dmgMatch = stmt.match(/hurtAndBreak\(([^,]+),/);
    const dmg = dmgMatch ? dmgMatch[1].trim() : '1';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.hurtAndBreak/);
    const targetName = targetMatch ? targetMatch[1] : 'itemstack';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `hurt_break_${idSeq}`, mcreatorBlock: 'item_damage', explanation: 'Deal damage to itemstack' });
    return {
      id: `hurt_break_${idSeq}`,
      type: 'item_damage',
      category: 'item',
      title: 'Damage itemstack',
      values: [
        { name: 'item', block: parseExpressionToAST(targetName, idSeq * 10 + 1) },
        { name: 'amount', block: parseExpressionToAST(dmg, idSeq * 10 + 2) },
      ],
    };
  }

  // 18.5 ITEM SET DISPLAY NAME / RESET NAME
  if (stmt.includes('.setHoverName(')) {
    const nameMatch = stmt.match(/setHoverName\(([^)]+)\)/);
    const nameExpr = nameMatch ? nameMatch[1].trim() : 'Component.literal("Name")';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.setHoverName/);
    const targetName = targetMatch ? targetMatch[1] : 'itemstack';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `set_name_${idSeq}`, mcreatorBlock: 'item_set_display_name', explanation: 'Set item display name' });
    return {
      id: `set_name_${idSeq}`,
      type: 'item_set_display_name',
      category: 'item',
      title: 'Set display name of item',
      values: [
        { name: 'item', block: parseExpressionToAST(targetName, idSeq * 10 + 1) },
        { name: 'name', block: parseExpressionToAST(nameExpr, idSeq * 10 + 2) },
      ],
    };
  }

  if (stmt.includes('.resetHoverName()')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.resetHoverName/);
    const targetName = targetMatch ? targetMatch[1] : 'itemstack';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `rst_name_${idSeq}`, mcreatorBlock: 'item_reset_display_name', explanation: 'Reset item display name' });
    return {
      id: `rst_name_${idSeq}`,
      type: 'item_reset_display_name',
      category: 'item',
      title: 'Reset display name of item',
      values: [
        { name: 'item', block: parseExpressionToAST(targetName, idSeq * 10 + 1) },
      ],
    };
  }

  // 18.6 ITEM ENCHANT / ADD ENHANCEMENT
  if (stmt.includes('.enchant(')) {
    const enchMatch = stmt.match(/enchant\(([^,]+),([^)]+)\)/);
    const ench = enchMatch ? enchMatch[1].trim() : 'Enchantments.SHARPNESS';
    const lvl = enchMatch ? enchMatch[2].trim() : '1';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.enchant/);
    const targetName = targetMatch ? targetMatch[1] : 'itemstack';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `ench_${idSeq}`, mcreatorBlock: 'item_add_enhancement', explanation: 'Add enchantment to item' });
    return {
      id: `ench_${idSeq}`,
      type: 'item_add_enhancement',
      category: 'item',
      title: 'Add enchantment to item',
      values: [
        { name: 'item', block: parseExpressionToAST(targetName, idSeq * 10 + 1) },
        { name: 'enhancement', block: parseExpressionToAST(ench, idSeq * 10 + 2) },
        { name: 'level', block: parseExpressionToAST(lvl, idSeq * 10 + 3) },
      ],
    };
  }

  // 18.7 ENTITY SET HAND / ARMOR ITEM
  if (stmt.includes('.setItemInHand(') || stmt.includes('.setItemSlot(')) {
    const isMain = stmt.includes('MAIN_HAND');
    const isOff = stmt.includes('OFF_HAND');
    const itemMatch = stmt.match(/(?:setItemInHand|setItemSlot)\([^,]+,\s*([\s\S]+?)\);?$/);
    const itemExpr = itemMatch ? itemMatch[1].trim() : 'ItemStack.EMPTY';
    const blockType = isMain ? 'entity_set_mainhand_item' : isOff ? 'entity_set_offhand_item' : 'entity_set_armor_slot_item';
    const title = isMain ? 'Set item in main hand' : isOff ? 'Set item in off hand' : 'Set armor slot item';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `set_hand_${idSeq}`, mcreatorBlock: blockType, explanation: title });
    return {
      id: `set_hand_${idSeq}`,
      type: blockType,
      category: 'item',
      title,
      values: [
        { name: 'item', block: parseExpressionToAST(itemExpr, idSeq * 10 + 1) },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      ],
    };
  }

  // 18.8 ENTITY ADD ITEM TO INVENTORY
  if (stmt.includes('.addItem(') || (stmt.includes('getInventory().add(') && !stmt.includes('getCooldowns'))) {
    const itemMatch = stmt.match(/(?:addItem|getInventory\(\)\.add)\(([\s\S]+?)\);?$/);
    const itemExpr = itemMatch ? itemMatch[1].trim() : 'ItemStack.EMPTY';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `add_item_${idSeq}`, mcreatorBlock: 'entity_add_item', explanation: 'Add item to entity inventory' });
    return {
      id: `add_item_${idSeq}`,
      type: 'entity_add_item',
      category: 'item',
      title: 'Add item to entity inventory',
      values: [
        { name: 'item', block: parseExpressionToAST(itemExpr, idSeq * 10 + 1) },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      ],
    };
  }

  // 18.9 ITEM COOLDOWN SET
  if (stmt.includes('getCooldowns().addCooldown(')) {
    const cdMatch = stmt.match(/addCooldown\(([^,]+),([^)]+)\)/);
    const itemExpr = cdMatch ? cdMatch[1].trim() : 'itemstack.getItem()';
    const ticksExpr = cdMatch ? cdMatch[2].trim() : '20';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `item_cd_${idSeq}`, mcreatorBlock: 'item_cooldown_for', explanation: 'Set item cooldown for player' });
    return {
      id: `item_cd_${idSeq}`,
      type: 'item_cooldown_for',
      category: 'item',
      title: 'Set cooldown for item',
      values: [
        { name: 'item', block: parseExpressionToAST(itemExpr, idSeq * 10 + 1) },
        { name: 'ticks', block: parseExpressionToAST(ticksExpr, idSeq * 10 + 2) },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      ],
    };
  }

  // 19. SEND CHAT / SYSTEM MESSAGE
  if (stmt.includes('displayClientMessage') || stmt.includes('sendSystemMessage')) {
    const msgMatch = stmt.match(/Component\.(?:literal|translatable)\(([^)]+)\)/);
    const msg = msgMatch ? msgMatch[1].trim() : '"Message"';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_send_chat', explanation: 'Send chat message to player' });
    return {
      id: `chat_${idSeq}`,
      type: 'entity_send_chat',
      category: 'action',
      title: 'Send Chat Message',
      values: [
        { name: 'text', block: parseExpressionToAST(msg, idSeq * 10 + 1) },
        { name: 'actbar', block: { id: `actbar_${idSeq}`, type: 'logic_boolean', category: 'logic', title: 'false', fields: { BOOL: 'FALSE' } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      ],
    };
  }

  // 20. CANCEL EVENT & EVENT RESULTS
  if (stmt.includes('setCanceled(true)') || stmt.includes('cancel()')) {
    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `cancel_${idSeq}`, mcreatorBlock: 'cancel_event', explanation: 'Cancel cancellable event' });
    return {
      id: `cancel_${idSeq}`,
      type: 'cancel_event',
      category: 'damage',
      title: 'Cancel event',
    };
  }

  if (stmt.includes('.setResult(')) {
    const resMatch = stmt.match(/setResult\((?:Result\.)?([A-Za-z0-9_]+)\)/);
    const resultType = resMatch ? resMatch[1] : 'DEFAULT';
    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `set_res_${idSeq}`, mcreatorBlock: 'set_event_result', explanation: `Set event result to ${resultType}` });
    return {
      id: `set_res_${idSeq}`,
      type: 'set_event_result',
      category: 'advanced',
      title: 'Set result of global trigger event',
      fields: { result: resultType },
    };
  }

  // 20.1 DIRECTION LOOPS: for (Direction directioniterator : Direction.values())
  if (stmt.includes('Direction.values()') || stmt.includes('Direction.Plane.HORIZONTAL')) {
    const isHorizontal = stmt.includes('HORIZONTAL');
    const body = extractBlockBody(stmt);
    const innerStmts = splitIntoStatements(body);
    const innerNodes = innerStmts
      .map((s, idx) => parseJavaStatement(s, idSeq * 100 + idx, variables, breakdown, elementType))
      .filter((n): n is BlockASTNode => n !== null);

    const blockType = isHorizontal ? 'direction_for_each_horizontal' : 'direction_for_each';
    const title = isHorizontal ? 'For each horizontal direction' : 'For each direction';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `dir_loop_${idSeq}`, mcreatorBlock: blockType, explanation: `${title} as Direction iterator` });
    return {
      id: `dir_loop_${idSeq}`,
      type: blockType,
      category: 'direction',
      title: `${title} as [Direction iterator]`,
      fields: { VAR: 'directioniterator' },
      statements: [{ name: 'DO', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
    };
  }

  // 20.2 COMMAND ENTITY ITERATOR: for (Entity entityiterator : EntityArgument.getEntities(arguments, "name"))
  if (stmt.includes('EntityArgument.getEntities(') || (stmt.includes('getEntities(') && stmt.includes('arguments'))) {
    const nameMatch = stmt.match(/getEntities\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = nameMatch ? nameMatch[1] : 'name';
    const body = extractBlockBody(stmt);
    const innerStmts = splitIntoStatements(body);
    const innerNodes = innerStmts
      .map((s, idx) => parseJavaStatement(s, idSeq * 100 + idx, variables, breakdown, elementType))
      .filter((n): n is BlockASTNode => n !== null);

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `cmd_ent_loop_${idSeq}`, mcreatorBlock: 'entity_iterator_cmdarg', explanation: `For each entity in command param '${paramName}'` });
    return {
      id: `cmd_ent_loop_${idSeq}`,
      type: 'entity_iterator_cmdarg',
      category: 'command',
      title: `For each entity provided by command parameter [${paramName}]`,
      fields: { name: paramName },
      statements: [{ name: 'DO', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
    };
  }

  // 20.3 PROJECTILE SHOOT STATEMENTS
  if (stmt.includes('.shootFromRotation(') || stmt.includes('Projectiles.shoot(') || (stmt.includes('.shoot(') && !stmt.includes('sound'))) {
    const hasPos = stmt.includes('.setPos(') || stmt.includes('shootFromPos');
    const blockType = hasPos ? 'projectile_shoot_from_pos' : 'projectile_shoot_from_entity';
    const title = hasPos ? 'Shoot projectile from position' : 'Shoot projectile from entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `proj_shoot_${idSeq}`, mcreatorBlock: blockType, explanation: title });
    return {
      id: `proj_shoot_${idSeq}`,
      type: blockType,
      category: 'projectile',
      title,
      values: [
        { name: 'projectile', block: { id: `proj_ent_${idSeq}`, type: 'projectile_arrow', category: 'projectile', title: 'Arrow' } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
        { name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'inaccuracy', block: { id: `inacc_${idSeq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
      ],
    };
  }

  // 20.4 SLOT & GUI STATEMENTS
  if (stmt.includes('gui_clear_slot') || (stmt.includes('.getSlot(') && stmt.includes('ItemStack.EMPTY'))) {
    const slotMatch = stmt.match(/getSlot\s*\(\s*([0-9]+)\s*\)/);
    const slotNum = slotMatch ? slotMatch[1] : '0';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_clr_${idSeq}`, mcreatorBlock: 'gui_clear_slot', explanation: `Clear GUI slot ${slotNum}` });
    return {
      id: `gui_clr_${idSeq}`,
      type: 'gui_clear_slot',
      category: 'gui',
      title: `Clear slot [${slotNum}] of current GUI`,
      values: [
        { name: 'slotid', block: { id: `slot_${idSeq}`, type: 'math_number', category: 'math', title: slotNum, fields: { NUM: slotNum } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (stmt.includes('gui_set_items') || (stmt.includes('.getSlot(') && stmt.includes('.set(') && !stmt.includes('ItemStack.EMPTY'))) {
    const slotMatch = stmt.match(/getSlot\s*\(\s*([0-9]+)\s*\)/);
    const slotNum = slotMatch ? slotMatch[1] : '0';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_set_${idSeq}`, mcreatorBlock: 'gui_set_items', explanation: `Set items in GUI slot ${slotNum}` });
    return {
      id: `gui_set_${idSeq}`,
      type: 'gui_set_items',
      category: 'gui',
      title: `Set items in slot [${slotNum}] of current GUI`,
      values: [
        { name: 'amount', block: { id: `amt_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'item', block: { id: `item_${idSeq}`, type: 'mcitem_all', category: 'item', title: 'Item' } },
        { name: 'slotid', block: { id: `slot_${idSeq}`, type: 'math_number', category: 'math', title: slotNum, fields: { NUM: slotNum } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (stmt.includes('gui_remove_items') || (stmt.includes('.getSlot(') && stmt.includes('.remove('))) {
    const slotMatch = stmt.match(/getSlot\s*\(\s*([0-9]+)\s*\)/);
    const slotNum = slotMatch ? slotMatch[1] : '0';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_rem_${idSeq}`, mcreatorBlock: 'gui_remove_items', explanation: `Remove items from GUI slot ${slotNum}` });
    return {
      id: `gui_rem_${idSeq}`,
      type: 'gui_remove_items',
      category: 'gui',
      title: `Remove items from slot [${slotNum}] of current GUI`,
      values: [
        { name: 'amount', block: { id: `amt_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'slotid', block: { id: `slot_${idSeq}`, type: 'math_number', category: 'math', title: slotNum, fields: { NUM: slotNum } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (stmt.includes('gui_damage_item_in_slot') || (stmt.includes('.getSlot(') && stmt.includes('hurtAndBreak'))) {
    const slotMatch = stmt.match(/getSlot\s*\(\s*([0-9]+)\s*\)/);
    const slotNum = slotMatch ? slotMatch[1] : '0';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_dmg_${idSeq}`, mcreatorBlock: 'gui_damage_item_in_slot', explanation: `Damage item in GUI slot ${slotNum}` });
    return {
      id: `gui_dmg_${idSeq}`,
      type: 'gui_damage_item_in_slot',
      category: 'gui',
      title: `Deal damage to item in slot [${slotNum}] of current GUI`,
      values: [
        { name: 'amount', block: { id: `amt_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'slotid', block: { id: `slot_${idSeq}`, type: 'math_number', category: 'math', title: slotNum, fields: { NUM: slotNum } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (stmt.includes('gui_set_text_textfield') || (stmt.includes('EditBox') && stmt.includes('.setValue('))) {
    const nameMatch = stmt.match(/setValue\s*\("([^"]+)"\)/) || stmt.match(/"([^"]+)"/);
    const widgetName = nameMatch ? nameMatch[1] : 'textFieldName';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_txt_${idSeq}`, mcreatorBlock: 'gui_set_text_textfield', explanation: `Set GUI textfield '${widgetName}'` });
    return {
      id: `gui_txt_${idSeq}`,
      type: 'gui_set_text_textfield',
      category: 'gui',
      title: `Set text inside textfield [${widgetName}]`,
      fields: { textfield: widgetName },
      values: [
        { name: 'text', block: { id: `txt_${idSeq}`, type: 'text', category: 'text', title: '"text"', fields: { TEXT: 'text' } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (stmt.includes('gui_set_value_slider') || (stmt.includes('Slider') && stmt.includes('.setValue('))) {
    const nameMatch = stmt.match(/"([^"]+)"/);
    const sliderName = nameMatch ? nameMatch[1] : 'sliderName';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_sld_${idSeq}`, mcreatorBlock: 'gui_set_value_slider', explanation: `Set GUI slider '${sliderName}'` });
    return {
      id: `gui_sld_${idSeq}`,
      type: 'gui_set_value_slider',
      category: 'gui',
      title: `Set value of slider [${sliderName}]`,
      fields: { slider: sliderName },
      values: [
        { name: 'value', block: { id: `val_${idSeq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (stmt.includes('gui_set_checkbox') || (stmt.includes('Checkbox') && stmt.includes('setSelected('))) {
    const nameMatch = stmt.match(/"([^"]+)"/);
    const boxName = nameMatch ? nameMatch[1] : 'checkBoxName';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `gui_chk_${idSeq}`, mcreatorBlock: 'gui_set_checkbox', explanation: `Set GUI checkbox '${boxName}'` });
    return {
      id: `gui_chk_${idSeq}`,
      type: 'gui_set_checkbox',
      category: 'gui',
      title: `Set checkbox [${boxName}] checked state`,
      fields: { checkbox: boxName },
      values: [
        { name: 'value', block: { id: `chk_val_${idSeq}`, type: 'logic_boolean', category: 'logic', title: 'true', fields: { BOOL: 'TRUE' } } },
        { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  // 20.45 DEBUG MARKER & COMMENTS
  if (stmt.includes('Debug marker:') || stmt.includes('debugMarker(') || stmt.startsWith('// MCreator: marker')) {
    const markerMatch = stmt.match(/marker[0-9A-Za-z_]*/i) || stmt.match(/"([^"]+)"/);
    const markerName = markerMatch ? markerMatch[1] || markerMatch[0] : 'marker1';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `dbg_${idSeq}`, mcreatorBlock: 'debug_marker', explanation: `Debug marker: ${markerName}` });
    return {
      id: `dbg_${idSeq}`,
      type: 'debug_marker',
      category: 'advanced',
      title: `Debug marker: [${markerName}]`,
      fields: { name: markerName },
    };
  }

  // 20.5 CALL PROCEDURE: e.g. SomeProcedure.execute(world, x, y, z, entity);
  const callProcMatch = stmt.match(/^([A-Za-z0-9_]+)\.execute\s*\(([\s\S]*)\)\s*;?$/);
  if (callProcMatch && !stmt.startsWith('this.') && !stmt.startsWith('super.')) {
    const rawProcClass = callProcMatch[1];
    const procName = rawProcClass.replace(/Procedure$/, '');
    const rawArgs = callProcMatch[2].trim();

    const depValues: { name: string; block?: BlockASTNode }[] = [];
    if (rawArgs) {
      const argList = rawArgs.startsWith('Map.of(')
        ? rawArgs.substring(7, rawArgs.length - 1).split(',').map(s => s.trim())
        : rawArgs.split(',').map(s => s.trim());

      argList.forEach((arg, aIdx) => {
        if (!arg) return;
        depValues.push({
          name: `dep_${aIdx}`,
          block: parseExpressionToAST(arg, idSeq * 100 + aIdx + 1),
        });
      });
    }

    breakdown.push({
      javaLine: stmt,
      lineNumber: startLine,
      blockId: `call_proc_${idSeq}`,
      mcreatorBlock: 'call_procedure',
      explanation: `Calls procedure '${procName}' with passed dependencies`,
    });

    return {
      id: `call_proc_${idSeq}`,
      type: 'call_procedure',
      category: 'action',
      title: `Call procedure: ${procName}`,
      fields: { procedure: procName },
      values: depValues.length > 0 ? depValues : undefined,
    };
  }

  // 21. FALLBACK CUSTOM CODE SNIPPET (Statement snippet with top notch and bottom tab)
  breakdown.push({
    javaLine: stmt,
    lineNumber: startLine,
    blockId: `snippet_${idSeq}`,
    mcreatorBlock: 'custom_code_snippet',
    explanation: 'Preserved verbatim unsupported Java statement fragment (Statement snippet)',
  });
  return {
    id: `snippet_${idSeq}`,
    type: 'custom_code_snippet',
    category: 'code',
    title: 'Custom code snippet (Statement)',
    fields: { CODE: stmt },
  };
}

/* -------------------------------------------------------------------------- */
/*                       Compound Control Structures                          */
/* -------------------------------------------------------------------------- */

function parseIfBranches(stmt: string): { branches: { cond: string; body: string }[]; elseBody: string | null } {
  const branches: { cond: string; body: string }[] = [];
  let elseBody: string | null = null;
  let remaining = stmt.trim();

  while (remaining.startsWith('if') || remaining.startsWith('else if') || remaining.startsWith('else')) {
    if (remaining.startsWith('else if')) {
      remaining = remaining.substring(7).trim();
    } else if (remaining.startsWith('if')) {
      remaining = remaining.substring(2).trim();
    } else if (remaining.startsWith('else')) {
      remaining = remaining.substring(4).trim();
      if (remaining.startsWith('{')) {
        elseBody = extractBlockBody(remaining);
      } else {
        elseBody = remaining.replace(/;$/, '').trim();
      }
      break;
    }

    if (!remaining.startsWith('(')) break;

    let pDepth = 0;
    let condEnd = -1;
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i] === '(') pDepth++;
      else if (remaining[i] === ')') {
        pDepth--;
        if (pDepth === 0) { condEnd = i; break; }
      }
    }

    if (condEnd === -1) break;
    const cond = remaining.substring(1, condEnd).trim();
    remaining = remaining.substring(condEnd + 1).trim();

    let branchBody = '';
    if (remaining.startsWith('{')) {
      branchBody = extractBlockBody(remaining);
      const closeBraceIdx = findMatchingBrace(remaining);
      remaining = closeBraceIdx !== -1 ? remaining.substring(closeBraceIdx + 1).trim() : '';
    } else {
      const semiIdx = remaining.indexOf(';');
      if (semiIdx !== -1) {
        branchBody = remaining.substring(0, semiIdx + 1).trim();
        remaining = remaining.substring(semiIdx + 1).trim();
      } else {
        branchBody = remaining;
        remaining = '';
      }
    }

    branches.push({ cond, body: branchBody });
  }

  if (branches.length === 0) {
    branches.push({ cond: 'true', body: extractBlockBody(stmt) });
  }

  return { branches, elseBody };
}

function findMatchingBrace(code: string): number {
  const start = code.indexOf('{');
  if (start === -1) return -1;
  let depth = 0;
  let inString = false;
  let stringChar = '';
  for (let i = start; i < code.length; i++) {
    const ch = code[i];
    if (!inString && (ch === '"' || ch === "'")) {
      inString = true;
      stringChar = ch;
    } else if (inString && ch === stringChar && code[i - 1] !== '\\') {
      inString = false;
    } else if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

function parseIfStatement(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: { javaLine: string; lineNumber?: number; blockId?: string; mcreatorBlock: string; explanation: string }[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode {
  const { branches, elseBody } = parseIfBranches(stmt);

  const ifValues: { name: string; block?: BlockASTNode }[] = [];
  const ifStatements: { name: string; block?: BlockASTNode }[] = [];

  branches.forEach((branch, idx) => {
    const condAST = parseExpressionToAST(branch.cond, idSeq * 100 + idx * 10 + 1);
    if (startLine !== undefined) condAST.sourceLine = startLine;
    ifValues.push({ name: `IF${idx}`, block: condAST });

    // Calculate line offset for branch body
    let bodyLine = startLine !== undefined ? startLine : undefined;
    if (startLine !== undefined && branch.body) {
      const branchBodyIdx = stmt.indexOf(branch.body);
      if (branchBodyIdx !== -1) {
        const linesBefore = stmt.substring(0, branchBodyIdx).split('\n').length - 1;
        bodyLine = startLine + linesBefore;
      }
    }

    const innerStmts = splitStatementsWithLocations(branch.body, bodyLine);
    const innerNodes = innerStmts
      .map((s, sIdx) => parseJavaStatement(s.text, idSeq * 1000 + idx * 100 + sIdx, variables, breakdown, elementType, s.startLine, s.endLine))
      .filter((n): n is BlockASTNode => n !== null);

    ifStatements.push({
      name: `DO${idx}`,
      block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined,
    });
  });

  if (elseBody !== null && elseBody.trim().length > 0) {
    let elseLine = startLine !== undefined ? startLine : undefined;
    if (startLine !== undefined) {
      const elseBodyIdx = stmt.lastIndexOf(elseBody);
      if (elseBodyIdx !== -1) {
        const linesBefore = stmt.substring(0, elseBodyIdx).split('\n').length - 1;
        elseLine = startLine + linesBefore;
      }
    }

    const elseStmts = splitStatementsWithLocations(elseBody, elseLine);
    const elseNodes = elseStmts
      .map((s, sIdx) => parseJavaStatement(s.text, idSeq * 9000 + sIdx, variables, breakdown, elementType, s.startLine, s.endLine))
      .filter((n): n is BlockASTNode => n !== null);

    ifStatements.push({
      name: 'ELSE',
      block: elseNodes.length > 0 ? chainNodes(elseNodes) : undefined,
    });
  }

  breakdown.push({
    javaLine: `if (${branches[0]?.cond || 'condition'})`,
    lineNumber: startLine,
    blockId: `if_${idSeq}`,
    mcreatorBlock: 'controls_if',
    explanation: `Conditional branch with ${branches.length} condition(s)${elseBody ? ' and else clause' : ''}`,
  });

  return {
    id: `if_${idSeq}`,
    type: 'controls_if',
    category: 'control',
    title: 'if',
    sourceLine: startLine,
    sourceEndLine: endLine,
    values: ifValues,
    statements: ifStatements,
  };
}

function parseForLoopStatement(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: { javaLine: string; lineNumber?: number; blockId?: string; mcreatorBlock: string; explanation: string }[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode {
  const headerMatch = stmt.match(/^for\s*\(([\s\S]+?)\)\s*\{/);
  const header = headerMatch ? headerMatch[1].trim() : '';
  const body = extractBlockBody(stmt);

  let bodyLine = startLine !== undefined ? startLine : undefined;
  if (startLine !== undefined && body) {
    const bodyIdx = stmt.indexOf(body);
    if (bodyIdx !== -1) {
      const linesBefore = stmt.substring(0, bodyIdx).split('\n').length - 1;
      bodyLine = startLine + linesBefore;
    }
  }

  const innerStmts = splitStatementsWithLocations(body, bodyLine);
  const innerNodes = innerStmts
    .map((s, idx) => parseJavaStatement(s.text, idSeq * 100 + idx, variables, breakdown, elementType, s.startLine, s.endLine))
    .filter((n): n is BlockASTNode => n !== null);

  // Check if standard indexed for: for (int i = 0; i < N; i++)
  if (header.includes(';')) {
    const parts = header.split(';').map(p => p.trim());
    const initPart = parts[0] || 'int i = 0';
    const condPart = parts[1] || 'i < 10';
    const incPart = parts[2] || 'i++';

    const varMatch = initPart.match(/(?:int|float|double)?\s*([a-zA-Z0-9_]+)\s*=\s*([\s\S]+)/);
    const varName = varMatch ? varMatch[1] : 'i';
    const fromVal = varMatch ? varMatch[2] : '0';

    let toVal = '10';
    if (condPart.includes('<=')) {
      toVal = condPart.split('<=')[1].trim();
    } else if (condPart.includes('<')) {
      const right = condPart.split('<')[1].trim();
      toVal = right;
    }

    let byVal = '1';
    if (incPart.includes('+=') || incPart.includes('-=')) {
      byVal = incPart.split(/(\+=|-=)/)[2].trim();
    }

    breakdown.push({ javaLine: `for (${header})`, lineNumber: startLine, blockId: `for_${idSeq}`, mcreatorBlock: 'controls_for', explanation: `Count with variable '${varName}' from ${fromVal} to ${toVal}` });
    return {
      id: `for_${idSeq}`,
      type: 'controls_for',
      category: 'control',
      title: 'Count with variable',
      sourceLine: startLine,
      sourceEndLine: endLine,
      fields: { VAR: `local:${varName}` },
      values: [
        { name: 'FROM', block: parseExpressionToAST(fromVal, idSeq * 10 + 1) },
        { name: 'TO', block: parseExpressionToAST(toVal, idSeq * 10 + 2) },
        { name: 'BY', block: parseExpressionToAST(byVal, idSeq * 10 + 3) },
      ],
      statements: [{ name: 'DO', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
    };
  }

  // Enhanced for-each loop: for (Entity e : list)
  if (header.includes(':')) {
    const parts = header.split(':').map(p => p.trim());
    const varMatch = parts[0].match(/([a-zA-Z0-9_]+)\s*$/);
    const varName = varMatch ? varMatch[1] : 'item';
    const listExpr = parts[1];

    breakdown.push({ javaLine: `for (${header})`, lineNumber: startLine, blockId: `foreach_${idSeq}`, mcreatorBlock: 'controls_forEach', explanation: `For each '${varName}' in '${listExpr}'` });
    return {
      id: `foreach_${idSeq}`,
      type: 'controls_forEach',
      category: 'control',
      title: 'For each item in list',
      sourceLine: startLine,
      sourceEndLine: endLine,
      fields: { VAR: `local:${varName}` },
      values: [{ name: 'LIST', block: parseExpressionToAST(listExpr, idSeq * 10 + 1) }],
      statements: [{ name: 'DO', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
    };
  }

  // Generic repeat fallback
  return {
    id: `repeat_${idSeq}`,
    type: 'controls_repeat_ext',
    category: 'control',
    title: 'Repeat times',
    sourceLine: startLine,
    sourceEndLine: endLine,
    values: [{ name: 'TIMES', block: { id: `rep_num_${idSeq}`, type: 'math_number', category: 'math', title: '10', fields: { NUM: '10' } } }],
    statements: [{ name: 'DO', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
  };
}

function parseWhileStatement(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: { javaLine: string; lineNumber?: number; blockId?: string; mcreatorBlock: string; explanation: string }[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode {
  const condMatch = stmt.match(/^while\s*\(([\s\S]+?)\)\s*\{/);
  const condExpr = condMatch ? condMatch[1].trim() : 'true';
  const body = extractBlockBody(stmt);

  let bodyLine = startLine !== undefined ? startLine : undefined;
  if (startLine !== undefined && body) {
    const bodyIdx = stmt.indexOf(body);
    if (bodyIdx !== -1) {
      const linesBefore = stmt.substring(0, bodyIdx).split('\n').length - 1;
      bodyLine = startLine + linesBefore;
    }
  }

  const innerStmts = splitStatementsWithLocations(body, bodyLine);
  const innerNodes = innerStmts
    .map((s, idx) => parseJavaStatement(s.text, idSeq * 100 + idx, variables, breakdown, elementType, s.startLine, s.endLine))
    .filter((n): n is BlockASTNode => n !== null);

  breakdown.push({ javaLine: `while (${condExpr})`, lineNumber: startLine, blockId: `while_${idSeq}`, mcreatorBlock: 'controls_whileUntil', explanation: 'Repeat while condition is true' });
  return {
    id: `while_${idSeq}`,
    type: 'controls_whileUntil',
    category: 'control',
    title: 'Repeat while',
    sourceLine: startLine,
    sourceEndLine: endLine,
    fields: { MODE: 'WHILE' },
    values: [{ name: 'BOOL', block: parseExpressionToAST(condExpr, idSeq * 10 + 1) }],
    statements: [{ name: 'DO', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
  };
}

function parseAIGoalStatement(
  stmt: string,
  idSeq: number,
  breakdown: { javaLine: string; mcreatorBlock: string; explanation: string }[]
): BlockASTNode {
  if (stmt.includes('PanicGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_panic', explanation: 'Panic when attacked AI goal' });
    return {
      id: `ai_panic_${idSeq}`,
      type: 'aitask_panic',
      category: 'ai',
      title: 'Panic when attacked',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1.25', fields: { NUM: '1.25' } } }],
    };
  }

  if (stmt.includes('WaterAvoidingRandomStrollGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_wander_avoid_water', explanation: 'Wander avoiding water AI goal' });
    return {
      id: `ai_wander_w_${idSeq}`,
      type: 'aitask_wander_avoid_water',
      category: 'ai',
      title: 'Wander avoiding water',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1.0', fields: { NUM: '1.0' } } }],
    };
  }

  if (stmt.includes('RandomStrollGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_wander', explanation: 'Wander around AI goal' });
    return {
      id: `ai_wander_${idSeq}`,
      type: 'aitask_wander',
      category: 'ai',
      title: 'Wander around',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1.0', fields: { NUM: '1.0' } } }],
    };
  }

  if (stmt.includes('MeleeAttackGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_attack_on_collide', explanation: 'Melee attack on collide AI goal' });
    return {
      id: `ai_melee_${idSeq}`,
      type: 'aitask_attack_on_collide',
      category: 'ai',
      title: 'Melee attack on collide',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1.2', fields: { NUM: '1.2' } } }],
      fields: { longmemory: 'false' },
    };
  }

  if (stmt.includes('LookAtPlayerGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_look_at', explanation: 'Look at player AI goal' });
    return {
      id: `ai_look_p_${idSeq}`,
      type: 'aitask_look_at',
      category: 'ai',
      title: 'Look at player',
      fields: { entity: 'Player' },
      values: [{ name: 'radius', block: { id: `rad_${idSeq}`, type: 'math_number', category: 'math', title: '8', fields: { NUM: '8' } } }],
    };
  }

  if (stmt.includes('RandomLookAroundGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_look_around', explanation: 'Look around randomly AI goal' });
    return {
      id: `ai_look_rnd_${idSeq}`,
      type: 'aitask_look_around',
      category: 'ai',
      title: 'Look around randomly',
    };
  }

  if (stmt.includes('NearestAttackableTargetGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_target_nearest', explanation: 'Target nearest attackable entity goal' });
    return {
      id: `ai_tgt_near_${idSeq}`,
      type: 'aitask_target_nearest',
      category: 'ai',
      title: 'Target nearest entity',
      fields: { entity: 'Player', checkSight: 'true' },
    };
  }

  if (stmt.includes('HurtByTargetGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_target_hurt_by', explanation: 'Target attacker when hurt goal' });
    return {
      id: `ai_hurt_by_${idSeq}`,
      type: 'aitask_target_hurt_by',
      category: 'ai',
      title: 'Target attacker when hurt',
      fields: { callForHelp: 'false' },
    };
  }

  if (stmt.includes('FloatGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_swim', explanation: 'Float in water goal' });
    return {
      id: `ai_swim_${idSeq}`,
      type: 'aitask_swim',
      category: 'ai',
      title: 'Float in water',
    };
  }

  if (stmt.includes('LeapAtTargetGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_leap_at_target', explanation: 'Leap at target goal' });
    return {
      id: `ai_leap_${idSeq}`,
      type: 'aitask_leap_at_target',
      category: 'ai',
      title: 'Leap at target',
      values: [{ name: 'height', block: { id: `h_${idSeq}`, type: 'math_number', category: 'math', title: '0.4', fields: { NUM: '0.4' } } }],
    };
  }

  if (stmt.includes('AvoidEntityGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_avoid_entity', explanation: 'Avoid entity goal' });
    return {
      id: `ai_avoid_${idSeq}`,
      type: 'aitask_avoid_entity',
      category: 'ai',
      title: 'Avoid entity',
      fields: { entity: 'Player' },
      values: [
        { name: 'radius', block: { id: `rad_${idSeq}`, type: 'math_number', category: 'math', title: '16', fields: { NUM: '16' } } },
        { name: 'walkSpeed', block: { id: `ws_${idSeq}`, type: 'math_number', category: 'math', title: '1.0', fields: { NUM: '1.0' } } },
        { name: 'sprintSpeed', block: { id: `ss_${idSeq}`, type: 'math_number', category: 'math', title: '1.3', fields: { NUM: '1.3' } } },
      ],
    };
  }

  // Fallback AI snippet
  breakdown.push({ javaLine: stmt, mcreatorBlock: 'custom_code_snippet', explanation: 'Preserved AI goal definition' });
  return {
    id: `ai_custom_${idSeq}`,
    type: 'custom_code_snippet',
    category: 'ai',
    title: 'Custom AI Task Snippet',
    fields: { CODE: stmt },
  };
}

function parseReturnStatement(
  stmt: string,
  idSeq: number,
  breakdown: { javaLine: string; mcreatorBlock: string; explanation: string }[]
): BlockASTNode {
  const retValStr = stmt.replace(/^return\s*/, '').replace(/;$/, '').trim();

  if (!retValStr) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'controls_flow_statements', explanation: 'Exit procedure execution (return)' });
    return {
      id: `ret_${idSeq}`,
      type: 'controls_flow_statements',
      category: 'control',
      title: 'Return / Exit procedure',
      fields: { FLOW: 'BREAK' },
    };
  }

  let retvalType = 'return_logic';
  let title = 'Return logic:';

  if (retValStr === 'true' || retValStr === 'false') {
    retvalType = 'return_logic';
    title = 'Return logic:';
  } else if (!isNaN(Number(retValStr))) {
    retvalType = 'return_number';
    title = 'Return number:';
  } else if (retValStr.startsWith('"')) {
    retvalType = 'return_string';
    title = 'Return text:';
  } else if (retValStr.includes('entity') || retValStr.includes('player') || retValStr.includes('_ent')) {
    retvalType = 'return_entity';
    title = 'Return entity:';
  } else if (retValStr.includes('itemstack') || retValStr.includes('ItemStack')) {
    retvalType = 'return_itemstack';
    title = 'Return itemstack:';
  } else if (retValStr.includes('blockstate') || retValStr.includes('defaultBlockState()')) {
    retvalType = 'return_blockstate';
    title = 'Return blockstate:';
  } else if (retValStr.includes('damageSource') || retValStr.includes('DamageSource')) {
    retvalType = 'return_damagesource';
    title = 'Return damage source:';
  } else if (retValStr.includes('Direction')) {
    retvalType = 'return_direction';
    title = 'Return direction:';
  } else if (retValStr.includes('Vec3')) {
    retvalType = 'return_vector';
    title = 'Return vector:';
  } else if (retValStr.includes('InteractionResult') || retValStr.includes('SUCCESS') || retValStr.includes('PASS')) {
    retvalType = 'return_actionresulttype';
    title = 'Return action result:';
  }

  const retAST = parseExpressionToAST(retValStr || 'true', idSeq * 10);
  breakdown.push({ javaLine: stmt, mcreatorBlock: retvalType, explanation: title });
  return {
    id: `ret_${idSeq}`,
    type: retvalType,
    category: 'event',
    title,
    values: [{ name: 'return', block: retAST }],
  };
}

/* -------------------------------------------------------------------------- */
/*                     Recursive Expression Parser to AST                     */
/* -------------------------------------------------------------------------- */

export function parseExpressionToAST(rawExpr: string, seq: number): BlockASTNode {
  let expr = rawExpr.trim();

  // Strip trailing semicolon if present
  if (expr.endsWith(';')) {
    expr = expr.slice(0, -1).trim();
  }

  // Strip redundant outer parentheses: ( ... )
  while (expr.startsWith('(') && expr.endsWith(')')) {
    if (isEnclosedInParens(expr)) {
      expr = expr.substring(1, expr.length - 1).trim();
    } else {
      break;
    }
  }

  // Cast unwrapping: (float) expr, (int) expr, (double) expr
  const castMatch = expr.match(/^\((?:float|double|int|long)\)\s*([\s\S]+)$/);
  if (castMatch) {
    return parseExpressionToAST(castMatch[1].trim(), seq);
  }

  // 1. ENTITY DATA PARAMETER ACCESSORS (SYNCED DATA)
  // NeoForge 1.21.1 / 26.1.2:
  // (entity instanceof LignumPalusEntity _datEntI ? _datEntI.getEntityData().get(LignumPalusEntity.DATA_mouth_state) : 0)
  // (entity instanceof LignumPalusEntity _datEntL && _datEntL.getEntityData().get(LignumPalusEntity.DATA_mouth_state))
  const dataParamTernaryMatch = expr.match(
    /\(?\s*([a-zA-Z0-9_]+)\s+instanceof\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*\?\s*\3\.getEntityData\(\)\.get\(\s*\2\.DATA_([a-zA-Z0-9_]+)\s*\)\s*:\s*([^)]+)\)?/
  );
  if (dataParamTernaryMatch) {
    const rawEntity = dataParamTernaryMatch[1];
    const entityClass = dataParamTernaryMatch[2];
    const accessor = dataParamTernaryMatch[4];
    const fallbackVal = dataParamTernaryMatch[5].trim();

    const isString = fallbackVal === '""' || fallbackVal.startsWith('"');
    const blockType = isString ? 'entity_data_string_get' : 'entity_data_integer_get';
    const cleanEntityName = entityClass.replace(/Entity$/, '');

    return {
      id: `ent_data_${seq}`,
      type: blockType,
      category: isString ? 'text' : 'math',
      title: `For custom entity [${rawEntity}] of type [${cleanEntityName}] get ${isString ? 'string' : 'integer'} data parameter [${accessor}] value`,
      fields: {
        customEntity: `CUSTOM:${cleanEntityName}`,
        accessor: accessor,
      },
      values: [
        { name: 'entity', block: parseExpressionToAST(rawEntity, seq * 10 + 1) },
      ],
    };
  }

  // Logic data parameter: (entity instanceof LignumPalusEntity _datEntL && _datEntL.getEntityData().get(LignumPalusEntity.DATA_xxx))
  const dataParamLogicMatch = expr.match(
    /\(?\s*([a-zA-Z0-9_]+)\s+instanceof\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*&&\s*\3\.getEntityData\(\)\.get\(\s*\2\.DATA_([a-zA-Z0-9_]+)\s*\)\)?/
  );
  if (dataParamLogicMatch) {
    const rawEntity = dataParamLogicMatch[1];
    const entityClass = dataParamLogicMatch[2];
    const accessor = dataParamLogicMatch[4];
    const cleanEntityName = entityClass.replace(/Entity$/, '');

    return {
      id: `ent_data_logic_${seq}`,
      type: 'entity_data_logic_get',
      category: 'logic',
      title: `For custom entity [${rawEntity}] of type [${cleanEntityName}] get logic data parameter [${accessor}] value`,
      fields: {
        customEntity: `CUSTOM:${cleanEntityName}`,
        accessor: accessor,
      },
      values: [
        { name: 'entity', block: parseExpressionToAST(rawEntity, seq * 10 + 1) },
      ],
    };
  }

  // Standalone getEntityData().get(...)
  const directDataParamMatch = expr.match(
    /([a-zA-Z0-9_]+)\.getEntityData\(\)\.get\(\s*([a-zA-Z0-9_]+)\.DATA_([a-zA-Z0-9_]+)\s*\)/
  );
  if (directDataParamMatch) {
    const rawEntity = directDataParamMatch[1].replace(/^_datEnt[ILSC]?/, 'entity');
    const entityClass = directDataParamMatch[2];
    const accessor = directDataParamMatch[3];
    const cleanEntityName = entityClass.replace(/Entity$/, '');

    return {
      id: `ent_data_get_${seq}`,
      type: 'entity_data_integer_get',
      category: 'math',
      title: `For custom entity [${rawEntity}] of type [${cleanEntityName}] get integer data parameter [${accessor}] value`,
      fields: {
        customEntity: `CUSTOM:${cleanEntityName}`,
        accessor: accessor,
      },
      values: [
        { name: 'entity', block: parseExpressionToAST(rawEntity, seq * 10 + 1) },
      ],
    };
  }

  // 2. TEXT COMPARISON: a.equals(b) -> text_binary_ops (Blockly block: %1 = %2 with inputs A and B)
  const equalsMatch = expr.match(/^([\s\S]+?)\.equals\(([\s\S]+)\)$/);
  if (equalsMatch && !expr.includes('&&') && !expr.includes('||')) {
    const leftStr = equalsMatch[1].trim();
    const rightStr = equalsMatch[2].trim();

    return {
      id: `text_bin_${seq}`,
      type: 'text_binary_ops',
      category: 'text',
      title: '=',
      values: [
        { name: 'A', block: parseExpressionToAST(leftStr, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(rightStr, seq * 10 + 2) },
      ],
    };
  }

  // Ternary: cond ? then : else
  const ternaryIdx = findTopLevelOperator(expr, '?');
  if (ternaryIdx !== -1) {
    const colonIdx = findTopLevelOperator(expr.substring(ternaryIdx + 1), ':');
    if (colonIdx !== -1) {
      const cond = expr.substring(0, ternaryIdx).trim();
      const thenPart = expr.substring(ternaryIdx + 1, ternaryIdx + 1 + colonIdx).trim();
      const elsePart = expr.substring(ternaryIdx + 1 + colonIdx + 1).trim();

      return {
        id: `ternary_${seq}`,
        type: 'logic_ternary',
        category: 'control',
        title: 'If then else',
        values: [
          { name: 'IF', block: parseExpressionToAST(cond, seq * 10 + 1) },
          { name: 'THEN', block: parseExpressionToAST(thenPart, seq * 10 + 2) },
          { name: 'ELSE', block: parseExpressionToAST(elsePart, seq * 10 + 3) },
        ],
      };
    }
  }

  // Logical OR (||)
  const orIdx = findTopLevelBinaryOp(expr, '||');
  if (orIdx !== -1) {
    const left = expr.substring(0, orIdx).trim();
    const right = expr.substring(orIdx + 2).trim();
    return {
      id: `or_${seq}`,
      type: 'logic_binary',
      category: 'logic',
      title: 'OR',
      fields: { OP: 'OR' },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  // Logical AND (&&)
  const andIdx = findTopLevelBinaryOp(expr, '&&');
  if (andIdx !== -1) {
    const left = expr.substring(0, andIdx).trim();
    const right = expr.substring(andIdx + 2).trim();
    return {
      id: `and_${seq}`,
      type: 'logic_binary',
      category: 'logic',
      title: 'AND',
      fields: { OP: 'AND' },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  // Comparisons: ==, !=, <=, >=, <, >
  const compMatch = findComparisonOperator(expr);
  if (compMatch) {
    const { op, index, length } = compMatch;
    const left = expr.substring(0, index).trim();
    const right = expr.substring(index + length).trim();

    // Check if item comparison e.g. itemstackiterator.getItem() == Blocks.OBSIDIAN.asItem()
    if (
      (left.includes('.getItem()') || left.includes('itemstack') || left.includes('ItemStack')) &&
      (right.includes('.getItem()') || right.includes('Blocks.') || right.includes('Items.') || right.includes('ModBlocks') || right.includes('ModItems') || right.includes('asItem()'))
    ) {
      const cleanLeft = left.replace(/\.getItem\(\)/g, '').trim();
      const cleanRight = right.replace(/\.asItem\(\)/g, '').replace(/\.getItem\(\)/g, '').trim();
      return {
        id: `comp_item_${seq}`,
        type: 'compare_mcitems',
        category: 'item',
        title: 'Compare items',
        values: [
          { name: 'a', block: parseExpressionToAST(cleanLeft, seq * 10 + 1) },
          { name: 'b', block: parseExpressionToAST(cleanRight, seq * 10 + 2) },
        ],
      };
    }

    let mcreatorOp = op;
    if (op === '==') mcreatorOp = '=';

    return {
      id: `comp_${seq}`,
      type: 'logic_compare',
      category: 'logic',
      title: op,
      fields: { OP: mcreatorOp },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  // Binary Arithmetic Addition & Subtraction (+, -)
  const addSubIdx = findLowestPrecedenceArithmeticOp(expr, ['+', '-']);
  if (addSubIdx !== -1) {
    const op = expr[addSubIdx];
    const left = expr.substring(0, addSubIdx).trim();
    const right = expr.substring(addSubIdx + 1).trim();

    // Check if string concatenation: "..." + expr
    if (left.startsWith('"') || right.startsWith('"') || expr.includes('""')) {
      return {
        id: `join_${seq}`,
        type: 'text_join',
        category: 'text',
        title: 'Create text with',
        values: [
          { name: 'ADD0', block: parseExpressionToAST(left, seq * 10 + 1) },
          { name: 'ADD1', block: parseExpressionToAST(right, seq * 10 + 2) },
        ],
      };
    }

    return {
      id: `math_bin_${seq}`,
      type: 'math_binary',
      category: 'math',
      title: op,
      fields: { OP: op === '+' ? 'ADD' : 'MINUS' },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  // Binary Arithmetic Multiplication & Division & Modulo (*, /, %)
  const mulDivIdx = findLowestPrecedenceArithmeticOp(expr, ['*', '/', '%']);
  if (mulDivIdx !== -1) {
    const op = expr[mulDivIdx];
    const left = expr.substring(0, mulDivIdx).trim();
    const right = expr.substring(mulDivIdx + 1).trim();

    return {
      id: `math_bin_${seq}`,
      type: 'math_binary',
      category: 'math',
      title: op,
      fields: { OP: op === '*' ? 'MULTIPLY' : op === '/' ? 'DIVIDE' : 'MODULO' },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  // Unary NOT (!)
  if (expr.startsWith('!')) {
    const inner = expr.substring(1).trim();
    return {
      id: `not_${seq}`,
      type: 'logic_negate',
      category: 'logic',
      title: 'not',
      values: [{ name: 'BOOL', block: parseExpressionToAST(inner, seq * 10 + 1) }],
    };
  }

  // Math.min(a, b)
  if (expr.startsWith('Math.min(')) {
    const args = extractFunctionArguments(expr, 'Math.min');
    if (args.length >= 2) {
      return {
        id: `min_${seq}`,
        type: 'math_dual_ops',
        category: 'math',
        title: 'min',
        fields: { OP: 'MIN' },
        values: [
          { name: 'A', block: parseExpressionToAST(args[0], seq * 10 + 1) },
          { name: 'B', block: parseExpressionToAST(args[1], seq * 10 + 2) },
        ],
      };
    }
  }

  // Math.max(a, b)
  if (expr.startsWith('Math.max(')) {
    const args = extractFunctionArguments(expr, 'Math.max');
    if (args.length >= 2) {
      return {
        id: `max_${seq}`,
        type: 'math_dual_ops',
        category: 'math',
        title: 'max',
        fields: { OP: 'MAX' },
        values: [
          { name: 'A', block: parseExpressionToAST(args[0], seq * 10 + 1) },
          { name: 'B', block: parseExpressionToAST(args[1], seq * 10 + 2) },
        ],
      };
    }
  }

  // Math.sin, Math.cos, Math.abs, Math.sqrt, Math.floor, Math.ceil, Math.round
  const singleMathMatch = expr.match(/^Math\.(sin|cos|tan|abs|sqrt|floor|ceil|round)\(([\s\S]+)\)$/);
  if (singleMathMatch) {
    const fn = singleMathMatch[1];
    const arg = singleMathMatch[2].trim();
    const opMap: Record<string, string> = {
      sin: 'SIN',
      cos: 'COS',
      tan: 'TAN',
      abs: 'ABS',
      sqrt: 'ROOT',
      floor: 'ROUNDDOWN',
      ceil: 'ROUNDUP',
      round: 'ROUND',
    };
    return {
      id: `math_s_${seq}`,
      type: 'math_singular_ops',
      category: 'math',
      title: fn,
      fields: { OP: opMap[fn] || 'SIN' },
      values: [{ name: 'NUM', block: parseExpressionToAST(arg, seq * 10 + 1) }],
    };
  }

  // Math.random()
  if (expr.includes('Math.random()')) {
    return {
      id: `rand_${seq}`,
      type: 'math_java_constants',
      category: 'math',
      title: 'Random [0,1)',
      fields: { CONSTANT: 'RANDOM' },
    };
  }

  // NBT GETTERS & TAG CHECKS: (Entity, Block, Item, and CompoundTag)
  if (expr.includes('.getInt(') || expr.includes('.getDouble(') || expr.includes('.getFloat(') || expr.includes('.getBoolean(') || expr.includes('.getString(') || expr.includes('.getCompound(') || expr.includes('.getList(') || (expr.includes('.contains(') && (expr.includes('Tag') || expr.includes('PersistentData') || expr.includes('CUSTOM_DATA') || expr.includes('tag.'))) || expr.includes('new CompoundTag()')) {
    if (expr.includes('new CompoundTag()')) {
      return {
        id: `nbt_create_${seq}`,
        type: 'custom_nbt_create',
        category: 'advanced',
        title: 'Create new CompoundTag',
      };
    }

    const isNum = expr.includes('.getInt(') || expr.includes('.getDouble(') || expr.includes('.getFloat(');
    const isBool = expr.includes('.getBoolean(');
    const isStr = expr.includes('.getString(');
    const isCompound = expr.includes('.getCompound(');
    const isList = expr.includes('.getList(');
    const isContains = expr.includes('.contains(');

    let keyExpr = '"key"';
    let typeParam = '10'; // Compound type for list
    if (isContains) {
      const match = expr.match(/\.contains\(([\s\S]+)\)/);
      if (match) keyExpr = match[1].trim();
    } else if (isList) {
      const listMatch = expr.match(/\.getList\(([^,]+),([^)]+)\)/);
      if (listMatch) {
        keyExpr = listMatch[1].trim();
        typeParam = listMatch[2].trim();
      }
    } else {
      const match = expr.match(/\.(?:getInt|getDouble|getFloat|getBoolean|getString|getCompound)\(([\s\S]+)\)/);
      if (match) keyExpr = match[1].trim();
    }

    const keyAST = parseExpressionToAST(keyExpr, seq * 10 + 1);

    const isItem = expr.includes('itemstack') || expr.includes('itemStack') || expr.includes('item') || expr.includes('CUSTOM_DATA') || expr.includes('CustomData');
    const isBlock = expr.includes('_blockEntity') || expr.includes('getBlockEntity') || expr.includes('blockEntity') || expr.includes('BlockEntity');
    const isCustomTag = (expr.match(/^(?:tag|compoundTag|customTag|nbt|_nbt)\./) != null) || (expr.includes('CompoundTag') && !expr.includes('PersistentData'));

    if (isItem) {
      const itemTarget = expr.includes('itemstack') ? 'itemstack' : expr.includes('item') ? 'item' : 'itemstack';
      const itemAST = parseExpressionToAST(itemTarget, seq * 10);
      if (isContains) {
        return {
          id: `item_nbt_has_${seq}`,
          type: 'item_nbt_tag_has',
          category: 'item',
          title: 'Itemstack has NBT tag',
          values: [
            { name: 'item', block: itemAST },
            { name: 'tagName', block: keyAST },
          ],
        };
      }
      if (isCompound) {
        return {
          id: `item_nbt_cmp_${seq}`,
          type: 'item_nbt_compound_get',
          category: 'item',
          title: 'Get itemstack NBT compound tag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'item', block: itemAST },
          ],
        };
      }
      const type = isNum ? 'item_nbt_num_get' : isBool ? 'item_nbt_logic_get' : 'item_nbt_text_get';
      const title = isNum ? 'Get itemstack NBT number tag' : isBool ? 'Get itemstack NBT logic tag' : 'Get itemstack NBT text tag';
      return {
        id: `item_nbt_get_${seq}`,
        type,
        category: 'item',
        title,
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'item', block: itemAST },
        ],
      };
    }

    if (isBlock) {
      if (isContains) {
        return {
          id: `block_nbt_has_${seq}`,
          type: 'block_nbt_tag_has',
          category: 'block',
          title: 'Block has NBT tag',
          values: [
            { name: 'x', block: parseExpressionToAST('x', seq * 10) },
            { name: 'y', block: parseExpressionToAST('y', seq * 10 + 3) },
            { name: 'z', block: parseExpressionToAST('z', seq * 10 + 4) },
            { name: 'tagName', block: keyAST },
          ],
        };
      }
      if (isCompound) {
        return {
          id: `block_nbt_cmp_${seq}`,
          type: 'block_nbt_compound_get',
          category: 'block',
          title: 'Get block NBT compound tag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'x', block: parseExpressionToAST('x', seq * 10) },
            { name: 'y', block: parseExpressionToAST('y', seq * 10 + 3) },
            { name: 'z', block: parseExpressionToAST('z', seq * 10 + 4) },
          ],
        };
      }
      const type = isNum ? 'block_nbt_num_get' : isBool ? 'block_nbt_logic_get' : 'block_nbt_text_get';
      const title = isNum ? 'Get block NBT number tag' : isBool ? 'Get block NBT logic tag' : 'Get block NBT text tag';
      return {
        id: `block_nbt_get_${seq}`,
        type,
        category: 'block',
        title,
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'x', block: parseExpressionToAST('x', seq * 10) },
          { name: 'y', block: parseExpressionToAST('y', seq * 10 + 3) },
          { name: 'z', block: parseExpressionToAST('z', seq * 10 + 4) },
        ],
      };
    }

    if (isCustomTag) {
      const targetMatch = expr.match(/^([a-zA-Z0-9_]+)\./);
      const target = targetMatch ? targetMatch[1] : 'tag';
      const tagAST = parseExpressionToAST(target, seq * 10);
      if (isContains) {
        return {
          id: `custom_nbt_has_${seq}`,
          type: 'custom_nbt_has',
          category: 'advanced',
          title: 'NBT tag exists in CompoundTag',
          values: [
            { name: 'tag', block: tagAST },
            { name: 'tagName', block: keyAST },
          ],
        };
      }
      if (isList) {
        return {
          id: `custom_nbt_list_${seq}`,
          type: 'custom_nbt_list_get',
          category: 'advanced',
          title: 'Get NBT list tag of CompoundTag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'tag', block: tagAST },
            { name: 'type', block: parseExpressionToAST(typeParam, seq * 10 + 3) },
          ],
        };
      }
      if (isCompound) {
        return {
          id: `custom_nbt_cmp_${seq}`,
          type: 'custom_nbt_compound_get',
          category: 'advanced',
          title: 'Get NBT compound tag of CompoundTag',
          values: [
            { name: 'tagName', block: keyAST },
            { name: 'tag', block: tagAST },
          ],
        };
      }
      const type = isNum ? 'custom_nbt_num_get' : isBool ? 'custom_nbt_logic_get' : 'custom_nbt_text_get';
      const title = isNum ? 'Get NBT number tag of CompoundTag' : isBool ? 'Get NBT logic tag of CompoundTag' : 'Get NBT text tag of CompoundTag';
      return {
        id: `custom_nbt_get_${seq}`,
        type,
        category: 'advanced',
        title,
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'tag', block: tagAST },
        ],
      };
    }

    // Default: Entity NBT
    const targetMatch = expr.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const entityAST = parseExpressionToAST(target, seq * 10);
    if (isContains) {
      return {
        id: `entity_nbt_has_${seq}`,
        type: 'entity_nbt_tag_has',
        category: 'entity',
        title: 'Entity has NBT tag',
        values: [
          { name: 'entity', block: entityAST },
          { name: 'tagName', block: keyAST },
        ],
      };
    }
    if (isCompound) {
      return {
        id: `entity_nbt_cmp_${seq}`,
        type: 'entity_nbt_compound_get',
        category: 'entity',
        title: 'Get entity NBT compound tag',
        values: [
          { name: 'tagName', block: keyAST },
          { name: 'entity', block: entityAST },
        ],
      };
    }
    const type = isNum ? 'entity_nbt_num_get' : isBool ? 'entity_nbt_logic_get' : 'entity_nbt_text_get';
    const title = isNum ? 'Get entity NBT number tag' : isBool ? 'Get entity NBT logic tag' : 'Get entity NBT text tag';
    return {
      id: `entity_nbt_get_${seq}`,
      type,
      category: 'entity',
      title,
      values: [
        { name: 'tagName', block: keyAST },
        { name: 'entity', block: entityAST },
      ],
    };
  }

  // INSTANCEOF SUBTYPE / TYPE COMPARISON: sourceentity instanceof Player, entity instanceof LivingEntity
  if (expr.includes('instanceof')) {
    const parts = expr.split('instanceof').map(p => p.trim());
    const entityExpr = parts[0];
    const targetType = parts[1] ? parts[1].split(/\s+/)[0] : 'Player';

    return {
      id: `inst_${seq}`,
      type: 'logic_entity_compare',
      category: 'logic',
      title: `Is (sub)type of ${targetType}`,
      fields: { entity: targetType },
      values: [{ name: 'compareTo', block: parseExpressionToAST(entityExpr, seq * 10 + 1) }],
    };
  }

  // METHOD CHAIN: getBlockState(...)
  if (expr.includes('.getBlockState(')) {
    return {
      id: `get_block_${seq}`,
      type: 'world_get_block',
      category: 'world',
      title: 'Get block at',
      values: [
        { name: 'x', block: { id: `x_${seq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${seq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${seq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
    };
  }

  // BLOCKSTATE CHECKS: state.isAir()
  if (expr.includes('.isAir()')) {
    return {
      id: `is_air_${seq}`,
      type: 'blockstate_is_air',
      category: 'block',
      title: 'Is block air',
      values: [
        { name: 'x', block: { id: `x_${seq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${seq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${seq}`, type: 'coord_z', category: 'world', title: 'z' } },
      ],
    };
  }

  // CLIENT SIDE CHECK
  if (expr.includes('isClientSide()') || expr.includes('isRemote')) {
    return {
      id: `is_client_${seq}`,
      type: 'world_data_isremote',
      category: 'world',
      title: 'Is world client side',
    };
  }

  // ENTITY GETTERS
  if (expr.includes('.getHealth()')) {
    return {
      id: `health_${seq}`,
      type: 'entity_get_health',
      category: 'entity',
      title: 'Current health of entity',
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } }],
    };
  }
  if (expr.includes('.getMaxHealth()')) {
    return {
      id: `max_health_${seq}`,
      type: 'entity_get_max_health',
      category: 'entity',
      title: 'Max health of entity',
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } }],
    };
  }
  if (expr.includes('.isInWater()')) {
    return {
      id: `in_water_${seq}`,
      type: 'entity_is_inwater',
      category: 'entity',
      title: 'Is entity in water',
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } }],
    };
  }
  if (expr.includes('.isOnFire()')) {
    return {
      id: `on_fire_${seq}`,
      type: 'entity_is_onfire',
      category: 'entity',
      title: 'Is entity on fire',
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } }],
    };
  }
  if (expr.includes('.getDeltaMovement()')) {
    return {
      id: `get_mov_${seq}`,
      type: 'entity_get_movement',
      category: 'entity',
      title: 'Get velocity of entity',
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } }],
    };
  }

  // ---------------------------------------------------------------------------
  // COMMAND ARGUMENT GETTERS
  // ---------------------------------------------------------------------------
  if (expr.includes('EntityArgument.getEntity(') || expr.includes('EntityArgument.getOptionalEntity(')) {
    const match = expr.match(/getEntity\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_ent_${seq}`,
      type: 'get_cmdarg_entity',
      category: 'command',
      title: `Get command entity parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('BlockStateArgument.getBlock(') || expr.includes('BlockStateArgument.getBlockState(')) {
    const match = expr.match(/getBlock(?:State)?\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_blk_${seq}`,
      type: 'get_cmdarg_block',
      category: 'command',
      title: `Get command block parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('ItemArgument.getItem(')) {
    const match = expr.match(/getItem\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_item_${seq}`,
      type: 'get_cmdarg_item',
      category: 'command',
      title: `Get command item parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('BoolArgumentType.getBool(')) {
    const match = expr.match(/getBool\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_logic_${seq}`,
      type: 'get_cmdarg_logic',
      category: 'command',
      title: `Get command logic parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('MessageArgument.getMessage(')) {
    const match = expr.match(/getMessage\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_msg_${seq}`,
      type: 'get_cmdarg_message',
      category: 'command',
      title: `Get command message parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('DoubleArgumentType.getDouble(') || expr.includes('IntegerArgumentType.getInteger(') || expr.includes('FloatArgumentType.getFloat(')) {
    const match = expr.match(/(?:getDouble|getInteger|getFloat)\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_num_${seq}`,
      type: 'get_cmdarg_number',
      category: 'command',
      title: `Get command number parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('ResourceLocationArgument.getId(')) {
    const match = expr.match(/getId\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    return {
      id: `cmd_res_${seq}`,
      type: 'get_cmdarg_resloc',
      category: 'command',
      title: `Get resource location parameter [${paramName}] as string`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('BlockPosArgument.getLoadedBlockPos(') || expr.includes('BlockPosArgument.getBlockPos(')) {
    const match = expr.match(/getBlockPos\s*\([^,]+,\s*"([^"]+)"\)/);
    const paramName = match ? match[1] : 'name';
    const isY = expr.includes('.getY()');
    const isZ = expr.includes('.getZ()');
    const coord = isY ? 'y' : isZ ? 'z' : 'x';
    return {
      id: `cmd_pos_${coord}_${seq}`,
      type: `get_cmdarg_blockpos_${coord}`,
      category: 'command',
      title: `${coord.toUpperCase()} position of command block position parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  if (expr.includes('StringArgumentType.getString(') || (expr.includes('arguments.getArgument(') && expr.includes('"'))) {
    const match = expr.match(/getString\s*\([^,]+,\s*"([^"]+)"\)/) || expr.match(/getArgument\s*\("([^"]+)"/);
    const paramName = match ? match[1] : 'name';
    if (!isNaN(Number(paramName))) {
      return {
        id: `cmd_acc_${seq}`,
        type: 'get_cmdarg_accept_all',
        category: 'command',
        title: `Get accept-all command parameter with index [${paramName}] as string`,
        fields: { index: paramName },
      };
    }
    return {
      id: `cmd_str_${seq}`,
      type: 'get_cmdarg_string',
      category: 'command',
      title: `Get command string parameter [${paramName}]`,
      fields: { name: paramName },
    };
  }

  // ---------------------------------------------------------------------------
  // DAMAGE PROCEDURES EXPRESSIONS
  // ---------------------------------------------------------------------------
  if (expr.includes('.damageSources().source(') || expr.includes('DamageSource.of(')) {
    const hasSource = expr.includes('sourceentity') || expr.includes('sourceEntity');
    const hasDirect = expr.includes('immediatesourceentity') || expr.includes('immediateSourceEntity');

    let blockType = 'damagesource_from_type';
    let title = 'Damage source of type: [type]';
    const values: { name: string; block?: BlockASTNode }[] = [];

    if (hasDirect && hasSource) {
      blockType = 'damagesource_from_type_cause_direct';
      title = 'Damage source of type: [type] caused by: [Source entity] direct cause: [Immediate source entity]';
      values.push(
        { name: 'damagesource', block: { id: `src_ent_${seq}`, type: 'source_entity_from_deps', category: 'component', title: 'Source entity' } },
        { name: 'directsource', block: { id: `imm_ent_${seq}`, type: 'immediate_source_entity_from_deps', category: 'component', title: 'Immediate source entity' } }
      );
    } else if (hasSource) {
      blockType = 'damagesource_from_type_cause';
      title = 'Damage source of type: [type] caused by: [Source entity]';
      values.push({ name: 'damagesource', block: { id: `src_ent_${seq}`, type: 'source_entity_from_deps', category: 'component', title: 'Source entity' } });
    }

    return {
      id: `ds_type_${seq}`,
      type: blockType,
      category: 'damage',
      title,
      fields: { damagetype: 'GENERIC' },
      values: values.length > 0 ? values : undefined,
    };
  }

  if (expr.includes('.getDirectEntity()')) {
    return {
      id: `ds_dir_ent_${seq}`,
      type: 'damagesource_get_direct_entity',
      category: 'damage',
      title: 'Get entity that directly caused [Provided damage source]',
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  if (expr.includes('.getEntity()') && (expr.includes('damagesource') || expr.includes('damageSource'))) {
    return {
      id: `ds_ent_${seq}`,
      type: 'damagesource_get_entity',
      category: 'damage',
      title: 'Get entity that caused [Provided damage source]',
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  if (expr.includes('.getFoodExhaustion()') || expr.includes('.getExhaustion()')) {
    return {
      id: `ds_exh_${seq}`,
      type: 'damagesource_get_exhaustion',
      category: 'damage',
      title: 'Get exhaustion value of [Provided damage source]',
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  if (expr.includes('.isCreativePlayer()')) {
    return {
      id: `ds_crt_${seq}`,
      type: 'damagesource_is_creative',
      category: 'damage',
      title: 'Is [Provided damage source] caused by player in creative mode',
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  if (expr.includes('.isIndirect()')) {
    return {
      id: `ds_ind_${seq}`,
      type: 'damagesource_is_indirect',
      category: 'damage',
      title: 'Is [Provided damage source] indirect',
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  if (expr.includes('.scalesWithDifficulty()')) {
    return {
      id: `ds_dif_${seq}`,
      type: 'damagesource_scales_with_difficulty',
      category: 'damage',
      title: 'Does [Provided damage source] scale with difficulty',
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  if (expr.includes('.is(') && (expr.includes('DamageTypeTags') || expr.includes('damagesource.is(') || expr.includes('damageSource.is('))) {
    const match = expr.match(/is\s*\(([^)]+)\)/);
    const tag = match ? match[1].replace(/DamageTypeTags\./, '').toLowerCase() : 'is_fire';
    return {
      id: `ds_tag_${seq}`,
      type: 'damagesource_is_tagged',
      category: 'damage',
      title: `Is type of [Provided damage source] tagged in damage type tags as [minecraft:${tag}]`,
      fields: { tag },
      values: [{ name: 'damagesource', block: { id: `ds_p_${seq}`, type: 'damagesource_from_deps', category: 'component', title: 'Provided damage source' } }],
    };
  }

  // ---------------------------------------------------------------------------
  // DIRECTION PROCEDURES EXPRESSIONS
  // ---------------------------------------------------------------------------
  if (expr.includes('.getOpposite()')) {
    return {
      id: `dir_opp_${seq}`,
      type: 'direction_opposite',
      category: 'direction',
      title: 'Opposite of [Trigger direction/face]',
      values: [{ name: 'direction', block: { id: `dir_dep_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } }],
    };
  }

  if (expr.includes('Direction.getRandom(')) {
    return {
      id: `dir_rnd_${seq}`,
      type: 'direction_random',
      category: 'direction',
      title: 'Random direction',
    };
  }

  if (expr.includes('.getAxis() ==') || expr.includes('.getAxis().equals(')) {
    return {
      id: `dir_cmp_ax_${seq}`,
      type: 'direction_compare_axes',
      category: 'direction',
      title: 'Are directions [Trigger direction/face] and [DOWN] on same axis',
      values: [
        { name: 'a', block: { id: `dir_a_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } },
        { name: 'b', block: { id: `dir_b_${seq}`, type: 'direction_constant', category: 'direction', title: 'DOWN', fields: { direction: 'DOWN' } } },
      ],
    };
  }

  if (expr.includes('.getStepX()')) {
    return {
      id: `dir_off_x_${seq}`,
      type: 'direction_offset_x',
      category: 'direction',
      title: 'X offset of direction [Trigger direction/face]',
      values: [{ name: 'direction', block: { id: `dir_dep_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } }],
    };
  }
  if (expr.includes('.getStepY()')) {
    return {
      id: `dir_off_y_${seq}`,
      type: 'direction_offset_y',
      category: 'direction',
      title: 'Y offset of direction [Trigger direction/face]',
      values: [{ name: 'direction', block: { id: `dir_dep_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } }],
    };
  }
  if (expr.includes('.getStepZ()')) {
    return {
      id: `dir_off_z_${seq}`,
      type: 'direction_offset_z',
      category: 'direction',
      title: 'Z offset of direction [Trigger direction/face]',
      values: [{ name: 'direction', block: { id: `dir_dep_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } }],
    };
  }

  if (expr.includes('.getClockWise(')) {
    return {
      id: `dir_cw_${seq}`,
      type: 'direction_rotate_clockwise_y',
      category: 'direction',
      title: '[Trigger direction/face] rotated 90 de.g. clockwise around Y axis',
      values: [{ name: 'direction', block: { id: `dir_dep_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } }],
    };
  }

  if (expr.includes('.getCounterClockWise(')) {
    return {
      id: `dir_ccw_${seq}`,
      type: 'direction_rotate_counterclockwise_y',
      category: 'direction',
      title: '[Trigger direction/face] rotated 90 de.g. counterclockwise around Y axis',
      values: [{ name: 'direction', block: { id: `dir_dep_${seq}`, type: 'direction_from_deps', category: 'component', title: 'Trigger direction/face' } }],
    };
  }

  const dirConstMatch = expr.match(/^Direction\.(DOWN|UP|NORTH|SOUTH|WEST|EAST)$/);
  if (dirConstMatch) {
    const dirName = dirConstMatch[1];
    return {
      id: `dir_c_${seq}`,
      type: 'direction_constant',
      category: 'direction',
      title: dirName,
      fields: { direction: dirName },
    };
  }

  // ---------------------------------------------------------------------------
  // PROJECTILE EXPRESSIONS
  // ---------------------------------------------------------------------------
  if (expr.includes('new ThrownPotion(')) {
    return {
      id: `proj_pot_${seq}`,
      type: 'projectile_splash_potion',
      category: 'projectile',
      title: 'Splash [potion] with acceleration and shooter',
      fields: { potion: 'CUSTOM:Potion' },
      values: [
        { name: 'ax', block: { id: `ax_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'ay', block: { id: `ay_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'az', block: { id: `az_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'shooter', block: { id: `no_ent_${seq}`, type: 'null_or_no_entry', category: 'component', title: 'No entity' } },
      ],
    };
  }

  if (expr.includes('new Arrow(') || expr.includes('new SpectralArrow(')) {
    return {
      id: `proj_arr_${seq}`,
      type: 'projectile_arrow',
      category: 'projectile',
      title: 'Arrow of type [No entry selected]',
      fields: { type: 'ARROW', pickup: 'DISALLOWED' },
      values: [
        { name: 'damage', block: { id: `dmg_${seq}`, type: 'math_number', category: 'math', title: '5', fields: { NUM: '5' } } },
        { name: 'knockback', block: { id: `kb_${seq}`, type: 'math_number', category: 'math', title: '1', fields: { NUM: '1' } } },
        { name: 'piercing', block: { id: `pierce_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'shooter', block: { id: `no_ent_${seq}`, type: 'null_or_no_entry', category: 'component', title: 'No entity' } },
        { name: 'fire', block: { id: `fire_${seq}`, type: 'logic_boolean', category: 'logic', title: 'false', fields: { BOOL: 'FALSE' } } },
        { name: 'particles', block: { id: `part_${seq}`, type: 'logic_boolean', category: 'logic', title: 'true', fields: { BOOL: 'TRUE' } } },
      ],
    };
  }

  if (expr.includes('new LargeFireball(') || expr.includes('new SmallFireball(') || expr.includes('new DragonFireball(')) {
    return {
      id: `proj_fb_${seq}`,
      type: 'projectile_fireball',
      category: 'projectile',
      title: 'Fireball with acceleration and shooter',
      fields: { type: 'FIREBALL' },
      values: [
        { name: 'ax', block: { id: `ax_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'ay', block: { id: `ay_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'az', block: { id: `az_${seq}`, type: 'math_number', category: 'math', title: '0', fields: { NUM: '0' } } },
        { name: 'shooter', block: { id: `no_ent_${seq}`, type: 'null_or_no_entry', category: 'component', title: 'No entity' } },
      ],
    };
  }

  if (expr.includes('new ThrownEgg(') || expr.includes('new Snowball(') || expr.includes('new ThrownEnderpearl(')) {
    return {
      id: `proj_throw_${seq}`,
      type: 'projectile_throwable',
      category: 'projectile',
      title: 'Throwable projectile of type [Snowball]',
      fields: { type: 'SNOWBALL' },
      values: [
        { name: 'shooter', block: { id: `no_ent_${seq}`, type: 'null_or_no_entry', category: 'component', title: 'No entity' } },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // SLOT & GUI PROCEDURES EXPRESSIONS
  // ---------------------------------------------------------------------------
  if (expr.includes('EditBox') && (expr.includes('.getValue()') || expr.includes('.getText()'))) {
    const nameMatch = expr.match(/"([^"]+)"/);
    const widgetName = nameMatch ? nameMatch[1] : 'textFieldName';
    return {
      id: `gui_get_txt_${seq}`,
      type: 'gui_get_text_textfield',
      category: 'gui',
      title: `Get text inside textfield [${widgetName}] of current GUI`,
      fields: { textfield: widgetName },
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } }],
    };
  }

  if (expr.includes('Slider') && expr.includes('.getValue()')) {
    const nameMatch = expr.match(/"([^"]+)"/);
    const sliderName = nameMatch ? nameMatch[1] : 'sliderName';
    return {
      id: `gui_get_sld_${seq}`,
      type: 'gui_get_value_slider',
      category: 'gui',
      title: `Get value of slider [${sliderName}] for current GUI`,
      fields: { slider: sliderName },
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } }],
    };
  }

  if (expr.includes('Checkbox') && (expr.includes('.selected()') || expr.includes('.isSelected()'))) {
    const nameMatch = expr.match(/"([^"]+)"/);
    const boxName = nameMatch ? nameMatch[1] : 'checkBoxName';
    return {
      id: `gui_is_chk_${seq}`,
      type: 'gui_is_checkbox_checked',
      category: 'gui',
      title: `Is checkbox [${boxName}] checked for current GUI`,
      fields: { checkbox: boxName },
      values: [{ name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } }],
    };
  }

  if (expr.includes('.getSlot(') && expr.includes('.getItem()') && !expr.includes('.getCount()')) {
    const slotMatch = expr.match(/getSlot\s*\(\s*([0-9]+)\s*\)/);
    const slotNum = slotMatch ? slotMatch[1] : '0';
    return {
      id: `gui_get_item_${seq}`,
      type: 'gui_get_item_inslot',
      category: 'gui',
      title: `Get item from slot [${slotNum}] of current GUI`,
      values: [
        { name: 'slotid', block: { id: `slot_${seq}`, type: 'math_number', category: 'math', title: slotNum, fields: { NUM: slotNum } } },
        { name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  if (expr.includes('.getSlot(') && expr.includes('.getItem()') && expr.includes('.getCount()')) {
    const slotMatch = expr.match(/getSlot\s*\(\s*([0-9]+)\s*\)/);
    const slotNum = slotMatch ? slotMatch[1] : '0';
    return {
      id: `gui_get_amt_${seq}`,
      type: 'gui_get_amount_inslot',
      category: 'gui',
      title: `Get number of items from slot [${slotNum}] of current GUI`,
      values: [
        { name: 'slotid', block: { id: `slot_${seq}`, type: 'math_number', category: 'math', title: slotNum, fields: { NUM: slotNum } } },
        { name: 'entity', block: { id: `ent_${seq}`, type: 'entity_from_deps', category: 'component', title: 'Event/target entity' } },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // VECTOR PROCEDURES EXPRESSIONS
  // ---------------------------------------------------------------------------
  if (expr.includes('.distanceTo(') || expr.includes('.distanceToSqr(')) {
    const match = expr.match(/^([\s\S]+?)\.distanceTo(?:Sqr)?\(([\s\S]+)\)$/);
    if (match) {
      return {
        id: `vec_dist_${seq}`,
        type: 'vector_distance',
        category: 'vector',
        title: 'Get distance between vectors',
        values: [
          { name: 'a', block: parseExpressionToAST(match[1].trim(), seq * 10 + 1) },
          { name: 'b', block: parseExpressionToAST(match[2].trim(), seq * 10 + 2) },
        ],
      };
    }
  }

  if (expr.includes('.length(') || expr.includes('.lengthSqr()')) {
    const match = expr.match(/^([\s\S]+?)\.length(?:Sqr)?\(\)$/);
    if (match) {
      return {
        id: `vec_len_${seq}`,
        type: 'vector_length',
        category: 'vector',
        title: 'Get length of vector',
        values: [{ name: 'vector', block: parseExpressionToAST(match[1].trim(), seq * 10 + 1) }],
      };
    }
  }

  if (expr.includes('.normalize()')) {
    const match = expr.match(/^([\s\S]+?)\.normalize\(\)$/);
    if (match) {
      return {
        id: `vec_norm_${seq}`,
        type: 'vector_normalize',
        category: 'vector',
        title: 'Normalized vector of',
        values: [{ name: 'vector', block: parseExpressionToAST(match[1].trim(), seq * 10 + 1) }],
      };
    }
  }

  if (expr.includes('.scale(') || (expr.includes('.multiply(') && !expr.includes('Vec3'))) {
    const match = expr.match(/^([\s\S]+?)\.(?:scale|multiply)\(([\s\S]+)\)$/);
    if (match) {
      return {
        id: `vec_scl_${seq}`,
        type: 'vector_scale',
        category: 'vector',
        title: 'Scale vector through [Multiplication]',
        fields: { type: 'MULTIPLY' },
        values: [
          { name: 'vector', block: parseExpressionToAST(match[1].trim(), seq * 10 + 1) },
          { name: 'number', block: parseExpressionToAST(match[2].trim(), seq * 10 + 2) },
        ],
      };
    }
  }

  if (expr.includes('.add(') && expr.includes('Vec3')) {
    const match = expr.match(/^([\s\S]+?)\.add\(([\s\S]+)\)$/);
    if (match) {
      return {
        id: `vec_add_${seq}`,
        type: 'vector_math',
        category: 'vector',
        title: 'Vector add',
        fields: { OP: 'ADD' },
        values: [
          { name: 'A', block: parseExpressionToAST(match[1].trim(), seq * 10 + 1) },
          { name: 'B', block: parseExpressionToAST(match[2].trim(), seq * 10 + 2) },
        ],
      };
    }
  }

  if (expr.includes('.subtract(') && expr.includes('Vec3')) {
    const match = expr.match(/^([\s\S]+?)\.subtract\(([\s\S]+)\)$/);
    if (match) {
      return {
        id: `vec_sub_${seq}`,
        type: 'vector_math',
        category: 'vector',
        title: 'Vector subtract',
        fields: { OP: 'SUBTRACT' },
        values: [
          { name: 'A', block: parseExpressionToAST(match[1].trim(), seq * 10 + 1) },
          { name: 'B', block: parseExpressionToAST(match[2].trim(), seq * 10 + 2) },
        ],
      };
    }
  }

  // Vector coordinate getters: vec.x, vec.y, vec.z or vec.x(), vec.y(), vec.z()
  if (expr.endsWith('.x') || expr.endsWith('.x()')) {
    const target = expr.replace(/\.x(\(\))?$/, '');
    return {
      id: `vec_get_x_${seq}`,
      type: 'vector_get_x',
      category: 'vector',
      title: 'X component of [vector]',
      values: [{ name: 'vector', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }
  if (expr.endsWith('.y') || expr.endsWith('.y()')) {
    const target = expr.replace(/\.y(\(\))?$/, '');
    return {
      id: `vec_get_y_${seq}`,
      type: 'vector_get_y',
      category: 'vector',
      title: 'Y component of [vector]',
      values: [{ name: 'vector', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }
  if (expr.endsWith('.z') || expr.endsWith('.z()')) {
    const target = expr.replace(/\.z(\(\))?$/, '');
    return {
      id: `vec_get_z_${seq}`,
      type: 'vector_get_z',
      category: 'vector',
      title: 'Z component of [vector]',
      values: [{ name: 'vector', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  // ---------------------------------------------------------------------------
  // ADVANCED PROCEDURES EXPRESSIONS
  // ---------------------------------------------------------------------------
  if (expr.includes('dependencies.get(')) {
    const match = expr.match(/dependencies\.get\s*\("([^"]+)"\)/);
    const depName = match ? match[1] : 'name';
    let depType = 'dependency_number';
    let title = `Number dependency [${depName}]`;

    if (expr.includes('(String)') || depName.includes('text') || depName.includes('str')) {
      depType = 'dependency_text';
      title = `Text dependency [${depName}]`;
    } else if (expr.includes('(Vec3)') || depName.includes('vector')) {
      depType = 'dependency_vector';
      title = `Vector dependency [${depName}]`;
    } else if (expr.includes('(Entity)') || depName.includes('entity')) {
      depType = 'dependency_entity';
      title = `Entity dependency [${depName}]`;
    } else if (expr.includes('(ItemStack)') || depName.includes('itemstack')) {
      depType = 'dependency_itemstack';
      title = `Itemstack dependency [${depName}]`;
    } else if (expr.includes('(Boolean)') || depName.includes('logic')) {
      depType = 'dependency_logic';
      title = `Logic dependency [${depName}]`;
    }

    return {
      id: `dep_${seq}`,
      type: depType,
      category: 'advanced',
      title,
      fields: { NAME: depName },
    };
  }

  if (expr.includes('ModList.get().isLoaded(')) {
    const match = expr.match(/isLoaded\s*\("([^"]+)"\)/);
    const modId = match ? match[1] : 'neoforge';
    return {
      id: `mod_ld_${seq}`,
      type: 'is_mod_loaded',
      category: 'advanced',
      title: `Is the mod with ID [${modId}] loaded`,
      fields: { modid: modId },
      values: [{ name: 'mod', block: { id: `mod_t_${seq}`, type: 'text', category: 'text', title: `"${modId}"`, fields: { TEXT: modId } } }],
    };
  }

  if (expr.includes('EntityType.') && expr.includes('.create(')) {
    const match = expr.match(/EntityType\.([A-Z_]+)\.create/);
    const entName = match ? match[1] : 'ZOMBIE';
    return {
      id: `stat_ent_${seq}`,
      type: 'static_entity_instance',
      category: 'advanced',
      title: `Static entity instance of type [${entName}] (no spawning)`,
      fields: { entity: entName },
    };
  }

  // Procedure call as expression: SomeProcedure.execute(...)
  const callProcExprMatch = expr.match(/^([A-Za-z0-9_]+)\.execute\s*\(([\s\S]*)\)$/);
  if (callProcExprMatch && !expr.startsWith('this.') && !expr.startsWith('super.')) {
    const procName = callProcExprMatch[1].replace(/Procedure$/, '');
    return {
      id: `call_proc_ret_${seq}`,
      type: 'call_procedure_at',
      category: 'advanced',
      title: `Call procedure [${procName}] and get return value`,
      fields: { procedure: procName, retval: 'logic' },
    };
  }

  // ---------------------------------------------------------------------------
  // MINECRAFT COMPONENTS
  // ---------------------------------------------------------------------------
  if (expr.startsWith('InteractionResult.')) {
    const match = expr.match(/InteractionResult\.([A-Z]+)/);
    const actType = match ? match[1] : 'SUCCESS';
    return {
      id: `act_res_${seq}`,
      type: 'action_result_type',
      category: 'component',
      title: `Action result of type [${actType}]`,
      fields: { type: actType },
    };
  }

  if (expr === 'ItemStack.EMPTY') {
    return {
      id: `empty_item_${seq}`,
      type: 'empty_itemstack',
      category: 'component',
      title: 'Empty itemstack',
    };
  }

  if (expr === 'null' || expr === '(Entity) null' || expr === '(ItemStack) null') {
    return {
      id: `null_ent_${seq}`,
      type: 'null_or_no_entry',
      category: 'component',
      title: 'No entry selected',
    };
  }

  if (expr === 'entityiterator' || expr === '_entity') {
    return {
      id: `ent_iter_${seq}`,
      type: 'entity_iterator',
      category: 'component',
      title: 'Entity iterator',
    };
  }

  if (expr === 'directioniterator') {
    return {
      id: `dir_iter_${seq}`,
      type: 'direction_iterator',
      category: 'component',
      title: 'Direction iterator',
    };
  }

  if (expr === 'direction' || expr === '_direction' || expr === 'face') {
    return {
      id: `dir_dep_${seq}`,
      type: 'direction_from_deps',
      category: 'component',
      title: 'Trigger direction/face',
    };
  }

  if (expr.includes('.dimension()') || expr === 'dimension') {
    return {
      id: `dim_dep_${seq}`,
      type: 'dimension_from_deps',
      category: 'component',
      title: 'Provided dimension type',
    };
  }

  // VECTOR CONSTRUCTOR: new Vec3(x, y, z)
  if (expr.startsWith('new Vec3(')) {
    const args = extractFunctionArguments(expr, 'new Vec3');
    return {
      id: `vec3_${seq}`,
      type: 'create_vec3',
      category: 'vector',
      title: 'Make vector with x, y, z',
      values: [
        { name: 'x', block: parseExpressionToAST(args[0] || '0', seq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(args[1] || '0', seq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(args[2] || '0', seq * 10 + 3) },
      ],
    };
  }

  // COORDINATES: target.getX(), getX(), x
  if (expr.endsWith('.getX()') || expr === 'x') {
    return { id: `x_${seq}`, type: 'coord_x', category: 'world', title: 'x' };
  }
  if (expr.endsWith('.getY()') || expr === 'y') {
    return { id: `y_${seq}`, type: 'coord_y', category: 'world', title: 'y' };
  }
  if (expr.endsWith('.getZ()') || expr === 'z') {
    return { id: `z_${seq}`, type: 'coord_z', category: 'world', title: 'z' };
  }

  // ITEMSTACK ITERATOR IDENTIFIER
  if (expr === 'itemstackiterator' || expr === 'itemstack') {
    return {
      id: `iter_${seq}`,
      type: 'itemstack_iterator',
      category: 'gui',
      title: 'Itemstack iterator',
    };
  }

  // ITEM PROCEDURES EXPRESSIONS
  // 1. ITEMSTACK GET COUNT: itemstack.getCount()
  if (expr.includes('.getCount()')) {
    const match = expr.match(/^([\s\S]+?)\.getCount\(\)$/);
    const targetExpr = match ? match[1].trim() : 'itemstack';
    return {
      id: `cnt_${seq}`,
      type: 'itemstack_get_count',
      category: 'item',
      title: 'Get number of items in itemstack',
      values: [{ name: 'item', block: parseExpressionToAST(targetExpr, seq * 10 + 1) }],
    };
  }

  // 2. ITEM FROM ITEMSTACK: itemstack.getItem()
  if (expr.endsWith('.getItem()')) {
    const target = expr.replace(/\.getItem\(\)$/, '').trim();
    return {
      id: `item_from_${seq}`,
      type: 'item_from_itemstack',
      category: 'item',
      title: 'Get item from itemstack',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  // 3. ITEM GET DAMAGE & MAX DAMAGE
  if (expr.endsWith('.getDamageValue()') || expr.endsWith('.getDamage()')) {
    const target = expr.replace(/\.(getDamageValue|getDamage)\(\)$/, '').trim();
    return {
      id: `item_dmg_${seq}`,
      type: 'item_get_damage',
      category: 'item',
      title: 'Get damage of item',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.getMaxDamage()')) {
    const target = expr.replace(/\.getMaxDamage\(\)$/, '').trim();
    return {
      id: `item_max_dmg_${seq}`,
      type: 'item_get_max_damage',
      category: 'item',
      title: 'Get max damage of item',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  // 4. ITEM MAX STACK SIZE
  if (expr.endsWith('.getMaxStackSize()')) {
    const target = expr.replace(/\.getMaxStackSize\(\)$/, '').trim();
    return {
      id: `item_max_stack_${seq}`,
      type: 'item_get_max_stack_size',
      category: 'item',
      title: 'Get max stack size of item',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  // 5. ITEM DISPLAY NAME: itemstack.getHoverName().getString() / itemstack.getHoverName()
  if (expr.includes('.getHoverName()')) {
    const match = expr.match(/^([\s\S]+?)\.getHoverName\(\)(?:\.getString\(\))?$/);
    const target = match ? match[1].trim() : 'itemstack';
    return {
      id: `item_name_${seq}`,
      type: 'item_get_display_name',
      category: 'item',
      title: 'Get display name of item',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  // 6. ITEM ENCHANTMENT LEVEL: itemstack.getEnchantmentLevel(...)
  if (expr.includes('.getEnchantmentLevel(')) {
    const match = expr.match(/^([\s\S]+?)\.getEnchantmentLevel\(([\s\S]+)\)$/);
    const target = match ? match[1].trim() : 'itemstack';
    const enchExpr = match ? match[2].trim() : 'Enchantments.SHARPNESS';
    return {
      id: `item_ench_${seq}`,
      type: 'item_get_enhancement',
      category: 'item',
      title: 'Get enchantment level on item',
      values: [
        { name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) },
        { name: 'enhancement', block: parseExpressionToAST(enchExpr, seq * 10 + 2) },
      ],
    };
  }

  // 7. ITEM CHECKS (isDamageable, isEnchanted, isEnchantable, isFood, isEmpty)
  if (expr.endsWith('.isDamageableItem()')) {
    const target = expr.replace(/\.isDamageableItem\(\)$/, '').trim();
    return {
      id: `item_is_dmg_${seq}`,
      type: 'item_is_damageable',
      category: 'item',
      title: 'Is item damageable',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.isEnchanted()')) {
    const target = expr.replace(/\.isEnchanted\(\)$/, '').trim();
    return {
      id: `item_is_ench_${seq}`,
      type: 'item_is_enchanted',
      category: 'item',
      title: 'Is item enchanted',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.isEnchantable()')) {
    const target = expr.replace(/\.isEnchantable\(\)$/, '').trim();
    return {
      id: `item_is_enchable_${seq}`,
      type: 'item_is_enchantable',
      category: 'item',
      title: 'Is item enchantable',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.isFood()') || expr.includes('.getFoodProperties(')) {
    const target = expr.replace(/\.(?:isFood\(\)|getFoodProperties\([^)]*\)\s*!=\s*null)$/, '').trim();
    return {
      id: `item_is_food_${seq}`,
      type: 'item_is_food',
      category: 'item',
      title: 'Is item food',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.isEmpty()')) {
    const target = expr.replace(/\.isEmpty\(\)$/, '').trim();
    return {
      id: `item_is_empty_${seq}`,
      type: 'item_is_empty',
      category: 'item',
      title: 'Is itemstack empty',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.copy()')) {
    const target = expr.replace(/\.copy\(\)$/, '').trim();
    return {
      id: `item_copy_${seq}`,
      type: 'item_copy',
      category: 'item',
      title: 'Copy of itemstack',
      values: [{ name: 'item', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  // 8. ITEM IN HAND / ARMOR GETTERS
  if (expr.endsWith('.getMainHandItem()')) {
    const target = expr.replace(/\.getMainHandItem\(\)$/, '').trim();
    return {
      id: `mainhand_${seq}`,
      type: 'entity_get_mainhand_item',
      category: 'item',
      title: 'Item in main hand',
      values: [{ name: 'entity', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.getOffhandItem()')) {
    const target = expr.replace(/\.getOffhandItem\(\)$/, '').trim();
    return {
      id: `offhand_${seq}`,
      type: 'entity_get_offhand_item',
      category: 'item',
      title: 'Item in off hand',
      values: [{ name: 'entity', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.includes('.getItemBySlot(')) {
    const match = expr.match(/^([\s\S]+?)\.getItemBySlot\(([\s\S]+)\)$/);
    const target = match ? match[1].trim() : 'entity';
    const slotExpr = match ? match[2].trim() : 'EquipmentSlot.HEAD';
    return {
      id: `armor_slot_${seq}`,
      type: 'entity_get_armor_slot_item',
      category: 'item',
      title: 'Item in armor slot',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, seq * 10 + 1) },
        { name: 'slot', block: parseExpressionToAST(slotExpr, seq * 10 + 2) },
      ],
    };
  }

  // 9. ITEM COOLDOWN CHECK: getCooldowns().isOnCooldown(...)
  if (expr.includes('getCooldowns().isOnCooldown(')) {
    const match = expr.match(/^([\s\S]+?)\.getCooldowns\(\)\.isOnCooldown\(([\s\S]+)\)$/);
    const target = match ? match[1].trim() : 'entity';
    const itemExpr = match ? match[2].trim() : 'itemstack.getItem()';
    return {
      id: `item_cd_get_${seq}`,
      type: 'item_cooldown_get',
      category: 'item',
      title: 'Is item on cooldown for entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, seq * 10 + 1) },
        { name: 'item', block: parseExpressionToAST(itemExpr, seq * 10 + 2) },
      ],
    };
  }

  // MINECRAFT ITEM / BLOCK CONSTANTS: Blocks.OBSIDIAN, TheBackwoodsModBlocks.PETRIFIED_ROTTEN_OAK_WOOD.get()
  if (
    expr.startsWith('Blocks.') ||
    expr.startsWith('Items.') ||
    expr.includes('ModBlocks.') ||
    expr.includes('ModItems.')
  ) {
    const title = formatItemDisplayName(expr);
    const value = formatItemFieldValue(expr);
    return {
      id: `mcitem_${seq}`,
      type: 'mcitem_all',
      category: 'item',
      title,
      fields: { value },
    };
  }

  // LITERALS
  if (!isNaN(Number(expr))) {
    return {
      id: `num_${seq}`,
      type: 'math_number',
      category: 'math',
      title: expr,
      fields: { NUM: expr },
    };
  }

  if (expr === 'true' || expr === 'false') {
    return {
      id: `bool_${seq}`,
      type: 'logic_boolean',
      category: 'logic',
      title: expr,
      fields: { BOOL: expr.toUpperCase() },
    };
  }

  if (expr.startsWith('"') && expr.endsWith('"')) {
    const textVal = expr.slice(1, -1);
    return {
      id: `text_${seq}`,
      type: 'text',
      category: 'text',
      title: `"${textVal}"`,
      fields: { TEXT: textVal },
    };
  }

  // DEPENDENCY LEAF IDENTIFIERS
  if (expr === 'sourceentity' || expr === 'sourceEntity' || expr === '_sourceentity') {
    return {
      id: `src_ent_${seq}`,
      type: 'source_entity_from_deps',
      category: 'entity',
      title: 'Source entity',
    };
  }
  if (expr === 'immediatesourceentity' || expr === 'immediateSourceEntity') {
    return {
      id: `imm_ent_${seq}`,
      type: 'immediate_source_entity_from_deps',
      category: 'entity',
      title: 'Immediate source entity',
    };
  }
  if (expr === 'entity' || expr === '_ent' || expr === 'target' || expr === '_player' || expr === 'player' || expr === 'living') {
    return {
      id: `ent_${seq}`,
      type: 'entity_from_deps',
      category: 'entity',
      title: 'Event/target entity',
    };
  }
  if (expr === 'world' || expr === 'level' || expr === '_level' || expr === '_world') {
    return {
      id: `world_${seq}`,
      type: 'world_from_deps',
      category: 'world',
      title: 'Get world',
    };
  }
  if (expr === 'damagesource' || expr === 'damageSource' || expr === '_damagesource') {
    return {
      id: `damagesource_${seq}`,
      type: 'damagesource_from_deps',
      category: 'damage',
      title: 'Damage source',
    };
  }
  if (expr === 'blockstate' || expr === '_blockstate' || expr === 'state') {
    return {
      id: `blockstate_${seq}`,
      type: 'blockstate_from_deps',
      category: 'block',
      title: 'Blockstate at coords',
    };
  }

  // IDENTIFIERS / VARIABLE GETTERS
  if (/^[a-zA-Z0-9_]+$/.test(expr)) {
    return {
      id: `var_${seq}`,
      type: 'variables_get_number',
      category: 'variable',
      title: expr,
      fields: { VAR: `local:${expr}` },
    };
  }

  // FALLBACK SNIPPET FOR UNSUPPORTED COMPLEX EXPRESSION FRAGMENT (Value snippet)
  return {
    id: `snip_expr_${seq}`,
    type: 'custom_code_snippet',
    category: 'code',
    title: 'Custom code snippet (Expression)',
    fields: { CODE: expr || '(null)' },
    isSnippetValue: true,
  };
}

/* -------------------------------------------------------------------------- */
/*                           Parsing Helper Utilities                         */
/* -------------------------------------------------------------------------- */

function isEnclosedInParens(s: string): boolean {
  if (!s.startsWith('(') || !s.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    if (depth <= 0) return false;
  }
  return depth === 1;
}

function findTopLevelOperator(s: string, op: string): number {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') inString = !inString;
    else if (!inString) {
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') depth--;
      else if (depth === 0 && ch === op) return i;
    }
  }
  return -1;
}

function findTopLevelBinaryOp(s: string, op: string): number {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < s.length - op.length + 1; i++) {
    const ch = s[i];
    if (ch === '"') inString = !inString;
    else if (!inString) {
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') depth--;
      else if (depth === 0 && s.substring(i, i + op.length) === op) {
        return i;
      }
    }
  }
  return -1;
}

function findComparisonOperator(s: string): { op: string; index: number; length: number } | null {
  const ops = ['==', '!=', '<=', '>=', '<', '>'];
  let depth = 0;
  let inString = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') inString = !inString;
    else if (!inString) {
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') depth--;
      else if (depth === 0) {
        for (const op of ops) {
          if (s.substring(i, i + op.length) === op) {
            // Prevent matching < or > inside generic type arguments
            if (op === '<' || op === '>') {
              const prev = s[i - 1];
              const next = s[i + 1];
              if (prev && /[a-zA-Z0-9_]/.test(prev) && next && /[a-zA-Z0-9_]/.test(next)) {
                continue;
              }
            }
            return { op, index: i, length: op.length };
          }
        }
      }
    }
  }
  return null;
}

function findLowestPrecedenceArithmeticOp(s: string, targetOps: string[]): number {
  let depth = 0;
  let inString = false;
  let lastIdx = -1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') inString = !inString;
    else if (!inString) {
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') depth--;
      else if (depth === 0) {
        if (targetOps.includes(ch)) {
          // Avoid matching unary minus at start
          if (ch === '-' && (i === 0 || ['+', '-', '*', '/', '(', ','].includes(s[i - 1].trim()))) {
            continue;
          }
          lastIdx = i;
        }
      }
    }
  }
  return lastIdx;
}

function extractFunctionArguments(s: string, fnPrefix: string): string[] {
  const start = s.indexOf(fnPrefix + '(');
  if (start === -1) return [];
  const openParen = start + fnPrefix.length;
  let depth = 0;
  let buffer = '';
  const args: string[] = [];

  for (let i = openParen; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') {
      depth++;
      if (depth > 1) buffer += ch;
    } else if (ch === ')') {
      depth--;
      if (depth === 0) {
        if (buffer.trim()) args.push(buffer.trim());
        break;
      } else {
        buffer += ch;
      }
    } else if (ch === ',' && depth === 1) {
      args.push(buffer.trim());
      buffer = '';
    } else {
      buffer += ch;
    }
  }

  return args;
}

function extractBlockBody(s: string): string {
  const start = s.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  let end = -1;

  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  return end !== -1 ? s.substring(start + 1, end).trim() : s.substring(start + 1).trim();
}

function chainNodes(nodes: BlockASTNode[]): BlockASTNode {
  if (nodes.length === 0) return nodes[0];
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].next = nodes[i + 1];
  }
  return nodes[0];
}

function countTotalBlocks(root: BlockASTNode): number {
  let count = 1;
  if (root.values) {
    for (const v of root.values) {
      if (v.block) count += countTotalBlocks(v.block);
    }
  }
  if (root.statements) {
    for (const s of root.statements) {
      if (s.block) count += countTotalBlocks(s.block);
    }
  }
  if (root.next) {
    count += countTotalBlocks(root.next);
  }
  return count;
}

/* -------------------------------------------------------------------------- */
/*                       Blockly XML Code Generation                          */
/* -------------------------------------------------------------------------- */

function generateBlocklyXmlFromAST(
  root: BlockASTNode,
  extension: '.ptpl' | '.aitpl' | '.cmdtpl' | '.ftpl',
  eventTrigger: string,
  variables?: VariableDecl[]
): string {
  let xml = `<xml xmlns="https://developers.google.com/blockly/xml">\n`;

  if (variables && variables.length > 0) {
    xml += `  <variables>\n`;
    for (const v of variables) {
      const typeMap: Record<string, string> = {
        number: 'Number',
        logic: 'Boolean',
        string: 'String',
        itemstack: 'MCItem',
      };
      const blocklyType = typeMap[v.type] || 'Number';
      xml += `    <variable type="${blocklyType}" id="${escapeXml(v.name)}">${escapeXml(v.name)}</variable>\n`;
    }
    xml += `  </variables>\n`;
  }

  function renderNode(node: BlockASTNode, indent: string = '  ', isRoot: boolean = false): string {
    let res = `${indent}<block type="${node.type}"${isRoot ? ' x="40" y="40"' : ''}>\n`;

    if (node.type === 'event_trigger') {
      res = `${indent}<block type="event_trigger" deletable="false" x="40" y="40">\n`;
      res += `${indent}  <field name="trigger">${eventTrigger}</field>\n`;
    } else if (node.type === 'controls_if') {
      const ifValues = (node.values || []).filter(v => v.name.startsWith('IF'));
      const elseStatement = (node.statements || []).find(s => s.name === 'ELSE');
      const elseIfCount = Math.max(0, ifValues.length - 1);
      const hasElse = elseStatement !== undefined;
      if (elseIfCount > 0 || hasElse) {
        res += `${indent}  <mutation${elseIfCount > 0 ? ` elseif="${elseIfCount}"` : ''}${hasElse ? ` else="1"` : ''}></mutation>\n`;
      }
    } else if (node.fields) {
      for (const [key, val] of Object.entries(node.fields)) {
        res += `${indent}  <field name="${key}">${escapeXml(val)}</field>\n`;
      }
    }

    if (node.values) {
      for (const v of node.values) {
        res += `${indent}  <value name="${v.name}">\n`;
        if (v.block) {
          res += renderNode(v.block, indent + '    ', false);
        }
        res += `${indent}  </value>\n`;
      }
    }

    if (node.statements) {
      for (const s of node.statements) {
        res += `${indent}  <statement name="${s.name}">\n`;
        if (s.block) {
          res += renderNode(s.block, indent + '    ', false);
        }
        res += `${indent}  </statement>\n`;
      }
    }

    if (node.next) {
      res += `${indent}  <next>\n`;
      res += renderNode(node.next, indent + '    ', false);
      res += `${indent}  </next>\n`;
    }

    res += `${indent}</block>\n`;
    return res;
  }

  xml += renderNode(root, '  ', true);
  xml += `</xml>`;
  return xml;
}

function escapeXml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractProcedureClassName(code: string): string {
  const match = code.match(/class\s+([a-zA-Z0-9_]+)/);
  return match ? match[1] : 'ParanoiaAudioLogic';
}

function getNeoForgeVersionInfo(version: NeoForgeVersion): TranslationResult['neoForgeVersionNotes'] {
  switch (version) {
    case '1.21.1':
      return {
        version: '1.21.1',
        compatibilityInfo: 'Standard NeoForge 1.21.1 event bus mapping using LivingDamageEvent.Post, player.level(), Component.literal(), and MobEffectInstance.',
        syntaxDiffs: [
          'LivingDamageEvent.Post event handler pattern for damage checks.',
          'player.level() returns LevelAccessor / Level instance.',
          'Component.literal("Text") for client & system messages.',
          'MobEffectInstance uses direct MobEffects registry holders.',
        ],
      };
    case '26.1.2':
      return {
        version: '26.1.2',
        compatibilityInfo: 'MCreator 2026.1.2 generator targeting modern NeoForge with updated DataParameters, damage containers, and getStringOr NBT fallbacks.',
        syntaxDiffs: [
          'Entity DataParameters sync via _datEntI.getEntityData().get(DATA_xxx).',
          'Component.translatable preferred for localized messaging in MCreator 2026.1+.',
          'entity.getPersistentData().getStringOr(tag, "") modern NBT accessors.',
          'Holder-based Registries and updated sound & particle broadcast methods.',
        ],
      };
  }
}
