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
import { ELEMENT_CONFIGS } from '../data/elementConfigs';

export const GLOBAL_TRIGGERS: Record<string, string> = {
  no_ext_trigger: 'No additional trigger',
  player_ticks: 'On player tick update',
  entity_ticks: 'On entity tick update',
  world_ticks: 'On world tick update',
  entity_attacked: 'When entity is attacked',
  block_break: 'A block is broken',
  block_multiplace: 'A block is multiplaced',
  block_place: 'A block is placed',
  bonemeal_used: 'Bonemeal is used',
  bucket_filled: 'Bucket is filled',
  chat_sent: 'Player sent chat',
  command_executed: 'Command executed',
  crop_attempts_growth: 'Crop attempts to grow',
  entity_blocks: 'Entity blocks with shield',
  entity_change_equipment: 'Entity changes equipment',
  entity_dies: 'Entity dies',
  entity_dropxp: 'Entity drops experience',
  entity_falls: 'Entity falls',
  entity_grief: 'Entity about to grief the world',
  entity_healed: 'Entity is healed',
  entity_item_pickup: 'Entity attempts to pick up item',
  entity_joins_world: 'Entity joins the world',
  entity_jumps: 'Entity jumps',
  entity_pickupxp: 'Entity picks up experience',
  entity_pre_hurt: 'Entity is hurt',
  entity_sets_attack_target: 'Entity sets its attack target',
  entity_spawns: 'Entity spawns',
  entity_struck_by_lightning: 'Entity struck by lightning',
  entity_switch_hand: 'Entity switches hand',
  entity_tamed: 'Entity is tamed',
  entity_travels_to_dimension: 'Entity travels to a dimension',
  entity_uses_totem: 'Entity uses a totem',
  explosion_occurs: 'An explosion occurs',
  farmland_trampled: 'Farmland is trampled',
  gem_dropped: 'Item is dropped',
  gem_expired: 'Dropped item expires',
  item_crafted: 'Item is crafted',
  item_destroyed: 'Item is destroyed',
  item_smelted: 'Item is smelted',
  minecraft_world_loaded: 'Minecraft loads a world',
  minecraft_world_unloaded: 'Minecraft unloads a world',
  mod_clientload: 'Mod client-side loaded',
  mod_load: 'Mod loaded in the game',
  mod_serverload: 'Mod server-side loaded',
  player_completes_advancement: 'Player completes advancement',
  player_critical_hit: 'Player deals critical hit',
  player_fishes_item: 'Player fishes item',
  player_in_bed: 'Player goes to bed',
  player_left_click_air: 'Player left clicks in air',
  player_left_click_block: 'Player left clicks block',
  player_log_in: 'Player joins the world',
  player_log_out: 'Player leaves the world',
  player_respawn: 'Player respawns',
  player_right_click_block: 'Player right clicks block',
  player_right_click_entity: 'Player right clicks on entity',
  player_right_click_item: 'Player right clicks with item',
  player_right_click_empty_hand: 'Player right clicks with empty hand',
  player_use_hoe: 'Player tills with hoe',
  player_useitem_finish: 'Player finishes using item',
  player_useitem_start: 'Player uses item',
  player_useitem_stop: 'Player stops using item',
  player_wakes_up: 'Player wakes up',
  player_xp_change: 'Player XP amount changes',
  player_xp_level_change: 'Player XP level changes',
  sapling_glow: 'Block grows into feature',
  village_siege: 'Zombies siege a village',
  world_loaded: 'On world loaded',
  mcreator_link_device_connected: 'MCreator Link: New device connected',
  mcreator_link_message_received: 'MCreator Link: Custom message received',
  mcreator_link_pin_changed: 'MCreator Link: Digital pin changed',
  right_clicked_item: 'When right clicked with item',
  right_clicked_block: 'When right clicked on block',
  entity_dimension_changed: 'When entity changes dimension',
  craft_item: 'When item is crafted',
  player_joins: 'When player logs in',
  be_global_player_ticks: '[Global] On player tick update',
  be_global_world_ticks: '[Global] On world tick update',
  be_global_block_place: '[Global] A block is placed',
  be_global_entity_dies: '[Global] Entity dies',
  be_global_world_loaded: '[Global] On world loaded',
  be_global_weather_change: '[Global] Weather changes',
  be_global_player_interact_block: '[Global] Player interacts with block',
  be_global_player_interact_entity: '[Global] Player interacts with entity',
  be_global_entity_hits_entity: '[Global] Entity hits another entity (melee attack)',
  be_global_entity_is_hurt: '[Global] Entity is hurt',
  be_global_entity_spawned: '[Global] Entity is spawned',
  be_global_block_explode: '[Global] Block exploded',
  be_global_entity_healed: '[Global] Entity is healed',
  be_global_entity_hits_block: '[Global] Entity hits a block',
  be_global_item_charged: '[Global] Item finished charging',
  be_global_item_released: '[Global] Chargeable item is released',
  be_global_item_starts_charging: '[Global] Chargeable item starts charging',
  be_global_item_stops_charging: '[Global] Chargeable item stops charging or released',
  be_local_block_break: '[Local, Block] Block broken',
  be_local_block_place: '[Local, Block] Block placed',
  be_local_block_player_break: '[Local, Block] Player breaks block',
  be_local_block_player_interact: '[Local, Block] Player interacts with block',
  be_local_block_random_tick: '[Local, Block] Block random tick',
  be_local_item_use: '[Local, Item] Item used',
  be_local_item_consume: '[Local, Item] Item consumed',
  be_local_item_entity_hit: '[Local, Item] Item hits entity',
  be_local_item_mine_block: '[Local, Item] Block mined with item',
  be_local_item_use_completed: '[Local, Item] Item use finished',
  be_local_item_use_on_block: '[Local, Item] Item used on block',
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

  const detectedMethods = extractClassMethods(code);

  let activeMethodName = selectedMethodName;
  let activeBody = '';
  let activeMethod: DetectedMethod | undefined;

  const executeMethods = detectedMethods.filter(m => m.name === 'execute');
  const realExecuteMethod = executeMethods.length > 0
    ? [...executeMethods].sort((a, b) => b.body.length - a.body.length)[0]
    : undefined;

  let bridgeTrigger: string | undefined;

  if (detectedMethods.length > 0) {
    if (activeMethodName) {
      activeMethod = detectedMethods.find(m => m.signature === activeMethodName || m.name === activeMethodName);
    }

    const isDelegator = activeMethod && (
      /^execute\s*\([\s\S]*?\);?$/.test(activeMethod.body.trim().replace(/\/\/.*$/gm, '').trim())
    );

    if (isDelegator && realExecuteMethod && activeMethod && realExecuteMethod.body.length > activeMethod.body.length) {
      if (activeMethod.eventTrigger) {
        bridgeTrigger = activeMethod.eventTrigger;
      }
      activeMethod = realExecuteMethod;
    }
    const subMethod = detectedMethods.find(m => m.eventTrigger || (m.signature && m.signature.includes("@SubscribeEvent")));
    if (subMethod && subMethod.eventTrigger && !bridgeTrigger) {
      bridgeTrigger = subMethod.eventTrigger;
    }

    if (!activeMethod) {
      if (elementType === 'ai_task') {
        const goalsMethod = detectedMethods.find(m => m.name === 'registerGoals' || m.body.includes('goalSelector') || m.body.includes('Goal'));
        if (goalsMethod) {
          activeMethod = goalsMethod;
        }
      }
      if (!activeMethod) {
        if (realExecuteMethod && realExecuteMethod.body.length > 20) {
          activeMethod = realExecuteMethod;
        } else {
          activeMethod = [...detectedMethods].sort((a, b) => b.body.length - a.body.length)[0];
        }
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

  activeBody = normalizeDependencyAliases(activeBody);

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
    if (detectedEventTrigger === 'entity_attacked' || detectedEventTrigger === 'entity_pre_hurt') {
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
    const cmdNameMatch = code.match(/Commands\.literal\s*\(\s*"([^"]+)"\s*\)/);
    const cmdName = cmdNameMatch ? cmdNameMatch[1] : 'customcommand';
    const permMatch = code.match(/hasPermission\s*\(\s*([0-9]+)\s*\)/);
    const permLevel = permMatch ? permMatch[1] : '2';

    rootNode = {
      id: 'root_cmd',
      type: 'args_start',
      category: 'command',
      title: 'Command entry point',
      fields: {
        command_name: cmdName,
        permission_level: permLevel,
      },
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
    try {
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
    } catch (stmtErr: any) {
      console.warn('Failed parsing statement, falling back to snippet:', stmtObj.text, stmtErr);
      nodes.push({
        id: "snippet_" + (idCounter++),
        type: 'custom_code_snippet',
        category: 'code',
        title: 'Custom code snippet',
        fields: { CODE: stmtObj.text },
        sourceLine: stmtObj.startLine,
        sourceEndLine: stmtObj.endLine,
      });
    }
  }

  if (elementType === 'ai_task') {
    rootNode.statements = [{ name: 'tasks', block: nodes.length > 0 ? chainNodes(nodes) : undefined }];
  } else if (elementType === 'command') {
    const commandNodes = parseCommandStructureFromJava(code, breakdown);
    rootNode.statements = [{ name: 'args', block: commandNodes.length > 0 ? chainNodes(commandNodes) : undefined }];
    rootNode.next = undefined;
  } else if (elementType === 'feature') {
    const featNode = parseFeatureStructureFromJava(code, breakdown);
    rootNode = featNode;
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

  if (dependencies.has('amount') && !variables.some(variable => variable.name === 'amount')) {
    const replaceAmount = (node: BlockASTNode): void => {
      if (node.type === 'variables_get_number' && node.fields?.VAR === 'local:amount') {
        node.type = 'custom_dependency_number';
        node.category = 'advanced';
        node.title = 'Number dependency amount';
        node.fields = { NAME: 'amount' };
      }
      node.values?.forEach(value => { if (value.block) replaceAmount(value.block); });
      node.statements?.forEach(statement => { if (statement.block) replaceAmount(statement.block); });
      if (node.next) replaceAmount(node.next);
    };
    replaceAmount(rootNode);
  }

  const blocklyXml = generateBlocklyXmlFromAST(rootNode, elementConfig.extension, detectedEventTrigger, variables);

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


export interface StatementWithLocation {
  text: string;
  startLine: number;
  endLine: number;
}


function unwrapGuardedMethod(code: string, guardPattern: RegExp, methodName: string, targetOverride?: string): string {
  let res = code;
  let idx = 0;
  let loopCount = 0;
  while (loopCount++ < 200) {
    const match = res.substring(idx).match(guardPattern);
    if (!match) break;
    const matchStart = idx + (match.index || 0);
    const mIdx = res.indexOf(methodName + '(', matchStart);
    if (mIdx === -1 || mIdx > matchStart + 150) {
      idx = matchStart + Math.max(1, match[0].length);
      continue;
    }
    const openParen = res.indexOf('(', mIdx);
    let depth = 0;
    let closeParen = -1;
    for (let i = openParen; i < res.length; i++) {
      if (res[i] === '(') depth++;
      else if (res[i] === ')') {
        depth--;
        if (depth === 0) { closeParen = i; break; }
      }
    }
    if (closeParen === -1) { idx = Math.max(idx + 1, mIdx + 1); continue; }
    let endOfStmt = closeParen + 1;
    while (endOfStmt < res.length && /[\s;}]/.test(res[endOfStmt])) {
      if (res[endOfStmt] === ';') { endOfStmt++; break; }
      endOfStmt++;
    }
    const args = res.substring(openParen + 1, closeParen);
    const target = targetOverride !== undefined ? (targetOverride === '$1' ? match[1] : targetOverride) : (match[1] || '');
    const replacement = `${target ? target + '.' : ''}${methodName}(${args});`;
    res = res.substring(0, matchStart) + replacement + res.substring(endOfStmt);
    idx = matchStart + replacement.length;
  }
  return res;
}

function unwrapMCreatorBoilerplate(text: string): string {
  let s = text;

  s = s.replace(
    /^\s*if\s*\(\s*(?:entity|sourceentity|world|level|_level|immediatesourceentity)\s*==\s*null(?:\s*\|\|\s*(?:entity|sourceentity|world|level|_level|immediatesourceentity)\s*==\s*null)*\s*\)\s*return\s*;\s*$/gm,
    ''
  );

  s = s.replace(
    /\(?\s*([a-zA-Z0-9_.]+)\s+instanceof\s+LivingEntity\s+([_a-zA-Z0-9]+)\s*&&\s*\2\.hasEffect\(([^)]+)\)\s*\)?/g,
    (_, ent, _alias, pot) => `${ent}.hasEffect(${pot.trim()})`
  );

  s = s.replace(
    /if\s*\(\s*!([a-zA-Z0-9_.]+)\.level\(\)\.isClientSide\(\)\s*\)\s*\{?\s*\1\.discard\(\)\s*;?\s*\}?/g,
    (_, ent) => `${ent}.discard();`
  );

  s = s.replace(
    /if\s*\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+ServerPlayer\s+([_a-zA-Z0-9]+)\s*&&\s*!\2\.level\(\)\.isClientSide\(\)\s*\)\s*\{\s*ResourceKey<Level>\s*destinationType\s*=\s*([^;]+);[\s\S]*?teleportTo\(nextLevel[\s\S]*?\}\s*\}/g,
    (_, ent, _player, resKeyExpr) => {
      return `${ent}.switchDimension(${resKeyExpr.trim()});`;
    }
  );

  s = unwrapGuardedMethod(s, /if\s*\(\s*(?:world|level)\s+instanceof\s+ServerLevel\s+([_a-zA-Z0-9]+)\s*\)\s*\{?\s*\1\./, 'sendParticles', '_level');
  s = s.replace(
    /if\s*\(\s*(?:world|level|_level)\s+instanceof\s+ServerLevel\s+([_a-zA-Z0-9]+)\s*\)\s*\{?\s*\1\.getServer\(\)\.getCommands\(\)\.performPrefixedCommand\(([\s\S]*?)\);?\s*\}?/g,
    (_, _lvl, args) => `performPrefixedCommand(${args});`
  );

  s = unwrapGuardedMethod(s, /if\s*\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+LivingEntity\s+([_a-zA-Z0-9]+)\s*&&\s*!\2\.level\(\)\.isClientSide\(\)\s*\)\s*\{?\s*\2\./, 'addEffect', '$1');

  s = s.replace(
    /if\s*\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s*\)\s*\{?\s*\3\.getEntityData\(\)\.set\(([\s\S]*?)\);?\s*\}?/g,
    (_, ent, _class, _alias, args) => `${ent}.getEntityData().set(${args});`
  );

  s = s.replace(
    /if\s*\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+LivingEntity\s+([_a-zA-Z0-9]+)\s*&&\s*\2\.getAttributes\(\)\.hasAttribute\(([^)]+)\)\s*\)\s*\{?\s*\2\.getAttribute\(\3\)\.setBaseValue\(([^)]+)\);?\s*\}?/g,
    (_, ent, _alias, attr, val) => `${ent}.getAttribute(${attr}).setBaseValue(${val});`
  );

  s = s.replace(
    /if\s*\(\s*(?:world|level)\s+instanceof\s+Level\s+([_a-zA-Z0-9]+)\s*\)\s*\{\s*if\s*\(\s*!\1\.isClientSide\(\)\s*\)\s*\{([\s\S]*?)\}\s*else\s*\{[\s\S]*?\}\s*\}/g,
    (_, _lvl, serverSideBody) => serverSideBody.trim()
  );

  s = s.replace(
    /if\s*\(\s*event\s+instanceof\s+ICancellableEvent\s+([_a-zA-Z0-9]+)\s*\)\s*\{\s*\1\.setCanceled\(true\);\s*\}/g,
    "event.setCanceled(true);"
  );

  s = s.replace(
    /BlockPos\s+([_a-zA-Z0-9]+)\s*=\s*BlockPos\.containing\([^)]+\);?\s*BlockState\s+([_a-zA-Z0-9]+)\s*=\s*([A-Za-z0-9_.]+(?:\.defaultBlockState\(\))?);?\s*BlockState\s+([_a-zA-Z0-9]+)\s*=\s*(?:world|level)\.getBlockState\(\s*\1\s*\);?\s*for\s*\(\s*Property<\?>\s*[_a-zA-Z0-9]+\s*:\s*\4\.getProperties\(\)\s*\)[\s\S]*?(?:world|level)\.setBlock\(\s*\1\s*,\s*\2\s*,\s*3\s*\);?/g,
    (_, _bp, bs) => `world.setBlock_keepState(${bs});`
  );

  s = s.replace(
    /if\s*\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+(?:Player|ServerPlayer|LivingEntity|Entity|Mob)\s+([a-zA-Z0-9_]+)\s*\)\s*\{\s*\2\.([a-zA-Z0-9_.]+(?:\(\)[a-zA-Z0-9_.]*)*)\s*\(([\s\S]*?)\)\s*;?\s*\}/g,
    (_, ent, _alias, method, args) => `${ent}.${method}(${args});`
  );
  s = s.replace(
    /if\s*\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+(?:Player|ServerPlayer|LivingEntity|Entity|Mob)\s+([a-zA-Z0-9_]+)\s*\)(?!\s*\{)\s*\2\.([a-zA-Z0-9_.]+(?:\(\)[a-zA-Z0-9_.]*)*)\s*\(([\s\S]*?)\)\s*;/g,
    (_, ent, _alias, method, args) => `${ent}.${method}(${args});`
  );

  s = s.replace(
    /\(\s*([a-zA-Z0-9_.]+)\s+instanceof\s+[a-zA-Z0-9_.]+\s+([a-zA-Z0-9_]+)\s*\?\s*\2\.(getEntityData\(\)\.get\(\s*[^()]*\s*\))\s*:\s*(?:ItemStack\.EMPTY|false|true|-?\d+(?:\.\d+)?f?|null|"[^"]*"|'[^']*')\s*\)/g,
    (_, ent, _alias, call) => `${ent}.${call.trim()}`
  );

  s = s.replace(
    /ResourceKey\.create\(\s*Registries\.DIMENSION\s*,\s*ResourceLocation\.(?:parse|fromNamespaceAndPath)\(\s*["']([^"']+)["']\s*\)\s*\)/g,
    (_, res) => {
      const parts = res.split(':');
      const name = parts.length > 1 ? parts[1] : parts[0];
      return 'CUSTOM:' + name.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    }
  );

  s = s.replace(
    /if\s*\(\s*(?:world|level)\s+instanceof\s+Level\s+_level\s*\)\s*\{\s*if\s*\(\s*!_level\.isClientSide\(\)\s*\)\s*\{([\s\S]*?)\}\s*else\s*\{[\s\S]*?\}\s*\}/g,
    (_, serverSideBody) => serverSideBody.trim()
  );

  s = s.replace(
    /BuiltInRegistries\.SOUND_EVENT\.(?:get|getValue)\(\s*(?:ResourceLocation|Identifier)\.(?:parse|fromNamespaceAndPath)\(\s*["']([^"']+)["']\s*\)\s*\)/g,
    (_, soundLoc) => {
      const parts = soundLoc.split(':');
      return '"' + (parts.length > 1 ? parts[1] : parts[0]) + '"';
    }
  );

  s = s.replace(/SoundSource\.([A-Z_]+)/g, (_, src) => '"' + src.toLowerCase() + '"');

  const needle = 'BlockPos.containing(';
  let bpIdx = 0;
  while ((bpIdx = s.indexOf(needle, bpIdx)) !== -1) {
    let depth = 1;
    let start = bpIdx + needle.length;
    let end = -1;
    for (let i = start; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      const inner = s.substring(start, end);
      s = s.substring(0, bpIdx) + inner + s.substring(end + 1);
      bpIdx += inner.length;
    } else {
      bpIdx += needle.length;
    }
  }

  s = s.replace(/\(float\)\s*/g, '');

  return s;
}

function normalizeDependencyAliases(body: string): string {
  body = unwrapMCreatorBoilerplate(body);
  const depAliasRegex = /^\s*(?:Player|LivingEntity|Entity|Level|ServerLevel|LevelAccessor|BlockPos)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^;]+;\s*$/gm;
  const aliases: Record<string, string> = {};

  let m: RegExpExecArray | null;
  depAliasRegex.lastIndex = 0;
  while ((m = depAliasRegex.exec(body)) !== null) {
    const varName = m[1];
    const line = m[0];
    if (line.includes('.getEntity()') || line.includes('.getPlayer()')) {
      aliases[varName] = 'entity';
    } else if (line.includes('.getLevel()') || line.includes('.getWorld()') || line.includes('getLevel()')) {
      aliases[varName] = 'level';
    }
  }

  let result = body.replace(depAliasRegex, '');

  for (const [alias, canonical] of Object.entries(aliases)) {
    if (alias !== canonical) {
      result = result.replace(new RegExp(`\\b${alias}\\.`, 'g'), `${canonical}.`);
    }
  }

  return result;
}

