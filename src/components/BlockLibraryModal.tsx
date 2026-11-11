import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MCREATOR_BLOCK_DATABASE } from '../data/mcreatorBlocksDatabase';
import { BlockDefinition } from '../types';
import { Search, X, BookOpen, ChevronRight, Layers } from 'lucide-react';

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
  return str.replace(/^[\"'"]+|[\"'"]+$/g, '').trim();
}

export function getBlockCanonicalCategory(block: BlockDefinition): string {
  const id = cleanStr(block.id).toLowerCase();
  const tb = cleanStr(block.toolbox);
  const cat = cleanStr(block.category).toLowerCase();

  if (id === 'create_vec3' || id.startsWith('vector_') || id.endsWith('_vector') || cat === 'vector') return 'Vectors';
  if (id === 'cancel_event') return 'Damage procedures';
  if (id.startsWith('get_command_parameter_') || id.includes('command_parameter') || cat === 'command_param') return 'Command parameters';
  if (id.startsWith('datetime_') || cat === 'datetime') return 'Date and time';
  if (id.startsWith('mcreator_link_') || cat === 'mcreator_link' || id.includes('digital_pin') || id.includes('analog_pin')) return 'MCreator Link';
  if (id.startsWith('text_') || id === 'text_print' || id === 'text_log' || cat === 'text') return 'Text';
  if (id.startsWith('projectile_') || id.startsWith('shoot_projectile') || cat === 'projectile') return 'Projectile procedures';
  if (id.startsWith('damage_') || cat === 'damage' || id.includes('deal_damage')) return 'Damage procedures';

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

  if (id.startsWith('variables_') || cat === 'variable') return 'Custom variables';

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

// =========================================================================
// STATIC PRECOMPUTATIONS: Done ONCE at module load to guarantee 0ms open lag
// =========================================================================
interface IndexedBlockItem {
  block: BlockDefinition;
  canonicalCategory: string;
  theme: { bg: string; text: string; border: string };
  searchKey: string;
  subBreadcrumb: string;
}

const STATIC_UNIQUE_BLOCKS: BlockDefinition[] = (() => {
  const map = new Map<string, BlockDefinition>();
  for (const b of MCREATOR_BLOCK_DATABASE) {
    const cleanId = cleanStr(b.id);
    if (!map.has(cleanId) || (b.toolbox && b.toolboxPath)) {
      map.set(cleanId, b);
    }
  }
  return Array.from(map.values());
})();

const STATIC_INDEXED_BLOCKS: IndexedBlockItem[] = STATIC_UNIQUE_BLOCKS.map((block) => {
  const canonicalCategory = getBlockCanonicalCategory(block);
  const theme = CATEGORY_COLORS[canonicalCategory] || {
    bg: '#5b80a5',
    text: '#ffffff',
    border: '#354d64',
  };

  let subBreadcrumb = '';
  if (block.toolboxPath) {
    if (block.toolboxPath.includes('-> Data') || block.toolboxPath.includes('Check data')) subBreadcrumb = 'Data';
    else if (block.toolboxPath.includes('-> Actions') || block.toolboxPath.includes('Management')) subBreadcrumb = 'Actions';
  } else if (block.toolbox) {
    if (block.toolbox.includes('data')) subBreadcrumb = 'Data';
    else if (block.toolbox.includes('management') || block.toolbox.includes('action')) subBreadcrumb = 'Actions';
  }

  // Pre-bake search string for ultra-fast substring checks
  const javaKeywords = (block.javaPatterns || []).join(' ');
  const searchKey = `${block.title || ''} ${block.mcreatorType || ''} ${block.id || ''} ${block.description || ''} ${canonicalCategory} ${subBreadcrumb} ${javaKeywords}`.toLowerCase();

  return {
    block,
    canonicalCategory,
    theme,
    searchKey,
    subBreadcrumb,
  };
});

const STATIC_CATEGORY_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = { 'All Blocks': STATIC_INDEXED_BLOCKS.length };
  for (const cat of ALL_TOOLBOX_CATEGORIES) {
    if (cat === 'All Blocks') continue;
    counts[cat] = 0;
  }
  for (const item of STATIC_INDEXED_BLOCKS) {
    const cat = item.canonicalCategory;
    if (counts[cat] !== undefined) {
      counts[cat]++;
    } else {
      counts['Advanced'] = (counts['Advanced'] || 0) + 1;
    }
  }
  return counts;
})();

const PAGE_SIZE = 48; // Fast chunk rendering

