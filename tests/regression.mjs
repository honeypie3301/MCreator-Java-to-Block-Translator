import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(path.join(tmpdir(), 'mcreator-regression-'));
const workerPath = path.join(root, 'tests', 'regression-worker.cjs');
const converter = path.join(temp, 'lib', 'mcreatorConverter.js');
const args = process.argv.slice(2);
const corpus = args.includes('--corpus');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
const timeoutArg = args.find(a => a.startsWith('--timeout='));
const timeout = timeoutArg ? Number(timeoutArg.slice(10)) : 3000;

function translate(source, version = '1.21.1', expression = false) {
  return new Promise(resolve => {
    const worker = new Worker(workerPath, { workerData: { converter, source, version, expression } });
    let done = false;
    const finish = value => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(value);
    };
    const timer = setTimeout(() => finish({ error: `Conversion exceeded ${timeout} ms` }), timeout);
    worker.once('message', finish);
    worker.once('error', error => finish({ error: error.stack || String(error) }));
    worker.once('exit', code => { if (!done) finish({ error: `Worker exited before returning a result (${code})` }); });
  });
}

function nodes(rootNode) {
  const result = [];
  const seen = new Set();
  function visit(node) {
    if (!node) return;
    assert(!seen.has(node), 'Block tree contains a cycle or shared node');
    seen.add(node);
    result.push(node);
    for (const value of node.values || []) visit(value.block);
    for (const statement of node.statements || []) visit(statement.block);
    visit(node.next);
  }
  visit(rootNode);
  return result;
}

function input(node, name) { return node.values?.find(value => value.name === name)?.block; }
function procedure(body) { return `class Example { public static void execute(LevelAccessor world, double x, double y, double z, Entity entity, ItemStack itemstack) { ${body} } }`; }

// Templates: mcreator-core/procedures and generator-1.21.1/neoforge-1.21.1/procedures.
const cases = [
  { name: 'custom snippets use MCreator statement and value types', source: procedure('double custom = unusualCall(); unknownStatement();'), check(ast, result) {
    assert.match(result.xml, /<block type="java_code_get">/);
    assert.match(result.xml, /<block type="java_code">/);
  } },
  { name: 'hurt event preserves negation, source entity and health calculation', source: `class Example {
    @SubscribeEvent public static void onEntityAttacked(LivingDamageEvent.Pre event) { execute(event, event.getEntity(), event.getSource().getEntity(), event.getOriginalDamage()); }
    private static void execute(Event event, Entity entity, Entity sourceentity, double amount) {
      if (entity instanceof PetrifiedLignumTrilobitaEntity && !((sourceentity instanceof LivingEntity _livEnt ? _livEnt.getMainHandItem() : ItemStack.EMPTY).is(ItemTags.create(ResourceLocation.parse("minecraft:axes"))))) {
        if (entity instanceof LivingEntity _entity) _entity.setHealth((float) ((entity instanceof LivingEntity _livEnt ? _livEnt.getHealth() : -1) + amount * 0.3));
      }
    }
  }`, check(ast, result) {
    assert.equal(result.trigger, 'entity_pre_hurt');
    const all = nodes(ast);
    const neg = all.find(n => n.type === 'logic_negate');
    assert(neg, 'missing not block');
    const tag = input(neg, 'BOOL');
    assert.equal(tag.type, 'compare_mcitems_oredictionary');
    assert.equal(input(input(tag, 'a'), 'entity').type, 'source_entity_from_deps');
    const health = all.find(n => n.type === 'entity_set_health');
    assert(health, 'missing set health');
    const value = input(health, 'health');
    assert.equal(value.type, 'math_dual_ops');
    assert(nodes(value).some(n => n.type === 'entity_health'));
    assert(nodes(value).some(n => n.type === 'custom_dependency_number' && n.fields.NAME === 'amount'));
    assert.match(result.xml, /<block type="custom_dependency_number">\s*<field name="NAME">amount<\/field>/);
    assert(nodes(value).some(n => n.type === 'math_number' && n.fields.NUM === '0.3'));
  } },
  { name: 'main hand comparison', expression: true, source: '(entity instanceof LivingEntity _livEnt ? _livEnt.getMainHandItem() : ItemStack.EMPTY).getItem() == TheBackwoodsModItems.SPLINTER_NEEDLE.get()', check(ast) {
    assert.equal(ast.type, 'compare_mcitems');
    assert.equal(input(ast, 'a').type, 'entity_iteminhand');
    assert.equal(input(input(ast, 'a'), 'entity').type, 'entity_from_deps');
  } },
  { name: 'block comparison and coordinates', expression: true, source: '(world.getBlockState(BlockPos.containing(x, y, z))).getBlock() == TheBackwoodsModBlocks.SPLINTERED_OAK_WOOD.get()', check(ast) {
    assert.equal(ast.type, 'compare_mcblocks');
    const position = input(ast, 'a');
    assert.equal(position.type, 'world_get_block');
    for (const axis of ['x', 'y', 'z']) assert.equal(input(position, axis).type, `coord_${axis}`);
    assert.equal(input(ast, 'b').fields.value, 'CUSTOM:SplinteredOakWood');
  } },
  { name: 'overworld dimension', expression: true, source: '(entity.level().dimension()) == Level.OVERWORLD', check(ast) {
    assert.equal(ast.type, 'compare_dimensionids');
    assert.equal(input(ast, 'b').fields.dimension, 'Surface');
  } },
  { name: 'server lookup preserved as snippet', expression: true, source: '(double) (world instanceof net.minecraft.server.level.ServerLevel _slv ? _slv.getServer().getPlayerList().getViewDistance() * 16 : 64)', check(ast) {
    assert.equal(ast.type, 'custom_code_snippet');
    assert(ast.isSnippetValue);
    assert(ast.fields.CODE.includes('_slv.getServer()'));
  } },
  { name: 'block replacement, removal, hand damage and repeat', source: procedure('world.setBlock(BlockPos.containing(x, y, z), TheBackwoodsModBlocks.SPLINTERED_OAK_WOOD.get().defaultBlockState(), 3); world.destroyBlock(BlockPos.containing(x, y, z), false); if (world instanceof ServerLevel _level) { (entity instanceof LivingEntity _livEnt ? _livEnt.getMainHandItem() : ItemStack.EMPTY).hurtAndBreak(1, _level, null, _stkprov -> {}); } for (int _i1 = 0; _i1 < Mth.nextInt(RandomSource.create(), 0, 2); _i1++) { world.destroyBlock(BlockPos.containing(x, y, z), false); }'), check(ast) {
    const all = nodes(ast);
    const replace = all.find(n => n.type === 'block_replace');
    assert(replace, 'missing block_replace');
    assert.equal(input(replace, 'block').fields.value, 'CUSTOM:SplinteredOakWood');
    for (const axis of ['x', 'y', 'z']) assert.equal(input(replace, axis).type, `coord_${axis}`);
    assert(all.some(n => n.type === 'block_remove_with_particles'));
    const damage = all.find(n => n.type === 'item_damage');
    assert.equal(input(damage, 'item').type, 'entity_iteminhand');
    assert(all.some(n => n.type === 'controls_repeat_ext'));
  } },
];