function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of argsStr) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

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
          const methodMatch = header.match(/(?:@SubscribeEvent\s+)?(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(void|[a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)$/);
          if (methodMatch) {
            const mReturnType = methodMatch[1].trim();
            const mName = methodMatch[2];
            const mParams = methodMatch[3].trim();
            let eventTrigger: string | undefined;
            if (header.includes("RightClickBlock") || mName === "onRightClickBlock") {
              eventTrigger = "player_right_click_block";
            } else if (header.includes("RightClickItem") || mName === "onRightClickItem") {
              eventTrigger = "player_right_click_item";
            } else if (header.includes("EntityInteract") || mName === "onRightClickEntity") {
              eventTrigger = "player_right_click_entity";
            } else if (header.includes("LeftClickBlock") || mName === "onLeftClickBlock") {
              eventTrigger = "player_left_click_block";
            } else if (header.includes("LeftClickEmpty") || mName === "onLeftClick") {
              eventTrigger = "player_left_click_air";
            } else if (header.includes("RightClickEmpty") || mName === "onRightClick") {
              eventTrigger = "player_right_click_empty_hand";
            } else if (header.includes("LivingDamageEvent.Pre")) {
              eventTrigger = "entity_pre_hurt";
            } else if (header.includes("LivingIncomingDamageEvent") || header.includes("LivingDamageEvent") || mName === "onEntityAttacked") {
              eventTrigger = "entity_attacked";
            } else if (header.includes("LivingDeathEvent") || mName === "onEntityDeath") {
              eventTrigger = "entity_dies";
            } else if (header.includes("EntityTickEvent") || mName === "onEntityTick") {
              eventTrigger = "entity_ticks";
            } else if (header.includes("PlayerTickEvent") || mName === "onPlayerTick") {
              eventTrigger = "player_ticks";
            } else if (header.includes("LevelTickEvent") || mName === "onWorldTick") {
              eventTrigger = "world_ticks";
            } else if (header.includes("BreakEvent") || mName === "onBlockBreak") {
              eventTrigger = "block_break";
            } else if (header.includes("EntityPlaceEvent") || mName === "onBlockPlace") {
              eventTrigger = "block_place";
            } else if (header.includes("EntityMultiPlaceEvent") || mName === "onBlockMultiPlace") {
              eventTrigger = "block_multiplace";
            } else if (header.includes("FarmlandTrampleEvent") || mName === "onFarmlandTrampled") {
              eventTrigger = "farmland_trampled";
            } else if (header.includes("BonemealEvent") || mName === "onBonemeal") {
              eventTrigger = "bonemeal_used";
            } else if (header.includes("ServerChatEvent") || mName === "onChat") {
              eventTrigger = "chat_sent";
            } else if (header.includes("CommandEvent") || mName === "onCommand") {
              eventTrigger = "command_executed";
            } else if (header.includes("CropGrowEvent") || mName === "onCropGrowPre") {
              eventTrigger = "crop_attempts_growth";
            } else if (header.includes("LivingShieldBlockEvent")) {
              eventTrigger = "entity_blocks";
            } else if (header.includes("LivingEquipmentChangeEvent")) {
              eventTrigger = "entity_change_equipment";
            } else if (header.includes("LivingExperienceDropEvent")) {
              eventTrigger = "entity_dropxp";
            } else if (header.includes("LivingFallEvent")) {
              eventTrigger = "entity_falls";
            } else if (header.includes("EntityMobGriefingEvent")) {
              eventTrigger = "entity_grief";
            } else if (header.includes("LivingHealEvent")) {
              eventTrigger = "entity_healed";
            } else if (header.includes("ItemEntityPickupEvent")) {
              eventTrigger = "entity_item_pickup";
            } else if (header.includes("EntityJoinLevelEvent")) {
              eventTrigger = "entity_spawns";
            } else if (header.includes("LivingJumpEvent")) {
              eventTrigger = "entity_jumps";
            } else if (header.includes("PickupXp")) {
              eventTrigger = "entity_pickupxp";
            } else if (header.includes("LivingChangeTargetEvent")) {
              eventTrigger = "entity_sets_attack_target";
            } else if (header.includes("EntityStruckByLightningEvent")) {
              eventTrigger = "entity_struck_by_lightning";
            } else if (header.includes("LivingSwapItemsEvent")) {
              eventTrigger = "entity_switch_hand";
            } else if (header.includes("AnimalTameEvent")) {
              eventTrigger = "entity_tamed";
            } else if (header.includes("EntityTravelToDimensionEvent")) {
              eventTrigger = "entity_travels_to_dimension";
            } else if (header.includes("LivingUseTotemEvent")) {
              eventTrigger = "entity_uses_totem";
            } else if (header.includes("ExplosionEvent")) {
              eventTrigger = "explosion_occurs";
            } else if (header.includes("ItemTossEvent")) {
              eventTrigger = "gem_dropped";
            } else if (header.includes("ItemExpireEvent")) {
              eventTrigger = "gem_expired";
            } else if (header.includes("ItemCraftedEvent")) {
              eventTrigger = "item_crafted";
            } else if (header.includes("PlayerDestroyItemEvent")) {
              eventTrigger = "item_destroyed";
            } else if (header.includes("ItemSmeltedEvent")) {
              eventTrigger = "item_smelted";
            } else if (header.includes("LevelEvent.Load")) {
              eventTrigger = "minecraft_world_loaded";
            } else if (header.includes("LevelEvent.Unload")) {
              eventTrigger = "minecraft_world_unloaded";
            } else if (header.includes("AdvancementEarnEvent")) {
              eventTrigger = "player_completes_advancement";
            } else if (header.includes("CriticalHitEvent")) {
              eventTrigger = "player_critical_hit";
            } else if (header.includes("ItemFishedEvent")) {
              eventTrigger = "player_fishes_item";
            } else if (header.includes("CanPlayerSleepEvent")) {
              eventTrigger = "player_in_bed";
            } else if (header.includes("PlayerLoggedInEvent")) {
              eventTrigger = "player_log_in";
            } else if (header.includes("PlayerLoggedOutEvent")) {
              eventTrigger = "player_log_out";
            } else if (header.includes("PlayerRespawnEvent")) {
              eventTrigger = "player_respawn";
            } else if (header.includes("LivingEntityUseItemEvent.Finish")) {
              eventTrigger = "player_useitem_finish";
            } else if (header.includes("LivingEntityUseItemEvent.Start")) {
              eventTrigger = "player_useitem_start";
            } else if (header.includes("LivingEntityUseItemEvent.Stop")) {
              eventTrigger = "player_useitem_stop";
            } else if (header.includes("BlockToolModificationEvent")) {
              eventTrigger = "player_use_hoe";
            } else if (header.includes("PlayerWakeUpEvent")) {
              eventTrigger = "player_wakes_up";
            } else if (header.includes("PlayerXpEvent.XpChange")) {
              eventTrigger = "player_xp_change";
            } else if (header.includes("PlayerXpEvent.LevelChange")) {
              eventTrigger = "player_xp_level_change";
            }

            const startLine = code.substring(0, headerStartChar).split('\n').length;
            const bodyStartLine = code.substring(0, i + 1).split('\n').length;

            methods.push({
              name: mName,
              signature: `${mName}(${mParams})`,
              params: mParams,
              returnType: mReturnType,
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

function splitIntoStatements(code: string): string[] {
  return splitStatementsSmart(code);
}

function extractNewItemStackArg(stmt: string): string | null {
  const needle = 'new ItemStack(';
  const itemIdx = stmt.indexOf(needle);
  if (itemIdx === -1) return null;
  const after = stmt.substring(itemIdx + needle.length);
  let depth = 1;
  for (let i = 0; i < after.length; i++) {
    if (after[i] === '(') depth++;
    else if (after[i] === ')') {
      depth--;
      if (depth === 0) {
        return after.substring(0, i).trim();
      }
    }
  }
  return null;
}

function formatItemDisplayName(rawItem: string): string {
  const clean = rawItem.replace(/\.defaultBlockState\(\)/g, '').replace(/\.asItem\(\)/g, '').replace(/\.get\(\)/g, '').trim();
  const parts = clean.split('.');
  const last = parts[parts.length - 1];
  return last
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatItemFieldValue(rawItem: string): string {
  const clean = rawItem.replace(/\.defaultBlockState\(\)/g, '').replace(/\.asItem\(\)/g, '').replace(/\.get\(\)/g, '').trim();
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

function isEntityClearInventory(stmt: string): boolean {
  const s = stmt.trim();
  return (
    s.includes('clearOrCountMatchingItems(p -> true') ||
    s.includes('clearOrCountMatchingItems(p->true') ||
    s.includes('getInventory().clearContent()') ||
    s.includes('.clearInventory()')
  );
}

function parseEntityClearInventoryStatement(
  stmt: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  let entityNode: BlockASTNode = {
    id: `ent_dep_${idSeq}`,
    type: 'entity_from_deps',
    category: 'entity',
    title: 'Event/target entity',
  };
  const entMatch = stmt.match(/([_a-zA-Z0-9]+)\s+instanceof\s+Player/);
  if (entMatch) {
    const rawEnt = entMatch[1].trim();
    if (rawEnt !== 'entity' && rawEnt !== '_player' && rawEnt !== '_ent' && rawEnt !== 'player') {
      entityNode = parseExpressionToAST(rawEnt, idSeq * 10 + 1);
    }
  }

  breakdown.push({
    javaLine: stmt.length > 80 ? stmt.substring(0, 80) + '...' : stmt,
    lineNumber: startLine,
    blockId: `clear_inv_${idSeq}`,
    mcreatorBlock: 'entity_clear_inventory',
    explanation: 'Clear inventory of entity',
  });

  return {
    id: `clear_inv_${idSeq}`,
    type: 'entity_clear_inventory',
    category: 'player',
    title: 'Clear inventory of entity',
    values: [{ name: 'entity', block: entityNode }],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function isEntityRemoveItem(stmt: string): boolean {
  const s = stmt.trim();
  return (
    (s.includes('clearOrCountMatchingItems') && !s.includes('p -> true') && !s.includes('p->true')) ||
    s.includes('removeItem(')
  );
}

function parseEntityRemoveItemStatement(
  stmt: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  let amountNode: BlockASTNode = {
    id: `num_amt_${idSeq}`,
    type: 'math_number',
    category: 'math',
    title: '1',
    fields: { NUM: '1' },
  };
  const countMatch = stmt.match(/clearOrCountMatchingItems\s*\([^,]+,\s*(?:false\s*,\s*)?([^,]+),/);
  if (countMatch) {
    const rawCount = countMatch[1].trim();
    amountNode = parseExpressionToAST(rawCount, idSeq * 10 + 1);
  }

  let itemNode: BlockASTNode = {
    id: `item_rm_${idSeq}`,
    type: 'mcitem_all',
    category: 'item',
    title: 'Item',
    fields: { value: 'Items.AIR' },
  };

  const newStackMatch = stmt.match(/new\s+ItemStack\s*\(\s*([^)]+)\)/);
  if (newStackMatch) {
    const rawItemExpr = newStackMatch[1].trim();
    const title = formatItemDisplayName(rawItemExpr);
    const val = formatItemFieldValue(rawItemExpr);
    itemNode = {
      id: `item_rm_${idSeq}`,
      type: 'mcitem_all',
      category: 'item',
      title: title || 'Item',
      fields: { value: val },
    };
  }

  let entityNode: BlockASTNode = {
    id: `ent_dep_${idSeq}`,
    type: 'entity_from_deps',
    category: 'entity',
    title: 'Event/target entity',
  };
  const entMatch = stmt.match(/([_a-zA-Z0-9]+)\s+instanceof\s+Player/);
  if (entMatch) {
    const rawEnt = entMatch[1].trim();
    if (rawEnt !== 'entity' && rawEnt !== '_player' && rawEnt !== '_ent' && rawEnt !== 'player') {
      entityNode = parseExpressionToAST(rawEnt, idSeq * 10 + 3);
    }
  }

  breakdown.push({
    javaLine: stmt.length > 80 ? stmt.substring(0, 80) + '...' : stmt,
    lineNumber: startLine,
    blockId: `rm_item_${idSeq}`,
    mcreatorBlock: 'entity_remove_item',
    explanation: 'Remove item from entity inventory',
  });

  return {
    id: `rm_item_${idSeq}`,
    type: 'entity_remove_item',
    category: 'player',
    title: 'Remove from inventory',
    values: [
      { name: 'amount', block: amountNode },
      { name: 'item', block: itemNode },
      { name: 'entity', block: entityNode },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function isEntityAddItem(stmt: string): boolean {
  const s = stmt.trim();
  if (s.startsWith('if') && (s.includes('world.setBlock') || s.includes('world.setBlockAndUpdate') || s.includes('getProperties()') || s.includes('for (') || s.includes('for('))) {
    return false;
  }
  return (
    s.includes('giveItemToPlayer(') ||
    s.includes('placeItemBackInInventory(') ||
    (s.includes('getInventory().add(') && !s.includes('getCooldowns')) ||
    (s.includes('.addItem(') && !s.includes('getCooldowns'))
  );
}

function parseEntityAddItemStatement(
  stmt: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  let amountNode: BlockASTNode = {
    id: `num_amt_${idSeq}`,
    type: 'math_number',
    category: 'math',
    title: '1',
    fields: { NUM: '1' },
  };
  const countMatch = stmt.match(/(?:_setstack|_stk|stack)\.setCount\s*\(([\s\S]+?)\);/);
  if (countMatch) {
    const rawCount = countMatch[1].trim();
    amountNode = parseExpressionToAST(rawCount, idSeq * 10 + 1);
  }

  let itemNode: BlockASTNode = {
    id: `item_add_${idSeq}`,
    type: 'mcitem_all',
    category: 'item',
    title: 'Bowl',
    fields: { value: 'Items.BOWL' },
  };

  const rawItemExpr = extractNewItemStackArg(stmt);
  if (rawItemExpr) {
    const title = formatItemDisplayName(rawItemExpr);
    const val = formatItemFieldValue(rawItemExpr);
    itemNode = {
      id: `item_add_${idSeq}`,
      type: 'mcitem_all',
      category: 'item',
      title: title || 'Item',
      fields: { value: val },
    };
  } else {
    const giveMatch = stmt.match(/(?:giveItemToPlayer|placeItemBackInInventory|addItem)\s*\([^,]+,\s*([^)]+)\)/);
    if (giveMatch) {
      const rawItem = giveMatch[1].trim();
      if (rawItem && rawItem !== '_setstack') {
        itemNode = parseExpressionToAST(rawItem, idSeq * 10 + 2);
      }
    }
  }

  let entityNode: BlockASTNode = {
    id: `ent_dep_${idSeq}`,
    type: 'entity_from_deps',
    category: 'entity',
    title: 'Event/target entity',
  };
  const entMatch = stmt.match(/([_a-zA-Z0-9]+)\s+instanceof\s+Player/);
  if (entMatch) {
    const rawEnt = entMatch[1].trim();
    if (rawEnt !== 'entity' && rawEnt !== '_player' && rawEnt !== '_ent' && rawEnt !== 'player') {
      entityNode = parseExpressionToAST(rawEnt, idSeq * 10 + 3);
    }
  }

  breakdown.push({
    javaLine: stmt.length > 80 ? stmt.substring(0, 80) + '...' : stmt,
    lineNumber: startLine,
    blockId: `add_item_${idSeq}`,
    mcreatorBlock: 'entity_add_item',
    explanation: 'Add item to entity inventory',
  });

  return {
    id: `add_item_${idSeq}`,
    type: 'entity_add_item',
    category: 'player',
    title: 'Add to inventory',
    values: [
      { name: 'amount', block: amountNode },
      { name: 'item', block: itemNode },
      { name: 'entity', block: entityNode },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
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

function parseWorldEntityInRangeForeach(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: TranslationBreakdownItem[],
  elementType: MCreatorElementType,
  startLine?: number,
  endLine?: number
): BlockASTNode {
  let xExpr = 'x';
  let yExpr = 'y';
  let zExpr = 'z';
  const vecMatch = stmt.match(/new\s+Vec3\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
  if (vecMatch) {
    xExpr = vecMatch[1].trim();
    yExpr = vecMatch[2].trim();
    zExpr = vecMatch[3].trim();
  }

  let rangeExpr = '10';
  const inflateMatch = stmt.match(/\.inflate\(([\s\S]+?)\s*\/\s*2d\)/);
  if (inflateMatch) {
    rangeExpr = inflateMatch[1].trim();
  } else {
    const rawInflate = stmt.match(/\.inflate\(([^)]+)\)/);
    if (rawInflate) {
      rangeExpr = rawInflate[1].trim();
    }
  }

  let loopBody = '';
  const forMatch = stmt.match(/for\s*\(\s*Entity\s+entityiterator\s*:\s*[\s\S]+?\)\s*\{/);
  if (forMatch && forMatch.index !== undefined) {
    const forStart = stmt.substring(forMatch.index);
    loopBody = extractBlockBody(forStart);
  } else {
    loopBody = extractBlockBody(stmt);
  }

  let bodyLine = startLine !== undefined ? startLine : undefined;
  if (startLine !== undefined && loopBody) {
    const bodyIdx = stmt.indexOf(loopBody);
    if (bodyIdx !== -1) {
      const linesBefore = stmt.substring(0, bodyIdx).split('\n').length - 1;
      bodyLine = startLine + linesBefore;
    }
  }

  const innerStmts = splitStatementsWithLocations(loopBody, bodyLine);
  const innerNodes = innerStmts
    .map((s, idx) => parseJavaStatement(s.text, idSeq * 100 + idx, variables, breakdown, elementType, s.startLine, s.endLine))
    .filter((n): n is BlockASTNode => n !== null);

  breakdown.push({
    javaLine: `For each entity as [Entity iterator] in cube`,
    lineNumber: startLine,
    blockId: `inrange_${idSeq}`,
    mcreatorBlock: 'world_entity_inrange_foreach',
    explanation: `For each entity in square cube with size ${rangeExpr} at (${xExpr}, ${yExpr}, ${zExpr})`,
  });

  return {
    id: `inrange_${idSeq}`,
    type: 'world_entity_inrange_foreach',
    category: 'world',
    title: 'For each entity as [Entity iterator] in square cube',
    sourceLine: startLine,
    sourceEndLine: endLine,
    values: [
      {
        name: '_placeholder',
        block: {
          id: `iter_${idSeq}`,
          type: 'entity_iterator',
          category: 'entity',
          title: 'Entity iterator',
        },
      },
      { name: 'x', block: parseExpressionToAST(xExpr, idSeq * 10 + 1) },
      { name: 'y', block: parseExpressionToAST(yExpr, idSeq * 10 + 2) },
      { name: 'z', block: parseExpressionToAST(zExpr, idSeq * 10 + 3) },
      { name: 'range', block: parseExpressionToAST(rangeExpr, idSeq * 10 + 4) },
    ],
    statements: [
      { name: 'foreach', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined },
    ],
  };
}

function parseEntityNbtSetStatement(
  rawTarget: string,
  method: string,
  keyExpr: string,
  valExpr: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  const isNum = method === 'putDouble' || method === 'putInt' || method === 'putFloat';
  const isBool = method === 'putBoolean';
  const blockType = isNum ? 'entity_nbt_num_set' : isBool ? 'entity_nbt_logic_set' : 'entity_nbt_text_set';

  const cleanKey = keyExpr.trim().replace(/^["']|["']$/g, '');
  const keyAST: BlockASTNode = {
    id: `nbt_key_${idSeq}`,
    type: 'text',
    category: 'text',
    title: `"${cleanKey}"`,
    fields: { TEXT: cleanKey },
  };

  const valAST = parseExpressionToAST(valExpr, idSeq * 10 + 2);

  const isIterator = rawTarget.includes('entityiterator') || rawTarget.includes('_ent');
  const targetAST: BlockASTNode = isIterator
    ? { id: `iter_${idSeq}`, type: 'entity_iterator', category: 'entity', title: 'Entity iterator' }
    : { id: `ent_dep_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' };

  breakdown.push({
    javaLine: `${rawTarget}.getPersistentData().${method}("${cleanKey}", ${valExpr})`,
    lineNumber: startLine,
    blockId: `nbt_set_${idSeq}`,
    mcreatorBlock: blockType,
    explanation: `Set entity custom NBT tag '${cleanKey}' to ${valExpr}`,
  });

  return {
    id: `nbt_set_${idSeq}`,
    type: blockType,
    category: 'entity',
    title: `Set [Entity] custom ${isNum ? 'number' : isBool ? 'logic' : 'text'} NBT tag`,
    sourceLine: startLine,
    sourceEndLine: endLine,
    values: [
      { name: 'entity', block: targetAST },
      { name: 'tagName', block: keyAST },
      { name: 'tagValue', block: valAST },
    ],
  };
}

function parseMoveEntityStatement(
  stmt: string,
  idSeq: number,
  variables: VariableDecl[],
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  let entExpr = 'entity';
  let xExpr = 'x';
  let yExpr = 'y';
  let zExpr = 'z';

  const entMatch = stmt.match(/(?:Entity|Player|LivingEntity)\s+[_a-zA-Z0-9]+\s*=\s*([^;]+);/);
  if (entMatch) {
    entExpr = entMatch[1].trim();
  }

  const xMatch = stmt.match(/double\s+[_a-zA-Z0-9]*x[a-zA-Z0-9]*\s*=\s*([^;]+);/i);
  if (xMatch) {
    xExpr = xMatch[1].trim();
  }

  const yMatch = stmt.match(/double\s+[_a-zA-Z0-9]*y[a-zA-Z0-9]*\s*=\s*([^;]+);/i);
  if (yMatch) {
    yExpr = yMatch[1].trim();
  }

  const zMatch = stmt.match(/double\s+[_a-zA-Z0-9]*z[a-zA-Z0-9]*\s*=\s*([^;]+);/i);
  if (zMatch) {
    zExpr = zMatch[1].trim();
  }

  if (!xMatch || !yMatch || !zMatch) {
    const callMatch = stmt.match(/(?:teleportTo|teleport|setPos)\s*\(/);
    if (callMatch && callMatch.index !== undefined) {
      const startIdx = callMatch.index + callMatch[0].length;
      let depth = 1;
      let endIdx = startIdx;
      for (let i = startIdx; i < stmt.length; i++) {
        if (stmt[i] === '(' || stmt[i] === '[' || stmt[i] === '{') depth++;
        else if (stmt[i] === ')' || stmt[i] === ']' || stmt[i] === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
      const rawArgsStr = stmt.substring(startIdx, endIdx);
      const args: string[] = [];
      let cur = '';
      let argDepth = 0;
      for (let i = 0; i < rawArgsStr.length; i++) {
        const c = rawArgsStr[i];
        if (c === '(' || c === '[' || c === '{') argDepth++;
        else if (c === ')' || c === ']' || c === '}') argDepth--;
        else if (c === ',' && argDepth === 0) {
          args.push(cur.trim());
          cur = '';
          continue;
        }
        cur += c;
      }
      if (cur.trim()) args.push(cur.trim());

      if (args.length >= 6 || (args.length >= 4 && (args[0].includes('Level') || args[0].includes('level')))) {
        if (!xMatch && args[1]) xExpr = args[1];
        if (!yMatch && args[2]) yExpr = args[2];
        if (!zMatch && args[3]) zExpr = args[3];
      } else if (args.length >= 3) {
        if (!xMatch && args[0]) xExpr = args[0];
        if (!yMatch && args[1]) yExpr = args[1];
        if (!zMatch && args[2]) zExpr = args[2];
      }
    }
  }

  breakdown.push({
    javaLine: stmt,
    lineNumber: startLine,
    blockId: `move_ent_${idSeq}`,
    mcreatorBlock: 'move_entity',
    explanation: 'Set location of entity',
  });

  const entAST: BlockASTNode = (entExpr === 'entity' || entExpr === '_ent')
    ? { id: `ent_dep_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
    : (entExpr === 'entityiterator' ? { id: `ent_iter_${idSeq}`, type: 'entity_iterator', category: 'entity', title: 'Entity iterator' } : parseExpressionToAST(entExpr, idSeq * 10 + 1));

  return {
    id: `move_ent_${idSeq}`,
    type: 'move_entity',
    category: 'entity',
    title: 'Set location of entity',
    values: [
      { name: 'entity', block: entAST },
      { name: 'x', block: parseExpressionToAST(xExpr, idSeq * 10 + 2) },
      { name: 'y', block: parseExpressionToAST(yExpr, idSeq * 10 + 3) },
      { name: 'z', block: parseExpressionToAST(zExpr, idSeq * 10 + 4) },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function parseEntityDataSetStatement(stmt: string, idSeq: number, breakdown: TranslationBreakdownItem[], startLine?: number, endLine?: number): BlockASTNode {
  const setMatch = stmt.match(/getEntityData\(\)\.set\(\s*([A-Za-z0-9_]+)\.DATA_([A-Za-z0-9_]+)\s*,\s*([^)]+)\s*\)/);
  const rawEntityClass = setMatch ? setMatch[1] : 'CustomEntity';
  const paramName = setMatch ? setMatch[2] : 'param';
  const valExpr = setMatch ? setMatch[3].trim() : '0';

  const cleanEntityName = rawEntityClass.replace(/Entity$/, '');
  const isBool = valExpr === 'true' || valExpr === 'false';
  const isString = valExpr.startsWith('"') || valExpr.startsWith("'");
  const blockType = isBool ? 'entity_data_logic_set' : isString ? 'entity_data_string_set' : 'entity_data_integer_set';

  breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `ent_data_set_${idSeq}`, mcreatorBlock: blockType, explanation: `Set ${cleanEntityName} data parameter '${paramName}' to ${valExpr}` });

  return {
    id: `ent_data_set_${idSeq}`,
    type: blockType,
    category: 'entity',
    title: `For custom entity of type ${cleanEntityName} set data parameter ${paramName} value`,
    fields: {
      customEntity: `CUSTOM:${cleanEntityName}`,
      accessor: paramName,
    },
    values: [
      { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
      { name: 'value', block: parseExpressionToAST(valExpr, idSeq * 10 + 1) },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function parseEntityAddPotionStatement(stmt: string, idSeq: number, breakdown: TranslationBreakdownItem[], startLine?: number, endLine?: number): BlockASTNode {
  const potMatch = stmt.match(/MobEffectInstance\s*\(\s*MobEffects\.([A-Za-z0-9_]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*(?:,\s*([^,]+)\s*,\s*([^)]+)\s*)?\)/);
  const potName = potMatch ? potMatch[1] : 'REGENERATION';
  const durExpr = potMatch ? potMatch[2].trim() : '60';
  const ampExpr = potMatch ? potMatch[3].trim() : '0';
  const ambExpr = potMatch && potMatch[4] ? potMatch[4].trim() : 'true';
  const partExpr = potMatch && potMatch[5] ? potMatch[5].trim() : 'false';

  const formattedPot = potName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `potion_${idSeq}`, mcreatorBlock: 'entity_add_potion_advanced', explanation: `Add potion ${formattedPot} effect to entity` });

  return {
    id: `potion_${idSeq}`,
    type: 'entity_add_potion_advanced',
    category: 'action',
    title: 'Add potion',
    fields: { potion: formattedPot },
    values: [
      { name: 'potion', block: { id: `pot_name_${idSeq}`, type: 'text', category: 'text', title: formattedPot, fields: { TEXT: formattedPot } } },
      { name: 'level', block: parseExpressionToAST(ampExpr, idSeq * 10 + 1) },
      { name: 'duration', block: parseExpressionToAST(durExpr, idSeq * 10 + 2) },
      { name: 'ambient', block: parseExpressionToAST(ambExpr, idSeq * 10 + 3) },
      { name: 'particles', block: parseExpressionToAST(partExpr, idSeq * 10 + 4) },
      { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function parseEntitySetAttributeStatement(stmt: string, idSeq: number, breakdown: TranslationBreakdownItem[], startLine?: number, endLine?: number): BlockASTNode {
  const attrMatch = stmt.match(/getAttribute\(\s*Attributes\.([A-Za-z0-9_]+)\s*\)\s*\.setBaseValue\(\s*([^)]+)\s*\)/);
  const rawAttr = attrMatch ? attrMatch[1] : 'WATER_MOVEMENT_EFFICIENCY';
  const valExpr = attrMatch ? attrMatch[2].trim() : '1';

  const formattedAttr = rawAttr === 'GRAVITY' ? 'Entity gravity' : rawAttr.split('_').map((w, idx) => idx === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ');

  breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `attr_${idSeq}`, mcreatorBlock: 'entity_set_attribute_base_value', explanation: `Set attribute ${formattedAttr} base value to ${valExpr}` });

  return {
    id: `attr_${idSeq}`,
    type: 'entity_set_attribute_base_value',
    category: 'entity',
    title: 'Set the base value of attribute',
    fields: { attribute: formattedAttr },
    values: [
      { name: 'value', block: parseExpressionToAST(valExpr, idSeq * 10 + 1) },
      { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function parseSpawnEntityStatement(
  stmt: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  const entMatch = stmt.match(/([A-Za-z0-9_]+ModEntities|[A-Za-z0-9_]+Entities|EntityType)\.([A-Za-z0-9_]+)/);
  const rawEnt = entMatch ? entMatch[2] : 'CUSTOM_ENTITY';
  const cleanEntityName = rawEnt
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  let xExpr = 'x', yExpr = 'y', zExpr = 'z';
  const posMatch = stmt.match(/BlockPos\.containing\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/) || stmt.match(/\.spawn\(\s*[^,]+,\s*([^,]+),\s*([^,]+),\s*([^,]+),/);
  if (posMatch) {
    xExpr = posMatch[1].trim();
    yExpr = posMatch[2].trim();
    zExpr = posMatch[3].trim();
  }

  let yawExpr = '0', pitchExpr = '0';
  const yawMatch = stmt.match(/\.setYRot\(([^)]+)\)/);
  if (yawMatch) yawExpr = yawMatch[1].trim();
  const pitchMatch = stmt.match(/\.setXRot\(([^)]+)\)/);
  if (pitchMatch) pitchExpr = pitchMatch[1].trim();

  let vxExpr = '0', vyExpr = '0', vzExpr = '0';
  const velMatch = stmt.match(/\.setDeltaMovement\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/);
  if (velMatch) {
    vxExpr = velMatch[1].trim();
    vyExpr = velMatch[2].trim();
    vzExpr = velMatch[3].trim();
  }

  breakdown.push({
    javaLine: stmt.substring(0, 80) + '...',
    lineNumber: startLine,
    blockId: `spawn_ent_${idSeq}`,
    mcreatorBlock: 'spawn_entity_with_rotation_velocity',
    explanation: `Spawn entity ${cleanEntityName} at (${xExpr}, ${yExpr}, ${zExpr})`,
  });

  return {
    id: `spawn_ent_${idSeq}`,
    type: 'spawn_entity_with_rotation_velocity',
    category: 'action',
    title: 'Spawn entity',
    fields: {
      entity: `CUSTOM:${cleanEntityName}`,
    },
    values: [
      { name: 'x', block: parseExpressionToAST(xExpr, idSeq * 10 + 1) },
      { name: 'y', block: parseExpressionToAST(yExpr, idSeq * 10 + 2) },
      { name: 'z', block: parseExpressionToAST(zExpr, idSeq * 10 + 3) },
      { name: 'yaw', block: parseExpressionToAST(yawExpr, idSeq * 10 + 4) },
      { name: 'pitch', block: parseExpressionToAST(pitchExpr, idSeq * 10 + 5) },
      { name: 'vx', block: parseExpressionToAST(vxExpr, idSeq * 10 + 6) },
      { name: 'vy', block: parseExpressionToAST(vyExpr, idSeq * 10 + 7) },
      { name: 'vz', block: parseExpressionToAST(vzExpr, idSeq * 10 + 8) },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
}

function parseSpawnGemStatement(
  stmt: string,
  idSeq: number,
  breakdown: TranslationBreakdownItem[],
  startLine?: number,
  endLine?: number
): BlockASTNode {
  let itemNode: BlockASTNode = {
    id: `item_${idSeq}`,
    type: 'mcitem_all',
    category: 'item',
    title: 'Dirt',
    fields: { value: 'Blocks.DIRT' },
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
        id: `item_${idSeq}`,
        type: 'mcitem_all',
        category: 'item',
        title,
        fields: { value },
      };
    }
  }

  let xExpr = 'x', yExpr = 'y', zExpr = 'z';
  const posMatch = stmt.match(/new\s+ItemEntity\s*\(\s*[^,]+,\s*([^,]+),\s*([^,]+),\s*([^,]+),/);
  if (posMatch) {
    xExpr = posMatch[1].trim();
    yExpr = posMatch[2].trim();
    zExpr = posMatch[3].trim();
  }

  let delayExpr = '10';
  const delayMatch = stmt.match(/setPickUpDelay\s*\(\s*([^)]+)\s*\)/);
  if (delayMatch) {
    delayExpr = delayMatch[1].trim();
  }

  const isDespawn = !stmt.includes('setUnlimitedLifetime()');

  breakdown.push({
    javaLine: stmt.substring(0, 80) + '...',
    lineNumber: startLine,
    blockId: `spawn_gem_${idSeq}`,
    mcreatorBlock: 'spawn_gem',
    explanation: `Spawn dropped item at (${xExpr}, ${yExpr}, ${zExpr}) with delay ${delayExpr}`,
  });

  return {
    id: `spawn_gem_${idSeq}`,
    type: 'spawn_gem',
    category: 'action',
    title: 'Spawn dropped item',
    fields: {
      despawn: isDespawn ? 'TRUE' : 'FALSE',
    },
    values: [
      { name: 'block', block: itemNode },
      { name: 'x', block: parseExpressionToAST(xExpr, idSeq * 10 + 1) },
      { name: 'y', block: parseExpressionToAST(yExpr, idSeq * 10 + 2) },
      { name: 'z', block: parseExpressionToAST(zExpr, idSeq * 10 + 3) },
      { name: 'pickUpDelay', block: parseExpressionToAST(delayExpr, idSeq * 10 + 4) },
    ],
    sourceLine: startLine,
    sourceEndLine: endLine,
  };
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
  const trimmedStmt = stmt.trim();

  const damageWrapper = trimmedStmt.match(/^if\s*\(\s*world\s+instanceof\s+ServerLevel\s+([\w]+)\s*\)\s*\{\s*([\s\S]+?\.hurtAndBreak\([\s\S]*?\);)\s*\}$/);
  if (damageWrapper) {
    return parseJavaStatement(damageWrapper[2], idSeq, variables, breakdown, elementType, startLine, endLine);
  }

  const portal = trimmedStmt.match(/^if\s*\(\s*world\s+instanceof\s+Level\s+(\w+)\s*\)\s*([\w]+)PortalBlock\.portalSpawn\(/);
  if (portal) {
    const args = extractFunctionArguments(trimmedStmt, 'portalSpawn');
    const coords = args.length === 4 ? args.slice(1) : args.length === 2 ? extractFunctionArguments(args[1], 'BlockPos.containing') : [];
    if (args[0] === portal[1] && coords.length === 3) {
      breakdown.push({ javaLine: stmt, lineNumber: startLine, mcreatorBlock: 'world_make_portal', explanation: 'Create dimension portal' });
      return { id: `portal_${idSeq}`, type: 'world_make_portal', category: 'world', title: 'Create portal', fields: { dimension: `CUSTOM:${portal[2]}` }, values: coords.map((coord, index) => ({ name: ['x', 'y', 'z'][index], block: parseExpressionToAST(coord, idSeq * 10 + index + 1) })) };
    }
  }

  if (!trimmedStmt || /^[\s\}\);]+$/.test(trimmedStmt)) {
    return null;
  }

  const isDirectWaitCall = !trimmedStmt.startsWith('if') && !trimmedStmt.startsWith('for') && !trimmedStmt.startsWith('{') && (
    trimmedStmt.startsWith('queueServerWork(') ||
    trimmedStmt.startsWith('wait(') ||
    trimmedStmt.startsWith('wait_ticks(') ||
    /^[a-zA-Z0-9_.]+\.queueServerWork\s*\(/.test(trimmedStmt)
  );
  if (isDirectWaitCall) {
    const ticksMatch = trimmedStmt.match(/(?:queueServerWork|wait)\s*\(\s*([0-9]+)/);
    const ticks = ticksMatch ? ticksMatch[1] : '20';
    const innerBody = extractBlockBody(trimmedStmt);
    const innerStmts = splitStatementsWithLocations(innerBody, startLine);
    const innerNodes = innerStmts
      .map((s, idx) => parseJavaStatement(s.text, idSeq * 100 + idx, variables, breakdown, elementType, s.startLine, s.endLine))
      .filter((n): n is BlockASTNode => n !== null);

    breakdown.push({ javaLine: trimmedStmt, lineNumber: startLine, blockId: `wait_${idSeq}`, mcreatorBlock: 'wait_ticks', explanation: `Wait ${ticks} ticks before execution` });
    return {
      id: `wait_${idSeq}`,
      type: 'wait_ticks',
      category: 'event',
      title: 'Run task after ticks on server-side',
      values: [{ name: 'ticks', block: { id: `ticks_${idSeq}`, type: 'math_number', category: 'math', title: ticks, fields: { NUM: ticks } } }],
      statements: [{ name: 'task', block: innerNodes.length > 0 ? chainNodes(innerNodes) : undefined }],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (
    (trimmedStmt.includes('destinationType') || trimmedStmt.includes('ClientboundLevelEventPacket') || trimmedStmt.includes('ClientboundGameEventPacket')) &&
    (trimmedStmt.includes('Registries.DIMENSION') || trimmedStmt.includes('dimension() == destinationType') || trimmedStmt.includes('ServerLevel nextLevel'))
  ) {
    const dimMatch = trimmedStmt.match(/(?:ResourceLocation\.parse|new\s+ResourceLocation|Identifier\.fromNamespaceAndPath)\s*\(\s*["']([^"']+)["']\s*\)/);
    let rawDim = dimMatch ? dimMatch[1] : 'CUSTOM:TheGrain';
    const dimParts = rawDim.split(':');
    const dimName = dimParts.length > 1 ? dimParts[1] : dimParts[0];
    const formattedDim = dimName.charAt(0).toUpperCase() + dimName.slice(1);

    const entMatch = trimmedStmt.match(/([_a-zA-Z0-9]+)\s+instanceof\s+ServerPlayer/);
    const rawEnt = entMatch ? entMatch[1] : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_player' || rawEnt === '_ent')
      ? { id: `ent_dep_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, idSeq * 10 + 1);

    breakdown.push({
      javaLine: trimmedStmt.substring(0, 80) + '...',
      lineNumber: startLine,
      blockId: `switch_dim_${idSeq}`,
      mcreatorBlock: 'entity_switch_dimension',
      explanation: `Switch dimension of entity to ${formattedDim}`,
    });

    return {
      id: `switch_dim_${idSeq}`,
      type: 'entity_switch_dimension',
      category: 'entity',
      title: `Switch dimension of entity to ${formattedDim}`,
      fields: { dimension: rawDim.includes(':') ? `CUSTOM:${formattedDim}` : formattedDim },
      values: [{ name: 'entity', block: targetAST }],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (elementType === 'ai_task') {
    if (
      trimmedStmt.startsWith('super.registerGoals') ||
      trimmedStmt.includes('getNodeEvaluator()') ||
      trimmedStmt.includes('setCanOpenDoors') ||
      trimmedStmt.includes('setCanFloat')
    ) {
      return null;
    }
  }

  if (elementType === 'command') {
    if (
      trimmedStmt.includes('arguments.getSource()') ||
      trimmedStmt.includes('FakePlayerFactory') ||
      trimmedStmt.includes('RegisterCommandsEvent') ||
      trimmedStmt.includes('getDispatcher()') ||
      trimmedStmt.startsWith('event.getDispatcher') ||
      trimmedStmt.startsWith('Commands.') ||
      trimmedStmt.startsWith('return 0') ||
      trimmedStmt.startsWith('return')
    ) {
      return null;
    }
  }

  const isServerLevelOnlyWrapper = (
    trimmedStmt.startsWith('if (world instanceof ServerLevel') ||
    trimmedStmt.startsWith('if (_level != null)') ||
    trimmedStmt.startsWith('if (level instanceof ServerLevel')
  );

  const isDirectSpawnStmt = (
    trimmedStmt.startsWith('ItemEntity') ||
    trimmedStmt.startsWith('Entity entityToSpawn') ||
    trimmedStmt.startsWith('_level.addFreshEntity') ||
    trimmedStmt.startsWith('world.addFreshEntity')
  );

  if (isServerLevelOnlyWrapper || isDirectSpawnStmt) {
    if (trimmedStmt.includes('ItemEntity') && trimmedStmt.includes('new ItemEntity(')) {
      return parseSpawnGemStatement(trimmedStmt, idSeq, breakdown, startLine, endLine);
    }
    if (trimmedStmt.includes('.spawn(') || trimmedStmt.includes('MobSpawnType') || trimmedStmt.includes('EntitySpawnReason')) {
      return parseSpawnEntityStatement(trimmedStmt, idSeq, breakdown, startLine, endLine);
    }
  }

  if (!trimmedStmt.startsWith('if') && !trimmedStmt.startsWith('for') && !trimmedStmt.startsWith('{') && trimmedStmt.includes('.getEntityData().set(')) {
    return parseEntityDataSetStatement(trimmedStmt, idSeq, breakdown, startLine, endLine);
  }

  if (!trimmedStmt.startsWith('if') && !trimmedStmt.startsWith('for') && !trimmedStmt.startsWith('{') && (trimmedStmt.includes('.addEffect(') || (trimmedStmt.includes('MobEffectInstance') && !trimmedStmt.includes('hasEffect')))) {
    return parseEntityAddPotionStatement(trimmedStmt, idSeq, breakdown, startLine, endLine);
  }

  if (!trimmedStmt.startsWith('if') && !trimmedStmt.startsWith('for') && !trimmedStmt.startsWith('{') && trimmedStmt.includes('.getAttribute(') && trimmedStmt.includes('.setBaseValue(')) {
    return parseEntitySetAttributeStatement(trimmedStmt, idSeq, breakdown, startLine, endLine);
  }

  if (trimmedStmt.startsWith('{') && trimmedStmt.endsWith('}')) {
    if (trimmedStmt.includes('world.getEntitiesOfClass') || trimmedStmt.includes('new AABB(_center, _center).inflate')) {
      return parseWorldEntityInRangeForeach(trimmedStmt, idSeq, variables, breakdown, elementType, startLine, endLine);
    }

    if (!trimmedStmt.includes('if ') && !trimmedStmt.includes('if(') && (trimmedStmt.includes('.teleportTo(') || trimmedStmt.includes('.teleport(') || trimmedStmt.includes('.setPos('))) {
      return parseMoveEntityStatement(trimmedStmt, idSeq, variables, breakdown, startLine, endLine);
    }

    const scopedNbtMatch = trimmedStmt.match(/\{\s*(?:Entity\s+)?([_a-zA-Z0-9]+)\s*=\s*([^;]+);\s*\1\.getPersistentData\(\)\.(putDouble|putInt|putFloat|putBoolean|putString)\(([^,]+),\s*([^)]+)\);?\s*\}/);
    if (scopedNbtMatch) {
      const rawTarget = scopedNbtMatch[2].trim();
      const method = scopedNbtMatch[3];
      const keyExpr = scopedNbtMatch[4].trim();
      const valExpr = scopedNbtMatch[5].trim();
      return parseEntityNbtSetStatement(rawTarget, method, keyExpr, valExpr, idSeq, breakdown, startLine, endLine);
    }

    const scopedPVarMatch = trimmedStmt.match(/\{\s*.*PlayerVariables\s+([_a-zA-Z0-9]+)\s*=\s*([a-zA-Z0-9_]+)\.getData\(.*PLAYER_VARIABLES\);\s*\1\.([a-zA-Z0-9_]+)\s*=\s*([^;]+);(?:\s*\1\.markSyncDirty\(\);)?\s*\}/);
    if (scopedPVarMatch) {
      const rawTarget = scopedPVarMatch[2].trim();
      const varName = scopedPVarMatch[3].trim();
      const valExpr = scopedPVarMatch[4].trim();
      const targetAST: BlockASTNode = (!rawTarget || rawTarget === 'entity' || rawTarget === 'player')
        ? { id: `ent_dep_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
        : parseExpressionToAST(rawTarget, idSeq * 10 + 1);

      breakdown.push({
        javaLine: trimmedStmt,
        lineNumber: startLine,
        blockId: `pvar_set_${idSeq}`,
        mcreatorBlock: 'variables_set_number',
        explanation: `Set Global Player Variable '${varName}'`,
      });

      return {
        id: `pvar_set_${idSeq}`,
        type: 'variables_set_number',
        category: 'variable',
        title: `Set number Global: ${varName}`,
        fields: { VAR: `global:${varName}` },
        values: [
          { name: 'VAL', block: parseExpressionToAST(valExpr, idSeq * 10 + 2) },
          { name: 'entity', block: targetAST },
        ],
        sourceLine: startLine,
        sourceEndLine: endLine,
      };
    }


    const innerBody = extractBlockBody(trimmedStmt);
    if (innerBody) {
      const innerStmts = splitStatementsWithLocations(innerBody, startLine);
      const innerNodes = innerStmts
        .map((s, idx) => parseJavaStatement(s.text, idSeq * 1000 + idx, variables, breakdown, elementType, s.startLine, s.endLine))
        .filter((n): n is BlockASTNode => n !== null);
      if (innerNodes.length > 0) {
        return chainNodes(innerNodes);
      }
    }
  }

  if (!trimmedStmt.startsWith('if') && !trimmedStmt.startsWith('for') && !trimmedStmt.startsWith('{') && (trimmedStmt.includes('.teleportTo(') || trimmedStmt.includes('.teleport(') || trimmedStmt.includes('.setPos('))) {
    return parseMoveEntityStatement(trimmedStmt, idSeq, variables, breakdown, startLine, endLine);
  }

  const directScopedNbtMatch = trimmedStmt.match(/^(?:Entity\s+)?([_a-zA-Z0-9]+)\s*=\s*([^;]+);\s*\1\.getPersistentData\(\)\.(putDouble|putInt|putFloat|putBoolean|putString)\(([^,]+),\s*([^)]+)\);?$/);
  if (directScopedNbtMatch) {
    const rawTarget = directScopedNbtMatch[2].trim();
    const method = directScopedNbtMatch[3];
    const keyExpr = directScopedNbtMatch[4].trim();
    const valExpr = directScopedNbtMatch[5].trim();
    return parseEntityNbtSetStatement(rawTarget, method, keyExpr, valExpr, idSeq, breakdown, startLine, endLine);
  }

  if (isInventoryForeach(stmt)) {
    return parseInventoryForeachStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  if (isInventorySetSlot(stmt)) {
    return parseInventorySetSlotStatement(stmt, idSeq, breakdown);
  }
  if (isEntityAddItem(stmt)) {
    return parseEntityAddItemStatement(stmt, idSeq, breakdown, startLine, endLine);
  }
  if (isEntityClearInventory(stmt)) {
    return parseEntityClearInventoryStatement(stmt, idSeq, breakdown, startLine, endLine);
  }
  if (isEntityRemoveItem(stmt)) {
    return parseEntityRemoveItemStatement(stmt, idSeq, breakdown, startLine, endLine);
  }

  if (stmt.includes('AdvancementHolder') || stmt.includes('getAdvancements()')) {
    return parseAdvancementStatement(stmt, idSeq, breakdown);
  }

  if (stmt.startsWith('if ') || stmt.startsWith('if(')) {
    return parseIfStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  if (stmt.startsWith('for ') || stmt.startsWith('for(')) {
    return parseForLoopStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  if (stmt.startsWith('while ') || stmt.startsWith('while(')) {
    return parseWhileStatement(stmt, idSeq, variables, breakdown, elementType);
  }

  if (elementType === 'ai_task' || stmt.includes('goalSelector.addGoal') || stmt.includes('targetSelector.addGoal') || stmt.includes('Goal(') || stmt.includes('Goal>')) {
    if (stmt.includes('goalSelector') || stmt.includes('targetSelector') || stmt.includes('Goal') || elementType === 'ai_task') {
      return parseAIGoalStatement(stmt, idSeq, breakdown);
    }
  }

  if (stmt.startsWith('return ') || stmt === 'return;') {
    return parseReturnStatement(stmt, idSeq, breakdown);
  }

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
      type: 'math_dual_ops',
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
      type: 'math_dual_ops',
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

    let target = 'entity';
    const gpdIdx = stmt.indexOf('.getPersistentData()');
    const gcdIdx = stmt.indexOf('.getCustomData()');
    const dataIdx = gpdIdx !== -1 ? gpdIdx : gcdIdx;
    if (dataIdx !== -1) {
      let rawT = stmt.substring(0, dataIdx).trim();
      while (rawT.startsWith('(') && rawT.endsWith(')')) {
        rawT = rawT.slice(1, -1).trim();
      }
      target = rawT || 'entity';
    } else {
      const altMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
      if (altMatch) target = altMatch[1];
    }
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

  if (stmt.includes('setAllowFriendlyFire(')) {
    const teamMatch = stmt.match(/([a-zA-Z0-9_.]+)\.setAllowFriendlyFire\s*\(\s*([^)]+)\s*\)/);
    const teamExpr = teamMatch ? teamMatch[1].trim() : '"team_name"';
    const condExpr = teamMatch ? teamMatch[2].trim() : 'true';
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'team_set_friendlyfire', explanation: 'Set friendly fire for team' });
    return {
      id: `set_ff_${idSeq}`,
      type: 'team_set_friendlyfire',
      category: 'world',
      title: 'Set friendly fire for team with name to',
      values: [
        { name: 'name', block: parseExpressionToAST(teamExpr, idSeq * 10 + 1) },
        { name: 'condition', block: parseExpressionToAST(condExpr, idSeq * 10 + 2) },
      ],
    };
  }

  if (stmt.includes('.hurt(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\.hurt/);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const hurtMatch = stmt.match(/\.hurt\s*\(([^,]+)(?:,([\s\S]+))?\)/);
    let dsExpr = hurtMatch ? hurtMatch[1].trim() : 'damagesource';
    let amtExpr = hurtMatch && hurtMatch[2] ? hurtMatch[2].trim() : '1';

    if (!hurtMatch || !hurtMatch[2]) {
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

  if (stmt.includes('.sendParticles(') || stmt.includes('.addParticle(')) {
    const fnName = stmt.includes('.sendParticles(') ? 'sendParticles' : 'addParticle';
    const openParen = stmt.indexOf(fnName + '(') + fnName.length;
    let depth = 0;
    let closeParen = -1;
    for (let i = openParen; i < stmt.length; i++) {
      if (stmt[i] === '(') depth++;
      else if (stmt[i] === ')') {
        depth--;
        if (depth === 0) { closeParen = i; break; }
      }
    }
    const argsStr = closeParen !== -1 ? stmt.substring(openParen + 1, closeParen) : '';
    const params = splitArgs(argsStr);

    if (params.length >= 8) {
      const partType = (params[0] || 'CAMPFIRE_COSY_SMOKE')
        .replace(/ParticleTypes\./, '')
        .toLowerCase()
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const px = params[1] || 'x';
      const py = params[2] || 'y';
      const pz = params[3] || 'z';
      const countExpr = params[4] || '5';
      const pdx = params[5] || '0.5';
      const pdy = params[6] || '0.5';
      const pdz = params[7] || '0.5';
      const pSpeed = params[8] || '0.001';

      breakdown.push({ javaLine: stmt, mcreatorBlock: 'spawn_particle_multi', explanation: `Spawn ${countExpr} server-side particles of type '${partType}'` });
      return {
        id: `part_${idSeq}`,
        type: 'spawn_particle_multi',
        category: 'action',
        title: `Spawn ${countExpr} server-side particles`,
        fields: { particle: partType },
        values: [
          { name: 'count', block: parseExpressionToAST(countExpr, idSeq * 10 + 1) },
          { name: 'x', block: parseExpressionToAST(px, idSeq * 10 + 2) },
          { name: 'y', block: parseExpressionToAST(py, idSeq * 10 + 3) },
          { name: 'z', block: parseExpressionToAST(pz, idSeq * 10 + 4) },
          { name: 'dx', block: parseExpressionToAST(pdx, idSeq * 10 + 5) },
          { name: 'dy', block: parseExpressionToAST(pdy, idSeq * 10 + 6) },
          { name: 'dz', block: parseExpressionToAST(pdz, idSeq * 10 + 7) },
          { name: 'speed', block: parseExpressionToAST(pSpeed, idSeq * 10 + 8) },
        ],
        sourceLine: startLine,
        sourceEndLine: endLine,
      };
    }

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
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

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

  if (stmt.includes('performPrefixedCommand')) {
    const cmdMatch = stmt.match(/performPrefixedCommand\s*\([^,]+,([\s\S]+?)\);?$/);
    const rawCmd = cmdMatch ? cmdMatch[1].trim() : '"say Hello"';
    const isEntityCmd = (stmt.includes('.createCommandSourceStack()') || stmt.includes('entity.createCommandSourceStack()')) && !stmt.includes('Vec3');

    if (isEntityCmd) {
      breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_execute_command', explanation: 'Execute Minecraft command in name of entity' });
      return {
        id: `cmd_${idSeq}`,
        type: 'entity_execute_command',
        category: 'command',
        title: 'Execute command in name of entity',
        values: [
          { name: 'command', block: parseExpressionToAST(rawCmd, idSeq * 10 + 1) },
          { name: 'entity', block: { id: `ent_${idSeq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } },
        ],
        sourceLine: startLine,
        sourceEndLine: endLine,
      };
    }

    let xExpr = 'x', yExpr = 'y', zExpr = 'z';
    const vecMatch = stmt.match(/new\s+Vec3\s*\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/);
    if (vecMatch) {
      xExpr = vecMatch[1].trim();
      yExpr = vecMatch[2].trim();
      zExpr = vecMatch[3].trim();
    }

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'execute_command', explanation: 'Execute Minecraft command at position' });

    return {
      id: `cmd_${idSeq}`,
      type: 'execute_command',
      category: 'action',
      title: 'Execute command /',
      values: [
        { name: 'command', block: parseExpressionToAST(rawCmd, idSeq * 10 + 1) },
        { name: 'x', block: parseExpressionToAST(xExpr, idSeq * 10 + 2) },
        { name: 'y', block: parseExpressionToAST(yExpr, idSeq * 10 + 3) },
        { name: 'z', block: parseExpressionToAST(zExpr, idSeq * 10 + 4) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

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
    };
  }

  if (stmt.includes('switchDimension') || stmt.includes('changeDimension') || stmt.includes('entity_switch_dimension')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_.]+)\.(?:switchDimension|changeDimension)\s*\(([\s\S]+)\);?/);
    let target = 'entity';
    let rawDim = 'CUSTOM:TheGrain';
    if (targetMatch) {
      target = targetMatch[1].trim();
      rawDim = targetMatch[2].trim();
    }
    let cleanDim = 'CUSTOM:TheGrain';
    const resLocMatch = rawDim.match(/ResourceLocation\.(?:parse|fromNamespaceAndPath)\(\s*["']([^"']+)["']\s*\)/);
    if (resLocMatch) {
      const parts = resLocMatch[1].split(':');
      const name = parts.length > 1 ? parts[1] : parts[0];
      cleanDim = 'CUSTOM:' + name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    } else if (rawDim.includes('CUSTOM:')) {
      cleanDim = rawDim;
    } else if (rawDim.startsWith('"') || rawDim.startsWith("'")) {
      const name = rawDim.replace(/^["']|["']$/g, '');
      cleanDim = 'CUSTOM:' + name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_switch_dimension', explanation: `Switch dimension of entity to '${cleanDim}'` });
    return {
      id: `switch_dim_${idSeq}`,
      type: 'entity_switch_dimension',
      category: 'entity',
      title: `Switch dimension of entity to ${cleanDim.replace('CUSTOM:', '')}`,
      fields: { dimension: cleanDim },
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
    };
  }

  if (stmt.includes('.setBlock(') || stmt.includes('.setBlockAndUpdate(')) {
    const args = extractFunctionArguments(stmt, stmt.includes('.setBlockAndUpdate(') ? 'setBlockAndUpdate' : 'setBlock');
    if (args.length >= 4) {
      const blockMatch = args[3].match(/\b([\w]+ModBlocks|Blocks)\.([A-Z0-9_]+)/);
      if (blockMatch) {
        const rawBlock = blockMatch[1] === 'Blocks' ? `Blocks.${blockMatch[2]}` : blockMatch[2];
        return { id: `blk_rep_${idSeq}`, type: 'block_replace', category: 'block', title: 'Replace block at', fields: { state: 'FALSE', nbt: 'FALSE' }, values: [
          ...args.slice(0, 3).map((coord, index) => ({ name: ['x', 'y', 'z'][index], block: parseExpressionToAST(coord, idSeq * 10 + index + 1) })),
          { name: 'block', block: { id: `mcitem_${idSeq}`, type: 'mcitem_all', category: 'item', title: formatItemDisplayName(rawBlock), fields: { value: formatItemFieldValue(rawBlock) } } },
        ] };
      }
    }
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

  if (stmt.includes('world.setBlock_keepState') || stmt.includes('.setBlock_keepState(')) {
    const blockMatch = stmt.match(/([A-Za-z0-9_]+ModBlocks|[A-Za-z0-9_]+Blocks|Blocks)\.([A-Za-z0-9_]+)/);
    const rawBlock = blockMatch ? (blockMatch[1] === 'Blocks' ? `Blocks.${blockMatch[2]}` : blockMatch[2]) : 'Blocks.FLOWER_POT';
    const cleanName = formatItemFieldValue(rawBlock);
    const displayName = formatItemDisplayName(rawBlock);
    breakdown.push({
      javaLine: stmt,
      lineNumber: startLine,
      blockId: `blk_rep_${idSeq}`,
      mcreatorBlock: 'block_replace',
      explanation: `Replace block at position with ${displayName} (keep state: true)`,
    });
    return {
      id: `blk_rep_${idSeq}`,
      type: 'block_replace',
      category: 'block',
      title: 'Replace block at',
      fields: { state: 'TRUE', nbt: 'FALSE' },
      values: [
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
        { name: 'block', block: { id: `mcitem_${idSeq}`, type: 'mcitem_all', category: 'item', title: displayName, fields: { value: cleanName } } },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes(".defaultBlockState()") && (stmt.includes("world.setBlock(") || stmt.includes(".setBlock("))) {
    const blockMatch = stmt.match(/([A-Za-z0-9_]+ModBlocks|[A-Za-z0-9_]+Blocks|Blocks)\.([A-Za-z0-9_]+)/);
    const rawBlock = blockMatch ? blockMatch[2] : "DIRT";
    const cleanName = "CUSTOM:" + rawBlock.toLowerCase().split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `blk_rep_${idSeq}`, mcreatorBlock: "block_replace", explanation: `Replace block at position with ${cleanName}` });
    return {
      id: `blk_rep_${idSeq}`,
      type: "block_replace",
      category: "block",
      title: "Replace block at",
      fields: { state: "FALSE", nbt: "FALSE" },
      values: [
        { name: "x", block: { id: `x_${idSeq}`, type: "coord_x", category: "world", title: "x" } },
        { name: "y", block: { id: `y_${idSeq}`, type: "coord_y", category: "world", title: "y" } },
        { name: "z", block: { id: `z_${idSeq}`, type: "coord_z", category: "world", title: "z" } },
        { name: "block", block: { id: `mcitem_${idSeq}`, type: "mcitem_all", category: "item", title: cleanName.replace("CUSTOM:", ""), fields: { value: cleanName } } },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes(".destroyBlock(")) {
    const hasParticles = !stmt.includes("false)");
    const blockType = hasParticles ? "block_remove_drop" : "block_remove_with_particles";
    const title = hasParticles ? "Remove block at and spawn break particles" : "Remove block at";

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `block_rem_${idSeq}`, mcreatorBlock: blockType, explanation: title });
    return {
      id: `block_rem_${idSeq}`,
      type: blockType,
      category: "block",
      title,
      values: [
        { name: "x", block: { id: `x_${idSeq}`, type: "coord_x", category: "world", title: "x" } },
        { name: "y", block: { id: `y_${idSeq}`, type: "coord_y", category: "world", title: "y" } },
        { name: "z", block: { id: `z_${idSeq}`, type: "coord_z", category: "world", title: "z" } },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }
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

  if (stmt.includes('playSound') || stmt.includes('play_sound')) {
    const pIdx = stmt.indexOf('playSound(');
    if (pIdx !== -1) {
      let depth = 0;
      let start = stmt.indexOf('(', pIdx);
      let end = start;
      for (let i = start; i < stmt.length; i++) {
        if (stmt[i] === '(') depth++;
        else if (stmt[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
      }
      const argsStr = stmt.substring(start + 1, end);
      const params = splitArgs(argsStr);

      let soundName = 'sound';
      let mappedSound = false;
      let xExpr = 'x', yExpr = 'y', zExpr = 'z';
      let levelExpr = '1', pitchExpr = '1', categoryStr = 'ambient';

      if (params[0] === 'null') {
        const rawSound = (params[4] || '').trim();
        const literalSound = rawSound.match(/^["']([^"']+)["']$/);
        mappedSound = !!literalSound;
        soundName = literalSound ? literalSound[1] : rawSound.replace(/SoundEvents\.(CUSTOM_)?/, '').toLowerCase() || 'sound';
        xExpr = params[1] || 'x';
        yExpr = params[2] || 'y';
        zExpr = params[3] || 'z';
        levelExpr = params[6] || '1';
        pitchExpr = params[7] || '1';
        categoryStr = (params[5] || 'ambient').replace(/SoundSource\./, '').replace(/["']/g, '').toLowerCase();
      } else {
        soundName = params[0] ? params[0].replace(/"/g, '') : 'sound';
        xExpr = params[1] || 'x';
        yExpr = params[2] || 'y';
        zExpr = params[3] || 'z';
        levelExpr = params[4] || '1';
        pitchExpr = params[5] || '1';
        categoryStr = params[6] ? params[6].replace(/"/g, '') : 'ambient';
      }

      if (!mappedSound && !soundName.includes(':')) soundName = `CUSTOM:${soundName}`;

      breakdown.push({ javaLine: stmt, mcreatorBlock: 'play_sound', explanation: `Play sound '${soundName}'` });
      return {
        id: `play_sound_${idSeq}`,
        type: 'play_sound',
        category: 'world',
        title: 'Play sound',
        fields: { sound: soundName, soundcategory: categoryStr },
        values: [
          { name: 'x', block: parseExpressionToAST(xExpr, idSeq * 10 + 1) },
          { name: 'y', block: parseExpressionToAST(yExpr, idSeq * 10 + 2) },
          { name: 'z', block: parseExpressionToAST(zExpr, idSeq * 10 + 3) },
          { name: 'level', block: parseExpressionToAST(levelExpr.replace(/f$/, ''), idSeq * 10 + 4) },
          { name: 'pitch', block: parseExpressionToAST(pitchExpr.replace(/f$/, ''), idSeq * 10 + 5) },
        ],
      };
    }
  }

  if (stmt.includes('causeFoodExhaustion(')) {
    const amtMatch = stmt.match(/causeFoodExhaustion\(([^)]+)\)/);
    const amt = amtMatch ? amtMatch[1].trim() : '-1';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `exhaust_${idSeq}`, mcreatorBlock: 'entity_add_exhaustion', explanation: 'Increase exhaustion of entity' });
    return {
      id: `exhaust_${idSeq}`,
      type: 'entity_add_exhaustion',
      category: 'action',
      title: 'Increase exhaustion of entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'amount', block: parseExpressionToAST(amt, idSeq * 10 + 2) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('giveExperiencePoints(') || stmt.includes('giveExperienceLevels(')) {
    const isLevel = stmt.includes('giveExperienceLevels(');
    const amtMatch = stmt.match(/(?:giveExperiencePoints|giveExperienceLevels)\(([^)]+)\)/);
    const amt = amtMatch ? amtMatch[1].trim() : '1';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const blockType = isLevel ? 'entity_add_xp_level' : 'entity_add_xp';
    const title = isLevel ? 'Add experience levels to entity' : 'Add experience to entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `xp_${idSeq}`, mcreatorBlock: blockType, explanation: title });
    return {
      id: `xp_${idSeq}`,
      type: blockType,
      category: 'action',
      title,
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'xpamount', block: parseExpressionToAST(amt, idSeq * 10 + 2) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.swing(')) {
    const isOffhand = stmt.includes('OFF_HAND');
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const blockType = isOffhand ? 'entity_swing_offhand' : 'entity_swing_mainhand';
    const title = isOffhand ? 'Swing off hand' : 'Swing main hand';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `swing_${idSeq}`, mcreatorBlock: blockType, explanation: title });
    return {
      id: `swing_${idSeq}`,
      type: blockType,
      category: 'action',
      title,
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.setDeltaMovement(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    let vx = '0', vy = '0', vz = '0';
    const v3Idx = stmt.indexOf('new Vec3(');
    if (v3Idx !== -1) {
      let depth = 1;
      let start = v3Idx + 'new Vec3('.length;
      let end = -1;
      for (let i = start; i < stmt.length; i++) {
        if (stmt[i] === '(') depth++;
        else if (stmt[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end !== -1) {
        const v3Args = splitArgs(stmt.substring(start, end));
        if (v3Args.length >= 3) {
          vx = v3Args[0];
          vy = v3Args[1];
          vz = v3Args[2];
        }
      }
    }

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `mov_${idSeq}`, mcreatorBlock: 'entity_set_movement', explanation: 'Set entity velocity vector' });
    return {
      id: `mov_${idSeq}`,
      type: 'entity_set_movement',
      category: 'action',
      title: 'Set velocity of entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'vx', block: parseExpressionToAST(vx, idSeq * 10 + 2) },
        { name: 'vy', block: parseExpressionToAST(vy, idSeq * 10 + 3) },
        { name: 'vz', block: parseExpressionToAST(vz, idSeq * 10 + 4) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.setFoodLevel(')) {
    const amtMatch = stmt.match(/setFoodLevel\(([^)]+)\)/);
    const amt = amtMatch ? amtMatch[1].trim() : '20';
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `food_set_${idSeq}`, mcreatorBlock: 'entity_set_foodlevel', explanation: 'Set food level of entity' });
    return {
      id: `food_set_${idSeq}`,
      type: 'entity_set_foodlevel',
      category: 'action',
      title: 'Set food level of entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'foodlevel', block: parseExpressionToAST(amt, idSeq * 10 + 2) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.heal(') || stmt.includes('.setHealth(')) {
    const amtExpr = extractFunctionArguments(stmt, stmt.includes('.setHealth(') ? 'setHealth' : 'heal')[0]?.trim() || '1';

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

  if (stmt.includes('makeStuckInBlock(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `cobweb_${idSeq}`, mcreatorBlock: 'entity_setinweb', explanation: 'Set entity in cobweb for one tick' });
    return {
      id: `cobweb_${idSeq}`,
      type: 'entity_setinweb',
      category: 'entity',
      title: 'Set [Entity] in cobweb for one tick',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('removeAllEffects(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `clrpots_${idSeq}`, mcreatorBlock: 'entity_clearpotions', explanation: 'Clear all potion effects of entity' });
    return {
      id: `clrpots_${idSeq}`,
      type: 'entity_clearpotions',
      category: 'action',
      title: 'Clear all potion effects of entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.removeEffect(')) {
    const potMatch = stmt.match(/removeEffect\s*\(([^)]+)\)/);
    const potType = potMatch ? potMatch[1].trim() : 'MobEffects.REGENERATION';
    const cleanPot = potType.replace(/MobEffects\./, '').toLowerCase();
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `rm_pot_${idSeq}`, mcreatorBlock: 'entity_remove_specific_potion_effect', explanation: `Remove potion effect ${cleanPot}` });
    return {
      id: `rm_pot_${idSeq}`,
      type: 'entity_remove_specific_potion_effect',
      category: 'action',
      title: `Remove specific potion effect`,
      fields: { potion: cleanPot },
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.startRiding(')) {
    const rideMatch = stmt.match(/^([a-zA-Z0-9_]+)\.startRiding\s*\(([^,)]+)/);
    const passenger = rideMatch ? rideMatch[1].trim() : 'sourceentity';
    const vehicle = rideMatch ? rideMatch[2].trim() : 'entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `ride_${idSeq}`, mcreatorBlock: 'entity_makeride', explanation: 'Make entity ride entity' });
    return {
      id: `ride_${idSeq}`,
      type: 'entity_makeride',
      category: 'action',
      title: 'Make entity ride entity',
      values: [
        { name: 'sourceentity', block: parseExpressionToAST(passenger, idSeq * 10 + 1) },
        { name: 'entity', block: parseExpressionToAST(vehicle, idSeq * 10 + 2) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.stopRiding()')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `stopride_${idSeq}`, mcreatorBlock: 'entity_makestopriding', explanation: 'Make entity stop riding' });
    return {
      id: `stopride_${idSeq}`,
      type: 'entity_makestopriding',
      category: 'action',
      title: 'Make entity stop riding entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.push(') && !stmt.includes('.pushPath(')) {
    const pushMatch = stmt.match(/^([a-zA-Z0-9_]+)\.push\s*\(([^,]+),([^,]+),([^)]+)\)/);
    const target = pushMatch ? pushMatch[1].trim() : 'entity';
    const dx = pushMatch ? pushMatch[2].trim() : '1';
    const dy = pushMatch ? pushMatch[3].trim() : '1';
    const dz = pushMatch ? pushMatch[4].trim() : '1';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `push_${idSeq}`, mcreatorBlock: 'entity_push', explanation: 'Push entity with delta' });
    return {
      id: `push_${idSeq}`,
      type: 'entity_push',
      category: 'action',
      title: 'Push entity with dx dy dz',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'x', block: parseExpressionToAST(dx, idSeq * 10 + 2) },
        { name: 'y', block: parseExpressionToAST(dy, idSeq * 10 + 3) },
        { name: 'z', block: parseExpressionToAST(dz, idSeq * 10 + 4) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.tame(')) {
    const tameMatch = stmt.match(/^([a-zA-Z0-9_]+)\.tame\s*\(([^)]+)\)/);
    const target = tameMatch ? tameMatch[1].trim() : 'entity';
    const tamer = tameMatch ? tameMatch[2].trim() : 'sourceentity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `tame_${idSeq}`, mcreatorBlock: 'entity_maketamed', explanation: 'Tame entity' });
    return {
      id: `tame_${idSeq}`,
      type: 'entity_maketamed',
      category: 'action',
      title: 'Tame entity by sourceentity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'sourceentity', block: parseExpressionToAST(tamer, idSeq * 10 + 2) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('fallDistance =') || stmt.includes('.setFallDistance(') || stmt.includes('resetFallDistance(')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const distMatch = stmt.match(/=\s*([^;]+);/) || stmt.match(/setFallDistance\s*\(([^)]+)\)/);
    const dist = distMatch ? distMatch[1].trim() : '0';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `fall_${idSeq}`, mcreatorBlock: 'entity_override_fall', explanation: 'Override fall distance of entity' });
    return {
      id: `fall_${idSeq}`,
      type: 'entity_override_fall',
      category: 'entity',
      title: 'Override fall distance of entity',
      values: [
        { name: 'height', block: parseExpressionToAST(dist, idSeq * 10 + 1) },
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 2) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.moveTo(') && (stmt.includes('getNavigation()') || stmt.includes('navigation'))) {
    const navMatch = stmt.match(/moveTo\s*\(([^,]+),([^,]+),([^,]+),([^)]+)\)/);
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const x = navMatch ? navMatch[1].trim() : 'x';
    const y = navMatch ? navMatch[2].trim() : 'y';
    const z = navMatch ? navMatch[3].trim() : 'z';
    const spd = navMatch ? navMatch[4].trim() : '1';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `path_${idSeq}`, mcreatorBlock: 'entity_pathfind_to', explanation: 'Pathfind entity to position' });
    return {
      id: `path_${idSeq}`,
      type: 'entity_pathfind_to',
      category: 'action',
      title: 'Attempt to make entity find path and move to',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
        { name: 'x', block: parseExpressionToAST(x, idSeq * 10 + 2) },
        { name: 'y', block: parseExpressionToAST(y, idSeq * 10 + 3) },
        { name: 'z', block: parseExpressionToAST(z, idSeq * 10 + 4) },
        { name: 'speed', block: parseExpressionToAST(spd, idSeq * 10 + 5) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('getNavigation().stop()')) {
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `stop_nav_${idSeq}`, mcreatorBlock: 'entity_stop_navigation', explanation: 'Stop entity navigation' });
    return {
      id: `stop_nav_${idSeq}`,
      type: 'entity_stop_navigation',
      category: 'action',
      title: 'Attempt to stop navigation of entity',
      values: [
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('.lookAt(')) {
    const lookMatch = stmt.match(/lookAt\s*\([^,]+,\s*(?:new\s+Vec3\s*\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)|([^,]+),\s*([^,]+),\s*([^)]+))\)/);
    const targetMatch = stmt.match(/^([a-zA-Z0-9_]+)\./);
    const target = targetMatch ? targetMatch[1] : 'entity';
    const x = lookMatch ? (lookMatch[1] || lookMatch[4] || 'x').trim() : 'x';
    const y = lookMatch ? (lookMatch[2] || lookMatch[5] || 'y').trim() : 'y';
    const z = lookMatch ? (lookMatch[3] || lookMatch[6] || 'z').trim() : 'z';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `look_${idSeq}`, mcreatorBlock: 'entity_rotate_to_face', explanation: 'Rotate entity to face coordinate' });
    return {
      id: `look_${idSeq}`,
      type: 'entity_rotate_to_face',
      category: 'action',
      title: 'Make entity look at coordinate',
      values: [
        { name: 'x', block: parseExpressionToAST(x, idSeq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(y, idSeq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(z, idSeq * 10 + 3) },
        { name: 'entity', block: parseExpressionToAST(target, idSeq * 10 + 4) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

  if (stmt.includes('scheduleTick(')) {
    const tickMatch = stmt.match(/scheduleTick\s*\([^,]+,\s*[^,]+,\s*([^)]+)\)/);
    const ticks = tickMatch ? tickMatch[1].trim() : '0';

    breakdown.push({ javaLine: stmt, lineNumber: startLine, blockId: `sched_${idSeq}`, mcreatorBlock: 'block_schedule_tick', explanation: 'Schedule tick update of block' });
    return {
      id: `sched_${idSeq}`,
      type: 'block_schedule_tick',
      category: 'block',
      title: 'Schedule tick update of block',
      values: [
        { name: 'x', block: { id: `x_${idSeq}`, type: 'coord_x', category: 'world', title: 'x' } },
        { name: 'y', block: { id: `y_${idSeq}`, type: 'coord_y', category: 'world', title: 'y' } },
        { name: 'z', block: { id: `z_${idSeq}`, type: 'coord_z', category: 'world', title: 'z' } },
        { name: 'ticks', block: parseExpressionToAST(ticks, idSeq * 10 + 1) },
      ],
      sourceLine: startLine,
      sourceEndLine: endLine,
    };
  }

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
    const targetMatch = stmt.match(/^([\s\S]+?)\.hurtAndBreak/);
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

  if (stmt.includes('displayClientMessage') || stmt.includes('sendSystemMessage') || stmt.includes('sendSuccess')) {
    let msgExpr = '"Message"';
    let isActbar = 'FALSE';
    let targetEnt = 'entity';

    const entMatch = stmt.match(/^([a-zA-Z0-9_.]+)\.(?:displayClientMessage|sendSystemMessage|sendSuccess)/);
    if (entMatch) {
      targetEnt = entMatch[1].trim();
    }

    const dIdx = stmt.search(/(?:displayClientMessage|sendSystemMessage|sendSuccess)\s*\(/);
    if (dIdx !== -1) {
      const openParen = stmt.indexOf('(', dIdx);
      let depth = 0;
      let closeParen = -1;
      for (let i = openParen; i < stmt.length; i++) {
        if (stmt[i] === '(') depth++;
        else if (stmt[i] === ')') {
          depth--;
          if (depth === 0) { closeParen = i; break; }
        }
      }
      if (closeParen !== -1) {
        const fullArgsStr = stmt.substring(openParen + 1, closeParen);
        const args = splitArgs(fullArgsStr);
        if (args.length >= 1) {
          msgExpr = args[0].trim();
          const compMatch = msgExpr.match(/^Component\.(?:literal|translatable)\s*\(([\s\S]+)\)$/);
          if (compMatch) {
            msgExpr = compMatch[1].trim();
          }
        }
        if (args.length >= 2) {
          isActbar = args[1].trim().toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
        }
      }
    }

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'entity_send_chat', explanation: 'Send chat message to player' });
    return {
      id: `chat_${idSeq}`,
      type: 'entity_send_chat',
      category: 'action',
      title: 'Send message to player',
      values: [
        { name: 'text', block: parseExpressionToAST(msgExpr, idSeq * 10 + 1) },
        { name: 'actbar', block: { id: `actbar_${idSeq}`, type: 'logic_boolean', category: 'logic', title: isActbar, fields: { BOOL: isActbar } } },
        { name: 'entity', block: parseExpressionToAST(targetEnt, idSeq * 10 + 3) },
      ],
    };
  }

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

  if (
    branches.length === 1 &&
    elseBody === null &&
    !branches[0].cond.includes("isClientSide") &&
    !branches[0].cond.includes("getMainHandItem") &&
    !branches[0].cond.includes("getItemInHand") &&
    !branches[0].cond.includes("getBlockState") &&
    (branches[0].cond.includes("LivingDeathEvent") || branches[0].cond.includes("Event _") || branches[0].cond.includes("getSource().getEntity()"))
  ) {
    breakdown.push({
      javaLine: stmt.trim().split('\n')[0],
      lineNumber: startLine,
      blockId: `snip_${idSeq}`,
      mcreatorBlock: 'custom_code_snippet',
      explanation: 'Custom NeoForge mob targeting logic preserved as verbatim code snippet',
    });
    return {
      id: `snip_${idSeq}`,
      type: 'custom_code_snippet',
      category: 'code',
      title: 'Custom code snippet',
      sourceLine: startLine,
      sourceEndLine: endLine,
      fields: { CODE: stmt.trim() },
    };
  }

  const ifValues: { name: string; block?: BlockASTNode }[] = [];
  const ifStatements: { name: string; block?: BlockASTNode }[] = [];

  branches.forEach((branch, idx) => {
    const condAST = parseExpressionToAST(branch.cond, idSeq * 100 + idx * 10 + 1);
    if (startLine !== undefined) condAST.sourceLine = startLine;
    ifValues.push({ name: `IF${idx}`, block: condAST });

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
  if (stmt.includes('world.getEntitiesOfClass') || stmt.includes('new AABB(_center, _center).inflate')) {
    return parseWorldEntityInRangeForeach(stmt, idSeq, variables, breakdown, elementType, startLine, endLine);
  }

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

  if (header.includes(';')) {
    const parts = header.split(';').map(p => p.trim());
    const initPart = parts[0] || 'int i = 0';
    const condPart = parts[1] || 'i < 10';
    const incPart = parts[2] || 'i++';

    const repeatInit = initPart.match(/^int\s+(_i\d+)\s*=\s*0$/);
    if (repeatInit && incPart === `${repeatInit[1]}++` && !new RegExp(`\\b${repeatInit[1]}\\b`).test(body)) {
      const repeatCond = condPart.match(new RegExp(`^${repeatInit[1]}\\s*<\\s*([\\s\\S]+)$`));
      if (repeatCond) {
        return { id: `repeat_${idSeq}`, type: 'controls_repeat_ext', category: 'control', title: 'Repeat times', values: [{ name: 'TIMES', block: parseExpressionToAST(repeatCond[1], idSeq * 10 + 1) }], statements: [{ name: 'DO', block: innerNodes.length ? chainNodes(innerNodes) : undefined }] };
      }
    }

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
  if (stmt.includes('AvoidEntityGoal')) {
    const entityMatch = stmt.match(/([A-Z][A-Za-z0-9_]*Entity)\.class/);
    const entityType = entityMatch ? entityMatch[1].replace('Entity', '') : 'Player';
    const numbers = stmt.match(/[-+]?[0-9]*\.?[0-9]+/g) || [];
    const radius = numbers[1] || '16';
    const nearSpeed = numbers[2] || '1.0';
    const farSpeed = numbers[3] || '1.2';

    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_avoid_entity', explanation: `Avoid living entity of type ${entityType} in radius ${radius}` });
    return {
      id: `ai_avoid_${idSeq}`,
      type: 'aitask_avoid_entity',
      category: 'ai',
      title: `Avoid entity (${entityType})`,
      fields: { entity: entityType },
      values: [
        { name: 'radius', block: { id: `rad_${idSeq}`, type: 'math_number', category: 'math', title: radius, fields: { NUM: radius } } },
        { name: 'walkSpeed', block: { id: `ws_${idSeq}`, type: 'math_number', category: 'math', title: nearSpeed, fields: { NUM: nearSpeed } } },
        { name: 'sprintSpeed', block: { id: `ss_${idSeq}`, type: 'math_number', category: 'math', title: farSpeed, fields: { NUM: farSpeed } } },
      ],
    };
  }

  if (stmt.includes('NearestAttackableTargetGoal') || stmt.includes('TargetGoal')) {
    const entityMatch = stmt.match(/([A-Z][A-Za-z0-9_]*)\.class/);
    const entityType = entityMatch ? entityMatch[1] : 'Player';
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_target_nearest', explanation: `Target nearest attackable ${entityType} goal` });
    return {
      id: `ai_tgt_near_${idSeq}`,
      type: 'aitask_target_nearest',
      category: 'ai',
      title: `Target nearest ${entityType}`,
      fields: { entity: entityType, checkSight: 'true' },
    };
  }

  if (stmt.includes('MeleeAttackGoal')) {
    const spdMatch = stmt.match(/([0-9]+\.[0-9]+)/);
    const speed = spdMatch ? spdMatch[1] : '1.2';
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_attack_on_collide', explanation: `Melee attack on collide with speed factor ${speed}` });
    return {
      id: `ai_melee_${idSeq}`,
      type: 'aitask_attack_on_collide',
      category: 'ai',
      title: 'Melee attack on collide',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: speed, fields: { NUM: speed } } }],
      fields: { longmemory: 'false' },
    };
  }

  if (stmt.includes('OpenDoorGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_open_doors', explanation: 'Open doors AI goal' });
    return {
      id: `ai_opendoors_${idSeq}`,
      type: 'aitask_open_doors',
      category: 'ai',
      title: 'Open doors',
      fields: { closeDoor: stmt.includes('false') ? 'false' : 'true' },
    };
  }

  if (stmt.includes('BreakDoorGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_doors_break', explanation: 'Break doors AI goal' });
    return {
      id: `ai_breakdoors_${idSeq}`,
      type: 'aitask_doors_break',
      category: 'ai',
      title: 'Break doors',
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

  if (stmt.includes('WaterAvoidingRandomStrollGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_wander_avoid_water', explanation: 'Wander avoiding water AI goal' });
    return {
      id: `ai_wander_w_${idSeq}`,
      type: 'aitask_wander_avoid_water',
      category: 'ai',
      title: 'Wander avoiding water',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '0.8', fields: { NUM: '0.8' } } }],
    };
  }

  if (stmt.includes('RandomStrollGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_wander', explanation: 'Wander around AI goal' });
    return {
      id: `ai_wander_${idSeq}`,
      type: 'aitask_wander',
      category: 'ai',
      title: 'Wander around',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '0.8', fields: { NUM: '0.8' } } }],
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

  if (stmt.includes('HurtByTargetGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_target_hurt_by', explanation: 'Fight attacker mobs back goal' });
    return {
      id: `ai_hurt_by_${idSeq}`,
      type: 'aitask_target_hurt_by',
      category: 'ai',
      title: 'Fight attacker mobs back',
      fields: { callForHelp: 'true' },
    };
  }

  if (stmt.includes('LeapAtTargetGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_leap_at_target', explanation: 'Leap at target goal' });
    return {
      id: `ai_leap_${idSeq}`,
      type: 'aitask_leap_at_target',
      category: 'ai',
      title: 'Leap at target',
      values: [{ name: 'speed', block: { id: `h_${idSeq}`, type: 'math_number', category: 'math', title: '0.5', fields: { NUM: '0.5' } } }],
    };
  }

  if (stmt.includes('BreedGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_breed', explanation: 'Breed, find partner goal' });
    return {
      id: `ai_breed_${idSeq}`,
      type: 'aitask_breed',
      category: 'ai',
      title: 'Breed, find partner',
      values: [{ name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1.0', fields: { NUM: '1.0' } } }],
    };
  }

  if (stmt.includes('FollowOwnerGoal')) {
    breakdown.push({ javaLine: stmt, mcreatorBlock: 'aitask_follow_owner', explanation: 'Follow owner goal' });
    return {
      id: `ai_fol_owner_${idSeq}`,
      type: 'aitask_follow_owner',
      category: 'ai',
      title: 'Follow owner',
      values: [
        { name: 'speed', block: { id: `spd_${idSeq}`, type: 'math_number', category: 'math', title: '1.0', fields: { NUM: '1.0' } } },
        { name: 'minDistance', block: { id: `min_${idSeq}`, type: 'math_number', category: 'math', title: '10', fields: { NUM: '10' } } },
        { name: 'maxDistance', block: { id: `max_${idSeq}`, type: 'math_number', category: 'math', title: '2', fields: { NUM: '2' } } },
      ],
    };
  }

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
  breakdown: { javaLine: string; mcreatorBlock: string; explanation: string }[],
  expectedReturnType?: string
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

  const isNumericExpr = (
    !isNaN(Number(retValStr)) ||
    /\.(?:getDouble|getInt|getFloat|getByte|getShort|getLong|size|length)\s*\(/.test(retValStr) ||
    /Math\.(?:abs|max|min|floor|ceil|round|sqrt|pow|sin|cos|tan)\b/.test(retValStr) ||
    (expectedReturnType && /^(?:double|float|int|long|byte|short|number)$/i.test(expectedReturnType))
  );

  const isLogicExpr = (
    retValStr === 'true' || retValStr === 'false' ||
    /\.(?:getBoolean|contains|isEmpty|isPresent|isClientSide|isAlive)\s*\(/.test(retValStr) ||
    /==|!=|<=|>=|<|>|&&|\|\||!/.test(retValStr) ||
    (expectedReturnType && /^(?:boolean|logic)$/i.test(expectedReturnType))
  );

  const isStringExpr = (
    retValStr.startsWith('"') ||
    /\.getString\s*\(/.test(retValStr) ||
    (expectedReturnType && /^(?:string|text)$/i.test(expectedReturnType))
  );

  if (isNumericExpr) {
    retvalType = 'return_number';
    title = 'Return number:';
  } else if (isLogicExpr) {
    retvalType = 'return_logic';
    title = 'Return logic:';
  } else if (isStringExpr) {
    retvalType = 'return_string';
    title = 'Return text:';
  } else if (expectedReturnType && /^(?:itemstack)$/i.test(expectedReturnType)) {
    retvalType = 'return_itemstack';
    title = 'Return itemstack:';
  } else if (expectedReturnType && /^(?:entity)$/i.test(expectedReturnType)) {
    retvalType = 'return_entity';
    title = 'Return entity:';
  } else if (expectedReturnType && /^(?:vec3|vector)$/i.test(expectedReturnType)) {
    retvalType = 'return_vector';
    title = 'Return vector:';
  } else if (expectedReturnType && /^(?:direction)$/i.test(expectedReturnType)) {
    retvalType = 'return_direction';
    title = 'Return direction:';
  } else if (expectedReturnType && /^(?:blockstate)$/i.test(expectedReturnType)) {
    retvalType = 'return_blockstate';
    title = 'Return blockstate:';
  } else if (expectedReturnType && /^(?:damagesource)$/i.test(expectedReturnType)) {
    retvalType = 'return_damagesource';
    title = 'Return damage source:';
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
  } else if (retValStr.includes('itemstack') || retValStr.includes('ItemStack')) {
    retvalType = 'return_itemstack';
    title = 'Return itemstack:';
  } else if (retValStr.includes('entity') || retValStr.includes('player') || retValStr.includes('_ent')) {
    retvalType = 'return_entity';
    title = 'Return entity:';
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


export function parseExpressionToAST(rawExpr: string, seq: number, depth: number = 0): BlockASTNode {
  if (depth > 25 || !rawExpr || !rawExpr.trim()) {
    return {
      id: `snip_expr_${seq}`,
      type: 'custom_code_snippet',
      category: 'code',
      title: 'Custom code snippet',
      fields: { CODE: rawExpr || '' },
      isSnippetValue: true,
    };
  }
  if (depth === 0) {
    rawExpr = unwrapMCreatorBoilerplate(rawExpr);
  }
  let expr = rawExpr.trim();
  if (expr.endsWith(";")) expr = expr.slice(0, -1).trim();

  expr = expr.replace(/\s*\n\s*/g, " ");

  // These version-specific server lookups are intentionally kept as one
  // expression snippet. Letting the generic operator parsers inspect them
  // first can split Java pattern matching and ternary expressions into
  // misleading Blockly values.
  if (
    expr.includes('instanceof net.minecraft.server.level.ServerLevel') ||
    /\bServerLevel\s+_slv\b/.test(expr) ||
    expr.includes('_slv.getServer()') ||
    expr.includes('.getTickCount()')
  ) {
    return {
      id: `snip_expr_${seq}`,
      type: 'custom_code_snippet',
      category: 'code',
      title: `Custom code snippet: ${rawExpr.trim()}`,
      fields: { CODE: rawExpr.trim() },
      isSnippetValue: true,
    };
  }

  while (expr.startsWith("(") && expr.endsWith(")")) {
    let depth = 0;
    let enclosed = true;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === "(") depth++;
      else if (expr[i] === ")") {
        depth--;
        if (depth === 0) { enclosed = false; break; }
      }
    }
    if (enclosed) {
      expr = expr.substring(1, expr.length - 1).trim();
    } else {
      break;
    }
  }

  if (expr.startsWith('!') && !expr.startsWith('!=') && findTopLevelBinaryOp(expr, '&&') === -1 && findTopLevelBinaryOp(expr, '||') === -1) {
    return { id: `neg_${seq}`, type: 'logic_negate', category: 'logic', title: 'not', values: [{ name: 'BOOL', block: parseExpressionToAST(expr.slice(1).trim(), seq * 10 + 1) }] };
  }

  // Match the complete call before inspecting its arguments for other patterns.
  // The MCreator generator emits these functions around arbitrary expressions.
  const mathCall = expr.match(/^Math\.(sqrt|cbrt|round|ceil|floor|abs|signum|log|log10|sin|cos|tan|asin|acos|atan|toDegrees|toRadians|pow|min|max|hypot|atan2|exp)\s*\(/);
  if (mathCall) {
    const open = expr.indexOf('(', mathCall[0].length - 1);
    let nesting = 0, end = -1, quote = '';
    for (let i = open; i < expr.length; i++) {
      const ch = expr[i];
      if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = ''; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(') nesting++;
      else if (ch === ')' && --nesting === 0) { end = i; break; }
    }
    if (end === expr.length - 1) {
      const args = splitArgs(expr.slice(open + 1, end));
      const unary: Record<string, string> = { sqrt: 'ROOT', cbrt: 'CUBEROOT', round: 'ROUND', ceil: 'ROUNDUP', floor: 'ROUNDDOWN', abs: 'ABS', signum: 'SIGNUM', log: 'LN', log10: 'LOG10', sin: 'SIN', cos: 'COS', tan: 'TAN', asin: 'ASIN', acos: 'ACOS', atan: 'ATAN', toDegrees: 'RAD2DEG', toRadians: 'DEG2RAD' };
      const binary: Record<string, string> = { pow: 'POWER', min: 'MIN', max: 'MAX', hypot: 'HYPOT', atan2: 'ATAN2' };
      const fn = mathCall[1];
      if (unary[fn] && args.length === 1) return { id: `math_s_${seq}`, type: 'math_singular_ops', category: 'math', title: fn, fields: { OP: unary[fn] }, values: [{ name: 'NUM', block: parseExpressionToAST(args[0], seq * 10 + 1) }] };
      if (binary[fn] && args.length === 2) return { id: `math_d_${seq}`, type: 'math_dual_ops', category: 'math', title: fn, fields: { OP: binary[fn] }, values: [{ name: 'A', block: parseExpressionToAST(args[0], seq * 10 + 1) }, { name: 'B', block: parseExpressionToAST(args[1], seq * 10 + 2) }] };
      if (fn === 'exp' && args.length === 1) return { id: `snip_expr_${seq}`, type: 'custom_code_snippet', category: 'code', title: 'Custom code snippet (Expression)', fields: { CODE: expr }, isSnippetValue: true };
    }
  }

  const healthTernary = expr.match(/^([\w.]+)\s+instanceof\s+LivingEntity\s+(\w+)\s*\?\s*\2\.getHealth\(\)\s*:\s*-1$/);
  if (healthTernary) {
    return { id: `health_${seq}`, type: 'entity_health', category: 'entity', title: 'Current health of entity', values: [{ name: 'entity', block: parseExpressionToAST(healthTernary[1], seq * 10 + 1) }] };
  }

  // Exact zero-argument generators from MCreator's entity data toolbox.
  const entityDataMethods: Record<string, [string, string]> = {
    isAlive: ['entity_isalive', 'alive'], isVehicle: ['entity_isbeingridden', 'being ridden'],
    isOnFire: ['entity_isburning', 'burning'], fireImmune: ['entity_isimmunetofire', 'immune to fire'],
    isInLava: ['entity_isinlava', 'in lava'], isInWall: ['entity_isinwall', 'inside a solid wall'],
    isInvisible: ['entity_isinvisible', 'invisible'], isInvulnerable: ['entity_isinvulnerable', 'invulnerable'],
    isInWater: ['entity_isinwater', 'in water'], isInWaterRainOrBubble: ['entity_isinwaterrain_orbubblecolumn', 'in water, rain or bubble column'],
    isInWaterOrBubble: ['entity_isinwater_orbubblecolumn', 'in water or bubble column'], onGround: ['entity_isonground', 'on ground'],
    isPassenger: ['entity_isriding', 'riding'], isShiftKeyDown: ['entity_issneaking', 'sneaking'],
    isSprinting: ['entity_issprinting', 'sprinting'], isAttackable: ['entity_is_attackable', 'attackable'],
    isCurrentlyGlowing: ['entity_is_glowing', 'glowing'], isSwimming: ['entity_is_swimming', 'swimming'],
    isUnderWater: ['entity_is_underwater', 'underwater'], isNoGravity: ['entity_has_nogravity', 'without gravity'],
  };
  const directEntityData = expr.match(/^([a-zA-Z_$][\w$]*)\.([a-zA-Z]+)\(\)$/);
  if (directEntityData && entityDataMethods[directEntityData[2]]) {
    const [type, title] = entityDataMethods[directEntityData[2]];
    return { id: `entity_data_${seq}`, type, category: 'entity', title: `Is entity ${title}`, values: [{ name: 'entity', block: parseExpressionToAST(directEntityData[1], seq * 10 + 1) }] };
  }

  const guardedEntityData = expr.match(/^([a-zA-Z_$][\w$]*)\s+instanceof\s+(LivingEntity|Mob)\s+([\w$]+)\s*&&\s*\3\.(isAggressive|isBlocking|isBaby|isSleeping|isFallFlying)\(\)$/);
  if (guardedEntityData) {
    const guardedTypes: Record<string, [string, string, string]> = {
      isAggressive: ['Mob', 'entity_isaggressive', 'currently aggressive'],
      isBlocking: ['LivingEntity', 'entity_isblocking', 'blocking'],
      isBaby: ['LivingEntity', 'entity_ischild', 'a child'],
      isSleeping: ['LivingEntity', 'entity_issleeping', 'sleeping'],
      isFallFlying: ['LivingEntity', 'entity_is_elytra_flying', 'elytra flying'],
    };
    const [required, type, title] = guardedTypes[guardedEntityData[4]];
    if (guardedEntityData[2] === required) return { id: `entity_data_${seq}`, type, category: 'entity', title: `Is entity ${title}`, values: [{ name: 'entity', block: parseExpressionToAST(guardedEntityData[1], seq * 10 + 1) }] };
  }

  const explosionImmunity = expr.match(/^([a-zA-Z_$][\w$]*)\.ignoreExplosion\(new\s+Explosion\(\1\.level\(\),\s*null,\s*0,\s*0,\s*0,\s*4,\s*true,\s*Explosion\.BlockInteraction\.DESTROY\)\)$/);
  if (explosionImmunity) return { id: `entity_data_${seq}`, type: 'entity_isimmunetoexplosions', category: 'entity', title: 'Is entity immune to explosions', values: [{ name: 'entity', block: parseExpressionToAST(explosionImmunity[1], seq * 10 + 1) }] };

  const handItem = expr.match(/^([\w.]+)\s+instanceof\s+LivingEntity\s+(\w+)\s*\?\s*\2\.get(MainHand|Offhand)Item\(\)\s*:\s*ItemStack\.EMPTY$/);
  if (handItem) {
    const main = handItem[3] === 'MainHand';
    return { id: `hand_${seq}`, type: main ? 'entity_iteminhand' : 'entity_iteminoffhand', category: 'item', title: main ? 'Item in main-hand of' : 'Item in off-hand of', values: [{ name: 'entity', block: parseExpressionToAST(handItem[1], seq * 10 + 1) }] };
  }

  const blockComparison = expr.match(/^\(*\s*(?:world|level)\.getBlockState\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)\s*\)*\.getBlock\(\)\s*==\s*([\w]+ModBlocks|Blocks)\.([A-Z0-9_]+)(?:\.get\(\))?$/);
  if (blockComparison) {
    const rawBlock = blockComparison[4] === 'Blocks' ? `Blocks.${blockComparison[5]}` : blockComparison[5];
    const coords = blockComparison.slice(1, 4);
    return { id: `compare_block_${seq}`, type: 'compare_mcblocks', category: 'block', title: 'Compare blocks', values: [
      { name: 'a', block: { id: `get_block_${seq}`, type: 'world_get_block', category: 'world', title: 'Get block at', values: coords.map((coord, index) => ({ name: ['x', 'y', 'z'][index], block: parseExpressionToAST(coord, seq * 10 + index + 1) })) } },
      { name: 'b', block: { id: `block_${seq}`, type: 'mcitem_all', category: 'item', title: formatItemDisplayName(rawBlock), fields: { value: formatItemFieldValue(rawBlock) } } },
    ] };
  }

  const javaConstants: Record<string, [string, string]> = {
    'Double.POSITIVE_INFINITY': ['INFINITY', '∞'],
    'Double.NEGATIVE_INFINITY': ['NINFINITY', '-∞'],
    'Double.NaN': ['NAN', 'NaN'],
  };
  if (javaConstants[expr]) {
    return {
      id: `math_const_${seq}`,
      type: 'math_java_constants',
      category: 'math',
      title: javaConstants[expr][1],
      fields: { CONSTANT: javaConstants[expr][0] },
    };
  }

  const cmdNumMatch = expr.match(/(?:Double|Float|Integer|Long)ArgumentType\.get(?:Double|Float|Integer|Long)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)|commandParameterNumber\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdNumMatch) {
    const paramVal = cmdNumMatch[1] || cmdNumMatch[2];
    return {
      id: `cmd_param_num_${seq}`,
      type: 'get_command_parameter_number',
      category: 'command',
      title: 'Get command number parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdBoolMatch = expr.match(/BoolArgumentType\.getBool\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)|commandParameterLogic\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdBoolMatch) {
    const paramVal = cmdBoolMatch[1] || cmdBoolMatch[2];
    return {
      id: `cmd_param_logic_${seq}`,
      type: 'get_command_parameter_logic',
      category: 'command',
      title: 'Get command logic parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdStrMatch = expr.match(/(?:StringArgumentType\.getString|MessageArgument\.getMessage|commandParameterString|commandParameterMessage)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdStrMatch) {
    const paramVal = cmdStrMatch[1];
    return {
      id: `cmd_param_str_${seq}`,
      type: 'get_command_parameter_string',
      category: 'command',
      title: 'Get command text parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdEntMatch = expr.match(/(?:EntityArgument\.getEntity|commandParameterEntity)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdEntMatch) {
    const paramVal = cmdEntMatch[1];
    return {
      id: `cmd_param_ent_${seq}`,
      type: 'get_command_parameter_entity',
      category: 'command',
      title: 'Get command entity parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdPosCompMatch = expr.match(/(?:commandParameterBlockPos|BlockPosArgument\.getLoadedBlockPos|BlockPosArgument\.getBlockPos)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)\s*\.(getX|getY|getZ)\s*\(\s*\)/);
  if (cmdPosCompMatch) {
    const paramVal = cmdPosCompMatch[1];
    const comp = cmdPosCompMatch[2].toLowerCase();
    const axis = comp.endsWith('x') ? 'x' : comp.endsWith('y') ? 'y' : 'z';
    return {
      id: `cmd_param_pos_${axis}_${seq}`,
      type: `get_command_parameter_blockpos_${axis}`,
      category: 'command',
      title: `Get command blockpos ${axis} parameter`,
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdPosMatch = expr.match(/(?:BlockPosArgument\.(?:getLoadedBlockPos|getBlockPos)|commandParameterBlockPos)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdPosMatch) {
    const paramVal = cmdPosMatch[1];
    return {
      id: `cmd_param_pos_${seq}`,
      type: 'get_command_parameter_blockpos',
      category: 'command',
      title: 'Get command block pos parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdBsMatch = expr.match(/(?:BlockStateArgument\.getBlock|commandParameterBlockState)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdBsMatch) {
    const paramVal = cmdBsMatch[1];
    return {
      id: `cmd_param_bs_${seq}`,
      type: 'get_command_parameter_blockstate',
      category: 'command',
      title: 'Get command blockstate parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdItemMatch = expr.match(/(?:ItemArgument\.getItem|commandParameterItemStack)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdItemMatch) {
    const paramVal = cmdItemMatch[1];
    return {
      id: `cmd_param_item_${seq}`,
      type: 'get_command_parameter_itemstack',
      category: 'command',
      title: 'Get command itemstack parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  const cmdResMatch = expr.match(/(?:ResourceLocationArgument|IdentifierArgument)\.(?:getId|getResourceLocation)\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)|commandParameterResourceLocation\s*\(\s*arguments\s*,\s*["']([^"']+)["']\s*\)/);
  if (cmdResMatch) {
    const paramVal = cmdResMatch[1] || cmdResMatch[2];
    return {
      id: `cmd_param_res_${seq}`,
      type: 'get_command_parameter_resource_location',
      category: 'command',
      title: 'Get command resource location parameter',
      fields: { param: paramVal, name: paramVal },
    };
  }

  if (!expr.includes(" || ") && !expr.includes(" && ") && expr.includes(".is(ItemTags.create(")) {
    const dotIs = expr.indexOf(".is(ItemTags.create(");
    const rawStack = expr.substring(0, dotIs).trim();
    const rest = expr.substring(dotIs);
    const quoteMatch = rest.match(/["']([^"']+)["']/);
    const tagArg = quoteMatch ? quoteMatch[1] : "minecraft:logs";

    let itemAST: BlockASTNode = parseExpressionToAST(rawStack, seq * 10 + 1);
    if (rawStack.includes("getOffhandItem")) {
      itemAST = parseExpressionToAST(rawStack, seq * 10 + 1);
    } else if (rawStack.includes("itemstack") || rawStack.includes("item")) {
      itemAST = { id: `prov_item_${seq}`, type: "provided_itemstack", category: "item", title: "Provided itemstack" };
    }
    return {
      id: `item_tag_${seq}`,
      type: "compare_mcitems_oredictionary",
      category: "item",
      title: "Is item tagged in item tags as",
      values: [
        { name: "a", block: itemAST },
        { name: "b", block: { id: `tag_txt_${seq}`, type: "text", category: "text", title: `"${tagArg}"`, fields: { TEXT: tagArg } } },
      ],
    };
  }

  const isOr = expr.includes(" || ");
  const isAnd = !isOr && expr.includes(" && ");
  if (isOr || isAnd) {
    const opStr = isOr ? " || " : " && ";
    let depth = 0;
    let splitIdx = -1;
    for (let i = 0; i <= expr.length - opStr.length; i++) {
      if (expr[i] === "(") depth++;
      else if (expr[i] === ")") depth--;
      else if (depth === 0 && expr.substring(i, i + opStr.length) === opStr) {
        splitIdx = i;
        break;
      }
    }
    if (splitIdx !== -1) {
      const leftExpr = expr.substring(0, splitIdx).trim();
      const rightExpr = expr.substring(splitIdx + opStr.length).trim();
      return {
        id: `log_bin_${seq}`,
        type: "logic_binary",
        category: "logic",
        title: isOr ? "OR" : "AND",
        fields: { OP: isOr ? "OR" : "AND" },
        values: [
          { name: "A", block: parseExpressionToAST(leftExpr, seq * 10 + 1) },
          { name: "B", block: parseExpressionToAST(rightExpr, seq * 10 + 2) },
        ],
      };
    }
  }

  if (expr.endsWith(';')) {
    expr = expr.slice(0, -1).trim();
  }

  let openCount = 0;
  let closeCount = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === '(') openCount++;
    else if (expr[i] === ')') closeCount++;
  }
  while (openCount > closeCount && expr.startsWith('(')) {
    expr = expr.substring(1).trim();
    openCount--;
  }
  while (closeCount > openCount && expr.endsWith(')')) {
    expr = expr.substring(0, expr.length - 1).trim();
    closeCount--;
  }

  while (expr.startsWith('(') && expr.endsWith(')')) {
    if (isEnclosedInParens(expr)) {
      expr = expr.substring(1, expr.length - 1).trim();
    } else {
      break;
    }
  }

  if (expr.startsWith('!')) {
    const unneg = expr.substring(1).trim();
    const innerAST = parseExpressionToAST(unneg, seq * 10 + 1);
    return {
      id: `neg_${seq}`,
      type: 'logic_negate',
      category: 'logic',
      title: 'not',
      values: [{ name: 'BOOL', block: innerAST }],
    };
  }

  if (expr === 'Math.random()' || expr === 'java.lang.Math.random()') {
    return {
      id: `rnd_${seq}`,
      type: 'math_java_constants',
      category: 'math',
      title: 'Random [0,1)',
      fields: { CONSTANT: 'RANDOM' },
    };
  }

  if (expr.includes('Mth.nextInt(')) {
    const fnArgs = extractFunctionArguments(expr, 'Mth.nextInt');
    let minArg = '1';
    let maxArg = '10';
    if (fnArgs.length >= 3) {
      minArg = fnArgs[1].trim();
      maxArg = fnArgs[2].trim();
    } else if (fnArgs.length === 2) {
      minArg = fnArgs[0].trim();
      maxArg = fnArgs[1].trim();
    }
    return {
      id: `rnd_int_${seq}`,
      type: 'math_random_int_between',
      category: 'math',
      title: `Random integer between min: ${minArg} and max: ${maxArg} included`,
      values: [
        { name: 'min', block: parseExpressionToAST(minArg, seq * 10 + 1) },
        { name: 'max', block: parseExpressionToAST(maxArg, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('Mth.nextDouble(')) {
    const fnArgs = extractFunctionArguments(expr, 'Mth.nextDouble');
    let minArg = '0';
    let maxArg = '1';
    if (fnArgs.length >= 3) {
      minArg = fnArgs[1].trim();
      maxArg = fnArgs[2].trim();
    } else if (fnArgs.length === 2) {
      minArg = fnArgs[0].trim();
      maxArg = fnArgs[1].trim();
    }
    return {
      id: `rnd_num_${seq}`,
      type: 'math_random_number_between',
      category: 'math',
      title: `Random number between min: ${minArg} and max: ${maxArg}`,
      values: [
        { name: 'min', block: parseExpressionToAST(minArg, seq * 10 + 1) },
        { name: 'max', block: parseExpressionToAST(maxArg, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('Mth.clamp(') || expr.includes('Math.clamp(')) {
    const fnArgs = extractFunctionArguments(expr, expr.includes('Mth.clamp(') ? 'Mth.clamp' : 'Math.clamp');
    if (fnArgs.length >= 3) {
      return {
        id: `clamp_${seq}`,
        type: 'math_clamp',
        category: 'math',
        title: 'clamped between min and max',
        values: [
          { name: 'value', block: parseExpressionToAST(fnArgs[0].trim(), seq * 10 + 1) },
          { name: 'min', block: parseExpressionToAST(fnArgs[1].trim(), seq * 10 + 2) },
          { name: 'max', block: parseExpressionToAST(fnArgs[2].trim(), seq * 10 + 3) },
        ],
      };
    }
  }

  if (expr.includes('Mth.lerp(')) {
    const fnArgs = extractFunctionArguments(expr, 'Mth.lerp');
    if (fnArgs.length >= 3) {
      return {
        id: `lerp_${seq}`,
        type: 'math_lerp',
        category: 'math',
        title: 'Linear interpolation',
        values: [
          { name: 't', block: parseExpressionToAST(fnArgs[0].trim(), seq * 10 + 1) },
          { name: 'a', block: parseExpressionToAST(fnArgs[1].trim(), seq * 10 + 2) },
          { name: 'b', block: parseExpressionToAST(fnArgs[2].trim(), seq * 10 + 3) },
        ],
      };
    }
  }

  if (expr === 'Math.PI' || expr === 'java.lang.Math.PI') {
    return {
      id: `pi_${seq}`,
      type: 'math_java_constants',
      category: 'math',
      title: 'π',
      fields: { CONSTANT: 'PI' },
    };
  }
  if (expr === 'Math.E' || expr === 'java.lang.Math.E') {
    return {
      id: `e_${seq}`,
      type: 'math_java_constants',
      category: 'math',
      title: 'e',
      fields: { CONSTANT: 'E' },
    };
  }

  if (expr.includes('instabuild') || (expr.includes('instanceof Player') && expr.includes('getAbilities()'))) {
    const isIterator = expr.includes('entityiterator') || expr.includes('_ent');
    return {
      id: `is_creative_${seq}`,
      type: 'entity_iscreative',
      category: 'entity',
      title: 'Has creative mode ability enabled',
      values: [
        {
          name: 'entity',
          block: isIterator
            ? { id: `iter_${seq}`, type: 'entity_iterator', category: 'entity', title: 'Entity iterator' }
            : { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' },
        },
      ],
    };
  }

  const playerVarGetMatch = expr.match(/([a-zA-Z0-9_]+)\.getData\([a-zA-Z0-9_.]*PLAYER_VARIABLES\)\.([a-zA-Z0-9_]+)/);
  if (playerVarGetMatch) {
    const rawTarget = playerVarGetMatch[1];
    const varName = playerVarGetMatch[2];
    const targetAST: BlockASTNode = (!rawTarget || rawTarget === 'entity' || rawTarget === 'player' || rawTarget === '_player')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawTarget, seq * 10 + 1);

    return {
      id: `pvar_get_${seq}`,
      type: 'variables_get_number',
      category: 'variable',
      title: `Global: ${varName}`,
      fields: { VAR: `global:${varName}` },
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  const gamemodeMatch = expr.match(/(?:getEntityGameType\(([^)]+)\)\s*==\s*GameType\.([A-Z]+)|(?:entity|player)\.gameMode\.getGameModeForPlayer\(\)\s*==\s*GameType\.([A-Z]+))/);
  if (gamemodeMatch) {
    const rawTarget = gamemodeMatch[1] || 'entity';
    const mode = gamemodeMatch[2] || gamemodeMatch[3] || 'SPECTATOR';
    const targetAST: BlockASTNode = (!rawTarget || rawTarget === 'entity' || rawTarget === 'player')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawTarget, seq * 10 + 1);

    return {
      id: `gamemode_${seq}`,
      type: 'entity_checkgamemode',
      category: 'entity',
      title: `Is entity in game mode ${mode}`,
      fields: { gamemode: mode },
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('hasEntityInInventory(')) {
    const match = expr.match(/hasEntityInInventory\(([^,]+),\s*([\s\S]+?)\)/);
    const rawTarget = match ? match[1].trim() : 'entity';
    const itemArg = match ? match[2].trim() : '';
    const targetAST: BlockASTNode = (!rawTarget || rawTarget === 'entity' || rawTarget === 'player')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawTarget, seq * 10 + 1);

    let itemAST: BlockASTNode;
    const itemExtract = itemArg.match(/new ItemStack\(([A-Za-z0-9_.]+(?:\.get\(\))?)\)/);
    if (itemExtract) {
      const cleanItem = itemExtract[1].replace(/\.get\(\)$/, '').replace(/^[A-Za-z0-9_.]*Items\./, '');
      const formatted = cleanItem.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      itemAST = {
        id: `mcitem_${seq}`,
        type: 'mcitem_all',
        category: 'item',
        title: formatted,
        fields: { value: `CUSTOM:${formatted.replace(/\s+/g, '')}` },
      };
    } else {
      itemAST = parseExpressionToAST(itemArg, seq * 10 + 2);
    }

    return {
      id: `has_inv_${seq}`,
      type: 'entity_has_item_inventory',
      category: 'entity',
      title: 'Has entity in inventory',
      values: [
        { name: 'entity', block: targetAST },
        { name: 'item', block: itemAST },
      ],
    };
  }

  const castMatch = expr.match(/^\((?:float|double|int|long)\)\s*([\s\S]+)$/);
  if (castMatch) {
    const uncast = castMatch[1].trim();
    if (uncast.includes('instanceof net.minecraft.server.level.ServerLevel') || uncast.includes('ServerLevel _slv') || uncast.includes('_slv.getServer()')) {
      return {
        id: `snip_expr_${seq}`,
        type: 'custom_code_snippet',
        category: 'code',
        title: `Custom code snippet: ${rawExpr.trim()}`,
        fields: { CODE: rawExpr.trim() },
        isSnippetValue: true,
      };
    }
    return parseExpressionToAST(uncast, seq);
  }



  const entityTagMatch = expr.match(
    /^([a-zA-Z0-9_]+)(?:\.getType\(\))?\.is\(\s*TagKey\.create\(\s*Registries\.ENTITY_TYPE\s*,\s*(?:ResourceLocation\.parse|ResourceLocation\.fromNamespaceAndPath|ResourceLocation\.tryParse)?\(?\s*([^)]+)\)?\s*\)\s*\)$/
  );
  if (entityTagMatch) {
    const rawEntity = entityTagMatch[1].trim();
    const tagArg = entityTagMatch[2].trim().replace(/^["']|["']$/g, '');
    const entAST: BlockASTNode = (rawEntity === 'entityiterator' || rawEntity === '_ent')
      ? { id: `iter_${seq}`, type: 'entity_iterator', category: 'entity', title: 'Entity iterator' }
      : { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' };

    return {
      id: `ent_tag_${seq}`,
      type: 'entity_is_tagged_in',
      category: 'logic',
      title: 'Is entity tagged in entity tags as',
      values: [
        { name: 'entity', block: entAST },
        { name: 'tag', block: { id: `tag_txt_${seq}`, type: 'text', category: 'text', title: `"${tagArg}"`, fields: { TEXT: tagArg } } },
      ],
    };
  }

  if (expr.includes("DamageTypeTags.") || (expr.includes("Registries.DAMAGE_TYPE") && expr.includes(".is("))) {
    const tagMatch = expr.match(/DamageTypeTags\.([A-Za-z0-9_]+)/) || expr.match(/ResourceLocation\.(?:parse|fromNamespaceAndPath)?\(?["\x27]([^"\x27]+)["\x27]\)?/);
    const tagArg = tagMatch ? (tagMatch[1] || tagMatch[2]).toLowerCase() : "minecraft:is_fire";
    const srcMatch = expr.match(/^([a-zA-Z0-9_.]+)\.is\(/);
    const rawSrc = srcMatch ? srcMatch[1] : "damagesource";
    return {
      id: `dmg_tag_${seq}`,
      type: "damagesource_is_tagged_in",
      category: "damage",
      title: "Is type of damage source tagged in damage type tags as",
      values: [
        { name: "damagesource", block: parseExpressionToAST(rawSrc, seq * 10 + 1) },
        { name: "tag", block: { id: `tag_txt_${seq}`, type: "text", category: "text", title: `"${tagArg}"`, fields: { TEXT: tagArg } } },
      ],
    };
  }

  if (expr.includes(".isDamageableItem()") || expr.includes(".isDamageable(")) {
    const itemMatch = expr.match(/^([a-zA-Z0-9_.]+)\.isDamageable/);
    const rawItem = itemMatch ? itemMatch[1] : "itemstack";
    return {
      id: `item_dmgable_${seq}`,
      type: "itemstack_is_damageable",
      category: "item",
      title: "Is itemstack damageable",
      values: [{ name: "item", block: parseExpressionToAST(rawItem, seq * 10 + 1) }],
    };
  }

  if (expr.includes(".isDamaged()")) {
    const itemMatch = expr.match(/^([a-zA-Z0-9_.]+)\.isDamaged/);
    const rawItem = itemMatch ? itemMatch[1] : "itemstack";
    return {
      id: `item_dmged_${seq}`,
      type: "itemstack_is_damaged",
      category: "item",
      title: "Is itemstack damaged",
      values: [{ name: "item", block: parseExpressionToAST(rawItem, seq * 10 + 1) }],
    };
  }

  if (expr.includes(".fallDistance") || expr === "entity.fallDistance") {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\.fallDistance/);
    const rawEnt = entMatch ? entMatch[1] : "entity";
    return {
      id: `fall_dist_${seq}`,
      type: "entity_get_fall",
      category: "entity",
      title: "Get fall distance of",
      values: [{ name: "entity", block: parseExpressionToAST(rawEnt, seq * 10 + 1) }],
    };
  }

  const diffMatch = expr.match(/(?:world|level)\.getDifficulty\(\)\s*==\s*Difficulty\.([A-Z_]+)/) ||
                    expr.match(/Difficulty\.([A-Z_]+)\s*==\s*(?:world|level)\.getDifficulty\(\)/) ||
                    expr.match(/Difficulty\.([A-Z_]+)\.equals\(\s*(?:world|level)\.getDifficulty\(\)\s*\)/);
  if (diffMatch) {
    const diff = diffMatch[1];
    return {
      id: `diff_${seq}`,
      type: 'world_data_checkdifficulty',
      category: 'world',
      title: `Is difficulty in the provided world ${diff}`,
      fields: { difficulty: diff },
    };
  }


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

  const compMatch = findComparisonOperator(expr);
  if (compMatch) {
    const { op, index, length } = compMatch;
    const left = expr.substring(0, index).trim();
    const right = expr.substring(index + length).trim();

    if (
      op === '==' && (left.includes('.getItem()') || left.includes('itemstack') || left.includes('ItemStack')) &&
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

    const dimLhs = left.match(/(?:entity|player|living)\.level\(\)\.dimension\(\)/);
    const dimRhs = right.match(/(?:entity|player|living)\.level\(\)\.dimension\(\)/);
    if (op === '==' && (dimLhs || dimRhs || left.includes('.dimension()') || right.includes('.dimension()'))) {
      const entSide = (dimLhs || left.includes('.dimension()')) ? left : right;
      const dimSide = (dimLhs || left.includes('.dimension()')) ? right : left;

      const entityRaw = entSide.replace(/\.level\(\)\.dimension\(\)/, '').replace(/\.dimension\(\)/, '').trim();
      const entBlock: BlockASTNode = (!entityRaw || entityRaw === 'entity' || entityRaw === 'player' || entityRaw === 'living')
        ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
        : parseExpressionToAST(entityRaw, seq * 10 + 1);

      const dimIdBlock: BlockASTNode = {
        id: `dim_id_${seq}`,
        type: 'entity_dimension_id',
        category: 'world',
        title: 'ID of dimension',
        values: [{ name: 'entity', block: entBlock }],
      };

      const rawDim = dimSide.trim();
      const vanillaDimensions: Record<string, string> = { 'Level.OVERWORLD': 'Surface', 'Level.NETHER': 'Nether', 'Level.END': 'End' };
      const dimName = vanillaDimensions[rawDim] || (rawDim.startsWith('CUSTOM:') ? rawDim : `CUSTOM:${rawDim}`);
      const dimTypeBlock: BlockASTNode = {
        id: `dim_type_${seq}`,
        type: 'get_dimensionid',
        category: 'world',
        title: `Dimension type: ${rawDim}`,
        fields: { dimension: dimName },
      };

      return {
        id: `cmp_dim_${seq}`,
        type: 'compare_dimensionids',
        category: 'world',
        title: 'ID of dimension is in',
        values: [
          { name: 'a', block: dimIdBlock },
          { name: 'b', block: dimTypeBlock },
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

  const addSubIdx = findLowestPrecedenceArithmeticOp(expr, ['+', '-']);
  if (addSubIdx !== -1) {
    const op = expr[addSubIdx];
    const left = expr.substring(0, addSubIdx).trim();
    const right = expr.substring(addSubIdx + 1).trim();

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
      type: 'math_dual_ops',
      category: 'math',
      title: op,
      fields: { OP: op === '+' ? 'ADD' : 'MINUS' },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  const mulDivIdx = findLowestPrecedenceArithmeticOp(expr, ['*', '/', '%']);
  if (mulDivIdx !== -1) {
    const op = expr[mulDivIdx];
    const left = expr.substring(0, mulDivIdx).trim();
    const right = expr.substring(mulDivIdx + 1).trim();

    if (op === '%') {
      return {
        id: `math_mod_${seq}`,
        type: 'math_dual_ops',
        category: 'math',
        title: 'MOD',
        fields: { OP: 'MOD' },
        values: [
          { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
          { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
        ],
      };
    }

    return {
      id: `math_bin_${seq}`,
      type: 'math_dual_ops',
      category: 'math',
      title: op,
      fields: { OP: op === '*' ? 'MULTIPLY' : 'DIVIDE' },
      values: [
        { name: 'A', block: parseExpressionToAST(left, seq * 10 + 1) },
        { name: 'B', block: parseExpressionToAST(right, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('getHeight') || expr.includes('getHeightmapPos')) {
    const typeMatch = expr.match(/Heightmap\.Types\.([A-Z_]+)/);
    const rawType = typeMatch ? typeMatch[1] : 'WORLD_SURFACE';
    let xArg = 'x', zArg = 'z';
    const posMatch = expr.match(/BlockPos\.containing\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (posMatch) {
      xArg = posMatch[1].trim();
      zArg = posMatch[2].trim();
    } else {
      const ghMatch = expr.match(/getHeight\s*\([^,]+,\s*(?:\(int\)\s*)?([^,]+)\s*,\s*(?:\(int\)\s*)?([^)]+)\s*\)/);
      if (ghMatch) {
        xArg = ghMatch[1].trim();
        zArg = ghMatch[2].trim();
      }
    }
    return {
      id: `height_at_${seq}`,
      type: 'world_data_heightat',
      category: 'world',
      title: 'Get world height at location',
      fields: { heightmapType: rawType },
      values: [
        { name: 'x', block: parseExpressionToAST(xArg, seq * 10 + 1) },
        { name: 'z', block: parseExpressionToAST(zArg, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('.getEffect(') && expr.includes('.getDuration()')) {
    const potMatch = expr.match(/getEffect\s*\(\s*(?:MobEffects\.)?([a-zA-Z0-9_]+)\s*\)/);
    const potName = potMatch ? potMatch[1] : 'DARKNESS';
    const entMatch = expr.match(/^([a-zA-Z0-9_]+)\./) || expr.match(/\(\s*([a-zA-Z0-9_]+)\s+instanceof\s+LivingEntity/);
    const rawEnt = entMatch ? entMatch[1] : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_livEnt' || rawEnt === '_entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);

    return {
      id: `pot_dur_${seq}`,
      type: 'entity_potioneffectremaining',
      category: 'entity',
      title: 'Get remaining ticks of potion for',
      fields: { potion: potName },
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.getEffect(') && expr.includes('.getAmplifier()')) {
    const potMatch = expr.match(/getEffect\s*\(\s*(?:MobEffects\.)?([a-zA-Z0-9_]+)\s*\)/);
    const potName = potMatch ? potMatch[1] : 'DARKNESS';
    const entMatch = expr.match(/^([a-zA-Z0-9_]+)\./) || expr.match(/\(\s*([a-zA-Z0-9_]+)\s+instanceof\s+LivingEntity/);
    const rawEnt = entMatch ? entMatch[1] : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_livEnt' || rawEnt === '_entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);

    return {
      id: `pot_amp_${seq}`,
      type: 'entity_potioneffectlevel',
      category: 'entity',
      title: 'Get effect amplifier of potion for if active',
      fields: { potion: potName },
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.hasEffect(')) {
    const potMatch = expr.match(/hasEffect\s*\(\s*(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s*\)/);
    let potName = potMatch ? potMatch[1] : 'DARKNESS';
    if (potName.includes('_') || /^[A-Z0-9_]+$/.test(potName)) {
      potName = potName.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
    }
    const entMatch = expr.match(/^([a-zA-Z0-9_]+)\./) || expr.match(/\(\s*([a-zA-Z0-9_]+)\s+instanceof\s+LivingEntity/);
    const rawEnt = entMatch ? entMatch[1] : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_livEnt' || rawEnt === '_entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);

    return {
      id: `has_pot_${seq}`,
      type: 'entity_haspotioneffect',
      category: 'entity',
      title: 'Has active potion',
      fields: { potion: potName },
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('PotionContents.createItemStack') || (expr.includes('Items.POTION') || expr.includes('Items.SPLASH_POTION') || expr.includes('Items.LINGERING_POTION'))) {
    let potType = 'POTION';
    if (expr.includes('SPLASH_POTION')) potType = 'SPLASH_POTION';
    else if (expr.includes('LINGERING_POTION')) potType = 'LINGERING_POTION';

    const potMatch = expr.match(/(?:Potions\.|ResourceLocation\.parse\(["'](?:minecraft:)?)([^"'\)]+)["'\)]/);
    const potName = potMatch ? potMatch[1] : 'AWKWARD';

    return {
      id: `item_pot_${seq}`,
      type: 'item_get_potion',
      category: 'item',
      title: 'Get of as item',
      fields: { type: potType, potion: potName },
    };
  }

  if (expr.includes('createPotionProjectile')) {
    let potType = 'SPLASH_POTION';
    if (expr.includes('LINGERING_POTION')) potType = 'LINGERING_POTION';

    const potMatch = expr.match(/(?:Potions\.|ResourceLocation\.parse\(["'](?:minecraft:)?)([^"'\)]+)["'\)]/);
    const potName = potMatch ? potMatch[1] : 'AWKWARD';

    let ax = '0', ay = '0', az = '0', shooter = 'entity';
    const vecMatch = expr.match(/new\s+Vec3\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (vecMatch) {
      ax = vecMatch[1].trim();
      ay = vecMatch[2].trim();
      az = vecMatch[3].trim();
    }
    const shootMatch = expr.match(/createPotionProjectile\s*\([^,]+,[^,]+,\s*([^,]+),/);
    if (shootMatch) shooter = shootMatch[1].trim();

    return {
      id: `proj_pot_${seq}`,
      type: 'projectiles_potion',
      category: 'projectile',
      title: 'potion of with acceleration ax: ay: az: shooter:',
      fields: { potionType: potType, potion: potName },
      values: [
        { name: 'ax', block: parseExpressionToAST(ax, seq * 10 + 1) },
        { name: 'ay', block: parseExpressionToAST(ay, seq * 10 + 2) },
        { name: 'az', block: parseExpressionToAST(az, seq * 10 + 3) },
        { name: 'shooter', block: (shooter === 'entity' || shooter === '_entity') ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' } : parseExpressionToAST(shooter, seq * 10 + 4) },
      ],
    };
  }

  if (expr.includes('.getLevelData().getGameTime()') || expr.includes('.getGameTime()') || expr.includes('.getDayTime()') || expr.includes('dayTime()')) {
    return {
      id: `world_time_${seq}`,
      type: 'world_data_current_time',
      category: 'world',
      title: 'World game time in ticks',
    };
  }

  if (expr.includes('DamageSource') || expr.includes('DamageTypes.') || expr.includes('holderOrThrow')) {
    const typeMatch = expr.match(/(?:DamageTypes\.|ResourceLocation\.parse\(["'](?:minecraft:)?)([a-zA-Z0-9_]+)["']?\)?/);
    const rawType = typeMatch ? typeMatch[1] : 'GENERIC';
    const cleanType = rawType.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    const formattedType = cleanType.charAt(0).toUpperCase() + cleanType.slice(1).toLowerCase();

    return {
      id: `ds_${seq}`,
      type: 'damagesource_from_type',
      category: 'damage',
      title: `Damage source of type: ${formattedType}`,
      fields: { damagetype: rawType.toLowerCase() },
    };
  }

  if (expr.includes('instanceof SimpleWaterloggedBlock')) {
    const blockMatch = expr.match(/^([^\s]+)\s+instanceof\s+SimpleWaterloggedBlock/);
    const blockExpr = blockMatch ? blockMatch[1].trim() : 'block';
    return {
      id: `waterlog_${seq}`,
      type: 'block_is_waterloggable',
      category: 'block',
      title: 'Is waterloggable',
      values: [{ name: 'block', block: parseExpressionToAST(blockExpr, seq * 10 + 1) }],
    };
  }

  if (expr.includes('.isInWaterRainOrBubble()')) {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\.isInWaterRainOrBubble\(\)/);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `water_rain_bub_${seq}`,
      type: 'entity_isinwaterrain_orbubblecolumn',
      category: 'entity',
      title: 'Is in water, rain, or bubble column',
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.isInWaterOrBubble()')) {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\.isInWaterOrBubble\(\)/);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `water_bub_${seq}`,
      type: 'entity_isinwater_orbubblecolumn',
      category: 'entity',
      title: 'Is in water or bubble column',
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.isInWater()')) {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\.isInWater\(\)/);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `isinwater_${seq}`,
      type: 'entity_isinwater',
      category: 'entity',
      title: 'Is in water',
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.isUnderWater()')) {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\.isUnderWater\(\)/);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `underwater_${seq}`,
      type: 'entity_is_underwater',
      category: 'entity',
      title: 'Is underwater',
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.setTicks(1') || expr.includes('.setSeconds(') || expr.includes('.setFire(')) {
    const secMatch = expr.match(/(?:setSeconds|setTicks|setFire)\s*\(\s*([^)]+)\s*\)/);
    const secExpr = secMatch ? secMatch[1].trim() : '15';
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\./);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `set_fire_${seq}`,
      type: 'entity_set_on_fire',
      category: 'entity',
      title: 'Set on fire for seconds',
      values: [
        { name: 'seconds', block: parseExpressionToAST(secExpr, seq * 10 + 2) },
        { name: 'entity', block: targetAST },
      ],
    };
  }

  if (expr.includes('.getRemainingFireTicks()') || expr.includes('.getFireTicks()')) {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\./);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `fire_ticks_${seq}`,
      type: 'entity_get_fire_ticks',
      category: 'entity',
      title: 'Get remaining ticks on fire of',
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('.fireImmune()') || expr.includes('.isFireImmune()')) {
    const entMatch = expr.match(/^([a-zA-Z0-9_.]+)\./);
    const rawEnt = entMatch ? entMatch[1].trim() : 'entity';
    const targetAST: BlockASTNode = (rawEnt === 'entity' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `fire_imm_${seq}`,
      type: 'entity_isimmunetofire',
      category: 'entity',
      title: 'Is immune to fire',
      values: [{ name: 'entity', block: targetAST }],
    };
  }

  if (expr.includes('getAllowFriendlyFire()') || expr.includes('isAllowFriendlyFire()')) {
    const teamMatch = expr.match(/(?:getTeam\s*\([^)]+\)|getScoreboard\s*\([^)]+\)\.getPlayerTeam\s*\([^)]+\)|scoreboard\.getPlayerTeam\s*\([^)]+\)|getTeams\s*\([^)]+\)|Team\s+[^=]+=)\s*([^,]+)/);
    const teamExpr = teamMatch ? teamMatch[1].trim() : '"team_name"';
    return {
      id: `team_ff_${seq}`,
      type: 'team_get_friendlyfire',
      category: 'world',
      title: 'Is friendly fire for team with name enabled',
      values: [{ name: 'name', block: parseExpressionToAST(teamExpr, seq * 10 + 1) }],
    };
  }

  if (expr === 'null' || expr === '(Entity) null' || expr === '(LivingEntity) null' || expr === '(Player) null') {
    return {
      id: `null_ent_${seq}`,
      type: 'entity_null',
      category: 'entity',
      title: 'No entity',
    };
  }

  if (expr.includes('.isLoaded(') || expr.includes('is_mod_loaded')) {
    const modMatch = expr.match(/isLoaded\s*\(\s*["']?([^"')]+)["']?\s*\)/);
    const modId = modMatch ? modMatch[1].trim() : 'forge';
    return {
      id: `mod_loaded_${seq}`,
      type: 'is_mod_loaded',
      category: 'advanced',
      title: `Is the mod with ID "${modId}" loaded`,
      values: [
        { name: 'modid', block: { id: `text_mod_${seq}`, type: 'text', category: 'text', title: `"${modId}"`, fields: { TEXT: modId } } },
      ],
    };
  }

  if (/[A-Z][a-zA-Z0-9_]*Procedure\.execute/.test(expr) || expr.includes('procedure_retval_')) {
    const procMatch = expr.match(/([A-Z][a-zA-Z0-9_]*Procedure)\.execute/);
    const procName = procMatch ? procMatch[1].replace(/Procedure$/, '') : 'CustomProcedure';
    return {
      id: `proc_ret_${seq}`,
      type: 'procedure_retval_number',
      category: 'advanced',
      title: `Call procedure and get return value ${procName}`,
      fields: { procedure: procName },
    };
  }

  if (expr.includes('.substring(')) {
    const subMatch = expr.match(/\.substring\s*\(([^,]+),([^)]+)\)/);
    const fromStr = subMatch ? subMatch[1].trim() : '0';
    const toStr = subMatch ? subMatch[2].trim() : '1';
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.substring/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_sub_${seq}`,
      type: 'text_substring',
      category: 'text',
      title: 'Substring',
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
        { name: 'from', block: parseExpressionToAST(fromStr, seq * 10 + 2) },
        { name: 'to', block: parseExpressionToAST(toStr, seq * 10 + 3) },
      ],
    };
  }

  if (expr.includes('.contains(') && !expr.includes('Tag') && !expr.includes('PersistentData')) {
    const match = expr.match(/\.contains\s*\(([\s\S]+)\)/);
    const paramStr = match ? match[1].trim() : 'str';
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.contains/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_cnt_${seq}`,
      type: 'text_contains',
      category: 'text',
      title: 'Does text contain',
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
        { name: 'contains', block: parseExpressionToAST(paramStr, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('.startsWith(')) {
    const match = expr.match(/\.startsWith\s*\(([\s\S]+)\)/);
    const paramStr = match ? match[1].trim() : 'str';
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.startsWith/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_sw_${seq}`,
      type: 'text_starts_with',
      category: 'text',
      title: 'Does text start with',
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
        { name: 'startsWith', block: parseExpressionToAST(paramStr, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('.endsWith(')) {
    const match = expr.match(/\.endsWith\s*\(([\s\S]+)\)/);
    const paramStr = match ? match[1].trim() : 'str';
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.endsWith/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_ew_${seq}`,
      type: 'text_ends_with',
      category: 'text',
      title: 'Does text end with',
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
        { name: 'endsWith', block: parseExpressionToAST(paramStr, seq * 10 + 2) },
      ],
    };
  }

  if (expr.includes('.trim()')) {
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.trim\(\)/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_trm_${seq}`,
      type: 'text_trim',
      category: 'text',
      title: 'Trim text',
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
      ],
    };
  }

  if (expr.includes('.toUpperCase()')) {
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.toUpperCase\(\)/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_uc_${seq}`,
      type: 'text_change_case',
      category: 'text',
      title: 'Uppercase text',
      fields: { CASE: 'UPPERCASE' },
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
      ],
    };
  }

  if (expr.includes('.toLowerCase()')) {
    const targetMatch = expr.match(/^([a-zA-Z0-9_.]+\(\)|[a-zA-Z0-9_.]+)\.toLowerCase\(\)/);
    const targetStr = targetMatch ? targetMatch[1].trim() : 'text';
    return {
      id: `txt_lc_${seq}`,
      type: 'text_change_case',
      category: 'text',
      title: 'Lowercase text',
      fields: { CASE: 'LOWERCASE' },
      values: [
        { name: 'text', block: parseExpressionToAST(targetStr, seq * 10 + 1) },
      ],
    };
  }

  if (expr.includes('Calendar.getInstance()')) {
    let timeType = 'time_seconds';
    let timeTitle = 'Seconds past current minute';
    if (expr.includes('Calendar.MINUTE')) { timeType = 'time_minutes'; timeTitle = 'Minutes past current hour'; }
    else if (expr.includes('Calendar.HOUR')) { timeType = 'time_hours'; timeTitle = 'Current hour of day'; }
    else if (expr.includes('Calendar.DAY_OF_WEEK')) { timeType = 'time_day_of_week'; timeTitle = 'Day of current week'; }
    else if (expr.includes('Calendar.WEEK_OF_YEAR')) { timeType = 'time_week_of_year'; timeTitle = 'Week of current year'; }
    else if (expr.includes('Calendar.DAY_OF_MONTH')) { timeType = 'time_day_of_month'; timeTitle = 'Day of current month'; }
    else if (expr.includes('Calendar.MONTH')) { timeType = 'time_month'; timeTitle = 'Current month'; }
    else if (expr.includes('Calendar.YEAR')) { timeType = 'time_year'; timeTitle = 'Current year'; }

    return {
      id: `tm_${seq}`,
      type: timeType,
      category: 'datetime',
      title: timeTitle,
    };
  }

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

  if (expr.includes('Math.random()')) {
    return {
      id: `rand_${seq}`,
      type: 'math_java_constants',
      category: 'math',
      title: 'Random [0,1)',
      fields: { CONSTANT: 'RANDOM' },
    };
  }

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
    let typeParam = '10';
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

  if (expr.includes('instanceof')) {
    const parts = expr.split('instanceof').map(p => p.trim());
    const entityExpr = parts[0];
    let rawType = parts[1] ? parts[1].split(/\s+/)[0] : 'Player';
    let targetType = rawType;
    if (rawType === 'Player' || rawType === 'ServerPlayer') targetType = 'EntityPlayer';
    else if (rawType === 'LivingEntity') targetType = 'EntityLiving';

    return {
      id: `inst_${seq}`,
      type: 'logic_entity_compare',
      category: 'logic',
      title: `Is (sub)type of ${targetType === 'EntityPlayer' ? 'Player' : targetType}`,
      fields: { entity: targetType },
      values: [{ name: 'compareTo', block: parseExpressionToAST(entityExpr, seq * 10 + 1) }],
    };
  }

  if (expr.includes('.getBlockState(')) {
    let xArg = 'x', yArg = 'y', zArg = 'z';
    const posMatch = expr.match(/BlockPos\.containing\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (posMatch) {
      xArg = posMatch[1].trim();
      yArg = posMatch[2].trim();
      zArg = posMatch[3].trim();
    } else {
      const pMatch = expr.match(/getBlockState\s*\(([^)]+)\)/);
      if (pMatch) {
        xArg = pMatch[1].trim() + '.getX()';
        yArg = pMatch[1].trim() + '.getY()';
        zArg = pMatch[1].trim() + '.getZ()';
      }
    }
    return {
      id: `get_block_${seq}`,
      type: 'world_get_block',
      category: 'world',
      title: 'Get block at',
      values: [
        { name: 'x', block: parseExpressionToAST(xArg, seq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(yArg, seq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(zArg, seq * 10 + 3) },
      ],
    };
  }

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

  if (expr.includes('isClientSide()') || expr.includes('isRemote')) {
    return {
      id: `is_client_${seq}`,
      type: 'world_data_isremote',
      category: 'world',
      title: 'Is world client side',
    };
  }


  if (expr.includes('.getEntitiesOfClass(') && expr.includes('.isEmpty()')) {
    const clsMatch = expr.match(/getEntitiesOfClass\(\s*([A-Za-z0-9_]+?)Entity\.class/);
    const entityName = clsMatch ? clsMatch[1] : 'Entity';

    const rangeMatch = expr.match(/inflate\(\s*([0-9.]+)\s*\/\s*2d?\s*\)/);
    const rangeVal = rangeMatch ? rangeMatch[1] : '64';

    let xVal = 'x', yVal = 'y', zVal = 'z';
    const v3Idx = expr.indexOf('new Vec3(');
    if (v3Idx !== -1) {
      let depth = 1;
      let v3Start = v3Idx + 'new Vec3('.length;
      let v3End = -1;
      for (let i = v3Start; i < expr.length; i++) {
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')') {
          depth--;
          if (depth === 0) {
            v3End = i;
            break;
          }
        }
      }
      if (v3End !== -1) {
        const v3Args = splitArgs(expr.substring(v3Start, v3End));
        if (v3Args.length >= 3) {
          xVal = v3Args[0].trim().replace(/^\(+|\)+$/g, '');
          yVal = v3Args[1].trim().replace(/^\(+|\)+$/g, '');
          zVal = v3Args[2].trim().replace(/^\(+|\)+$/g, '');
        }
      }
    }

    return {
      id: `ent_inrange_${seq}`,
      type: 'world_entity_inrange_exists',
      category: 'world',
      title: 'Does entity exist in cube',
      fields: { entity: `CUSTOM:${entityName}` },
      values: [
        { name: 'x', block: parseExpressionToAST(xVal, seq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(yVal, seq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(zVal, seq * 10 + 3) },
        { name: 'range', block: { id: `rng_${seq}`, type: 'math_number', category: 'math', title: rangeVal, fields: { NUM: rangeVal } } },
      ],
    };
  }

  if (expr.includes('.isEmptyBlock(')) {
    let xStr = 'x', yStr = 'y', zStr = 'z';
    const startIdx = expr.indexOf('.isEmptyBlock(') + '.isEmptyBlock('.length;
    let depth = 1;
    let endIdx = -1;
    for (let i = startIdx; i < expr.length; i++) {
      if (expr[i] === '(') depth++;
      else if (expr[i] === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      const inner = expr.substring(startIdx, endIdx);
      const parts = splitArgs(inner);
      if (parts.length >= 3) {
        xStr = parts[0];
        yStr = parts[1];
        zStr = parts[2];
      }
    }
    return {
      id: `is_air_${seq}`,
      type: 'world_data_isair',
      category: 'world',
      title: 'Is air at',
      values: [
        { name: 'x', block: parseExpressionToAST(xStr, seq * 10 + 1) },
        { name: 'y', block: parseExpressionToAST(yStr, seq * 10 + 2) },
        { name: 'z', block: parseExpressionToAST(zStr, seq * 10 + 3) },
      ],
    };
  }

  const entityDepBlock = (rawEnt: string): BlockASTNode =>
    (!rawEnt || rawEnt === 'entity' || rawEnt === 'player' || rawEnt === 'living' || rawEnt === '_player')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);

  if (expr.includes('.getHealth()')) {
    const rawEntity = expr.replace('.getHealth()', '').trim();
    return {
      id: `health_${seq}`,
      type: 'entity_health',
      category: 'entity',
      title: 'Current health of entity',
      values: [{ name: 'entity', block: entityDepBlock(rawEntity) }],
    };
  }
  if (expr.includes('.getMaxHealth()')) {
    const rawEntity = expr.replace('.getMaxHealth()', '').trim();
    return {
      id: `max_health_${seq}`,
      type: 'entity_health_max',
      category: 'entity',
      title: 'Max health of entity',
      values: [{ name: 'entity', block: entityDepBlock(rawEntity) }],
    };
  }
  if (expr.includes('.isInWater()')) {
    const rawEntity = expr.replace('.isInWater()', '').trim();
    return {
      id: `in_water_${seq}`,
      type: 'entity_is_inwater',
      category: 'entity',
      title: 'Is entity in water',
      values: [{ name: 'entity', block: entityDepBlock(rawEntity) }],
    };
  }
  if (expr.includes('.isOnFire()') || expr.includes('.isBurning()')) {
    const rawEntity = expr.replace(/\.(isOnFire|isBurning)\(\)/g, '').trim();
    return {
      id: `is_burning_${seq}`,
      type: 'entity_isburning',
      category: 'entity',
      title: 'Is entity burning',
      values: [{ name: 'entity', block: entityDepBlock(rawEntity) }],
    };
  }
  if (expr.includes('.getDeltaMovement()')) {
    const rawEntity = expr.replace('.getDeltaMovement()', '').trim();
    return {
      id: `get_mov_${seq}`,
      type: 'entity_get_movement',
      category: 'entity',
      title: 'Get velocity of entity',
      values: [{ name: 'entity', block: entityDepBlock(rawEntity) }],
    };
  }

  if (expr.includes('.getFoodData().getFoodLevel()') || expr.includes('.getFoodLevel()')) {
    const rawEntity = expr.replace(/\.getFoodData\(\)\.getFoodLevel\(\)/, '').replace(/\.getFoodLevel\(\)/, '').trim();
    return {
      id: `food_lvl_${seq}`,
      type: 'entity_foodlevel',
      category: 'player',
      title: 'Get food level of entity',
      values: [{ name: 'entity', block: entityDepBlock(rawEntity) }],
    };
  }

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

  if (expr.includes('dependencies.get(')) {
    const match = expr.match(/dependencies\.get\s*\("([^"]+)"\)/);
    const depName = match ? match[1] : 'name';
    let depType = 'custom_dependency_number';
    let title = `Number dependency [${depName}]`;

    if (expr.includes('(String)') || depName.includes('text') || depName.includes('str')) {
      depType = 'custom_dependency_string';
      title = `Text dependency [${depName}]`;
    } else if (expr.includes('(Vec3)') || depName.includes('vector')) {
      depType = 'custom_dependency_vector';
      title = `Vector dependency [${depName}]`;
    } else if (expr.includes('(Entity)') || depName.includes('entity')) {
      depType = 'custom_dependency_entity';
      title = `Entity dependency [${depName}]`;
    } else if (expr.includes('(ItemStack)') || depName.includes('itemstack')) {
      depType = 'custom_dependency_itemstack';
      title = `Itemstack dependency [${depName}]`;
    } else if (expr.includes('(Boolean)') || depName.includes('logic')) {
      depType = 'custom_dependency_logic';
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

  if (expr === 'entityiterator' || expr === '_entity' || expr === '_ent') {
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

  const getXMatch = expr.match(/^([a-zA-Z0-9_().]+)?\.getX\(\)$/);
  if (getXMatch) {
    const rawEnt = (getXMatch[1] || '').trim();
    const entAST: BlockASTNode = (!rawEnt || rawEnt === 'entity' || rawEnt === 'player' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `ent_pos_x_${seq}`,
      type: 'entity_pos_x',
      category: 'entity',
      title: 'X position of entity',
      values: [{ name: 'entity', block: entAST }],
    };
  }
  if (expr === 'x') {
    return { id: `x_${seq}`, type: 'coord_x', category: 'world', title: 'x' };
  }

  const getYMatch = expr.match(/^([a-zA-Z0-9_().]+)?\.getY\(\)$/);
  if (getYMatch) {
    const rawEnt = (getYMatch[1] || '').trim();
    const entAST: BlockASTNode = (!rawEnt || rawEnt === 'entity' || rawEnt === 'player' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `ent_pos_y_${seq}`,
      type: 'entity_pos_y',
      category: 'entity',
      title: 'Y position of entity',
      values: [{ name: 'entity', block: entAST }],
    };
  }
  if (expr === 'y') {
    return { id: `y_${seq}`, type: 'coord_y', category: 'world', title: 'y' };
  }

  const getZMatch = expr.match(/^([a-zA-Z0-9_().]+)?\.getZ\(\)$/);
  if (getZMatch) {
    const rawEnt = (getZMatch[1] || '').trim();
    const entAST: BlockASTNode = (!rawEnt || rawEnt === 'entity' || rawEnt === 'player' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);
    return {
      id: `ent_pos_z_${seq}`,
      type: 'entity_pos_z',
      category: 'entity',
      title: 'Z position of entity',
      values: [{ name: 'entity', block: entAST }],
    };
  }
  if (expr === 'z') {
    return { id: `z_${seq}`, type: 'coord_z', category: 'world', title: 'z' };
  }

  if (expr === 'itemstackiterator') {
    return {
      id: `iter_${seq}`,
      type: 'itemstack_iterator',
      category: 'gui',
      title: 'Itemstack iterator',
    };
  }
  if (expr === 'itemstack' || expr === 'provided_itemstack' || expr === '_itemstack' || expr === 'item') {
    return {
      id: `item_dep_${seq}`,
      type: 'provided_itemstack',
      category: 'item',
      title: 'Provided itemstack',
    };
  }

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

  if (expr.includes('getFlyingSpeed()')) {
    const entMatch = expr.match(/^([\s\S]+?)\s+instanceof\s+Player/);
    const targetEnt = entMatch ? entMatch[1].trim() : 'entity';
    return {
      id: `fly_speed_${seq}`,
      type: 'entity_get_fly_speed',
      category: 'player',
      title: 'Get base fly speed parameter of',
      values: [{ name: 'entity', block: parseExpressionToAST(targetEnt, seq * 10 + 1) }],
    };
  }

  if (expr.includes('getWalkingSpeed()')) {
    const entMatch = expr.match(/^([\s\S]+?)\s+instanceof\s+Player/);
    const targetEnt = entMatch ? entMatch[1].trim() : 'entity';
    return {
      id: `walk_speed_${seq}`,
      type: 'entity_get_walk_speed',
      category: 'player',
      title: 'Get base walk speed parameter of',
      values: [{ name: 'entity', block: parseExpressionToAST(targetEnt, seq * 10 + 1) }],
    };
  }

  if (
    expr.includes('ItemStack.parseOptional(') ||
    expr.includes('ItemStack.OPTIONAL_CODEC.parse(') ||
    (expr.includes('.getOrDefault(DataComponents.CUSTOM_DATA') && expr.includes('getCompound'))
  ) {
    const tagMatch = expr.match(/getCompound(?:OrEmpty)?\s*\(\s*(["']?[^)]+?["']?)\s*\)/);
    const tagExpr = tagMatch ? tagMatch[1].trim() : '"tag"';
    const itemMatch = expr.match(/([a-zA-Z0-9_.]+)\.getOrDefault\(DataComponents\.CUSTOM_DATA/);
    const itemTarget = itemMatch ? itemMatch[1].trim() : 'itemstack';

    return {
      id: `item_nbt_itemstack_get_${seq}`,
      type: 'item_nbt_itemstack_get',
      category: 'item',
      title: 'Get custom data itemstack tag',
      values: [
        { name: 'tagName', block: parseExpressionToAST(tagExpr, seq * 10 + 1) },
        { name: 'item', block: parseExpressionToAST(itemTarget, seq * 10 + 2) },
      ],
    };
  }

  if (expr.endsWith('.getMainHandItem()')) {
    const target = expr.replace(/\.getMainHandItem\(\)$/, '').trim();
    return {
      id: `mainhand_${seq}`,
      type: 'entity_iteminhand',
      category: 'item',
      title: 'Item in main hand',
      values: [{ name: 'entity', block: parseExpressionToAST(target, seq * 10 + 1) }],
    };
  }

  if (expr.endsWith('.getOffhandItem()')) {
    const target = expr.replace(/\.getOffhandItem\(\)$/, '').trim();
    return {
      id: `offhand_${seq}`,
      type: 'entity_iteminoffhand',
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

  if (expr.endsWith('.tickCount') || expr.endsWith('.tickCount)') || expr === 'entity.tickCount') {
    const rawEnt = expr.replace(/\.?tickCount\)?$/, '').replace(/^[\(]+/, '').trim();
    const entAST: BlockASTNode = (!rawEnt || rawEnt === 'entity' || rawEnt === 'player' || rawEnt === '_ent')
      ? { id: `ent_dep_${seq}`, type: 'entity_from_deps', category: 'entity', title: 'Event/target entity' }
      : parseExpressionToAST(rawEnt, seq * 10 + 1);

    return {
      id: `tick_cnt_${seq}`,
      type: 'entity_get_tickcount',
      category: 'entity',
      title: 'Get number of ticks entity has existed for',
      values: [{ name: 'entity', block: entAST }],
    };
  }

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

  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    const strVal = expr.slice(1, -1);
    return {
      id: `txt_${seq}`,
      type: 'text',
      category: 'text',
      title: `"${strVal}"`,
      fields: { TEXT: strVal },
    };
  }

  if (/^[a-zA-Z0-9_]+$/.test(expr)) {
    return {
      id: `var_${seq}`,
      type: 'variables_get_number',
      category: 'variable',
      title: expr,
      fields: { VAR: `local:${expr}` },
    };
  }

  return {
    id: `snip_expr_${seq}`,
    type: 'custom_code_snippet',
    category: 'code',
    title: 'Custom code snippet (Expression)',
    fields: { CODE: expr || '(null)' },
    isSnippetValue: true,
  };
}


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
    const blockType = node.type === 'custom_code_snippet' ? (node.isSnippetValue ? 'java_code_get' : 'java_code') : node.type;
    let res = `${indent}<block type="${blockType}"${isRoot ? ' x="40" y="40"' : ''}>\n`;

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
    } else if (node.type.startsWith('variables_set_') || node.type.startsWith('variables_get_')) {
      res += `${indent}  <mutation xmlns="http://www.w3.org/1999/xhtml" is_player_var="false" has_entity="false"></mutation>\n`;
      if (node.fields) {
        for (const [key, val] of Object.entries(node.fields)) {
          res += `${indent}  <field name="${key}">${escapeXml(val)}</field>\n`;
        }
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


function parseCommandStructureFromJava(
  code: string,
  breakdown: TranslationBreakdownItem[]
): BlockASTNode[] {
  let idSeq = 1;

  const cmdMatch = code.match(/Commands\.literal\s*\(\s*"([^"]+)"\s*\)([\s\S]*)/);
  if (!cmdMatch) {
    return [];
  }

  const chainBody = cmdMatch[2];

  function extractTopChainItems(text: string): { type: 'then' | 'executes'; inner: string }[] {
    const results: { type: 'then' | 'executes'; inner: string }[] = [];
    let idx = 0;
    while (idx < text.length) {
      const thenIdx = text.indexOf('.then', idx);
      const execIdx = text.indexOf('.executes', idx);

      let nextType: 'then' | 'executes' | null = null;
      let targetIdx = -1;

      if (thenIdx !== -1 && (execIdx === -1 || thenIdx < execIdx)) {
        nextType = 'then';
        targetIdx = thenIdx;
      } else if (execIdx !== -1) {
        nextType = 'executes';
        targetIdx = execIdx;
      } else {
        break;
      }

      const openParen = text.indexOf('(', targetIdx);
      if (openParen === -1) break;

      let depth = 1;
      let endParen = -1;
      for (let i = openParen + 1; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')') depth--;
        if (depth === 0) {
          endParen = i;
          break;
        }
      }

      if (endParen === -1) break;

      const inner = text.substring(openParen + 1, endParen);
      results.push({ type: nextType, inner });
      idx = endParen + 1;
    }
    return results;
  }

  function parseChain(segment: string): BlockASTNode[] {
    const nodes: BlockASTNode[] = [];

    const litMatch = segment.match(/^Commands\.literal\s*\(\s*"([^"]+)"\s*\)/);
    const argMatch = segment.match(/^Commands\.argument\s*\(\s*"([^"]+)"\s*,\s*([\s\S]+?)\)/);

    if (litMatch) {
      const name = litMatch[1];
      const rest = segment.substring(litMatch[0].length);
      const subItems = extractTopChainItems(rest);

      let childNode: BlockASTNode | undefined;
      let actionNode: BlockASTNode | undefined;
      const childThenItems: string[] = [];

      for (const item of subItems) {
        if (item.type === 'then') {
          childThenItems.push(item.inner);
        } else if (item.type === 'executes') {
          const procMatch = item.inner.match(/([A-Z][A-Za-z0-9_]*?)Procedure\.execute/);
          if (procMatch) {
            const procName = procMatch[1];
            actionNode = {
              id: `cmd_act_${idSeq++}`,
              type: 'call_procedure',
              category: 'command',
              title: `Call procedure ${procName}`,
              fields: { procedure: procName },
            };
          }
        }
      }

      if (childThenItems.length > 0) {
        const parsedChildren: BlockASTNode[] = [];
        for (const childItem of childThenItems) {
          const res = parseChain(childItem);
          parsedChildren.push(...res);
        }
        if (parsedChildren.length > 1) {
          for (let i = 0; i < parsedChildren.length - 1; i++) {
            parsedChildren[i].next = parsedChildren[i + 1];
          }
        }
        childNode = parsedChildren[0];
      } else if (actionNode) {
        childNode = actionNode;
      }

      breakdown.push({
        javaLine: `Commands.literal("${name}")`,
        mcreatorBlock: 'literal',
        explanation: `Literal parameter '${name}'`,
      });

      nodes.push({
        id: `cmd_param_${idSeq++}`,
        type: 'literal',
        category: 'command',
        title: `Literal parameter ${name}`,
        fields: { name },
        statements: childNode ? [{ name: 'args', block: childNode }] : undefined,
      });

    } else if (argMatch) {
      const name = argMatch[1];
      const argTypeStr = argMatch[2];
      const rest = segment.substring(argMatch[0].length);
      const subItems = extractTopChainItems(rest);

      if (name === 'arguments' || argTypeStr.includes('greedyString')) {
        let procName: string | undefined;
        for (const item of subItems) {
          if (item.type === 'executes') {
            const pm = item.inner.match(/([A-Z][A-Za-z0-9_]*?)Procedure\.execute/);
            if (pm) procName = pm[1];
          }
        }
        if (!procName) {
          const pm = segment.match(/([A-Z][A-Za-z0-9_]*?)Procedure\.execute/);
          if (pm) procName = pm[1];
        }
        if (procName) {
          breakdown.push({
            javaLine: `Commands.argument("${name}", greedyString())`,
            mcreatorBlock: 'call_procedure_any',
            explanation: `Accept any parameter and call procedure '${procName}'`,
          });
          nodes.push({
            id: `cmd_act_${idSeq++}`,
            type: 'call_procedure_any',
            category: 'command',
            title: `Accept any parameter and call procedure ${procName}`,
            fields: { procedure: procName },
          });
          return nodes;
        }
      }

      let blockType = 'number_default';
      let titlePrefix = 'Number';

      if (argTypeStr.includes('EntityArgument')) {
        blockType = 'entity';
        titlePrefix = 'Entity';
      } else if (argTypeStr.includes('DoubleArgument') || argTypeStr.includes('IntegerArgument') || argTypeStr.includes('FloatArgument')) {
        blockType = 'number_default';
        titlePrefix = 'Number';
      } else if (argTypeStr.includes('BlockPosArgument')) {
        blockType = 'blockpos';
        titlePrefix = 'Block position';
      } else if (argTypeStr.includes('BlockStateArgument')) {
        blockType = 'blockstate';
        titlePrefix = 'Block state';
      } else if (argTypeStr.includes('ItemArgument')) {
        blockType = 'item';
        titlePrefix = 'Item';
      } else if (argTypeStr.includes('BoolArgument')) {
        blockType = 'logic';
        titlePrefix = 'Logic';
      } else if (argTypeStr.includes('StringArgument')) {
        blockType = 'string';
        titlePrefix = 'String';
      }

      let childNode: BlockASTNode | undefined;
      let actionNode: BlockASTNode | undefined;
      const childThenItems: string[] = [];

      for (const item of subItems) {
        if (item.type === 'then') {
          childThenItems.push(item.inner);
        } else if (item.type === 'executes') {
          const procMatch = item.inner.match(/([A-Z][A-Za-z0-9_]*?)Procedure\.execute/);
          if (procMatch) {
            const procName = procMatch[1];
            actionNode = {
              id: `cmd_act_${idSeq++}`,
              type: 'call_procedure',
              category: 'command',
              title: `Call procedure ${procName}`,
              fields: { procedure: procName },
            };
          }
        }
      }

      if (childThenItems.length > 0) {
        const parsedChildren: BlockASTNode[] = [];
        for (const childItem of childThenItems) {
          const res = parseChain(childItem);
          parsedChildren.push(...res);
        }
        if (parsedChildren.length > 1) {
          for (let i = 0; i < parsedChildren.length - 1; i++) {
            parsedChildren[i].next = parsedChildren[i + 1];
          }
        }
        childNode = parsedChildren[0];
      } else if (actionNode) {
        childNode = actionNode;
      }

      const paramFields: Record<string, string> = { name };
      let paramTitle = `${titlePrefix} parameter ${name}`;
      if (blockType === 'entity') {
        const entType = argTypeStr.includes('entities()')
          ? 'multiple entities'
          : argTypeStr.includes('players()')
          ? 'multiple players'
          : argTypeStr.includes('player()')
          ? 'one player'
          : 'one entity';
        paramFields.type = entType;
        paramTitle = `Entity parameter ${name} for ${entType}`;
      }

      nodes.push({
        id: `cmd_param_${idSeq++}`,
        type: blockType,
        category: 'command',
        title: paramTitle,
        fields: paramFields,
        statements: childNode ? [{ name: 'args', block: childNode }] : undefined,
      });
    }

    return nodes;
  }

  const topItems = extractTopChainItems(chainBody);
  const rootChildren: BlockASTNode[] = [];

  for (const item of topItems) {
    if (item.type === 'then') {
      const childNodes = parseChain(item.inner);
      rootChildren.push(...childNodes);
    }
  }

  if (rootChildren.length > 1) {
    for (let i = 0; i < rootChildren.length - 1; i++) {
      rootChildren[i].next = rootChildren[i + 1];
    }
  }

  return rootChildren;
}

function parseFeatureStructureFromJava(
  code: string,
  breakdown: TranslationBreakdownItem[]
): BlockASTNode {
  let idSeq = 1;

  let featureType = 'feature_geode_simple';
  let featureTitle = 'Geode feature';
  let featureCategory: BlockCategory = 'feature_blocks';

  if (code.includes('OreConfiguration') || code.includes('Feature.ORE') || code.includes('TargetBlockState')) {
    featureType = 'feature_ore';
    featureTitle = 'Ore feature';
    featureCategory = 'feature_ore' as BlockCategory;
  } else if (code.includes('TreeConfiguration') || code.includes('Feature.TREE') || code.includes('TrunkPlacer')) {
    featureType = 'feature_tree_simple';
    featureTitle = 'Simple tree feature';
    featureCategory = 'feature_tree' as BlockCategory;
  } else if (code.includes('RandomPatchFeature') || code.includes('SimpleBlockFeature')) {
    featureType = 'feature_random_patch_simple';
    featureTitle = 'Random patch feature';
    featureCategory = 'feature_blocks';
  } else if (code.includes('DiskFeature') || code.includes('DiskConfiguration')) {
    featureType = 'feature_disk_simple';
    featureTitle = 'Simple disk feature';
    featureCategory = 'feature_blocks';
  }

  const blockMatches = Array.from(code.matchAll(/(?:Blocks|CUSTOM)\.([A-Za-z0-9_]+)/g)).map(m => m[1]);
  const primaryBlock = blockMatches[0] ? `CUSTOM:${blockMatches[0]}` : 'Blocks.AIR';

  const makeBlockSelector = (bName: string) => ({
    id: `blk_sel_${idSeq++}`,
    type: 'blockstate_selector',
    category: 'feature_blocks' as BlockCategory,
    title: bName,
    fields: { block: bName },
  });

  const values: { name: string; block?: BlockASTNode }[] = [
    { name: 'filling', block: makeBlockSelector('Blocks.AIR') },
    { name: 'inner_layer', block: makeBlockSelector(primaryBlock) },
    { name: 'alternate_inner_layer', block: makeBlockSelector(primaryBlock) },
    { name: 'middle_layer', block: makeBlockSelector(primaryBlock) },
    { name: 'outer_layer', block: makeBlockSelector(primaryBlock) },
  ];

  breakdown.push({
    javaLine: `Feature configuration (${featureTitle})`,
    mcreatorBlock: featureType,
    explanation: `Configured feature '${featureTitle}' with block '${primaryBlock}'`,
  });

  const featureNode: BlockASTNode = {
    id: 'feat_root_block',
    type: featureType,
    category: featureCategory,
    title: featureTitle,
    values,
  };

  const placements: BlockASTNode[] = [];

  const rarityMatch = code.match(/RarityFilter\.onAverageOnceEvery\s*\(\s*([0-9]+)\s*\)/);
  if (rarityMatch) {
    const rVal = rarityMatch[1];
    placements.push({
      id: `pl_rarity_${idSeq++}`,
      type: 'placement_rarity',
      category: 'feature_placement_common',
      title: 'Rarity placement',
      fields: { rarity: rVal },
    });
  }

  const countUniformMatch = code.match(/UniformInt\.of\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/);
  const countConstMatch = code.match(/ConstantInt\.of\s*\(\s*([0-9]+)\s*\)/);
  if (countUniformMatch) {
    placements.push({
      id: `pl_count_${idSeq++}`,
      type: 'placement_count',
      category: 'feature_placement_common',
      title: 'Count placement',
      values: [{
        name: 'count',
        block: {
          id: `int_unif_${idSeq++}`,
          type: 'int_provider_uniform',
          category: 'feature_int_provider',
          title: 'Uniform integer provider',
          fields: { min: countUniformMatch[1], max: countUniformMatch[2] },
        },
      }],
    });
  } else if (countConstMatch) {
    placements.push({
      id: `pl_count_${idSeq++}`,
      type: 'placement_count',
      category: 'feature_placement_common',
      title: 'Count placement',
      values: [{
        name: 'count',
        block: {
          id: `int_const_${idSeq++}`,
          type: 'int_provider_constant',
          category: 'feature_int_provider',
          title: 'Constant integer provider',
          fields: { value: countConstMatch[1] },
        },
      }],
    });
  }

  if (code.includes('InSquarePlacement')) {
    placements.push({
      id: `pl_sq_${idSeq++}`,
      type: 'placement_in_square',
      category: 'feature_placement_common',
      title: 'In square placement',
    });
  }

  const heightMatch = code.match(/HeightRangePlacement\.uniform\s*\(\s*VerticalAnchor\.absolute\s*\(\s*([0-9\-]+)\s*\)\s*,\s*VerticalAnchor\.absolute\s*\(\s*([0-9\-]+)\s*\)/);
  if (heightMatch) {
    placements.push({
      id: `pl_height_${idSeq++}`,
      type: 'placement_height_uniform',
      category: 'feature_placement_height',
      title: 'Uniform height placement',
      values: [
        {
          name: 'min',
          block: {
            id: `v_min_${idSeq++}`,
            type: 'vertical_anchor_absolute',
            category: 'feature_placement_height',
            title: 'Absolute height',
            fields: { value: heightMatch[1] },
          },
        },
        {
          name: 'max',
          block: {
            id: `v_max_${idSeq++}`,
            type: 'vertical_anchor_absolute',
            category: 'feature_placement_height',
            title: 'Absolute height',
            fields: { value: heightMatch[2] },
          },
        },
      ],
    });
  }

  if (code.includes('BiomeFilter')) {
    placements.push({
      id: `pl_biome_${idSeq++}`,
      type: 'placement_biome_filter',
      category: 'feature_placement_conditional',
      title: 'Biome filter placement',
    });
  }

  if (placements.length > 0) {
    for (let i = 0; i < placements.length - 1; i++) {
      placements[i].next = placements[i + 1];
    }
    featureNode.next = placements[0];
  }

  return featureNode;
}
