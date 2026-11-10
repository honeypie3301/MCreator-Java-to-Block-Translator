import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Play, Trash2, Code2, AlertCircle, Sparkles, Navigation } from 'lucide-react';
import { MCreatorElementType } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface JavaEditorPanelProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  targetEvent: string;
  onChangeTargetEvent: (event: string) => void;
  onTranslate: () => void;
  isTranslating: boolean;
  elementType: MCreatorElementType;
  error?: string | null;
  selectedLineNumber?: number | null;
  onSelectLine?: (lineNumber: number) => void;
}

const LINE_HEIGHT = 20; // 20px per line (leading-5)

const EVENT_TRIGGERS = [
  { id: 'auto', label: 'Auto-Detect Event Trigger' },
  { id: 'no_ext_trigger', label: 'No additional trigger (Static procedure)' },
  { id: 'player_ticks', label: 'On player tick update (PlayerTickEvent)' },
  { id: 'entity_ticks', label: 'On entity tick update (EntityTickEvent)' },
  { id: 'world_ticks', label: 'On world tick update (LevelTickEvent)' },
  { id: 'entity_attacked', label: 'When entity is attacked (LivingDamageEvent)' },
  { id: 'block_break', label: 'When block is broken (BlockEvent.BreakEvent)' },
  { id: 'right_clicked_item', label: 'When right clicked with item (PlayerInteractEvent)' },
  { id: 'right_clicked_block', label: 'When right clicked on block' },
  { id: 'entity_spawns', label: 'When entity spawns (EntityJoinLevelEvent)' },
  { id: 'entity_dies', label: 'When entity dies (LivingDeathEvent)' },
  { id: 'player_joins', label: 'When player logs in (PlayerLoggedInEvent)' },
  { id: 'player_useitem_finish', label: 'When player finishes using item' },
  { id: 'craft_item', label: 'When item is crafted (ItemCraftedEvent)' },
  { id: 'explosion_occurs', label: 'When explosion occurs (ExplosionEvent)' },
  { id: 'entity_dimension_changed', label: 'When entity changes dimension' },
];

const SNIPPET_INSERTERS = [
  {
    label: 'NBT & Loops',
    code: `for (int i = 0; i < 4; i++) {\n    if (tag.contains("pb_x_" + (i + 1))) {\n        double px = tag.getDouble("pb_x_" + (i + 1));\n        tag.putDouble("pb_x_" + (i + 1), px + 0.5);\n    }\n}`,
  },
  {
    label: 'Math & Vectors',
    code: `double progress = Math.min(1.0, (floatTicks - 25) / 25.0);\ndouble angle = Math.random() * 3.14159 * 2;\ndouble targetX = player.getX() + Math.sin(angle) * 8.0;\ndouble targetZ = player.getZ() + Math.cos(angle) * 8.0;\nentity.setDeltaMovement(new Vec3(targetX - player.getX(), 0.2, targetZ - player.getZ()));`,
  },
  {
    label: 'Block & World',
    code: `if (!world.isClientSide()) {\n    if (world.getBlockState(pos).isAir()) {\n        world.setBlock(pos, Blocks.STONE.defaultBlockState(), 3);\n        world.playSound("block.stone.place", x, y, z, 1.0f, 1.0f, "blocks");\n    }\n}`,
  },
  {
    label: 'Entity AI Goals',
    code: `this.goalSelector.addGoal(1, new FloatGoal(this));\nthis.goalSelector.addGoal(2, new PanicGoal(this, 1.25D));\nthis.goalSelector.addGoal(3, new AvoidEntityGoal<>(this, Player.class, 16.0F, 1.0D, 1.3D));\nthis.goalSelector.addGoal(4, new RandomStrollGoal(this, 1.0D));\nthis.goalSelector.addGoal(5, new RandomLookAroundGoal(this));\nthis.targetSelector.addGoal(1, new HurtByTargetGoal(this));`,
  },
  {
    label: 'Damage & Heal',
    code: `if (event.getSource().getEntity() instanceof Player player) {\n    float dmg = event.getNewDamage();\n    if (dmg > 0) {\n        player.heal(dmg * 0.5f);\n        player.displayClientMessage(Component.literal("Healed!"), true);\n    }\n}`,
  },
];

