import React, { useState, useMemo } from 'react';
import { MCREATOR_BLOCK_DATABASE } from '../data/mcreatorBlocksDatabase';
import { BlockDefinition } from '../types';
import { Search, X, BookOpen } from 'lucide-react';

interface BlockLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Block procedures': { bg: '#795548', text: '#ffffff', border: '#4e342e' },
  'Command parameters': { bg: '#815ba5', text: '#ffffff', border: '#4e3568' },
  'Damage procedures': { bg: '#ad336d', text: '#ffffff', border: '#6b1840' },
  'Direction procedures': { bg: '#935116', text: '#ffffff', border: '#572e0a' },
  'Entity procedures': { bg: '#5ba58c', text: '#ffffff', border: '#376454' },
  'Item procedures': { bg: '#d32f2f', text: '#ffffff', border: '#b71c1c' },
  'Player procedures': { bg: '#00acc1', text: '#ffffff', border: '#006064' },
  'Projectile procedures': { bg: '#8a4f9e', text: '#ffffff', border: '#532661' },
  'Slot & GUI procedures': { bg: '#488b49', text: '#ffffff', border: '#275728' },
  'World procedures': { bg: '#a58c5b', text: '#ffffff', border: '#645435' },
  'Minecraft components': { bg: '#00897b', text: '#ffffff', border: '#004d40' },
  'Custom variables': { bg: '#a55b80', text: '#ffffff', border: '#64354c' },
  'Flow control': { bg: '#5b80a5', text: '#ffffff', border: '#354d64' },
  'Logic': { bg: '#5ba58c', text: '#ffffff', border: '#376454' },
  'Math': { bg: '#5b67a5', text: '#ffffff', border: '#353c64' },
  'Vectors': { bg: '#7058a6', text: '#ffffff', border: '#44316e' },
  'Text': { bg: '#00897b', text: '#ffffff', border: '#004d40' },
  'Date and time': { bg: '#5c6bc0', text: '#ffffff', border: '#283593' },
  'MCreator Link': { bg: '#689f38', text: '#ffffff', border: '#3a611f' },
  'Advanced': { bg: '#7b5ba5', text: '#ffffff', border: '#4b3564' },
  'Procedure templates': { bg: '#5ba55b', text: '#ffffff', border: '#3c6e3c' },
};

export const ALL_TOOLBOX_CATEGORIES = [
  'All Blocks',
  'Block procedures',
  'Command parameters',
  'Damage procedures',
  'Direction procedures',
  'Entity procedures',
  'Item procedures',
  'Player procedures',
  'Projectile procedures',
  'Slot & GUI procedures',
  'World procedures',
  'Minecraft components',
  'Custom variables',
  'Flow control',
  'Logic',
  'Math',
  'Vectors',
  'Text',
  'Date and time',
  'MCreator Link',
  'Advanced',
];