cases.push({ name: 'nested distance math retains NBT sources and exponents', expression: true,
  source: 'Math.sqrt(Math.pow(x - immediatesourceentity.getPersistentData().getDouble("startX"), 2) + Math.pow(y - immediatesourceentity.getPersistentData().getDouble("startY"), 2) + Math.pow(z - immediatesourceentity.getPersistentData().getDouble("startZ"), 2))',
  check(ast) {
    assert.equal(ast.type, 'math_singular_ops');
    assert.equal(ast.fields.OP, 'ROOT');
    const all = nodes(ast);
    assert.equal(all.filter(n => n.type === 'math_dual_ops' && n.fields.OP === 'POWER').length, 3);
    const tags = all.filter(n => n.type === 'entity_nbt_num_get');
    assert.equal(tags.length, 3);
    assert.deepEqual(tags.map(n => input(n, 'tagName')?.fields?.TEXT).sort(), ['startX', 'startY', 'startZ']);
    for (const tag of tags) assert.equal(input(tag, 'entity').type, 'immediate_source_entity_from_deps');
  } });
cases.push({ name: 'unsupported math call preserves the complete expression', expression: true, source: 'Math.exp(entity.getPersistentData().getDouble("value"))', check(ast) {
  assert.equal(ast.type, 'custom_code_snippet');
  assert.equal(ast.fields.CODE, 'Math.exp(entity.getPersistentData().getDouble("value"))');
} });
cases.push({ name: 'arithmetic following a math call stays outside the call', expression: true, source: 'Math.pow(x, 2) + Math.pow(y, 2)', check(ast) {
  assert.equal(ast.type, 'math_dual_ops'); assert.equal(ast.fields.OP, 'ADD');
  assert.equal(input(ast, 'A').fields.OP, 'POWER'); assert.equal(input(ast, 'B').fields.OP, 'POWER');
} });
cases.push({ name: 'math operations export valid block types', source: procedure('double traveledDist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));'), check(ast, result) {
  assert.match(result.xml, /<block type="math_singular_ops">/);
  assert.match(result.xml, /<block type="math_dual_ops">/);
  assert.match(result.xml, /<field name="OP">POWER<\/field>/);
  assert(!result.xml.includes('type="math_binary"'));
} });
for (const [fn, op] of Object.entries({ sqrt: 'ROOT', cbrt: 'CUBEROOT', round: 'ROUND', ceil: 'ROUNDUP', floor: 'ROUNDDOWN', abs: 'ABS', signum: 'SIGNUM', log: 'LN', log10: 'LOG10', sin: 'SIN', cos: 'COS', tan: 'TAN', asin: 'ASIN', acos: 'ACOS', atan: 'ATAN', toDegrees: 'RAD2DEG', toRadians: 'DEG2RAD' })) {
  cases.push({ name: `math: ${fn}`, expression: true, source: `Math.${fn}(x)`, check(ast) { assert.equal(ast.type, 'math_singular_ops'); assert.equal(ast.fields.OP, op); } });
}
for (const [fn, op] of Object.entries({ pow: 'POWER', min: 'MIN', max: 'MAX', hypot: 'HYPOT', atan2: 'ATAN2' })) {
  cases.push({ name: `math: ${fn}`, expression: true, source: `Math.${fn}(x, y)`, check(ast) { assert.equal(ast.type, 'math_dual_ops'); assert.equal(ast.fields.OP, op); } });
}
for (const [source, op] of Object.entries({ 'Double.POSITIVE_INFINITY': 'INFINITY', 'Double.NEGATIVE_INFINITY': 'NINFINITY', 'Double.NaN': 'NAN' })) {
  cases.push({ name: `math constant: ${source}`, expression: true, source, check(ast) { assert.equal(ast.type, 'math_java_constants'); assert.equal(ast.fields.CONSTANT, op); } });
}