export const JavaEditorPanel: React.FC<JavaEditorPanelProps> = ({
  code,
  onChangeCode,
  targetEvent,
  onChangeTargetEvent,
  onTranslate,
  isTranslating,
  elementType,
  error,
  selectedLineNumber,
  onSelectLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(400);

  const totalLines = useMemo(() => {
    return Math.max(1, code.split('\n').length);
  }, [code]);

  const charCount = code.length;

  // Track container height for virtualization
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Synchronize scrolling between textarea and line numbers gutter
  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      setScrollTop(top);
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
    }
  }, []);

  // Programmatic scroll when selectedLineNumber is set from external click
  useEffect(() => {
    if (selectedLineNumber && textareaRef.current) {
      const targetTop = Math.max(0, (selectedLineNumber - 4) * LINE_HEIGHT);
      textareaRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, [selectedLineNumber]);

  // Track line click from cursor position in textarea
  const handleTextareaClick = () => {
    if (!textareaRef.current || !onSelectLine) return;
    const pos = textareaRef.current.selectionStart;
    const clickedLine = code.substring(0, pos).split('\n').length;
    onSelectLine(clickedLine);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onTranslate();
    }
    // Update active line on arrow key movement
    setTimeout(() => {
      if (textareaRef.current && onSelectLine) {
        const pos = textareaRef.current.selectionStart;
        const currentLine = code.substring(0, pos).split('\n').length;
        onSelectLine(currentLine);
      }
    }, 10);
  };

  const insertSnippet = (snippetCode: string) => {
    if (!code.trim()) {
      onChangeCode(snippetCode);
    } else {
      onChangeCode(code + '\n\n' + snippetCode);
    }
  };

  // Virtualized line number calculations for handling 100 to 20,000+ lines effortlessly
  const buffer = 15;
  const startLineIdx = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - buffer);
  const visibleCount = Math.ceil(viewportHeight / LINE_HEIGHT) + buffer * 2;
  const endLineIdx = Math.min(totalLines, startLineIdx + visibleCount);

  const visibleLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = startLineIdx; i < endLineIdx; i++) {
      lines.push(i + 1);
    }
    return lines;
  }, [startLineIdx, endLineIdx]);

  return (
    <div className="flex flex-col h-full bg-[#181614] border border-[#2E2925] rounded-lg overflow-hidden shadow-sm">
      {/* Top Bar */}
      <div className="bg-[#121110] px-3 py-2 border-b border-[#2E2925] flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-[#CEB098]" />
          <span className="font-semibold text-[#FAF6F0]">Java Source Code Input</span>
          <span className="text-[11px] text-[#A39B8E] font-mono">
            {totalLines.toLocaleString()} lines | {charCount.toLocaleString()} chars
          </span>
          {selectedLineNumber && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-mono text-[10px] flex items-center gap-1">
              <Navigation className="w-2.5 h-2.5" /> Line {selectedLineNumber}
            </span>
          )}
        </div>

        {elementType === 'procedure' && (
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-[#A39B8E] font-medium">Event Listener:</span>
            <CustomDropdown
              value={targetEvent}
              onChange={onChangeTargetEvent}
              align="right"
              options={EVENT_TRIGGERS.map((t) => ({
                value: t.id,
                label: t.label,
              }))}
            />
          </div>
        )}
      </div>

      {/* Snippet Quick Bar */}
      <div className="bg-[#161412] px-3 py-1.5 border-b border-[#292420] flex items-center space-x-2 text-[11px] overflow-x-auto">
        <span className="text-[#8C857B] font-mono text-[10px] shrink-0">Quick Snippets:</span>
        {SNIPPET_INSERTERS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => insertSnippet(s.code)}
            className="px-2 py-0.5 rounded bg-[#24201D] hover:bg-[#2E2925] text-[#D8C4B6] border border-[#3B342E] transition text-[11px] shrink-0"
          >
            + {s.label}
          </button>
        ))}
      </div>

      {/* Editor Body with Synchronized Gutter */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-[#0F0E0D] font-mono text-xs flex overflow-hidden select-text"
      >
        {/* Virtualized Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="select-none bg-[#141210] border-r border-[#24201D] text-[#5C554D] text-right font-mono text-[11px] overflow-hidden shrink-0 z-10 pointer-events-auto"
          style={{ width: totalLines > 9999 ? '4.5rem' : totalLines > 999 ? '3.75rem' : '3rem' }}
        >
          <div
            style={{
              height: `${totalLines * LINE_HEIGHT + 24}px`,
              position: 'relative',
            }}
          >
            {visibleLines.map((lineNum) => {
              const isSelected = selectedLineNumber === lineNum;
              return (
                <div
                  key={lineNum}
                  onClick={() => onSelectLine?.(lineNum)}
                  className={`cursor-pointer transition-colors px-2 leading-[20px] absolute w-full left-0 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-bold border-r-2 border-amber-400'
                      : 'hover:text-[#FAF6F0] hover:bg-[#1f1c19]'
                  }`}
                  style={{
                    top: `${(lineNum - 1) * LINE_HEIGHT + 12}px`,
                    height: `${LINE_HEIGHT}px`,
                  }}
                  title={`Click to inspect Blockly block for Line ${lineNum}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Java Source Text Area */}
        <div className="relative flex-1 h-full overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            onScroll={handleScroll}
            onClick={handleTextareaClick}
            onKeyUp={handleTextareaClick}
            onKeyDown={handleKeyDown}
            wrap="off"
            placeholder="// Enter or paste your NeoForge 1.21.1+ Java code here...
// Supporting events (@SubscribeEvent), logic structures (if/else/while/for), math expressions, potion effects, heal, and damage calls."
            className="w-full h-full p-3 pt-3 bg-transparent text-[#FAF6F0] placeholder-[#5C554D] resize-none outline-none font-mono text-xs selection:bg-[#CEB098]/30 overflow-auto"
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              whiteSpace: 'pre',
              tabSize: 4,
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#2A1816] border-t border-[#5C2B25] p-2.5 px-3 flex items-start space-x-2 text-xs text-[#E8A59E]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#E8A59E] mt-0.5" />
          <div className="flex-1 font-mono text-[11px] leading-tight">{error}</div>
        </div>
      )}

      {/* Bottom Footer */}
      <div className="bg-[#121110] p-2.5 border-t border-[#2E2925] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-[#A39B8E]">
          <kbd className="px-1.5 py-0.5 bg-[#24201D] border border-[#3B342E] rounded text-[#FAF6F0] font-mono text-[10px]">
            Ctrl + Enter
          </kbd>
          <span>to convert into blocks</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onChangeCode('')}
            disabled={!code || isTranslating}
            className="px-2.5 py-1 text-xs text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#24201D] border border-[#2E2925] rounded transition flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
            title="Clear Code"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={onTranslate}
            disabled={!code.trim() || isTranslating}
            className="px-4 py-1.5 text-xs font-semibold text-[#121110] bg-[#CEB098] hover:bg-[#E2D2C3] active:bg-[#B89980] rounded transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isTranslating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#121110]/30 border-t-[#121110] rounded-full animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Convert Code to Blocks</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