function cleanStr(str?: string): string {
  if (!str) return '';
  return str.replace(/^["']+|["']+$/g, '').trim();
}

export function getBlockCanonicalCategory(block: BlockDefinition): string {
  const id = cleanStr(block.id).toLowerCase();
  const tb = cleanStr(block.toolbox);
  const cat = cleanStr(block.category).toLowerCase();

  // 1. Direct explicit overrides for vectors, command, damage, link, and datetime
  if (id === 'create_vec3' || id.startsWith('vector_') || id.endsWith('_vector') || cat === 'vector') return 'Vectors';
  if (id === 'cancel_event') return 'Damage procedures';
  if (id.startsWith('get_command_parameter_') || id.includes('command_parameter') || cat === 'command_param') return 'Command parameters';
  if (id.startsWith('datetime_') || cat === 'datetime') return 'Date and time';
  if (id.startsWith('mcreator_link_') || cat === 'mcreator_link' || id.includes('digital_pin') || id.includes('analog_pin')) return 'MCreator Link';
  if (id.startsWith('text_') || id === 'text_print' || id === 'text_log' || cat === 'text') return 'Text';
  if (id.startsWith('projectile_') || id.startsWith('shoot_projectile') || cat === 'projectile') return 'Projectile procedures';
  if (id.startsWith('damage_') || cat === 'damage' || id.includes('deal_damage')) return 'Damage procedures';

  // 2. Direct exact toolbox matches (highest priority over prefix heuristics)
  if (tb === 'Block procedures' || tb === 'Block data procedures' || tb === 'Block actions') return 'Block procedures';
  if (tb === 'Command parameters' || tb === 'commands' || tb === 'Command procedures') return 'Command parameters';
  if (tb === 'Damage procedures' || tb === 'damagesources') return 'Damage procedures';
  if (tb === 'Direction procedures' || tb === 'directionactions') return 'Direction procedures';
  if (tb === 'Player procedures' || tb === 'playermanagement' || tb === 'playerdata') return 'Player procedures';
  if (tb === 'Entity procedures' || tb === 'Entity management procedures' || tb === 'Entity data procedures' || tb === 'entitymanagement' || tb === 'entitydata') return 'Entity procedures';
  if (tb === 'Item procedures' || tb === 'itemmanagement' || tb === 'itemdata') return 'Item procedures';
  if (tb === 'Projectile procedures' || tb === 'projectilemanagement') return 'Projectile procedures';
  if (tb === 'Slot & GUI procedures' || tb === 'guimanagement') return 'Slot & GUI procedures';
  if (tb === 'World procedures' || tb === 'World management procedures' || tb === 'World data procedures' || tb === 'worldmanagement' || tb === 'worlddata') return 'World procedures';
  if (tb === 'Minecraft components' || tb === 'mcelements') return 'Minecraft components';
  if (tb === 'Custom variables') return 'Custom variables';
  if (tb === 'Flow control' || tb === 'logicloops') return 'Flow control';
  if (tb === 'Logic' || tb === 'logicoperations') return 'Logic';
  if (tb === 'Math' || tb === 'Math procedures') return 'Math';
  if (tb === 'Vectors' || tb === 'Vector procedures') return 'Vectors';
  if (tb === 'Text') return 'Text';
  if (tb === 'Date and time') return 'Date and time';
  if (tb === 'MCreator Link') return 'MCreator Link';
  if (tb === 'Advanced') return 'Advanced';
  if (tb === 'Procedure templates') return 'Flow control';

  // 3. Player procedure specific ID checks (food, saturation, xp, advancement, gamemode, gui, flight, permission)
  if (
    id.startsWith('player_') ||
    id.includes('food_level') ||
    id.includes('saturation') ||
    id.includes('xp_level') ||
    id.includes('xp_points') ||
    id.includes('advancement') ||
    id.includes('achievement') ||
    id.includes('gamemode') ||
    id.includes('actionbar') ||
    id.includes('allow_build') ||
    id.includes('allow_fly') ||
    id.includes('make_fly') ||
    id.includes('open_gui') ||
    id.includes('close_gui') ||
    id.includes('permission') ||
    cat === 'player'
  ) {
    return 'Player procedures';
  }

  // 4. Custom variable ID checks
  if (id.startsWith('variables_') || cat === 'variable') return 'Custom variables';

  // 5. Advanced procedure ID checks
  if (
    id.startsWith('set_event_param_') ||
    id.startsWith('call_procedure_') ||
    id.startsWith('dependency_') ||
    id.startsWith('custom_code') ||
    id === 'not_null_check' ||
    id === 'no_entity' ||
    id === 'entity_static_type' ||
    id === 'is_mod_loaded' ||
    id === 'debug_marker' ||
    id === 'set_event_result' ||
    cat === 'advanced'
  ) {
    return 'Advanced';
  }

  // 6. General ID prefix checks
  if (id.startsWith('projectile') || id.startsWith('projectiles_') || cat === 'projectile') return 'Projectile procedures';
  if (id.startsWith('direction_') || cat === 'direction') return 'Direction procedures';
  if (id.startsWith('gui_') || id.startsWith('slot_') || cat === 'gui') return 'Slot & GUI procedures';
  if (id.startsWith('component_') || cat === 'component') return 'Minecraft components';
  if (id.startsWith('controls_') || id.startsWith('procedure_retval_') || cat === 'control') return 'Flow control';
  if (id.startsWith('logic_') || cat === 'logic') return 'Logic';
  if (id.startsWith('math_') || cat === 'math') return 'Math';
  if (id.startsWith('block_') || cat === 'block') return 'Block procedures';
  if (id.startsWith('entity_') || id.startsWith('aitask_') || cat === 'entity' || cat === 'ai') return 'Entity procedures';
  if (id.startsWith('item_') || cat === 'item') return 'Item procedures';
  if (id.startsWith('world_') || cat === 'world') return 'World procedures';

  // 7. Fallback checks on lowercase toolbox string
  const tbLower = tb.toLowerCase();
  if (tbLower.includes('player')) return 'Player procedures';
  if (tbLower.includes('command')) return 'Command parameters';
  if (tbLower.includes('damage')) return 'Damage procedures';
  if (tbLower.includes('direction')) return 'Direction procedures';
  if (tbLower.includes('entity')) return 'Entity procedures';
  if (tbLower.includes('item')) return 'Item procedures';
  if (tbLower.includes('projectile')) return 'Projectile procedures';
  if (tbLower.includes('slot') || tbLower.includes('gui')) return 'Slot & GUI procedures';
  if (tbLower.includes('world')) return 'World procedures';
  if (tbLower.includes('component')) return 'Minecraft components';
  if (tbLower.includes('variable')) return 'Custom variables';
  if (tbLower.includes('flow') || tbLower.includes('control')) return 'Flow control';
  if (tbLower.includes('logic')) return 'Logic';
  if (tbLower.includes('math')) return 'Math';
  if (tbLower.includes('vector')) return 'Vectors';
  if (tbLower.includes('text')) return 'Text';
  if (tbLower.includes('date') || tbLower.includes('time')) return 'Date and time';
  if (tbLower.includes('link')) return 'MCreator Link';
  if (tbLower.includes('block')) return 'Block procedures';

  return 'Advanced';
}

export const BlockLibraryModal: React.FC<BlockLibraryModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Blocks');

  // Deduplicate blocks once by ID (preferring entries with sourceFile/toolboxPath)
  const uniqueBlocks = useMemo(() => {
    const map = new Map<string, BlockDefinition>();
    for (const b of MCREATOR_BLOCK_DATABASE) {
      const cleanId = cleanStr(b.id);
      if (!map.has(cleanId) || (b.toolbox && b.toolboxPath)) {
        map.set(cleanId, b);
      }
    }
    return Array.from(map.values());
  }, []);

  // Compute category assignments for all blocks
  const blockCategoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const block of uniqueBlocks) {
      map.set(block.id, getBlockCanonicalCategory(block));
    }
    return map;
  }, [uniqueBlocks]);

  // Compute category counts strictly matching canonical categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Blocks': uniqueBlocks.length };
    for (const cat of ALL_TOOLBOX_CATEGORIES) {
      if (cat === 'All Blocks') continue;
      counts[cat] = 0;
    }
    for (const block of uniqueBlocks) {
      const canonicalCat = blockCategoriesMap.get(block.id) || 'Advanced';
      if (counts[canonicalCat] !== undefined) {
        counts[canonicalCat]++;
      } else {
        counts['Advanced'] = (counts['Advanced'] || 0) + 1;
      }
    }
    return counts;
  }, [uniqueBlocks, blockCategoriesMap]);

  // Filter blocks by search query & selected category
  const filteredBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return uniqueBlocks.filter((block) => {
      const canonicalCategory = blockCategoriesMap.get(block.id) || 'Advanced';
      const matchesCategory = selectedCategory === 'All Blocks' || canonicalCategory === selectedCategory;

      if (!matchesCategory) return false;

      if (q === '') return true;

      const title = (block.title || '').toLowerCase();
      const mcreatorType = (block.mcreatorType || '').toLowerCase();
      const desc = (block.description || '').toLowerCase();
      const id = (block.id || '').toLowerCase();

      return (
        title.includes(q) ||
        mcreatorType.includes(q) ||
        desc.includes(q) ||
        id.includes(q) ||
        canonicalCategory.toLowerCase().includes(q)
      );
    });
  }, [uniqueBlocks, blockCategoriesMap, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#161412] border border-[#3B342E] rounded-xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans text-xs text-[#FAF6F0]">
        {/* Top Header */}
        <div className="bg-[#121110] border-b border-[#2A2622] px-3.5 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-[#2A241F] border border-[#52463C] text-[#CEB098]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-xs tracking-tight text-[#FAF6F0]">
                  MCreator Registered Procedure Block Database
                </h2>
                <span className="bg-[#28231F] text-[#CEB098] px-2 py-0.5 rounded text-[10px] font-mono border border-[#524438]">
                  {uniqueBlocks.length.toLocaleString()} Unique Blocks
                </span>
              </div>
              <p className="text-[10px] text-[#A39B8E]">
                Source-backed NeoForge 1.21.1 / MCreator 2026.1 Blockly block registry & specifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded bg-[#24201D] hover:bg-[#2E2925] text-[#A39B8E] hover:text-[#FAF6F0] border border-[#3B342E] transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#181614] border-b border-[#2A2622] px-3 py-2 flex items-center justify-between gap-3 flex-wrap text-xs shrink-0">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#7E756B]" />
            <input
              type="text"
              placeholder="Search by block name, ID (e.g. entity_has_advancement), or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-[#100F0E] border border-[#2A2622] rounded text-xs text-[#FAF6F0] placeholder-[#6E665D] outline-none focus:border-[#CEB098] transition"
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#A39B8E]">
            <span>
              Showing <strong className="text-[#CEB098]">{filteredBlocks.length}</strong> of {uniqueBlocks.length} blocks
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Category Sidebar */}
          <div className="w-56 bg-[#121110] border-r border-[#2A2622] p-2 overflow-auto shrink-0 space-y-0.5 font-mono text-[11px]">
            {ALL_TOOLBOX_CATEGORIES.map((cat) => {
              const theme = CATEGORY_COLORS[cat] || { bg: '#4A423B', text: '#ffffff', border: '#332D28' };
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2 py-1.5 rounded transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#28231F] text-[#FAF6F0] border border-[#524438] font-bold'
                      : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 truncate">
                    {cat !== 'All Blocks' && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.bg }}
                      />
                    )}
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className="text-[10px] opacity-70 bg-[#1E1B18] px-1.5 py-0.2 rounded border border-[#2A2622] ml-1">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Blocks Grid View */}
          <div className="flex-1 p-3 overflow-auto bg-[#0F0E0D] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 align-start auto-rows-max">
            {filteredBlocks.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-[#7E756B] space-y-2">
                <Search className="w-8 h-8 text-[#4A423B]" />
                <p className="text-xs font-semibold">No MCreator procedure blocks match your search query.</p>
                <p className="text-[10px]">Try searching for "entity_has_advancement", "world", "controls_if", or clear search filters.</p>
              </div>
            ) : (
              filteredBlocks.map((block) => {
                const canonicalCategory = blockCategoriesMap.get(block.id) || 'Advanced';
                const theme = CATEGORY_COLORS[canonicalCategory] || {
                  bg: '#5b80a5',
                  text: '#ffffff',
                  border: '#354d64',
                };

                return (
                  <div
                    key={block.id}
                    className="bg-[#161412] border border-[#28231F] rounded-lg p-2.5 flex flex-col justify-between space-y-2 shadow-xs hover:border-[#524438] transition"
                  >
                    {/* Block Title Header */}
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        {(() => {
                          let subBreadcrumb = '';
                          if (block.toolboxPath) {
                            if (block.toolboxPath.includes('-> Data') || block.toolboxPath.includes('Check data')) subBreadcrumb = 'Data';
                            else if (block.toolboxPath.includes('-> Actions') || block.toolboxPath.includes('Management')) subBreadcrumb = 'Actions';
                          } else if (block.toolbox) {
                            if (block.toolbox.includes('data')) subBreadcrumb = 'Data';
                            else if (block.toolbox.includes('management') || block.toolbox.includes('action')) subBreadcrumb = 'Actions';
                          }
                          return (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                              style={{
                                backgroundColor: theme.bg,
                                color: theme.text,
                                border: `1px solid ${theme.border}`,
                              }}
                            >
                              <span>{canonicalCategory}</span>
                              {subBreadcrumb && (
                                <>
                                  <span className="opacity-60 text-[9px]">▸</span>
                                  <span>{subBreadcrumb}</span>
                                </>
                              )}
                            </span>
                          );
                        })()}
                        <span className="font-mono text-[10px] text-[#CEB098] bg-[#221E1B] px-1.5 py-0.5 rounded border border-[#3A332C] truncate max-w-[140px]">
                          {block.mcreatorType || block.id}
                        </span>
                      </div>

                      <h3 className="font-bold text-xs text-[#FAF6F0] tracking-tight line-clamp-1">
                        {block.title || block.label || block.mcreatorType || block.id}
                      </h3>

                      {block.description && (
                        <p className="text-[10px] text-[#A39B8E] mt-1 line-clamp-2 leading-snug">
                          {block.description}
                        </p>
                      )}
                    </div>

                    {/* Block Badges & Features */}
                    <div className="pt-1.5 border-t border-[#221E1B] flex items-center justify-between text-[10px] font-mono text-[#7E756B] flex-wrap gap-1">
                      {block.output ? (
                        <span className="bg-[#1E2522] text-[#82D182] px-1.5 py-0.2 rounded border border-[#2C482C]">
                          Output: {block.output}
                        </span>
                      ) : (
                        <span className="bg-[#1F232B] text-[#85A4C4] px-1.5 py-0.2 rounded border border-[#2E3C4E]">
                          Statement
                        </span>
                      )}

                      {block.fields && block.fields.length > 0 && (
                        <span className="text-[#A39B8E]">
                          Fields ({block.fields.length})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