for (const [name, source, expected] of [
  ['alive', 'sourceentity.isAlive()', 'entity_isalive'],
  ['being ridden', 'sourceentity.isVehicle()', 'entity_isbeingridden'],
  ['blocking', 'sourceentity instanceof LivingEntity _livEnt && _livEnt.isBlocking()', 'entity_isblocking'],
  ['burning', 'sourceentity.isOnFire()', 'entity_isburning'],
  ['aggressive', 'sourceentity instanceof Mob _mobEnt && _mobEnt.isAggressive()', 'entity_isaggressive'],
  ['explosion immunity', 'sourceentity.ignoreExplosion(new Explosion(sourceentity.level(), null, 0, 0, 0, 4, true, Explosion.BlockInteraction.DESTROY))', 'entity_isimmunetoexplosions'],
  ['fire immunity', 'sourceentity.fireImmune()', 'entity_isimmunetofire'],
  ['lava', 'sourceentity.isInLava()', 'entity_isinlava'],
  ['inside wall', 'sourceentity.isInWall()', 'entity_isinwall'],
  ['invisible', 'sourceentity.isInvisible()', 'entity_isinvisible'],
]) {
  cases.push({ name: `entity data: ${name}`, expression: true, source: `(${source})`, check(ast) {
    assert.equal(ast.type, expected);
    assert.equal(input(ast, 'entity').type, 'source_entity_from_deps');
  } });
}

// Ignore Java comments, but do not mistake comment markers in strings for comments.
function hasComment(text) {
  let state = 'code';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (state === 'code') {
      if (ch === '/' && (next === '/' || next === '*')) return true;
      if (text.startsWith('"""', i)) { state = 'text'; i += 2; }
      else if (ch === '"' || ch === "'") state = ch;
    } else if (state === 'text') {
      if (ch === '\\') i++;
      else if (text.startsWith('"""', i)) { state = 'code'; i += 2; }
    } else if (ch === '\\') i++;
    else if (ch === state) state = 'code';
  }
  return false;
}

function readDigest(filename) {
  const text = readFileSync(filename, 'utf8');
  const marker = /^={10,}\r?\nFile: ([^\r\n]+\.java)\r?\n={10,}\r?\n/gm;
  const sections = [...text.matchAll(marker)];
  if (!sections.length) throw new Error(`No Java file sections found in ${filename}`);
  return sections.map((match, i) => ({ name: match[1], source: text.slice(match.index + match[0].length, sections[i + 1]?.index ?? text.length).trim() }))
    .filter(entry => /(?:^|[\\/])procedures[\\/]/.test(entry.name));
}