export const BlockLibraryModal: React.FC<BlockLibraryModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Blocks');
  const [displayLimit, setDisplayLimit] = useState<number>(PAGE_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset pagination on search or category filter change
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedCategory]);

  // Filter blocks instantaneously
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isAll = selectedCategory === 'All Blocks';

    return STATIC_INDEXED_BLOCKS.filter((item) => {
      if (!isAll && item.canonicalCategory !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return item.searchKey.includes(q);
    });
  }, [searchQuery, selectedCategory]);

  // Infinite scroll loader: load more blocks smoothly
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
      setDisplayLimit((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
    }
  }, [filteredItems.length]);

  if (!isOpen) return null;

  const visibleItems = filteredItems.slice(0, displayLimit);
  const hasMore = displayLimit < filteredItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-1.5 sm:p-4 overflow-hidden">
      <div className="bg-[#161412] border border-[#3B342E] rounded-xl w-full max-w-6xl h-[92vh] max-h-[92vh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans text-xs text-[#FAF6F0]">
        {/* Top Header */}
        <div className="bg-[#121110] border-b border-[#2A2622] px-3.5 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 rounded bg-[#2A241F] border border-[#52463C] text-[#CEB098] shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <h2 className="font-bold text-xs tracking-tight text-[#FAF6F0] truncate">
                  MCreator Procedure Block Database
                </h2>
                <span className="bg-[#28231F] text-[#CEB098] px-2 py-0.5 rounded text-[10px] font-mono border border-[#524438] shrink-0 hidden sm:inline">
                  {STATIC_UNIQUE_BLOCKS.length.toLocaleString()} Blocks
                </span>
              </div>
              <p className="text-[10px] text-[#A39B8E] truncate">
                NeoForge 1.21.1 / MCreator 2026.1 Blockly specification & registry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded bg-[#24201D] hover:bg-[#2E2925] text-[#A39B8E] hover:text-[#FAF6F0] border border-[#3B342E] transition cursor-pointer shrink-0"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#181614] border-b border-[#2A2622] px-3 py-2 flex items-center justify-between gap-2.5 flex-wrap text-xs shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-xl">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#7E756B]" />
            <input
              type="text"
              placeholder="Search blocks by name, burn, entity_isburning, id, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-[#100F0E] border border-[#2A2622] rounded text-xs text-[#FAF6F0] placeholder-[#6E665D] outline-none focus:border-[#CEB098] transition"
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#A39B8E] shrink-0 ml-auto">
            <span>
              Showing <strong className="text-[#CEB098]">{visibleItems.length}</strong> of {filteredItems.length}
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Category Selector: Horizontal on mobile, vertical sidebar on md+ */}
          <div className="md:w-56 bg-[#121110] border-b md:border-b-0 md:border-r border-[#2A2622] p-1.5 md:p-2 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1 font-mono text-[11px] scrollbar-none">
            {ALL_TOOLBOX_CATEGORIES.map((cat) => {
              const theme = CATEGORY_COLORS[cat] || { bg: '#4A423B', text: '#ffffff', border: '#332D28' };
              const isSelected = selectedCategory === cat;
              const count = STATIC_CATEGORY_COUNTS[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left px-2 py-1.5 rounded transition flex items-center justify-between cursor-pointer shrink-0 md:w-full gap-2 ${
                    isSelected
                      ? 'bg-[#28231F] text-[#FAF6F0] border border-[#524438] font-bold'
                      : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0 truncate">
                    {cat !== 'All Blocks' && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.bg }}
                      />
                    )}
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className="text-[10px] opacity-70 bg-[#1E1B18] px-1.5 py-0.2 rounded border border-[#2A2622] shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Blocks Grid View */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-2.5 sm:p-3 overflow-y-auto bg-[#0F0E0D] flex flex-col min-h-0"
          >
            {filteredItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-[#7E756B] space-y-2">
                <Search className="w-8 h-8 text-[#4A423B]" />
                <p className="text-xs font-semibold">No MCreator procedure blocks match your search query.</p>
                <p className="text-[10px]">Try searching for "burn", "entity_isburning", "world", or "controls_if".</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 auto-rows-max">
                  {visibleItems.map(({ block, canonicalCategory, theme, subBreadcrumb }) => (
                    <div
                      key={block.id}
                      className="bg-[#161412] border border-[#28231F] rounded-lg p-2.5 flex flex-col justify-between space-y-2 shadow-xs hover:border-[#524438] transition min-w-0 overflow-hidden"
                    >
                      {/* Block Title Header */}
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 max-w-[62%] truncate flex items-center gap-1 shadow-xs"
                            style={{
                              backgroundColor: theme.bg,
                              color: theme.text,
                              border: `1px solid ${theme.border}`,
                            }}
                            title={`${canonicalCategory}${subBreadcrumb ? ` ▸ ${subBreadcrumb}` : ""}`}
                          >
                            <span className="truncate">{canonicalCategory.replace(" procedures", "")}</span>
                            {subBreadcrumb && (
                              <>
                                <span className="opacity-60 text-[9px] shrink-0">▸</span>
                                <span className="shrink-0">{subBreadcrumb}</span>
                              </>
                            )}
                          </span>
                          <span
                            className="font-mono text-[10px] text-[#CEB098] bg-[#221E1B] px-1.5 py-0.5 rounded border border-[#3A332C] truncate max-w-[130px] sm:max-w-[150px] shrink min-w-0 shadow-xs"
                            title={block.mcreatorType || block.id}
                          >
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
                        {block.output || (block as any).outputType ? (
                          <span className="bg-[#1E2522] text-[#82D182] px-1.5 py-0.2 rounded border border-[#2C482C]">
                            Output: {block.output || (block as any).outputType}
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
                  ))}
                </div>

                {hasMore && (
                  <div className="py-4 text-center">
                    <button
                      onClick={() => setDisplayLimit((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length))}
                      className="px-4 py-1.5 bg-[#24201D] hover:bg-[#2E2925] border border-[#524438] text-[#CEB098] rounded-md text-xs font-mono transition cursor-pointer"
                    >
                      Load More Blocks ({filteredItems.length - visibleItems.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