async function main() {
  if (!(timeout > 0) || !(limit > 0)) throw new Error('--timeout and --limit must be positive numbers');
  assert(hasComment('int x = 1; // comment'));
  assert(hasComment('int x = 1; /* comment */'));
  assert(!hasComment('String url = "https://example.test/a";'));
  assert(!hasComment('String text = """not // a comment""";'));
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const build = spawnSync(process.execPath, [tsc, '--target', 'ES2020', '--module', 'commonjs', '--moduleResolution', 'node', '--skipLibCheck', '--outDir', temp, 'src/lib/mcreatorConverter.ts', 'src/types.ts', 'src/data/elementConfigs.ts', 'src/data/mcreatorBlocksDatabase.ts'], { cwd: root, encoding: 'utf8' });
  if (build.status !== 0) throw new Error(`Could not compile converter:\n${build.stdout}\n${build.stderr}`);
  writeFileSync(path.join(temp, 'package.json'), '{"type":"commonjs"}');
  const registry = createRequire(import.meta.url)(path.join(temp, 'data', 'mcreatorBlocksDatabase.js')).MCREATOR_BLOCK_DATABASE;
  assert.equal(new Set(registry.map(block => block.id)).size, registry.length, 'Duplicate block IDs in registry');
  assert.equal(new Set(registry.map(block => block.mcreatorType)).size, registry.length, 'Duplicate MCreator block types in registry');
  assert.equal(new Set(registry.map(block => block.id.toLowerCase().replace(/_/g, ''))).size, registry.length, 'Block IDs differ only by underscores');
  assert(registry.some(block => block.id === 'entity_isalive'));
  assert(!registry.some(block => block.id === 'entity_is_alive'));
  assert(registry.some(block => block.id === 'custom_code_snippet') && registry.some(block => block.id === 'custom_code_snippet_output'));
  console.log(`PASS registry IDs and distinct snippet shapes (${registry.length} entries)`);
  let failed = 0;
  for (const version of ['1.21.1', '26.1.2']) {
    for (const test of cases) {
      const result = await translate(test.source, version, test.expression);
      try {
        assert(!result.error, result.error);
        test.check(result.ast, result);
        if (result.xml) assert(result.xml.startsWith('<xml ') && result.xml.trimEnd().endsWith('</xml>'));
        console.log(`PASS ${version} ${test.name}`);
      } catch (error) { failed++; console.error(`FAIL ${version} ${test.name}: ${error.message}`); }
    }
  }
  if (corpus) {
    const supplied = args.filter(a => !a.startsWith('--'));
    const files = supplied.length ? supplied : ['1.21.1', '26.1.2'].map(v => path.join(homedir(), 'Downloads', `src_digest-${v}.txt`));
    for (const file of files) {
      const match = path.basename(file).match(/(1\.21\.1|26\.1\.2)/);
      if (!match) throw new Error(`Digest filename must contain its version: ${file}`);
      const entries = readDigest(file);
      const clean = entries.filter(entry => !hasComment(entry.source));
      let checked = 0, errors = 0, snippets = 0;
      const snippetProcedures = [];
      console.log(`\nCorpus ${match[1]}: ${entries.length} procedures, ${entries.length - clean.length} skipped because they contain comments`);
      for (const entry of clean.slice(0, limit)) {
        const result = await translate(entry.source, match[1]);
        checked++;
        try {
          assert(!result.error, result.error);
          assert(result.xml?.startsWith('<xml ') && result.xml.trimEnd().endsWith('</xml>'), 'Missing Blockly XML');
          const all = nodes(result.ast);
          const count = all.filter(node => node.type === 'custom_code_snippet').length;
          snippets += count;
          if (count) snippetProcedures.push({ name: entry.name, count });
        } catch (error) { errors++; failed++; console.error(`FAIL ${entry.name}: ${error.message}`); }
      }
      console.log(`Checked ${checked}/${clean.length}; failures ${errors}; custom snippets ${snippets}. Corpus checks do not verify semantic equivalence.`);
      for (const entry of snippetProcedures.sort((a, b) => b.count - a.count).slice(0, 10)) console.log(`  ${entry.count} snippets: ${entry.name}`);
    }
  }
  console.log(`\n${cases.length * 2} mapping checks; ${failed} failure(s).`);
  if (failed) process.exitCode = 1;
}

try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rmSync(temp, { recursive: true, force: true }); }
