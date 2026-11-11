import React, { useState, useEffect, useRef } from 'react';
import { BlockASTNode } from '../types';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Trash2,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  X,
  Code2,
  FileText,
  Layers as LayersIcon,
  HelpCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { GLOBAL_TRIGGERS } from '../lib/mcreatorConverter';

interface VisualBlockCanvasProps {
  ast?: BlockASTNode;
  eventTrigger?: string;
  procedureName?: string;
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string, line?: number) => void;
}

// Color palette extracted directly from MCreator 2026.1 Blockly source & UI
const MCREATOR_CATEGORY_THEMES: Record<
  string,
  {
    headerBg: string;
    bodyBg: string;
    border: string;
    text: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  event: {
    headerBg: '#5ba55b',
    bodyBg: '#4a894a',
    border: '#3c6e3c',
    text: '#ffffff',
    accent: '#82d182',
    badgeBg: '#3d723d',
    badgeText: '#ffffff',
  },
  control: {
    headerBg: '#5b80a5',
    bodyBg: '#486887',
    border: '#354d64',
    text: '#ffffff',
    accent: '#85a4c4',
    badgeBg: '#39546f',
    badgeText: '#ffffff',
  },
  logic: {
    headerBg: '#5ba58c',
    bodyBg: '#498671',
    border: '#376454',
    text: '#ffffff',
    accent: '#88cbba',
    badgeBg: '#3a6c5b',
    badgeText: '#ffffff',
  },
  entity: {
    headerBg: '#5ba58c',
    bodyBg: '#498671',
    border: '#376454',
    text: '#ffffff',
    accent: '#88cbba',
    badgeBg: '#3a6c5b',
    badgeText: '#ffffff',
  },
  action: {
    headerBg: '#a58c5b',
    bodyBg: '#877248',
    border: '#645435',
    text: '#ffffff',
    accent: '#c4ad85',
    badgeBg: '#6f5e39',
    badgeText: '#ffffff',
  },
  world: {
    headerBg: '#a58c5b',
    bodyBg: '#877248',
    border: '#645435',
    text: '#ffffff',
    accent: '#c4ad85',
    badgeBg: '#6f5e39',
    badgeText: '#ffffff',
  },
  math: {
    headerBg: '#5b67a5',
    bodyBg: '#485387',
    border: '#353c64',
    text: '#ffffff',
    accent: '#8590c4',
    badgeBg: '#39426f',
    badgeText: '#ffffff',
  },
  variable: {
    headerBg: '#a55b80',
    bodyBg: '#874867',
    border: '#64354c',
    text: '#ffffff',
    accent: '#c485a5',
    badgeBg: '#6f3954',
    badgeText: '#ffffff',
  },
  ai: {
    headerBg: '#689f38',
    bodyBg: '#558b2f',
    border: '#3a611f',
    text: '#ffffff',
    accent: '#9ccc65',
    badgeBg: '#426d24',
    badgeText: '#ffffff',
  },
  command: {
    headerBg: '#815ba5',
    bodyBg: '#684887',
    border: '#4e3568',
    text: '#ffffff',
    accent: '#b18cd6',
    badgeBg: '#4e3568',
    badgeText: '#ffffff',
  },
  command_entry: {
    headerBg: '#5ba55b',
    bodyBg: '#4a894a',
    border: '#3c6e3c',
    text: '#ffffff',
    accent: '#82d182',
    badgeBg: '#3d723d',
    badgeText: '#ffffff',
  },
  command_param: {
    headerBg: '#815ba5',
    bodyBg: '#684887',
    border: '#4e3568',
    text: '#ffffff',
    accent: '#b18cd6',
    badgeBg: '#4e3568',
    badgeText: '#ffffff',
  },
  command_action: {
    headerBg: '#805ba5',
    bodyBg: '#684887',
    border: '#4e3568',
    text: '#ffffff',
    accent: '#b18cd6',
    badgeBg: '#4e3568',
    badgeText: '#ffffff',
  },
  command_action_any: {
    headerBg: '#5ba58c',
    bodyBg: '#498671',
    border: '#376454',
    text: '#ffffff',
    accent: '#88cbba',
    badgeBg: '#3a6c5b',
    badgeText: '#ffffff',
  },
  feature: {
    headerBg: '#00838f',
    bodyBg: '#006064',
    border: '#00363a',
    text: '#ffffff',
    accent: '#4dd0e1',
    badgeBg: '#00484b',
    badgeText: '#ffffff',
  },
  feature_ore: {
    headerBg: '#00838f',
    bodyBg: '#006064',
    border: '#00363a',
    text: '#ffffff',
    accent: '#4dd0e1',
    badgeBg: '#00484b',
    badgeText: '#ffffff',
  },
  feature_tree: {
    headerBg: '#2e7d32',
    bodyBg: '#1b5e20',
    border: '#0d3b11',
    text: '#ffffff',
    accent: '#81c784',
    badgeBg: '#144717',
    badgeText: '#ffffff',
  },
  feature_advanced: {
    headerBg: '#6a1b9a',
    bodyBg: '#4a148c',
    border: '#2c0b57',
    text: '#ffffff',
    accent: '#ba68c8',
    badgeBg: '#340d61',
    badgeText: '#ffffff',
  },
  feature_misc: {
    headerBg: '#00796b',
    bodyBg: '#004d40',
    border: '#00251a',
    text: '#ffffff',
    accent: '#80cbc4',
    badgeBg: '#00332a',
    badgeText: '#ffffff',
  },
  feature_blocks: {
    headerBg: '#9fa55b',
    bodyBg: '#878c48',
    border: '#6e7235',
    text: '#ffffff',
    accent: '#d3d68c',
    badgeBg: '#595c2b',
    badgeText: '#ffffff',
  },
  feature_int_provider: {
    headerBg: '#5b67a5',
    bodyBg: '#485387',
    border: '#353c64',
    text: '#ffffff',
    accent: '#8590c4',
    badgeBg: '#39426f',
    badgeText: '#ffffff',
  },
  feature_placement_common: {
    headerBg: '#5ba570',
    bodyBg: '#498a5b',
    border: '#376d45',
    text: '#ffffff',
    accent: '#88cb9b',
    badgeBg: '#2f5b3a',
    badgeText: '#ffffff',
  },
  feature_placement_height: {
    headerBg: '#5b9ea5',
    bodyBg: '#48848a',
    border: '#356a6f',
    text: '#ffffff',
    accent: '#88c2cb',
    badgeBg: '#2d575c',
    badgeText: '#ffffff',
  },
  feature_placement_conditional: {
    headerBg: '#5b7aa5',
    bodyBg: '#48668a',
    border: '#354e6f',
    text: '#ffffff',
    accent: '#88a3cb',
    badgeBg: '#2d415c',
    badgeText: '#ffffff',
  },
  text: {
    headerBg: '#00897b',
    bodyBg: '#00695c',
    border: '#004d40',
    text: '#ffffff',
    accent: '#4db6ac',
    badgeBg: '#004d40',
    badgeText: '#ffffff',
  },
  datetime: {
    headerBg: '#5c6bc0',
    bodyBg: '#3949ab',
    border: '#283593',
    text: '#ffffff',
    accent: '#9fa8da',
    badgeBg: '#1a237e',
    badgeText: '#ffffff',
  },
  player: {
    headerBg: '#00acc1',
    bodyBg: '#00838f',
    border: '#006064',
    text: '#ffffff',
    accent: '#80deea',
    badgeBg: '#004d40',
    badgeText: '#ffffff',
  },
  item: {
    headerBg: '#d32f2f',
    bodyBg: '#c62828',
    border: '#b71c1c',
    text: '#ffffff',
    accent: '#ef9a9a',
    badgeBg: '#8e0000',
    badgeText: '#ffffff',
  },
  block: {
    headerBg: '#795548',
    bodyBg: '#6d4c41',
    border: '#4e342e',
    text: '#ffffff',
    accent: '#bcaaa4',
    badgeBg: '#3e2723',
    badgeText: '#ffffff',
  },
  direction: {
    headerBg: '#935116',
    bodyBg: '#7e4513',
    border: '#572e0a',
    text: '#ffffff',
    accent: '#e59866',
    badgeBg: '#4a2509',
    badgeText: '#ffffff',
  },
  damage: {
    headerBg: '#ad336d',
    bodyBg: '#94275b',
    border: '#6b1840',
    text: '#ffffff',
    accent: '#f472b6',
    badgeBg: '#521130',
    badgeText: '#ffffff',
  },
  projectile: {
    headerBg: '#8a4f9e',
    bodyBg: '#753e87',
    border: '#532661',
    text: '#ffffff',
    accent: '#d8b4fe',
    badgeBg: '#3d1848',
    badgeText: '#ffffff',
  },
  vector: {
    headerBg: '#7058a6',
    bodyBg: '#5d4691',
    border: '#44316e',
    text: '#ffffff',
    accent: '#c4b5fd',
    badgeBg: '#322354',
    badgeText: '#ffffff',
  },
  gui: {
    headerBg: '#488b49',
    bodyBg: '#3c793d',
    border: '#275728',
    text: '#ffffff',
    accent: '#86efac',
    badgeBg: '#1c421d',
    badgeText: '#ffffff',
  },
  advanced: {
    headerBg: '#5250bd',
    bodyBg: '#4240a6',
    border: '#2c2b7a',
    text: '#ffffff',
    accent: '#a5b4fc',
    badgeBg: '#212061',
    badgeText: '#ffffff',
  },
  component: {
    headerBg: '#984a58',
    bodyBg: '#843d4a',
    border: '#5a2630',
    text: '#ffffff',
    accent: '#fca5a5',
    badgeBg: '#3e161e',
    badgeText: '#ffffff',
  },
  code: {
    headerBg: '#7b5ba5',
    bodyBg: '#654887',
    border: '#4b3564',
    text: '#ffffff',
    accent: '#a085c4',
    badgeBg: '#53396f',
    badgeText: '#ffffff',
  },
};

const complexityCache = new WeakMap<BlockASTNode, { count: number; maxDepth: number; textLen: number }>();

function getNodeComplexity(node: BlockASTNode, depth = 0): { count: number; maxDepth: number; textLen: number } {
  if (depth === 0 && complexityCache.has(node)) {
    return complexityCache.get(node)!;
  }
  let count = 1;
  let maxDepth = depth;
  let textLen = (node.title?.length || 0) + (node.fields ? JSON.stringify(node.fields).length : 0);

  if (node.values) {
    count += node.values.length;
    for (const v of node.values) {
      if (v.block) {
        const sub = getNodeComplexity(v.block, depth + 1);
        count += sub.count;
        maxDepth = Math.max(maxDepth, sub.maxDepth);
        textLen += sub.textLen;
      }
    }
  }
  const res = { count, maxDepth, textLen };
  if (depth === 0) {
    complexityCache.set(node, res);
  }
  return res;
}

function shouldUseExternalInputs(node: BlockASTNode, layoutMode: string = 'auto'): boolean {
  if (layoutMode === 'inline') return false;
  if (layoutMode === 'external') return true;
  // Never force math, logic binary/comparison, or common procedural statements into external layout
  if (
    node.type.startsWith('math_') ||
    node.type === 'logic_compare' ||
    node.type === 'logic_binary' ||
    node.type === 'logic_negate' ||
    node.type === 'spawn_particle_multi' ||
    node.type === 'spawn_particle' ||
    node.type === 'play_sound' ||
    node.type.startsWith('entity_add_potion') ||
    node.type === 'entity_despawn'
  ) {
    return false;
  }
  // Auto mode: check values count and depth
  if (!node.values || node.values.length === 0) return false;
  if (node.values.length > 5) return true;
  const complexity = getNodeComplexity(node);
  return complexity.maxDepth >= 3 || complexity.textLen > 60 || complexity.count >= 7;
}

function checkIsNodeSelected(
  node?: BlockASTNode,
  selectedLineNumber?: number | null,
  selectedBlockId?: string | null
): boolean {
  if (!node) return false;
  if (selectedBlockId && node.id === selectedBlockId) return true;
  if (selectedLineNumber && node.sourceLine === selectedLineNumber) return true;
  return false;
}

function hasBlockTypeInAST(node: BlockASTNode, targetType: string): boolean {
  if (node.type === targetType) return true;
  if (node.values) {
    for (const v of node.values) {
      if (v.block && hasBlockTypeInAST(v.block, targetType)) return true;
    }
  }
  if (node.statements) {
    for (const s of node.statements) {
      if (s.block && hasBlockTypeInAST(s.block, targetType)) return true;
    }
  }
  if (node.next && hasBlockTypeInAST(node.next, targetType)) return true;
  return false;
}

interface CanvasErrorBoundaryProps {
  children: React.ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class CanvasErrorBoundary extends React.Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { hasError: true, error: error?.message || 'Failed to render Blockly AST tree' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('VisualBlockCanvas Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-[#2A1816] border border-[#5C2B25] rounded text-amber-200 text-xs font-mono space-y-2">
          <p className="font-bold text-red-400">⚠️ Unable to render visual block layout for this element structure.</p>
          <p className="text-amber-300/80">{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const VisualBlockCanvas: React.FC<VisualBlockCanvasProps> = ({
  ast,
  eventTrigger,
  procedureName,
  selectedLineNumber,
  selectedBlockId,
  onSelectBlock,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'blockly' | 'tree'>('blockly');
  const inputLayoutMode = 'auto';

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  if (!ast) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-[#161920] rounded-lg border border-[#2b303c] text-[#8C857B] font-mono text-xs space-y-3">
        <Layers className="w-10 h-10 text-[#474e5e] stroke-[1.5]" />
        <p className="text-sm font-sans text-[#a8b0c0]">No procedure blocks generated yet.</p>
        <p className="text-[11px] text-[#6e7688]">
          Input your NeoForge Java code on the left and click "Convert Code to Blocks".
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#181a20] rounded-lg border border-[#2d323e] shadow-lg overflow-hidden font-sans text-xs transition-all ${
      isFullscreen ? 'fixed inset-3 z-50 shadow-2xl border-amber-500/50 bg-[#181a20]' : 'h-full'
    }`}>
      {/* MCreator Blockly Top Bar */}
      <div className="bg-[#1e222b] px-3 py-2 border-b border-[#2d323e] flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Procedure Name & Search */}
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#282d39] rounded border border-[#3b4252] text-[#e5e9f0]">
            <Sparkles className="w-3.5 h-3.5 text-[#CEB098]" />
            <span className="font-bold text-xs text-[#FAF6F0]">
              {procedureName || 'ParanoiaAudioLogic'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b4252] text-[#CEB098] font-mono ml-1 border border-[#52463C]">
              {eventTrigger || 'no_ext_trigger'}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#6c768a]" />
            <input
              type="text"
              placeholder="Search procedure blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#14171d] border border-[#2e3440] rounded text-xs text-[#d8dee9] placeholder-[#5c6370] outline-none focus:border-[#434c5e] w-44"
            />
          </div>
        </div>

        {/* Right: View Toggles & Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#14171d] p-0.5 rounded border border-[#2e3440] text-[11px]">
            <button
              onClick={() => setViewMode('blockly')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                viewMode === 'blockly'
                  ? 'bg-[#3b4252] text-[#eceff4] shadow-sm'
                  : 'text-[#7e889b] hover:text-[#d8dee9]'
              }`}
            >
              Blockly Canvas
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-[#3b4252] text-[#eceff4] shadow-sm'
                  : 'text-[#7e889b] hover:text-[#d8dee9]'
              }`}
            >
              AST Inspector
            </button>
          </div>

          {/* Zoom Buttons & Fullscreen */}
          <div className="flex items-center bg-[#14171d] px-1.5 py-0.5 rounded border border-[#2e3440] text-[11px] text-[#7e889b]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
              className="p-0.5 hover:text-[#eceff4] transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] w-8 text-center text-[#d8dee9]">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(180, z + 10))}
              className="p-0.5 hover:text-[#eceff4] transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-0.5 hover:text-[#eceff4] transition ml-1 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-0.5 hover:text-amber-300 transition ml-1.5 cursor-pointer flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Blockly Window"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Workspace Area */}
      <div className="relative flex-1 bg-[#14171d] p-4 overflow-auto min-h-[420px] select-none">
        {/* Subtle Canvas Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#4c566a 1px, transparent 1px)`,
            backgroundSize: `16px 16px`,
          }}
        />

        {/* Scalable Container */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative z-10 space-y-0.5 inline-block min-w-full"
        >
          {viewMode === 'blockly' ? (
            <CanvasErrorBoundary>
              <BlocklyNodeRenderer
                node={ast}
                eventTrigger={eventTrigger}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            </CanvasErrorBoundary>
          ) : (
            <TreeASTInspector
              node={ast}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
        </div>

        {/* Trash Bin Icon in Bottom Right (Classic Blockly Workspace Element) */}
        <div className="absolute bottom-4 right-4 p-2.5 rounded-full bg-[#1e222b] border border-[#2e3440] text-[#6c768a] hover:text-[#e5e9f0] shadow-md transition cursor-pointer">
          <Trash2 className="w-4 h-4" />
        </div>
      </div>

      {/* MCreator Errors / Warnings Notification Strip */}
      {hasBlockTypeInAST(ast, 'entity_nbt_num_set') && (
        <div className="bg-[#12141a] px-3.5 py-1.5 border-t border-[#2d323e] text-[#e06c75] font-mono text-[11px] flex items-center gap-2 select-text">
          <span className="font-bold">errors (1):</span>
          <span>entity_nbt_num_set is not synced between client and server automatically, which means it may not work properly in some cases.</span>
        </div>
      )}

      {/* MCreator Palette Legend Footer */}
      <div className="bg-[#1a1d24] px-3 py-1.5 border-t border-[#2d323e] flex items-center justify-between flex-wrap gap-2 text-[10px] text-[#7e889b]">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[#a0a8b8] flex items-center mr-1 font-semibold">
            <Info className="w-3 h-3 mr-1" /> Category Colors:
          </span>
          {Object.entries(MCREATOR_CATEGORY_THEMES).slice(0, 10).map(([cat, theme]) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded text-white font-medium shadow-xs capitalize text-[10px]"
              style={{ backgroundColor: theme.headerBg }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                 MCreator Blockly Visual Node Component                     */
/* -------------------------------------------------------------------------- */

const getBlockTheme = (node: BlockASTNode) => {
  if (node.type === 'args_start' || node.type === 'command_trigger') {
    return MCREATOR_CATEGORY_THEMES.command_entry;
  }
  if (
    ['literal', 'literal_parameter', 'number_default', 'number_min', 'number_min_max', 'entity', 'blockpos', 'blockstate', 'item', 'logic', 'string', 'message', 'resource_location'].includes(node.type) ||
    node.type.endsWith('_parameter') ||
    node.category === 'command_param'
  ) {
    return MCREATOR_CATEGORY_THEMES.command_param;
  }
  if (node.type === 'call_procedure') {
    return MCREATOR_CATEGORY_THEMES.command_action;
  }
  if (node.type === 'call_procedure_any') {
    return MCREATOR_CATEGORY_THEMES.command_action_any;
  }
  if (node.category === 'feature_ore' || node.type.startsWith('feature_ore') || node.type === 'feature_scattered_ore' || node.type === 'feature_single_block_ore') {
    return MCREATOR_CATEGORY_THEMES.feature_ore || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.category === 'feature_tree' || node.type.startsWith('feature_tree')) {
    return MCREATOR_CATEGORY_THEMES.feature_tree || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (
    node.category === 'feature_advanced' ||
    ['feature_custom_structure', 'feature_root_system', 'feature_vegetation_patch', 'feature_waterlogged_vegetation_patch', 'feature_disk', 'feature_block_column', 'feature_random_selector', 'feature_configured_placement', 'feature_patch'].includes(node.type)
  ) {
    return MCREATOR_CATEGORY_THEMES.feature_advanced || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (
    node.category === 'feature_misc' ||
    ['feature_geode_simple', 'feature_lake', 'feature_delta', 'feature_spring', 'feature_bamboo', 'feature_seagrass', 'feature_coral_claw', 'feature_coral_mushroom', 'feature_coral_tree', 'feature_huge_brown_mushroom', 'feature_huge_red_mushroom', 'feature_huge_fungus', 'feature_forest_rock', 'feature_underwater_magma', 'feature_block_pile', 'feature_patch_simple', 'feature_replace_sphere', 'feature_blob', 'feature_simple_block', 'feature_empty', 'feature_no_op'].includes(node.type)
  ) {
    return MCREATOR_CATEGORY_THEMES.feature_misc || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.category === 'feature_blocks' || node.type.startsWith('blockstate_') || node.type === 'block_tag' || node.type === 'block_list' || node.type === 'ore_target' || node.type === 'disk_rule' || node.type === 'block_column_layer') {
    return MCREATOR_CATEGORY_THEMES.feature_blocks || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.category === 'feature_int_provider' || node.type.startsWith('int_provider_')) {
    return MCREATOR_CATEGORY_THEMES.feature_int_provider || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.category === 'feature_placement_conditional' || node.type.startsWith('placement_condition') || node.type.startsWith('block_predicate_') || node.type.includes('conditional') || node.type.includes('filter')) {
    return MCREATOR_CATEGORY_THEMES.feature_placement_conditional || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.category === 'feature_placement_height' || node.type.includes('height')) {
    return MCREATOR_CATEGORY_THEMES.feature_placement_height || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.category === 'feature_placement_common' || node.type.startsWith('placement_')) {
    return MCREATOR_CATEGORY_THEMES.feature_placement_common || MCREATOR_CATEGORY_THEMES.feature;
  }
  if (node.type.startsWith('feature_')) {
    return MCREATOR_CATEGORY_THEMES.feature_misc || MCREATOR_CATEGORY_THEMES.feature;
  }
  return MCREATOR_CATEGORY_THEMES[node.category] || MCREATOR_CATEGORY_THEMES.feature || MCREATOR_CATEGORY_THEMES.control;
};

const BlocklyNodeRenderer: React.FC<{
  node: BlockASTNode;
  eventTrigger?: string;
  inputLayoutMode?: 'auto' | 'inline' | 'external';
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string, line?: number) => void;
}> = React.memo(({ node, eventTrigger, inputLayoutMode = 'auto', selectedLineNumber, selectedBlockId, onSelectBlock }) => {
  const theme = getBlockTheme(node);
  const isSelected = checkIsNodeSelected(node, selectedLineNumber, selectedBlockId);
  const isExternal = shouldUseExternalInputs(node, inputLayoutMode);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Scroll block into view when selected
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  // 1. Root Event Trigger Block
  if (node.type === 'event_trigger') {
    const triggerLabel = GLOBAL_TRIGGERS[eventTrigger || 'no_ext_trigger'] || 'No additional trigger';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        {/* Banner Shape */}
        <div
          className="rounded-t-md rounded-br-md px-3 py-2 text-white shadow-md border-t border-l border-r flex flex-col gap-1 select-none"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="font-bold text-[11px] tracking-wide flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Event trigger - triggered by external call
            </span>
            {node.sourceLine && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
                L{node.sourceLine}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium pl-1">
            <span className="text-white/90 text-[11px]">or when (global trigger):</span>
            <div
              className="px-2 py-0.5 rounded font-medium text-[11px] flex items-center gap-1 shadow-inner border border-black/20"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
              }}
            >
              <span>{triggerLabel}</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </div>
          </div>
        </div>

        {/* Puzzle Notch Connection Line to Next Statement */}
        <div
          className="w-3 h-1.5 ml-3 -mt-0.5 border-b border-l border-r"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        />

        {/* Connected Statement Flow */}
        {node.next && (
          <div className="pl-0 mt-0">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2. C-Shaped Control Blocks & Statement Containers (controls_if, controls_for, controls_forEach, controls_whileUntil, wait_ticks, aitask_wrapper, etc.)
  if (
    node.type === 'controls_if' ||
    node.type === 'controls_for' ||
    node.type === 'controls_forEach' ||
    node.type === 'controls_whileUntil' ||
    node.type === 'controls_repeat_ext' ||
    node.type === 'wait_ticks' ||
    node.type === 'aitask_wrapper' ||
    (node.statements && node.statements.length > 0)
  ) {
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        {/* C-Block Header Bar */}
        <div
          className="rounded-t-md rounded-tr-md px-2.5 py-1.5 text-white shadow border flex items-center gap-2 flex-wrap min-w-[280px]"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        >
          <button className="p-0.5 rounded hover:bg-black/20 text-white/90" title="Block Settings">
            <Settings className="w-3 h-3" />
          </button>
          {node.type !== 'world_entity_inrange_foreach' && (
            <span className="font-bold text-[11px] tracking-wide">{node.title || node.type}</span>
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
              L{node.sourceLine}
            </span>
          )}

          {/* Fields */}
          {node.fields && Object.keys(node.fields).length > 0 && node.type !== 'world_entity_inrange_foreach' && (
            <div className="flex items-center gap-1">
              {Object.entries(node.fields).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1 bg-black/20 px-1.5 py-0.2 rounded border border-black/20">
                  <span className="text-white/80 font-medium text-[10px]">{k}:</span>
                  <span className="font-bold text-yellow-200 text-[10px]">{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Inline Sockets for Value Inputs */}
          {node.type === 'entity_inventory_foreach' || node.type === 'block_inventory_foreach' ? (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold flex-1">
              <span>
                {node.type === 'block_inventory_foreach'
                  ? 'For each slot of block inventory at'
                  : 'For each slot of inventory of'}
              </span>
              {node.type === 'entity_inventory_foreach' && (
                <div className="bg-black/25 px-1.5 py-0.5 rounded border border-black/30">
                  {node.values?.find(v => v.name === 'entity')?.block ? (
                    <InlineValueBlock
                      node={node.values.find(v => v.name === 'entity')!.block!}
                      selectedLineNumber={selectedLineNumber}
                      selectedBlockId={selectedBlockId}
                      onSelectBlock={onSelectBlock}
                    />
                  ) : (
                    <span className="text-white/80 text-[10px]">Event/target entity</span>
                  )}
                </div>
              )}
              <span>get contents copy as</span>
              <span className="font-mono font-bold bg-cyan-950/60 border border-cyan-400/40 px-2 py-0.5 rounded text-cyan-200 text-[10px]">
                Itemstack iterator
              </span>
            </div>
          ) : node.type === 'controls_if' ? (
            (() => {
              const if0 = node.values?.find(v => v.name === 'IF0');
              return if0?.block ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <InlineValueBlock
                    node={if0.block}
                    inputLayoutMode={inputLayoutMode}
                    selectedLineNumber={selectedLineNumber}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={onSelectBlock}
                  />
                </div>
              ) : null;
            })()
          ) : node.type === 'world_entity_inrange_foreach' ? (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-white flex-1">
              <span>For each entity as</span>
              <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f]">
                Entity iterator
              </div>
              <span>at x:</span>
              <div className="bg-[#5b80a5] text-white px-2 py-0.5 rounded font-mono font-bold shadow-sm border border-[#486683]">
                x
              </div>
              <span>y:</span>
              <div className="bg-[#5b80a5] text-white px-2 py-0.5 rounded font-mono font-bold shadow-sm border border-[#486683]">
                y
              </div>
              <span>z:</span>
              <div className="bg-[#5b80a5] text-white px-2 py-0.5 rounded font-mono font-bold shadow-sm border border-[#486683]">
                z
              </div>
              <span>in square cube with size</span>
              {node.values?.find(v => v.name === 'range')?.block && (
                <InlineValueBlock
                  node={node.values.find(v => v.name === 'range')!.block!}
                  selectedLineNumber={selectedLineNumber}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                />
              )}
            </div>
          ) : node.type === 'wait_ticks' ? (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-white flex-1">
              <span>Run task after</span>
              {node.values?.find(v => v.name === 'ticks')?.block && (
                <InlineValueBlock
                  node={node.values.find(v => v.name === 'ticks')!.block!}
                  selectedLineNumber={selectedLineNumber}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                />
              )}
              <span>ticks on server-side</span>
              <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
            </div>
          ) : (
            node.values && node.values.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap flex-1">
                {node.values.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-black/25 px-1.5 py-0.5 rounded border border-black/30">
                    <span className="text-white/70 text-[9px] font-semibold">{v.name}:</span>
                    {v.block ? (
                      <InlineValueBlock
                        node={v.block}
                        selectedLineNumber={selectedLineNumber}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={onSelectBlock}
                      />
                    ) : (
                      <span className="text-white/40 text-[9px] italic">🧩 &lt;socket&gt;</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Statement Cavities (e.g. DO, DO0, DO1, ELSE, tasks) */}
        {node.statements && node.statements.length > 0 ? (
          node.statements.map((s, idx) => {
            let armLabel = s.name;
            let armSocket: BlockASTNode | undefined = undefined;

            if (node.type === 'controls_if') {
              if (s.name === 'DO0') {
                armLabel = 'do';
              } else if (s.name.startsWith('DO')) {
                const branchIdx = s.name.substring(2);
                armLabel = 'else if';
                armSocket = node.values?.find(v => v.name === `IF${branchIdx}`)?.block;
              } else if (s.name === 'ELSE') {
                armLabel = 'else';
              }
            }

            return (
              <div key={idx} className="flex flex-col w-full">
                {/* Arm Divider / Header for else-if and else branches */}
                {node.type === 'controls_if' && s.name !== 'DO0' && (
                  <div
                    className="flex items-center gap-2 px-2.5 py-1 border-t border-b text-[11px] font-bold text-white/95 select-none shadow-sm"
                    style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
                  >
                    <span>{armLabel}</span>
                    {armSocket && (
                      <InlineValueBlock
                        node={armSocket}
                        selectedLineNumber={selectedLineNumber}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={onSelectBlock}
                      />
                    )}
                  </div>
                )}

                <div className="flex items-stretch w-full">
                  {/* Vertical Arm Spine */}
                  <div
                    className="w-6 flex flex-col items-center justify-start py-1 font-bold text-[10px] text-white/90 border-l border-r shadow-inner select-none shrink-0"
                    style={{
                      backgroundColor: theme.bodyBg,
                      borderColor: theme.border,
                    }}
                  >
                    {node.type === 'controls_if' ? 'do' : s.name}
                  </div>

                  {/* Indented Statement Cavity */}
                  <div className="flex-1 p-0.5 min-h-[32px] my-0.5">
                    {s.block ? (
                      <BlocklyNodeRenderer
                        node={s.block}
                        selectedLineNumber={selectedLineNumber}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={onSelectBlock}
                      />
                    ) : (
                      <span className="text-white/40 text-[10px] italic p-0.5">🧩 &lt;empty cavity&gt;</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-stretch w-full">
            <div
              className="w-6 flex flex-col items-center justify-start py-1 font-bold text-[10px] text-white/90 border-l border-r shadow-inner shrink-0"
              style={{ backgroundColor: theme.bodyBg, borderColor: theme.border }}
            >
              do
            </div>
            <div className="flex-1 p-0.5 min-h-[32px] my-0.5">
              <span className="text-white/40 text-[10px] italic p-0.5">🧩 &lt;statement body&gt;</span>
            </div>
          </div>
        )}

        {/* C-Block Bottom Bar */}
        <div
          className="w-full h-2 rounded-b-md border-b border-l border-r shadow-sm"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        />

        {/* Connect to Next Statement Block */}
        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.5 Specialized Variable Setter Block (Set {type} [Local/Global: var] to: [val])
  if (node.type.startsWith('variables_set_')) {
    const valBlock = node.values?.find(v => v.name === 'VAL')?.block;
    const entityBlock = node.values?.find(v => v.name === 'entity')?.block;
    const typeLabel = node.type.replace('variables_set_', '');
    const isGlobal = (node.fields?.VAR || '').startsWith('global:');
    const varName = (node.fields?.VAR || '').replace(/^(local:|global:)/, '') || 'var';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[240px]"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        >
          <span className="font-bold text-[11px]">Set {typeLabel}</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {isGlobal ? 'Global: ' : 'Local: '}{varName} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <span className="font-bold text-[11px]">to:</span>
          {valBlock ? (
            <InlineValueBlock
              node={valBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <span className="text-white/40 text-[9px] italic">🧩 &lt;value&gt;</span>
          )}
          {isGlobal && (
            <>
              <span className="font-bold text-[11px] ml-1">for entity:</span>
              {entityBlock ? (
                <InlineValueBlock
                  node={entityBlock}
                  selectedLineNumber={selectedLineNumber}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                />
              ) : (
                <span className="bg-[#4682B4] text-white text-[10px] font-medium px-2 py-0.5 rounded">
                  Event/target entity
                </span>
              )}
            </>
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6 Specialized Inventory Set Slot Block
  if (node.type === 'entity_set_slot' || node.type === 'block_set_slot') {
    const amountBlock = node.values?.find(v => v.name === 'amount')?.block;
    const itemBlock = node.values?.find(v => v.name === 'item')?.block;
    const slotBlock = node.values?.find(v => v.name === 'slot')?.block;
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const isBlock = node.type === 'block_set_slot';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        >
          <span className="font-bold text-[11px]">Set</span>
          {amountBlock && <InlineValueBlock node={amountBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">in slot</span>
          {slotBlock && <InlineValueBlock node={slotBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">of</span>
          {isBlock ? (
            <span className="font-bold text-[11px]">block inventory</span>
          ) : entBlock ? (
            <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <span className="text-white/70 text-[11px]">Event/target entity</span>
          )}
          <span className="font-bold text-[11px]">if it has inventory</span>
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // Clear all potion effects of entity (entity_clearpotions)
  if (node.type === 'entity_clearpotions') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 text-[11px] font-bold shrink-0 flex-nowrap"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span>Clear all potion effects of</span>
          {entBlock ? (
            <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
              Event/target entity
            </div>
          )}
        </div>
        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer node={node.next} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          </div>
        )}
      </div>
    );
  }

  // Remove specific potion effect from entity (entity_remove_specific_potion_effect)
  if (node.type === 'entity_remove_specific_potion_effect') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const potion = node.fields?.potion || 'REGENERATION';
    return (
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 text-[11px] font-bold shrink-0 flex-nowrap"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span>Remove specific potion effect</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {potion} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <span>from</span>
          {entBlock ? (
            <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
              Event/target entity
            </div>
          )}
        </div>
        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer node={node.next} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          </div>
        )}
      </div>
    );
  }

  // 2.7.5 DEAL DAMAGE (Deal [amount] damage to [entity] from source [damagesource])
  if (node.type === 'deal_damage') {
    const amtBlock = node.values?.find(v => v.name === 'amount')?.block;
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const dsBlock = node.values?.find(v => v.name === 'damagesource')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 text-[11px] font-bold shrink-0 flex-nowrap"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span>Deal</span>
          {amtBlock && (
            <InlineValueBlock node={amtBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          )}
          <span>damage to</span>
          {entBlock ? (
            <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
              Event/target entity
            </div>
          )}
          <span>from source</span>
          {dsBlock && (
            <InlineValueBlock node={dsBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          )}
        </div>
        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer node={node.next} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          </div>
        )}
      </div>
    );
  }

  // Set entity on fire: entity_set_on_fire
  if (node.type === 'entity_set_on_fire') {
    const secBlock = node.values?.find(v => v.name === 'seconds')?.block;
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 text-[11px] font-bold shrink-0 flex-nowrap"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span>Set</span>
          {entBlock ? (
            <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
              Event/target entity
            </span>
          )}
          <span>on fire for</span>
          {secBlock && (
            <InlineValueBlock node={secBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          )}
          <span>seconds</span>
        </div>
        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer node={node.next} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          </div>
        )}
      </div>
    );
  }

  // Set team friendly fire: team_set_friendlyfire
  if (node.type === 'team_set_friendlyfire') {
    const nameBlock = node.values?.find(v => v.name === 'name')?.block;
    const condBlock = node.values?.find(v => v.name === 'condition')?.block;
    return (
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 text-[11px] font-bold shrink-0 flex-nowrap"
          style={{ backgroundColor: '#b58f3d', borderColor: '#87692b' }}
        >
          <span>Set friendly fire for team with name</span>
          {nameBlock && (
            <InlineValueBlock node={nameBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          )}
          <span>to</span>
          {condBlock && (
            <InlineValueBlock node={condBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          )}
        </div>
        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer node={node.next} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          </div>
        )}
      </div>
    );
  }

  // 2.7.4 MOVE ENTITY (Set location of [entity] to x: [x] y: [y] z: [z])
  if (node.type === 'move_entity') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const yBlock = node.values?.find(v => v.name === 'y')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 text-[11px] font-bold shrink-0 flex-nowrap"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span>Set location of</span>
          {entBlock ? (
            <InlineValueBlock
              node={entBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
              Event/target entity
            </div>
          )}
          <span>to x:</span>
          {xBlock && (
            <InlineValueBlock
              node={xBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span>y:</span>
          {yBlock && (
            <InlineValueBlock
              node={yBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span>z:</span>
          {zBlock && (
            <InlineValueBlock
              node={zBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.7.5 NBT Set & Remove Operations (Entity, Block, Item, and CompoundTag)
  if (
    node.type.includes('_nbt_') ||
    node.type.startsWith('custom_nbt_') ||
    node.type.startsWith('entity_nbt_') ||
    node.type.startsWith('block_nbt_') ||
    node.type.startsWith('item_nbt_')
  ) {
    const isRemove = node.type.includes('_remove') || node.type.includes('_rm');
    const isCopy = node.type === 'item_nbt_copy';
    const isCustomCompoundSet = node.type === 'custom_nbt_compound_set';
    const tagVal = node.values?.find(v => v.name === 'tagValue' || v.name === 'value')?.block;
    const tagName = node.values?.find(v => v.name === 'tagName' || v.name === 'tag')?.block;
    const entityBlock = node.values?.find(v => v.name === 'entity')?.block;
    const itemBlock = node.values?.find(v => v.name === 'item' || v.name === 'itemstack')?.block;
    const fromItemBlock = node.values?.find(v => v.name === 'fromItem')?.block;
    const toItemBlock = node.values?.find(v => v.name === 'toItem')?.block;
    const tagHolderBlock = node.values?.find(v => v.name === 'tag')?.block;
    const childTagBlock = node.values?.find(v => v.name === 'childTag')?.block;
    const xVal = node.values?.find(v => v.name === 'x')?.block;
    const yVal = node.values?.find(v => v.name === 'y')?.block;
    const zVal = node.values?.find(v => v.name === 'z')?.block;

    const isBlockNbt = node.type.startsWith('block_nbt_');
    const isItemNbt = node.type.startsWith('item_nbt_');
    const isCustomNbt = node.type.startsWith('custom_nbt_');
    const typeLabel = node.type.includes('_num_') ? 'Number' : node.type.includes('_logic_') ? 'Logic' : node.type.includes('_text_') ? 'Text' : 'Tag';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          {isCopy ? (
            <>
              <span className="font-bold text-[11px]">Copy NBT tags from</span>
              {fromItemBlock ? (
                <InlineValueBlock node={fromItemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              ) : (
                <span className="text-white/70 text-[10px]">ItemStack</span>
              )}
              <span className="font-bold text-[11px]">to</span>
              {toItemBlock ? (
                <InlineValueBlock node={toItemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              ) : (
                <span className="text-white/70 text-[10px]">ItemStack</span>
              )}
            </>
          ) : isRemove ? (
            <>
              <span className="font-bold text-[11px]">Remove</span>
              <span className="font-semibold text-[10px] bg-red-950/70 border border-red-500/40 text-red-200 px-1.5 py-0.2 rounded">NBT tag</span>
              {tagName && <InlineValueBlock node={tagName} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">from</span>
              {isBlockNbt ? (
                <span className="flex items-center gap-1">
                  <span>block at x:</span>{xVal && <InlineValueBlock node={xVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                  <span>y:</span>{yVal && <InlineValueBlock node={yVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                  <span>z:</span>{zVal && <InlineValueBlock node={zVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                </span>
              ) : isItemNbt ? (
                itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>
              ) : isCustomNbt ? (
                tagHolderBlock ? <InlineValueBlock node={tagHolderBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">CompoundTag</span>
              ) : (
                entityBlock ? <InlineValueBlock node={entityBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">Event/target entity</span>
              )}
            </>
          ) : isCustomCompoundSet ? (
            <>
              <span className="font-bold text-[11px]">Set CompoundTag NBT tag</span>
              {tagName && <InlineValueBlock node={tagName} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">of</span>
              {tagHolderBlock ? <InlineValueBlock node={tagHolderBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">CompoundTag</span>}
              <span className="font-bold text-[11px]">to:</span>
              {childTagBlock && <InlineValueBlock node={childTagBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type.startsWith('entity_nbt_') ? (
            <>
              <span className="font-bold text-[11px]">Set</span>
              {entityBlock ? (
                <InlineValueBlock node={entityBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              ) : (
                <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
                  Event/target entity
                </div>
              )}
              <span className="font-bold text-[11px]">custom {typeLabel.toLowerCase()} NBT tag</span>
              {tagName && <InlineValueBlock node={tagName} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">to</span>
              {tagVal && <InlineValueBlock node={tagVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : (
            <>
              <span className="font-bold text-[11px]">Set</span>
              <span className="font-semibold text-[10px] bg-indigo-950/70 border border-indigo-400/40 text-indigo-200 px-1.5 py-0.2 rounded">
                {isBlockNbt ? 'Block' : isItemNbt ? 'Item' : isCustomNbt ? 'Custom' : 'Entity'} NBT {typeLabel}
              </span>
              <span className="font-bold text-[11px]">tag:</span>
              {tagName && <InlineValueBlock node={tagName} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">of</span>
              {isBlockNbt ? (
                <span className="flex items-center gap-1">
                  <span>block at x:</span>{xVal && <InlineValueBlock node={xVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                  <span>y:</span>{yVal && <InlineValueBlock node={yVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                  <span>z:</span>{zVal && <InlineValueBlock node={zVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                </span>
              ) : isItemNbt ? (
                itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>
              ) : isCustomNbt ? (
                tagHolderBlock ? <InlineValueBlock node={tagHolderBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">CompoundTag</span>
              ) : (
                entityBlock ? <InlineValueBlock node={entityBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">Event/target entity</span>
              )}
              <span className="font-bold text-[11px]">to:</span>
              {tagVal && <InlineValueBlock node={tagVal} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          )}

          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.7.6 ITEM PROCEDURES & STACK MANIPULATIONS
  if (
    node.type.startsWith('item_') ||
    node.type.startsWith('itemstack_') ||
    node.type.startsWith('entity_set_mainhand_item') ||
    node.type.startsWith('entity_set_offhand_item') ||
    node.type.startsWith('entity_set_armor_slot_item') ||
    node.type.startsWith('entity_add_item')
  ) {
    const itemBlock = node.values?.find(v => v.name === 'item' || v.name === 'itemstack')?.block;
    const amountBlock = node.values?.find(v => v.name === 'amount' || v.name === 'count')?.block;
    const nameBlock = node.values?.find(v => v.name === 'name')?.block;
    const enchBlock = node.values?.find(v => v.name === 'enhancement')?.block;
    const lvlBlock = node.values?.find(v => v.name === 'level')?.block;
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const ticksBlock = node.values?.find(v => v.name === 'ticks')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          {node.type === 'itemstack_shrink' ? (
            <>
              <span className="font-bold text-[11px]">Shrink</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
              <span className="font-bold text-[11px]">by</span>
              {amountBlock && <InlineValueBlock node={amountBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type === 'itemstack_grow' ? (
            <>
              <span className="font-bold text-[11px]">Grow</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
              <span className="font-bold text-[11px]">by</span>
              {amountBlock && <InlineValueBlock node={amountBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type === 'item_set_count' ? (
            <>
              <span className="font-bold text-[11px]">Set count of</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
              <span className="font-bold text-[11px]">to</span>
              {amountBlock && <InlineValueBlock node={amountBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type === 'item_set_damage' ? (
            <>
              <span className="font-bold text-[11px]">Set damage of</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
              <span className="font-bold text-[11px]">to</span>
              {amountBlock && <InlineValueBlock node={amountBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type === 'item_damage' ? (
            <>
              <span className="font-bold text-[11px]">Deal</span>
              {amountBlock && <InlineValueBlock node={amountBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">damage to</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
            </>
          ) : node.type === 'item_set_display_name' ? (
            <>
              <span className="font-bold text-[11px]">Set display name of</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
              <span className="font-bold text-[11px]">to</span>
              {nameBlock && <InlineValueBlock node={nameBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type === 'item_reset_display_name' ? (
            <>
              <span className="font-bold text-[11px]">Reset display name of</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
            </>
          ) : node.type === 'item_add_enhancement' ? (
            <>
              <span className="font-bold text-[11px]">Enchant</span>
              {itemBlock ? <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">itemstack</span>}
              <span className="font-bold text-[11px]">with</span>
              {enchBlock && <InlineValueBlock node={enchBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">level</span>
              {lvlBlock && <InlineValueBlock node={lvlBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          ) : node.type === 'entity_set_mainhand_item' ? (
            <>
              <span className="font-bold text-[11px]">Set</span>
              {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">in main hand of</span>
              {entBlock ? <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">Event/target entity</span>}
            </>
          ) : node.type === 'entity_set_offhand_item' ? (
            <>
              <span className="font-bold text-[11px]">Set</span>
              {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">in off hand of</span>
              {entBlock ? <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">Event/target entity</span>}
            </>
          ) : node.type === 'entity_add_item' ? (
            <>
              <span className="font-bold text-[11px]">Add</span>
              {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">to inventory of</span>
              {entBlock ? <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">Event/target entity</span>}
            </>
          ) : node.type === 'item_cooldown_for' ? (
            <>
              <span className="font-bold text-[11px]">Set</span>
              {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">cooldown for</span>
              {ticksBlock && <InlineValueBlock node={ticksBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span className="font-bold text-[11px]">ticks for</span>
              {entBlock ? <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/70 text-[10px]">Event/target entity</span>}
            </>
          ) : (
            <>
              <span className="font-bold text-[11px]">{node.title || node.type}</span>
              {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </>
          )}

          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.5 Entity Data Parameter Set, Potion, Attribute Blocks
  if (
    node.type === 'entity_data_logic_set' ||
    node.type === 'entity_data_integer_set' ||
    node.type === 'entity_data_string_set' ||
    node.type === 'entity_add_potion_advanced' ||
    node.type === 'entity_set_attribute'
  ) {
    const isEntityData = node.type.startsWith('entity_data_');
    const isPotion = node.type === 'entity_add_potion_advanced';
    const isAttr = node.type === 'entity_set_attribute';
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          {isEntityData ? (
            <>
              <span className="font-bold text-[11px]">For custom entity</span>
              {entBlock ? (
                <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              ) : (
                <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
                  Event/target entity
                </div>
              )}
              <span className="font-bold text-[11px]">of type</span>
              <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
                {node.fields?.customEntity?.replace('CUSTOM:', '') || 'CustomEntity'} <ChevronDown className="w-3 h-3 opacity-70" />
              </span>
              <span className="font-bold text-[11px]">set {node.type.includes('_logic_') ? 'logic' : node.type.includes('_string_') ? 'string' : 'integer'} data parameter</span>
              <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
                {node.fields?.accessor || 'param'} <ChevronDown className="w-3 h-3 opacity-70" />
              </span>
              <span className="font-bold text-[11px]">value to</span>
              {node.values?.find(v => v.name === 'value')?.block && (
                <InlineValueBlock node={node.values.find(v => v.name === 'value')!.block!} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              )}
            </>
          ) : isPotion ? (
            <>
              <span className="font-bold text-[11px]">Add potion</span>
              <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
                {node.fields?.potion || 'Regeneration'} <ChevronDown className="w-3 h-3 opacity-70" />
              </span>
              <span className="font-bold text-[11px]">with amplifier</span>
              {node.values?.find(v => v.name === 'level')?.block && (
                <InlineValueBlock node={node.values.find(v => v.name === 'level')!.block!} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              )}
              <span className="font-bold text-[11px]">for</span>
              {node.values?.find(v => v.name === 'duration')?.block && (
                <InlineValueBlock node={node.values.find(v => v.name === 'duration')!.block!} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              )}
              <span className="font-bold text-[11px]">ticks ambient</span>
              {node.values?.find(v => v.name === 'ambient')?.block && (
                <InlineValueBlock node={node.values.find(v => v.name === 'ambient')!.block!} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              )}
              <span className="font-bold text-[11px]">particles</span>
              {node.values?.find(v => v.name === 'particles')?.block && (
                <InlineValueBlock node={node.values.find(v => v.name === 'particles')!.block!} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              )}
              <span className="font-bold text-[11px]">to</span>
              {entBlock ? (
                <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              ) : (
                <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
                  Event/target entity
                </div>
              )}
            </>
          ) : isAttr ? (
            <>
              <span className="font-bold text-[11px]">Set the base value of attribute</span>
              <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
                {node.explanation?.replace(/^Set attribute /, '').replace(/ base value to.*$/, '') || node.title?.replace(/^Set attribute /, '') || 'Water movement efficiency'} <ChevronDown className="w-3 h-3 opacity-70" />
              </span>
              <span className="font-bold text-[11px]">to</span>
              {node.values?.find(v => v.name === 'value')?.block && (
                <InlineValueBlock node={node.values.find(v => v.name === 'value')!.block!} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              )}
              <span className="font-bold text-[11px]">for entity</span>
              {entBlock ? (
                <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
              ) : (
                <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
                  Event/target entity
                </div>
              )}
            </>
          ) : null}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.5.5 ENTITY SEND CHAT: Send message [text] to [entity] show in action bar: [actbar]
  if (node.type === 'entity_send_chat') {
    const textBlock = node.values?.find(v => v.name === 'text')?.block;
    const actbarBlock = node.values?.find(v => v.name === 'actbar')?.block;
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const isActTrue = actbarBlock?.fields?.BOOL === 'TRUE' || actbarBlock?.title === 'TRUE';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[320px]"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span className="font-bold text-[11px]">Send message</span>
          {textBlock && (
            <InlineValueBlock
              node={textBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">to</span>
          {entBlock ? (
            <InlineValueBlock
              node={entBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Event/target entity
            </div>
          )}
          <span className="font-bold text-[11px]">show in action bar:</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {isActTrue ? 'true' : 'false'} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.5.6 ENTITY SWITCH DIMENSION: Switch dimension of [entity] to [dimension]
  if (node.type === 'entity_switch_dimension') {
    const rawDim = node.fields?.dimension || 'CUSTOM:TheGrain';
    const dimDisplay = rawDim.replace(/^CUSTOM:/, '');
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{ backgroundColor: '#00acc1', borderColor: '#00838f' }}
        >
          <span className="font-bold text-[11px]">Switch dimension of</span>
          {entBlock ? (
            <InlineValueBlock
              node={entBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Event/target entity
            </div>
          )}
          <span className="font-bold text-[11px]">to</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {dimDisplay} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.5.7 ENTITY NBT SETTERS: Set [entity] custom {number/logic/text} NBT tag [tagName] to [tagValue]
  if (
    node.type === 'entity_nbt_num_set' ||
    node.type === 'entity_nbt_logic_set' ||
    node.type === 'entity_nbt_text_set'
  ) {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const tagBlock = node.values?.find(v => v.name === 'tagName')?.block;
    const valBlock = node.values?.find(v => v.name === 'tagValue' || v.name === 'value')?.block;
    const typeLabel = node.type.includes('_num_') ? 'number' : node.type.includes('_logic_') ? 'logic' : 'text';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[320px]"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span className="font-bold text-[11px]">Set</span>
          {entBlock ? (
            <InlineValueBlock
              node={entBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Event/target entity
            </div>
          )}
          <span className="font-bold text-[11px]">custom {typeLabel} NBT tag</span>
          {tagBlock && (
            <InlineValueBlock
              node={tagBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">to</span>
          {valBlock && (
            <InlineValueBlock
              node={valBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.6 ENTITY DESPAWN: Despawn [ Event/target entity ]
  if (node.type === 'entity_despawn') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[200px]"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <span className="font-bold text-[11px]">Despawn</span>
          {entBlock ? (
            <InlineValueBlock
              node={entBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Event/target entity
            </div>
          )}
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.7 SPAWN PARTICLE MULTI
  if (node.type === 'spawn_particle_multi') {
    const countBlock = node.values?.find(v => v.name === 'count')?.block;
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const yBlock = node.values?.find(v => v.name === 'y')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;
    const dxBlock = node.values?.find(v => v.name === 'dx')?.block;
    const dyBlock = node.values?.find(v => v.name === 'dy')?.block;
    const dzBlock = node.values?.find(v => v.name === 'dz')?.block;
    const speedBlock = node.values?.find(v => v.name === 'speed')?.block;
    const particleType = node.fields?.particle || 'Campfire Cosy Smoke';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[320px]"
          style={{ backgroundColor: '#a58c5b', borderColor: '#877248' }}
        >
          <span className="font-bold text-[11px]">Spawn</span>
          {countBlock && (
            <InlineValueBlock
              node={countBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">server-side particles at x:</span>
          {xBlock && (
            <InlineValueBlock
              node={xBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">y:</span>
          {yBlock && (
            <InlineValueBlock
              node={yBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">z:</span>
          {zBlock && (
            <InlineValueBlock
              node={zBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">in area dx:</span>
          {dxBlock && (
            <InlineValueBlock
              node={dxBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">dy:</span>
          {dyBlock && (
            <InlineValueBlock
              node={dyBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">dz:</span>
          {dzBlock && (
            <InlineValueBlock
              node={dzBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">with speed</span>
          {speedBlock && (
            <InlineValueBlock
              node={speedBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">type:</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {particleType}
          </span>
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.7.5 PLAY SOUND
  if (node.type === 'play_sound') {
    const rawSound = node.fields?.sound || 'sound';
    const soundDisplay = rawSound.replace(/^CUSTOM:/, '').replace(/^["']|["']$/g, '');
    const category = (node.fields?.soundcategory || 'ambient').replace(/^["']|["']$/g, '');
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const yBlock = node.values?.find(v => v.name === 'y')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;
    const levelBlock = node.values?.find(v => v.name === 'level')?.block;
    const pitchBlock = node.values?.find(v => v.name === 'pitch')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[320px]"
          style={{ backgroundColor: '#a58c5b', borderColor: '#877248' }}
        >
          <span className="font-bold text-[11px]">Play sound</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {soundDisplay}
          </span>
          <span className="font-bold text-[11px]">at x:</span>
          {xBlock && (
            <InlineValueBlock
              node={xBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">y:</span>
          {yBlock && (
            <InlineValueBlock
              node={yBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">z:</span>
          {zBlock && (
            <InlineValueBlock
              node={zBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">level:</span>
          {levelBlock && (
            <InlineValueBlock
              node={levelBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">pitch:</span>
          {pitchBlock && (
            <InlineValueBlock
              node={pitchBlock}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          <span className="font-bold text-[11px]">category:</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {category} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.8 SPAWN ENTITY (with rotation & velocity)
  if (node.type === 'spawn_entity_with_rotation_velocity' || node.type === 'spawn_entity') {
    const cleanEntName = node.fields?.entity?.replace('CUSTOM:', '') || 'CustomEntity';
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const yBlock = node.values?.find(v => v.name === 'y')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;
    const yawBlock = node.values?.find(v => v.name === 'yaw')?.block;
    const pitchBlock = node.values?.find(v => v.name === 'pitch')?.block;
    const vxBlock = node.values?.find(v => v.name === 'vx')?.block;
    const vyBlock = node.values?.find(v => v.name === 'vy')?.block;
    const vzBlock = node.values?.find(v => v.name === 'vz')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[320px]"
          style={{ backgroundColor: '#a58c5b', borderColor: '#877248' }}
        >
          <span className="font-bold text-[11px]">Spawn entity:</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {cleanEntName} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <span className="font-bold text-[11px]">at x:</span>
          {xBlock && <InlineValueBlock node={xBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">y:</span>
          {yBlock && <InlineValueBlock node={yBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">z:</span>
          {zBlock && <InlineValueBlock node={zBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">with yaw:</span>
          {yawBlock && <InlineValueBlock node={yawBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">pitch:</span>
          {pitchBlock && <InlineValueBlock node={pitchBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">vx:</span>
          {vxBlock && <InlineValueBlock node={vxBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">vy:</span>
          {vyBlock && <InlineValueBlock node={vyBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">vz:</span>
          {vzBlock && <InlineValueBlock node={vzBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.6.9 SPAWN DROPPED ITEM (spawn_gem)
  if (node.type === 'spawn_gem') {
    const itemBlock = node.values?.find(v => v.name === 'block')?.block;
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const yBlock = node.values?.find(v => v.name === 'y')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;
    const delayBlock = node.values?.find(v => v.name === 'pickUpDelay')?.block;
    const isDespawn = node.fields?.despawn !== 'FALSE';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[320px]"
          style={{ backgroundColor: '#a58c5b', borderColor: '#877248' }}
        >
          <span className="font-bold text-[11px]">Spawn dropped item</span>
          {itemBlock && <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">at x:</span>
          {xBlock && <InlineValueBlock node={xBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">y:</span>
          {yBlock && <InlineValueBlock node={yBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">z:</span>
          {zBlock && <InlineValueBlock node={zBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">pickup delay:</span>
          {delayBlock && <InlineValueBlock node={delayBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">despawn:</span>
          <span className="bg-[#14171d]/60 border border-white/20 text-white font-mono text-[11px] px-1.5 py-0.2 rounded">
            {isDespawn ? '✓' : '✗'}
          </span>
          <FileText className="w-3.5 h-3.5 ml-auto text-white/80" />
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.7 Call Procedure Block
  if (node.type === 'call_procedure') {
    const procName = node.fields?.procedure || 'procedure';
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex flex-col gap-1.5 min-w-[280px]"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between gap-1.5 border-b border-white/20 pb-0.5">
            <span className="font-bold text-[11px] flex items-center gap-1.5">
              <span>⚡</span> Call procedure: <span className="font-mono text-yellow-200">{procName}</span>
            </span>
            {node.sourceLine && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
                L{node.sourceLine}
              </span>
            )}
          </div>
          {node.values && node.values.length > 0 && (
            <div className="flex flex-col gap-1 pl-1">
              <span className="text-[10px] text-white/80 font-medium">with dependencies:</span>
              <div className="flex flex-wrap gap-1 items-center">
                {node.values.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded border border-black/20">
                    <span className="text-white/70 text-[10px]">{v.name}:</span>
                    {v.block && (
                      <InlineValueBlock
                        node={v.block}
                        selectedLineNumber={selectedLineNumber}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={onSelectBlock}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.8 Statement Custom Code Snippet
  if (node.type === 'custom_code_snippet' && !node.isSnippetValue) {
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded-md px-3 py-2 text-white shadow border flex items-start gap-2.5 min-w-[340px]"
          style={{ backgroundColor: '#7b5ba5', borderColor: '#654887' }}
        >
          <div className="font-bold text-[11px] whitespace-nowrap pt-1">
            Custom code snippet:
          </div>
          <div className="flex-1 bg-[#37244f] border border-[#261738] rounded p-2 font-mono text-[11px] text-white whitespace-pre-wrap leading-relaxed shadow-inner">
            {node.fields?.CODE || '/* verbatim java statement */'}
          </div>
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.8.4 Action Log Block
  if (node.type === 'action_log') {
    const level = node.fields?.level || 'info';
    const msgBlock = node.values?.find(v => v.name === 'message')?.block;
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{ backgroundColor: '#00897b', borderColor: '#004d40' }}
        >
          <span className="font-bold text-[11px]">Log message with level</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {level} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <span className="font-bold text-[11px]">:</span>
          {msgBlock && (
            <InlineValueBlock
              node={msgBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.8.4.5 Text Print Statement Block ("print [text]")
  if (node.type === 'text_print') {
    const textVal = node.values?.find(v => v.name === 'TEXT')?.block;
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[180px]"
          style={{ backgroundColor: '#00897b', borderColor: '#004d40' }}
        >
          <span className="font-bold text-[11px]">print</span>
          {textVal && (
            <InlineValueBlock
              node={textVal}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.8.4.6 Flow Statement Block ("break out ▾ of loop")
  if (node.type === 'controls_flow_statements') {
    const flowOp = node.fields?.FLOW || 'BREAK';
    const flowText = flowOp === 'BREAK' ? 'break out' : 'continue with next iteration';
    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[180px]"
          style={{ backgroundColor: '#689f38', borderColor: '#558b2f' }}
        >
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {flowText} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
          <span className="font-bold text-[11px]">of loop</span>
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.8.5 ENTITY ADD EXHAUSTION (Increase exhaustion of [entity] by [amount])
  if (node.type === 'entity_add_exhaustion') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const amtBlock = node.values?.find(v => v.name === 'amount')?.block;

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[260px]"
          style={{
            backgroundColor: '#5ba58c',
            borderColor: '#498671',
          }}
        >
          <span className="font-bold text-[11px] whitespace-nowrap">Increase exhaustion of</span>
          {entBlock ? (
            <InlineValueBlock
              node={entBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10.5px]">
              Event/target entity
            </div>
          )}
          <span className="font-bold text-[11px] whitespace-nowrap">by</span>
          {amtBlock && (
            <InlineValueBlock
              node={amtBlock}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.8.5.5 Player & GUI & World Action Statement Blocks
  if (
    node.type === 'entity_remove_xp' ||
    node.type === 'entity_set_food_level' ||
    node.type === 'entity_set_food_saturation' ||
    node.type === 'entity_set_gamemode' ||
    node.type === 'entity_close_gui' ||
    node.type === 'entity_open_gui' ||
    node.type === 'entity_clear_inventory' ||
    node.type === 'entity_remove_item' ||
    node.type === 'entity_add_recipe' ||
    node.type === 'entity_remove_recipe' ||
    node.type.startsWith('gui_set_') ||
    node.type.startsWith('gui_clear_') ||
    node.type.startsWith('gui_deal_') ||
    node.type.startsWith('gui_remove_') ||
    node.type === 'place_portal' ||
    node.type === 'place_feature' ||
    node.type === 'world_send_chat' ||
    node.type === 'world_set_weather' ||
    node.type === 'spawn_falling_block' ||
    node.type === 'trigger_game_event' ||
    node.type === 'apply_bonemeal' ||
    node.type.startsWith('shoot_projectile') ||
    node.type.startsWith('spawn_potion') ||
    node.type.startsWith('spawn_arrow') ||
    node.type.startsWith('spawn_fireball') ||
    node.type.startsWith('spawn_throwable')
  ) {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const valBlock = node.values?.find(v => v.name === 'value' || v.name === 'amount' || v.name === 'xp' || v.name === 'level')?.block;
    const itemBlock = node.values?.find(v => v.name === 'item' || v.name === 'itemstack' || v.name === 'block')?.block;
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const yBlock = node.values?.find(v => v.name === 'y')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;
    const slotBlock = node.values?.find(v => v.name === 'slot')?.block;

    let themeBg = '#00acc1';
    let themeBorder = '#00838f';
    if (node.type.startsWith('gui_')) { themeBg = '#488b49'; themeBorder = '#275728'; }
    else if (node.type.includes('place_') || node.type.includes('world_') || node.type.includes('spawn_') || node.type.includes('trigger_') || node.type.includes('apply_')) { themeBg = '#a58c5b'; themeBorder = '#645435'; }
    else if (node.type.startsWith('shoot_') || node.type.startsWith('spawn_arrow') || node.type.startsWith('spawn_potion') || node.type.startsWith('spawn_fireball') || node.type.startsWith('spawn_throwable')) { themeBg = '#8a4f9e'; themeBorder = '#532661'; }

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all"
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[280px]"
          style={{ backgroundColor: themeBg, borderColor: themeBorder }}
        >
          <span className="font-bold text-[11px]">{node.title || node.explanation || node.type.replace(/_/g, ' ')}</span>
          {node.fields && Object.entries(node.fields).map(([k, v]) => (
            <span key={k} className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 shadow-xs">
              {String(v)} <ChevronDown className="w-3 h-3 opacity-70" />
            </span>
          ))}
          {valBlock && <InlineValueBlock node={valBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          {slotBlock && (
            <>
              <span className="font-bold text-[11px]">in slot</span>
              <InlineValueBlock node={slotBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
            </>
          )}
          {(xBlock || yBlock || zBlock) && (
            <span className="flex items-center gap-1 text-[11px] font-bold">
              <span>at x:</span>{xBlock && <InlineValueBlock node={xBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span>y:</span>{yBlock && <InlineValueBlock node={yBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              <span>z:</span>{zBlock && <InlineValueBlock node={zBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            </span>
          )}
          {entBlock ? (
            <InlineValueBlock node={entBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Event/target entity
            </span>
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 2.9 Return statement blocks: return_logic, return_number, return_string, return_itemstack, etc.
  if (node.type.startsWith('return_')) {
    const returnVal = node.values?.find(v => v.name === 'return' || v.name === 'value')?.block;
    const returnTheme = MCREATOR_CATEGORY_THEMES.control;
    const label = node.title || (
      node.type === 'return_logic' ? 'Return logic:' :
      node.type === 'return_number' ? 'Return number:' :
      node.type === 'return_string' ? 'Return text:' :
      node.type === 'return_itemstack' ? 'Return itemstack:' :
      node.type === 'return_blockstate' ? 'Return blockstate:' :
      'Return:'
    );

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? '' : ''
        }`}
      >
        <div
          className="rounded px-2.5 py-1 text-white blockly-3d-bevel flex items-center gap-1.5 flex-wrap min-w-[220px]"
          style={{
            backgroundColor: returnTheme.headerBg,
            borderColor: returnTheme.border,
          }}
        >
          <span className="font-bold text-[11px] whitespace-nowrap">{label}</span>
          {returnVal ? (
            <InlineValueBlock
              node={returnVal}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          ) : (
            <span className="text-white/40 text-[9px] italic">🧩 &lt;return value&gt;</span>
          )}
          {node.sourceLine && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
              L{node.sourceLine}
            </span>
          )}
        </div>

        {node.next && (
          <div className="mt-0.5">
            <BlocklyNodeRenderer
              node={node.next}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        )}
      </div>
    );
  }

  // 3. Compact Multi-Row Action Block (e.g. Set variable, NBT put, Play sound, Add potion)
  return (
    <div
      ref={nodeRef}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
        isSelected ? '' : ''
      }`}
    >
      <div
        className="rounded-md px-2.5 py-1.5 text-white blockly-3d-bevel flex flex-col gap-1 min-w-[260px]"
        style={{
          backgroundColor: theme.headerBg,
          borderColor: theme.border,
        }}
      >
        {/* Title / Action Name */}
        <div className="flex items-center justify-between gap-1.5 border-b border-white/20 pb-0.5">
          <span className="font-bold text-[11px] tracking-wide flex items-center gap-1">
            {node.title || node.type}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 text-white/90 font-mono">
              {node.category}
            </span>
            {node.sourceLine && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
                L{node.sourceLine}
              </span>
            )}
          </div>
        </div>

        {/* Stacked Parameter Fields */}
        {node.fields && Object.keys(node.fields).length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            {Object.entries(node.fields).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/20">
                <span className="text-white/90 font-medium text-[10px]">{k}:</span>
                <span className="font-bold text-white text-[10px] break-all">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sockets for Sub-Values - External (Stacked Rows) vs Inline */}
        {node.values && node.values.length > 0 && (
          isExternal ? (
            <div className="flex flex-col gap-1 w-full pt-1 border-t border-white/20">
              {node.values.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 px-2 py-0.5 rounded border border-white/20 w-full">
                  <span className="text-white/90 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    {v.name}:
                  </span>
                  <div className="flex-1 flex justify-end">
                    {v.block ? (
                      <InlineValueBlock
                        node={v.block}
                        inputLayoutMode={inputLayoutMode}
                        selectedLineNumber={selectedLineNumber}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={onSelectBlock}
                      />
                    ) : (
                      <span className="text-white/40 text-[9px] italic">🧩 &lt;socket&gt;</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
              {node.values.map((v, idx) => (
                <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/20">
                  <span className="text-white/90 text-[9px] font-semibold">{v.name}:</span>
                  {v.block ? (
                    <InlineValueBlock
                      node={v.block}
                      inputLayoutMode={inputLayoutMode}
                      selectedLineNumber={selectedLineNumber}
                      selectedBlockId={selectedBlockId}
                      onSelectBlock={onSelectBlock}
                    />
                  ) : (
                    <span className="text-white/40 text-[9px] italic">🧩 &lt;value&gt;</span>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {node.next && (
        <div className="mt-0.5">
          <BlocklyNodeRenderer
            node={node.next}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                  Inline Expression & Getter Pill Renderers                 */
/* -------------------------------------------------------------------------- */

const InlineValueBlock: React.FC<{
  node: BlockASTNode;
  inputLayoutMode?: 'auto' | 'inline' | 'external';
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string, line?: number) => void;
}> = React.memo(({ node, inputLayoutMode = 'auto', selectedLineNumber, selectedBlockId, onSelectBlock }) => {
  const theme = getBlockTheme(node);
  const isSelected = checkIsNodeSelected(node, selectedLineNumber, selectedBlockId);
  const isExternal = shouldUseExternalInputs(node, inputLayoutMode);

  // Logic Boolean Literal (`true` / `false`)
  if (node.type === 'logic_boolean') {
    const isTrue = node.fields?.BOOL === 'TRUE';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-xs border cursor-pointer shrink-0 ${
          isTrue ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-red-950/80 border-red-500/50 text-red-300'
        } ${isSelected ? '' : ''}`}
      >
        {isTrue ? 'TRUE' : 'FALSE'}
      </div>
    );
  }

  // Math Number Literal: [ 0 ]
  if (node.type === 'math_number') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2.5 py-0.5 rounded-full font-sans font-bold text-[11px] text-white shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        {node.fields?.NUM ?? node.title ?? '0'}
      </div>
    );
  }

  // Text Literal: “ text ”
  if (node.type === 'text') {
    const textVal = node.fields?.TEXT ?? (node.title ? node.title.replace(/^"|"$/g, '') : '');
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded font-mono font-medium text-[11px] text-white shadow-xs flex items-center gap-1 cursor-pointer shrink-0 border ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5ba55b', borderColor: '#4d8c4d' }}
      >
        <span className="text-white/80 select-none text-[13px] font-sans">“</span>
        <span>{textVal}</span>
        <span className="text-white/80 select-none text-[13px] font-sans">”</span>
      </div>
    );
  }

  // Variables Getter: Get {type} [Local/Global: var ▾] (for entity: [entity])
  if (node.type.startsWith('variables_get_')) {
    const rawVar = node.fields?.VAR || node.title || 'var';
    const isGlobal = rawVar.startsWith('global:');
    const varName = rawVar.replace(/^(?:local|global):/, '');
    const typeLabel = node.type.replace('variables_get_', '');
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#a55b80', borderColor: '#874867' }}
      >
        <span className="font-medium text-[10.5px] text-white/95">Get {typeLabel}</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-1.5 py-0.2 rounded text-[10.5px] flex items-center gap-1 shadow-xs">
          {isGlobal ? `Global: ${varName}` : `Local: ${varName}`} <ChevronDown className="w-2.5 h-2.5 opacity-70" />
        </span>
        {isGlobal && (
          <>
            <span className="font-medium text-[10.5px] text-white/95">for entity:</span>
            {entBlock ? (
              <InlineValueBlock
                node={entBlock}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            ) : (
              <div className="bg-[#5ba58c] text-white px-1.5 py-0.2 rounded shadow-sm font-semibold border border-[#48836f] text-[10px]">
                Event/target entity
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Entity Is Tagged In: Is [entity] tagged in entity tags as [ “tag” ]
  if (node.type === 'entity_is_tagged_in') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const tagBlock = node.values?.find(v => v.name === 'tag')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        <span className="font-bold text-[11px]">Is</span>
        {entBlock ? (
          <InlineValueBlock
            node={entBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ) : (
          <div className="bg-[#5ba58c] text-white px-1.5 py-0.2 rounded shadow-sm font-semibold border border-black/20 text-[10.5px]">
            Event/target entity
          </div>
        )}
        <span className="font-bold text-[11px]">tagged in entity tags as</span>
        {tagBlock && (
          <InlineValueBlock
            node={tagBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Entity Check Creative Mode: Has [ Event/target entity ] creative mode ability enabled
  if (node.type === 'entity_iscreative') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        <span className="font-bold text-[11px]">Has</span>
        {entBlock ? (
          <InlineValueBlock
            node={entBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ) : (
          <div className="bg-[#5ba58c] text-white px-1.5 py-0.2 rounded shadow-sm font-semibold border border-black/20 text-[10.5px]">
            Event/target entity
          </div>
        )}
        <span className="font-bold text-[11px]">creative mode ability enabled</span>
      </div>
    );
  }

  // Text Join: create text with [ ADD0 ] [ ADD1 ] ...
  if (node.type === 'text_join') {
    const addValues = node.values?.filter(v => v.name.startsWith('ADD')) || [];
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#00897b', borderColor: '#004d40' }}
      >
        <span className="font-bold text-[10.5px] text-teal-100 flex items-center gap-1">
          <Settings className="w-3 h-3 text-teal-200" /> create text with
        </span>
        {addValues.map((v, idx) => (
          v.block && (
            <InlineValueBlock
              key={idx}
              node={v.block}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          )
        ))}
      </div>
    );
  }

  // Math Constant: Random [0,1), PI, E, etc.
  if (node.type === 'math_java_constants' || (node.type === 'math_dual_ops' && (node.fields?.OP === 'RANDOM' || node.title?.includes('Random')))) {
    const constLabel = node.fields?.CONSTANT === 'PI' ? 'π' : node.fields?.CONSTANT === 'E' ? 'e' : 'Random [0,1)';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {constLabel} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
      </div>
    );
  }

  // Math Random Integer Between: Random integer between min: [min] and max: [max] included
  if (node.type === 'math_random_int_between') {
    const minBlock = node.values?.find(v => v.name === 'min')?.block;
    const maxBlock = node.values?.find(v => v.name === 'max')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        <span className="font-bold text-[11px]">Random integer between min:</span>
        {minBlock && (
          <InlineValueBlock
            node={minBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold text-[11px]">and max:</span>
        {maxBlock && (
          <InlineValueBlock
            node={maxBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold text-[11px]">included</span>
      </div>
    );
  }

  // Math Random Number Between: Random number between min: [min] and max: [max]
  if (node.type === 'math_random_number_between') {
    const minBlock = node.values?.find(v => v.name === 'min')?.block;
    const maxBlock = node.values?.find(v => v.name === 'max')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        <span className="font-bold text-[11px]">Random number between min:</span>
        {minBlock && (
          <InlineValueBlock
            node={minBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold text-[11px]">and max:</span>
        {maxBlock && (
          <InlineValueBlock
            node={maxBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Math Clamp: [value] clamped between min: [min] and max: [max]
  if (node.type === 'math_clamp') {
    const valBlock = node.values?.find(v => v.name === 'value')?.block;
    const minBlock = node.values?.find(v => v.name === 'min')?.block;
    const maxBlock = node.values?.find(v => v.name === 'max')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        {valBlock && (
          <InlineValueBlock
            node={valBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold text-[11px]">clamped between min:</span>
        {minBlock && (
          <InlineValueBlock
            node={minBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold text-[11px]">and max:</span>
        {maxBlock && (
          <InlineValueBlock
            node={maxBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Math Singular Ops: sin, cos, tan, abs, sqrt, round, etc.
  if (node.type === 'math_singular_ops') {
    const op = node.fields?.OP || 'SIN';
    const numBlock = node.values?.find(v => v.name === 'NUM')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {op.toLowerCase()} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        {numBlock && (
          <InlineValueBlock
            node={numBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // World Data Check Difficulty: Is difficulty in the provided world [ HARD ▾ ]
  if (node.type === 'world_data_checkdifficulty') {
    const diff = node.fields?.difficulty || 'HARD';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        <span className="font-bold text-[11px]">Is difficulty in the provided world</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {diff} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
      </div>
    );
  }

  // Potion Effect Level: Get effect amplifier of potion [potion ▾] for [entity] if active
  if (node.type === 'entity_potioneffectlevel') {
    const potion = node.fields?.potion || 'DARKNESS';
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        <span className="font-bold text-[11px]">Get effect amplifier of potion</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {potion} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">for</span>
        {entBlock ? (
          <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#498671] text-[10.5px]">
            Event/target entity
          </span>
        )}
        <span className="font-bold text-[11px]">if active</span>
      </div>
    );
  }

  // Potion Effect Remaining: Get remaining ticks of potion [potion ▾] for [entity]
  if (node.type === 'entity_potioneffectremaining') {
    const potion = node.fields?.potion || 'DARKNESS';
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        <span className="font-bold text-[11px]">Get remaining ticks of potion</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {potion} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">for</span>
        {entBlock ? (
          <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#498671] text-[10.5px]">
            Event/target entity
          </span>
        )}
      </div>
    );
  }

  // Has Active Potion: Has [entity] active potion [potion ▾]
  if (node.type === 'entity_haspotioneffect') {
    const potion = node.fields?.potion || 'DARKNESS';
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        <span className="font-bold text-[11px]">Has</span>
        {entBlock ? (
          <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#498671] text-[10.5px]">
            Event/target entity
          </span>
        )}
        <span className="font-bold text-[11px]">active potion</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {potion} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
      </div>
    );
  }

  // Get Potion Item: Get [type ▾] of [potion ▾] as item
  if (node.type === 'item_get_potion') {
    const pType = node.fields?.type || 'POTION';
    const typeLabel = pType === 'SPLASH_POTION' ? 'Splash potion' : pType === 'LINGERING_POTION' ? 'Lingering potion' : 'Potion';
    const potion = node.fields?.potion || 'AWKWARD';
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#a55b6d', borderColor: '#874857' }}
      >
        <span className="font-bold text-[11px]">Get</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {typeLabel} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">of</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {potion} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">as item</span>
      </div>
    );
  }

  // Potion Projectile: [potionType ▾] potion of [potion ▾] with acceleration ax: [ax] ay: [ay] az: [az] shooter: [shooter]
  if (node.type === 'projectiles_potion') {
    const pType = node.fields?.potionType || 'SPLASH_POTION';
    const typeLabel = pType === 'LINGERING_POTION' ? 'Lingering' : 'Splash';
    const potion = node.fields?.potion || 'AWKWARD';
    const ax = node.values?.find(v => v.name === 'ax')?.block;
    const ay = node.values?.find(v => v.name === 'ay')?.block;
    const az = node.values?.find(v => v.name === 'az')?.block;
    const shooter = node.values?.find(v => v.name === 'shooter')?.block;

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap"
        style={{ backgroundColor: '#a55b9a', borderColor: '#87487d' }}
      >
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {typeLabel} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">potion of</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {potion} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">with acceleration ax:</span>
        {ax && <InlineValueBlock node={ax} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-[11px]">ay:</span>
        {ay && <InlineValueBlock node={ay} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-[11px]">az:</span>
        {az && <InlineValueBlock node={az} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-[11px]">shooter:</span>
        {shooter && <InlineValueBlock node={shooter} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Damage Source from type: Damage source of type: [ Thorns ▾ ]
  if (node.type === 'damagesource_from_type') {
    const rawType = node.fields?.damagetype || 'thorns';
    const cleanType = rawType.replace(/^CUSTOM:/, '').replace(/^DamageTypes\./, '');
    const formatted = cleanType.charAt(0).toUpperCase() + cleanType.slice(1).toLowerCase();

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#b53d75', borderColor: '#872b53' }}
      >
        <span className="font-bold text-[11px]">Damage source of type:</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {formatted}
        </span>
      </div>
    );
  }

  // Water blocks: isinwater, isinwater_orbubblecolumn, isinwaterrain_orbubblecolumn, is_underwater, block_is_waterloggable
  if (
    node.type === 'entity_isinwater' ||
    node.type === 'entity_isinwater_orbubblecolumn' ||
    node.type === 'entity_isinwaterrain_orbubblecolumn' ||
    node.type === 'entity_is_underwater' ||
    node.type === 'block_is_waterloggable'
  ) {
    const isBlock = node.type === 'block_is_waterloggable';
    const label = node.type === 'entity_isinwater' ? 'Is in water'
      : node.type === 'entity_isinwater_orbubblecolumn' ? 'Is in water or bubble column'
      : node.type === 'entity_isinwaterrain_orbubblecolumn' ? 'Is in water, rain, or bubble column'
      : node.type === 'entity_is_underwater' ? 'Is underwater'
      : 'Is waterloggable';
    const targetBlock = node.values?.find(v => v.name === 'entity' || v.name === 'block')?.block;

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: isBlock ? '#b58f3d' : '#5b80a5', borderColor: isBlock ? '#87692b' : '#486887' }}
      >
        <span className="font-bold text-[11px]">{label}</span>
        {targetBlock ? (
          <InlineValueBlock node={targetBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#498671] text-[10.5px]">
            {isBlock ? 'Block' : 'Event/target entity'}
          </span>
        )}
      </div>
    );
  }

  // Fire & Team Scoreboard blocks
  if (
    node.type === 'entity_get_fire_ticks' ||
    node.type === 'entity_isimmunetofire' ||
    node.type === 'team_get_friendlyfire'
  ) {
    const label = node.type === 'entity_get_fire_ticks' ? 'Get remaining ticks on fire of'
      : node.type === 'entity_isimmunetofire' ? 'Is immune to fire'
      : 'Is friendly fire for team with name enabled';
    const targetBlock = node.values?.find(v => v.name === 'entity' || v.name === 'name')?.block;
    const isWorld = node.type === 'team_get_friendlyfire';

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: isWorld ? '#b58f3d' : '#5b80a5', borderColor: isWorld ? '#87692b' : '#486887' }}
      >
        <span className="font-bold text-[11px]">{label}</span>
        {targetBlock ? (
          <InlineValueBlock node={targetBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#498671] text-[10.5px]">
            {isWorld ? 'team_name' : 'Event/target entity'}
          </span>
        )}
      </div>
    );
  }

  // World Data Height At: Get [ World surface ▾ ] height at x: [ x ] z: [ z ]
  if (node.type === 'world_data_heightat') {
    const rawType = node.fields?.heightmapType || 'MOTION_BLOCKING_NO_LEAVES';
    const label = rawType.includes('OCEAN') ? 'Ocean floor' : rawType.includes('WG') ? 'World surface (world gen)' : 'World surface';
    const xBlock = node.values?.find(v => v.name === 'x')?.block;
    const zBlock = node.values?.find(v => v.name === 'z')?.block;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        <span className="font-bold text-[11px]">Get</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          {label} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
        <span className="font-bold text-[11px]">height at x:</span>
        {xBlock && (
          <InlineValueBlock
            node={xBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold text-[11px]">z:</span>
        {zBlock && (
          <InlineValueBlock
            node={zBlock}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Entity Dependencies: Event/target entity
  if (node.type === 'entity_from_deps') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        Event/target entity
      </div>
    );
  }

  // Entity Dependencies: Source entity
  if (node.type === 'source_entity_from_deps') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        Source entity
      </div>
    );
  }

  // Entity Dependencies: Immediate source entity
  if (node.type === 'immediate_source_entity_from_deps') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        Immediate source entity
      </div>
    );
  }


  // Entity Tick Count: Get number of ticks [entity] has existed for
  if (node.type === 'entity_get_tickcount') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        <span className="font-semibold text-white/95 text-[10.5px]">Get number of ticks</span>
        {entBlock ? (
          <InlineValueBlock
            node={entBlock}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ) : (
          <div className="bg-[#5ba58c] text-white px-1.5 py-0.2 rounded text-[10px]">Event/target entity</div>
        )}
        <span className="font-semibold text-white/95 text-[10.5px]">has existed for</span>
      </div>
    );
  }

  // Entity coordinate positions (X position of [entity], Y position of [entity], Z position of [entity])
  if (node.type === 'entity_pos_x' || node.type === 'entity_pos_y' || node.type === 'entity_pos_z') {
    const axis = node.type === 'entity_pos_x' ? 'X' : node.type === 'entity_pos_y' ? 'Y' : 'Z';
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5b67a5', borderColor: '#485285' }}
      >
        <span className="font-semibold text-white/95 text-[10.5px]">{axis} position of</span>
        {entBlock ? (
          <InlineValueBlock
            node={entBlock}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ) : (
          <span className="bg-[#5ba58c] text-white px-1.5 py-0.2 rounded text-[10px]">Event/target entity</span>
        )}
      </div>
    );
  }
  // World Entity In Range Exists block renderer
  if (node.type === 'world_entity_inrange_exists') {
    const entName = (node.fields?.entity || 'Entity').replace(/^CUSTOM:/, '');
    const xVal = node.values?.find(v => v.name === 'x')?.block;
    const yVal = node.values?.find(v => v.name === 'y')?.block;
    const zVal = node.values?.find(v => v.name === 'z')?.block;
    const rangeVal = node.values?.find(v => v.name === 'range')?.block;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#4a6b82', borderColor: '#354f61' }}
      >
        <span className="font-semibold text-white/95 text-[10.5px]">Does entity exist at x:</span>
        {xVal && <InlineValueBlock node={xVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-semibold text-white/95 text-[10.5px]">y:</span>
        {yVal && <InlineValueBlock node={yVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-semibold text-white/95 text-[10.5px]">z:</span>
        {zVal && <InlineValueBlock node={zVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-semibold text-white/95 text-[10.5px]">in square cube with size</span>
        {rangeVal && <InlineValueBlock node={rangeVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-semibold text-white/95 text-[10.5px]">of type</span>
        <span className="font-bold text-white text-[10.5px] bg-black/40 px-1.5 py-0.5 rounded border border-white/20">{entName}</span>
      </div>
    );
  }

  // World Data Is Air block renderer
  if (node.type === 'world_data_isair') {
    const xVal = node.values?.find(v => v.name === 'x')?.block;
    const yVal = node.values?.find(v => v.name === 'y')?.block;
    const zVal = node.values?.find(v => v.name === 'z')?.block;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#4a6b82', borderColor: '#354f61' }}
      >
        <span className="font-semibold text-white/95 text-[10.5px]">Is air at x:</span>
        {xVal && <InlineValueBlock node={xVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-semibold text-white/95 text-[10.5px]">y:</span>
        {yVal && <InlineValueBlock node={yVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-semibold text-white/95 text-[10.5px]">z:</span>
        {zVal && <InlineValueBlock node={zVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Dimension ID block: entity_dimension_id
  if (node.type === 'entity_dimension_id') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? '' : ''}`}
        style={{ backgroundColor: '#3d6b8c', borderColor: '#2e5570' }}
      >
        <span className="font-semibold text-[10px]">ID of dimension</span>
        {entBlock && <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Dimension type block: get_dimensionid
  if (node.type === 'get_dimensionid') {
    const dimName = (node.fields?.dimension || node.title || 'Dimension').replace(/^CUSTOM:/, '');
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? '' : ''}`}
        style={{ backgroundColor: '#2a5c40', borderColor: '#1d4330' }}
      >
        <span className="font-semibold text-[10px]">Dimension type:</span>
        <span className="font-bold text-emerald-200 text-[10px] bg-black/30 px-1 rounded">{dimName}</span>
      </div>
    );
  }

  // Dimension comparison block: compare_dimensionids
  if (node.type === 'compare_dimensionids') {
    const aBlock = node.values?.find(v => v.name === 'a')?.block;
    const bBlock = node.values?.find(v => v.name === 'b')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer flex-wrap ${isSelected ? '' : ''}`}
        style={{ backgroundColor: '#2d4a35', borderColor: '#1e3524' }}
      >
        {aBlock && <InlineValueBlock node={aBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-emerald-300 text-[10px] bg-black/30 px-1 rounded">is in</span>
        <span className="font-bold text-emerald-300 text-[10px]">=</span>
        {bBlock && <InlineValueBlock node={bBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Entity check game mode: entity_checkgamemode
  if (node.type === 'entity_checkgamemode') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const mode = node.fields?.gamemode || 'SPECTATOR';
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? '' : ''}`}
        style={{ backgroundColor: '#3d6b8c', borderColor: '#2e5570' }}
      >
        <span className="font-semibold text-[10.5px]">Is</span>
        {entBlock ? (
          <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10px]">
            Event/target entity
          </div>
        )}
        <span className="font-semibold text-[10.5px]">in game mode</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 shadow-xs">
          {mode} <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
      </div>
    );
  }

  // Entity has item in inventory: entity_has_item_inventory
  if (node.type === 'entity_has_item_inventory') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const itemBlock = node.values?.find(v => v.name === 'item')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? '' : ''}`}
        style={{ backgroundColor: '#3d6b8c', borderColor: '#2e5570' }}
      >
        <span className="font-semibold text-[10.5px]">Has</span>
        {entBlock ? (
          <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        ) : (
          <div className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#48836f] text-[10px]">
            Event/target entity
          </div>
        )}
        <span className="font-semibold text-[10.5px]">in inventory</span>
        {itemBlock && (
          <InlineValueBlock node={itemBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
        )}
      </div>
    );
  }

  // Entity food level block: entity_foodlevel / entity_get_food_level
  if (node.type === 'entity_foodlevel' || node.type === 'entity_get_food_level') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? '' : ''}`}
        style={{ backgroundColor: '#7c4b1a', borderColor: '#5c3612' }}
      >
        <span className="font-semibold text-[10px]">Get food level of</span>
        {entBlock && <InlineValueBlock node={entBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Entity Iterator: Entity iterator
  if (node.type === 'entity_iterator') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        Entity iterator
      </div>
    );
  }

  // Coordinate getters: x, y, z
  if (node.type === 'coord_x' || node.type === 'coord_y' || node.type === 'coord_z') {
    const coord = node.type === 'coord_x' ? 'x' : node.type === 'coord_y' ? 'y' : 'z';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-mono font-bold text-[11px] shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
      >
        {coord}
      </div>
    );
  }

  // MCItem All Block: [📦 Obsidian]
  if (node.type === 'mcitem_all') {
    const itemName = node.title || node.fields?.value || 'Item';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-950/70 border border-emerald-400/50 text-emerald-200 shadow-xs flex items-center gap-1 cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
      >
        <span>📦</span>
        <span>{itemName}</span>
      </div>
    );
  }

  // Itemstack Iterator Block
  if (node.type === 'itemstack_iterator') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-950/70 border border-cyan-400/50 text-cyan-200 shadow-xs cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
      >
        Itemstack iterator
      </div>
    );
  }

  // Expression Custom Code Snippet (Output Tab variant - can be plugged into ANY socket: entity, logic, text, math, damage, item, etc.)
  if (node.type === 'custom_code_snippet' || node.type === 'custom_code_snippet_output' || node.isSnippetValue) {
    const rawVal = node.fields?.CODE || node.title;
    const displayVal = !rawVal || rawVal === '(null)' ? '(null)' : rawVal;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 transition-all ${
          isSelected ? ' scale-[1.02]' : 'hover:brightness-110'
        }`}
        style={{ backgroundColor: '#7b5ba5', borderColor: '#654887' }}
        title="Custom code snippet (Expression/Value)"
      >
        <span className="font-semibold text-white/95 text-[10.5px] whitespace-nowrap">Custom code snippet:</span>
        <span className="bg-[#4d326f] border border-[#3b2358] px-1.5 py-0.2 rounded text-[10.5px] text-white font-mono font-medium shadow-inner max-w-[360px] truncate">
          {displayVal}
        </span>
      </div>
    );
  }

  // Entity Null ("No entity")
  if (node.type === 'entity_null') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans font-bold text-[11px] shadow-xs border cursor-pointer shrink-0 flex items-center gap-1 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        <span className="text-[9px] px-1 py-0.2 bg-black/40 text-emerald-200 font-mono rounded">NULL</span>
        <span>No entity</span>
      </div>
    );
  }

  // Is Mod Loaded ("Is the mod with ID [ "forge" ] loaded")
  if (node.type === 'is_mod_loaded') {
    const modIdBlock = node.values?.find(v => v.name === 'modid')?.block;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
      >
        <span className="font-bold text-[11px]">Is the mod with ID</span>
        {modIdBlock ? (
          <InlineValueBlock
            node={modIdBlock}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ) : (
          <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded">
            "forge"
          </span>
        )}
        <span className="font-bold text-[11px]">loaded</span>
      </div>
    );
  }

  // Date and Time Category Blocks (time_seconds, time_minutes, time_hours, etc.)
  if (node.type.startsWith('time_')) {
    const timeLabels: Record<string, string> = {
      time_seconds: 'Seconds',
      time_minutes: 'Minutes',
      time_hours: 'Hours (0-23)',
      time_day_of_week: 'Day of week (1-7)',
      time_week_of_year: 'Week of year',
      time_day_of_month: 'Day of month (1-31)',
      time_month: 'Month (1-12)',
      time_year: 'Year',
      time_format_default: 'Default date format',
      time_format: 'Formatted date',
    };
    const label = timeLabels[node.type] || node.title || 'Date & Time';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0 flex items-center gap-1 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5c6bc0', borderColor: '#3949ab' }}
      >
        <span>📅 {label}</span>
      </div>
    );
  }

  // Procedure Return Value Blocks ("Call procedure and get ... return value")
  if (node.type.startsWith('procedure_retval_')) {
    const procName = node.fields?.procedure || node.title || 'No entry selected';
    const returnType = node.type.replace('procedure_retval_', '');
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
      >
        <span className="font-bold text-[11px]">Call procedure and get {returnType} return value</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] shadow-xs">
          {procName}
        </span>
      </div>
    );
  }

  // Custom Dependency Blocks ("... dependency dependencyName")
  if (node.type.startsWith('custom_dependency_')) {
    const depType = node.type.replace('custom_dependency_', '').replace(/_/g, ' ');
    const depName = node.fields?.dependencyName || node.title || 'dependencyName';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
      >
        <span className="font-semibold text-[10.5px] capitalize">{depType} dependency</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] shadow-xs">
          {depName}
        </span>
      </div>
    );
  }

  // MCreator Link Category Blocks
  if (node.type.startsWith('mcreator_link_')) {
    const title = node.title || node.type.replace('mcreator_link_', '').replace(/_/g, ' ');
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0 flex items-center gap-1 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#689f38', borderColor: '#558b2f' }}
      >
        <span>🔌 {title}</span>
      </div>
    );
  }

  // Vectors Category Blocks
  if (node.type.startsWith('vector_')) {
    const vTheme = { headerBg: '#7058a6', border: '#5d4691' };
    const xVal = node.values?.find(v => v.name === 'x')?.block;
    const yVal = node.values?.find(v => v.name === 'y')?.block;
    const zVal = node.values?.find(v => v.name === 'z')?.block;
    const vecVal = node.values?.find(v => v.name === 'vector' || v.name === 'vec' || v.name === 'a')?.block;
    const vecValB = node.values?.find(v => v.name === 'b')?.block;
    const factorVal = node.values?.find(v => v.name === 'by' || v.name === 'factor')?.block;

    if (node.type === 'vector_create') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: vTheme.headerBg, borderColor: vTheme.border }}
        >
          <span className="font-bold text-[11px]">Make vector with x:</span>
          {xVal && <InlineValueBlock node={xVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">y:</span>
          {yVal && <InlineValueBlock node={yVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">z:</span>
          {zVal && <InlineValueBlock node={zVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'vector_distance') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: vTheme.headerBg, borderColor: vTheme.border }}
        >
          <span className="font-bold text-[11px]">Get distance between</span>
          {vecVal && <InlineValueBlock node={vecVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">and</span>
          {vecValB && <InlineValueBlock node={vecValB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'vector_scale') {
      const op = node.fields?.type || 'Multiplication';
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: vTheme.headerBg, borderColor: vTheme.border }}
        >
          <span className="font-bold text-[11px]">Scale vector</span>
          {vecVal && <InlineValueBlock node={vecVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">by</span>
          {factorVal && <InlineValueBlock node={factorVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">through</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {op} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
        </div>
      );
    }

    if (node.type === 'vector_dimension_get_x' || node.type === 'vector_dimension_get_y' || node.type === 'vector_dimension_get_z') {
      const component = node.type.endsWith('_x') ? 'X' : node.type.endsWith('_y') ? 'Y' : 'Z';
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: vTheme.headerBg, borderColor: vTheme.border }}
        >
          <span className="font-bold text-[11px]">{component} component of</span>
          {vecVal && <InlineValueBlock node={vecVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    const vLabels: Record<string, string> = {
      vector_length: 'Get length of vector',
      vector_normalize: 'Normalized vector of',
    };
    const vLabel = vLabels[node.type] || node.title || 'Vector';

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: vTheme.headerBg, borderColor: vTheme.border }}
      >
        <span className="font-bold text-[11px]">{vLabel}</span>
        {vecVal && <InlineValueBlock node={vecVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Text Operations Category Blocks
  if (
    node.type === 'text_length' ||
    node.type === 'text_newline' ||
    node.type === 'text_indexof' ||
    node.type === 'text_is_empty' ||
    node.type === 'text_replace' ||
    node.type === 'text_regex_replace' ||
    node.type === 'text_substring'
  ) {
    const tTheme = { headerBg: '#00897b', border: '#004d40' };
    const valA = node.values?.find(v => v.name === 'VALUE' || v.name === 'text' || v.name === 'target')?.block;
    const valB = node.values?.find(v => v.name === 'FIND' || v.name === 'with' || v.name === 'from')?.block;
    const valC = node.values?.find(v => v.name === 'IN' || v.name === 'on')?.block;
    const posVal = node.values?.find(v => v.name === 'start' || v.name === 'position')?.block;

    if (node.type === 'text_newline') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans font-bold text-[11px] shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: tTheme.headerBg, borderColor: tTheme.border }}
        >
          New line
        </div>
      );
    }

    if (node.type === 'text_indexof') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
        >
          <span className="font-bold text-[11px]">Index of:</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">in:</span>
          {valC && <InlineValueBlock node={valC} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">start looking from:</span>
          {posVal && <InlineValueBlock node={posVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'text_is_empty') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
        >
          <span className="font-bold text-[11px]">Is text empty:</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'text_replace') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: tTheme.headerBg, borderColor: tTheme.border }}
        >
          <span className="font-bold text-[11px]">Replace:</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">with:</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">on:</span>
          {valC && <InlineValueBlock node={valC} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'text_regex_replace') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: tTheme.headerBg, borderColor: tTheme.border }}
        >
          <span className="font-bold text-[11px]">Replace all matches of regex:</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">with:</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">on:</span>
          {valC && <InlineValueBlock node={valC} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'text_substring') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: tTheme.headerBg, borderColor: tTheme.border }}
        >
          <span className="font-bold text-[11px]">Substring:</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">from position:</span>
          {posVal && <InlineValueBlock node={posVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: tTheme.headerBg, borderColor: tTheme.border }}
      >
        <span className="font-bold text-[11px]">length of</span>
        {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Math Number from Text & Math Lerp
  if (node.type === 'math_from_text' || node.type === 'math_lerp') {
    const mTheme = { headerBg: '#5b67a5', border: '#485387' };
    const textVal = node.values?.find(v => v.name === 'NUM' || v.name === 'text')?.block;

    if (node.type === 'math_from_text') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
        >
          <span className="font-bold text-[11px]">Number from text</span>
          {textVal && <InlineValueBlock node={textVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    const tVal = node.values?.find(v => v.name === 't')?.block;
    const aVal = node.values?.find(v => v.name === 'a')?.block;
    const bVal = node.values?.find(v => v.name === 'b')?.block;

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: '#5250bd', borderColor: '#4240a6' }}
      >
        <span className="font-bold text-[11px]">Linear interpolation at:</span>
        {tVal && <InlineValueBlock node={tVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-[11px]">between (at 0):</span>
        {aVal && <InlineValueBlock node={aVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-[11px]">and (at 1):</span>
        {bVal && <InlineValueBlock node={bVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Logic Negate & Ternary & Specific Comparisons
  if (
    node.type === 'logic_negate' ||
    node.type === 'logic_ternary' ||
    node.type === 'logic_advancement_check' ||
    node.type === 'logic_vector_cmp' ||
    node.type === 'logic_direction_cmp' ||
    node.type === 'logic_itemstack_cmp' ||
    node.type === 'logic_block_cmp' ||
    node.type === 'logic_blockstate_cmp' ||
    node.type === 'logic_damage_source_check' ||
    node.type === 'logic_entity_subtypeof' ||
    node.type === 'logic_entity_compare' ||
    node.type === 'world_data_isremote'
  ) {
    const valA = node.values?.find(v => v.name === 'BOOL' || v.name === 'a' || v.name === 'IF' || v.name === 'entity')?.block;
    const valB = node.values?.find(v => v.name === 'THEN' || v.name === 'b')?.block;
    const valC = node.values?.find(v => v.name === 'ELSE')?.block;

    if (node.type === 'logic_negate') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
        >
          <span className="font-bold text-[11px]">not</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'world_data_isremote') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
        >
          <span className="font-bold text-[11px]">Is provided world client-side</span>
        </div>
      );
    }

    if (node.type === 'logic_entity_compare' || node.type === 'logic_entity_subtypeof') {
      const rawType = node.fields?.entity || 'Living entity';
      const displayType = rawType === 'EntityLiving' || rawType.includes('Living')
        ? 'Living entity'
        : rawType === 'EntityPlayer' || rawType.includes('Player')
        ? 'Player'
        : rawType;
      const targetBlock = node.values?.find(v => v.name === 'compareTo' || v.name === 'entity')?.block || valA;

      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5b80a5', borderColor: '#486887' }}
        >
          <span className="font-bold text-[11px]">Is</span>
          {targetBlock ? (
            <InlineValueBlock node={targetBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-[#498671] text-[10.5px]">
              Event/target entity
            </span>
          )}
          <span className="font-bold text-[11px]">(sub)type of</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            {displayType} <ChevronDown className="w-3 h-3 opacity-70" />
          </span>
        </div>
      );
    }

    if (node.type === 'logic_ternary') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#424242', borderColor: '#212121' }}
        >
          <span className="font-bold text-[11px]">If</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">then</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">else</span>
          {valC && <InlineValueBlock node={valC} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'logic_advancement_check') {
      const adv = node.fields?.advancement || 'No entry selected';
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5b80a5', borderColor: '#354d64' }}
        >
          <span className="font-bold text-[11px]">Is provided advancement equal to</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] shadow-xs">{adv}</span>
        </div>
      );
    }

    if (node.type === 'logic_vector_cmp') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#7058a6', borderColor: '#5d4691' }}
        >
          <span className="font-bold text-[11px]">Is</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">the same vector as</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'logic_direction_cmp') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#935116', borderColor: '#572e0a' }}
        >
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-amber-200 text-[10px] bg-black/30 px-1 rounded">=</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'logic_itemstack_cmp') {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#d32f2f', borderColor: '#b71c1c' }}
        >
          <span className="text-[10px]">💎</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-red-200 text-[10px] bg-black/30 px-1 rounded">=</span>
          <span className="text-[10px]">💎</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'logic_block_cmp' || node.type === 'logic_blockstate_cmp') {
      const isBs = node.type === 'logic_blockstate_cmp';
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#795548', borderColor: '#4e342e' }}
        >
          <span className="font-bold text-[11px]">Is</span>
          {valA && <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          <span className="font-bold text-[11px]">the same {isBs ? 'blockstate' : 'block'} as</span>
          {valB && <InlineValueBlock node={valB} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        </div>
      );
    }

    if (node.type === 'logic_damage_source_check') {
      const type = node.fields?.type || 'No entry selected';
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#ad336d', borderColor: '#6b1840' }}
        >
          <span className="font-bold text-[11px]">Is</span>
          {valA ? (
            <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <span className="bg-[#ad336d] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Provided damage source
            </span>
          )}
          <span className="font-bold text-[11px]">of type</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] shadow-xs">{type}</span>
        </div>
      );
    }

    if (node.type === 'logic_entity_subtypeof') {
      const type = node.fields?.entity || 'No entry selected';
      return (
        <div
          onClick={(e) => { e.stopPropagation(); }}
          className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0"
          style={{ backgroundColor: '#5ba58c', borderColor: '#376454' }}
        >
          <span className="font-bold text-[11px]">Is</span>
          {valA ? (
            <InlineValueBlock node={valA} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          ) : (
            <span className="bg-[#5ba58c] text-white px-2 py-0.5 rounded shadow-sm font-semibold border border-white/20 text-[10.5px]">
              Event/target entity
            </span>
          )}
          <span className="font-bold text-[11px]">(sub)type of</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] shadow-xs">{type}</span>
        </div>
      );
    }
  }

  // Minecraft Component Dependents & Constants
  if (
    node.type === 'damagesource_from_deps' ||
    node.type === 'direction_constant' ||
    node.type === 'direction_from_deps' ||
    node.type === 'action_result_type' ||
    node.type === 'blockstate_from_deps' ||
    node.type === 'direction_iterator' ||
    node.type === 'empty_itemstack' ||
    node.type === 'itemstack_from_deps' ||
    node.type === 'dimension_type_from_deps'
  ) {
    if (node.type === 'damagesource_from_deps') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#ad336d', borderColor: '#6b1840' }}>
          Provided damage source
        </div>
      );
    }

    if (node.type === 'direction_constant') {
      const dir = node.fields?.direction || node.title || 'DOWN';
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-bold text-[11px] shadow-xs border cursor-pointer shrink-0 flex items-center gap-1" style={{ backgroundColor: '#935116', borderColor: '#572e0a' }}>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 shadow-xs">{dir} <ChevronDown className="w-3 h-3 opacity-70" /></span>
        </div>
      );
    }

    if (node.type === 'direction_from_deps') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#935116', borderColor: '#572e0a' }}>
          Trigger direction/face
        </div>
      );
    }

    if (node.type === 'action_result_type') {
      const result = node.fields?.type || 'SUCCESS';
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-bold text-[11px] shadow-xs border cursor-pointer shrink-0 flex items-center gap-1.5" style={{ backgroundColor: '#689f38', borderColor: '#558b2f' }}>
          <span>Action result of type</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 shadow-xs">{result} <ChevronDown className="w-3 h-3 opacity-70" /></span>
        </div>
      );
    }

    if (node.type === 'blockstate_from_deps') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#795548', borderColor: '#4e342e' }}>
          Provided blockstate
        </div>
      );
    }

    if (node.type === 'direction_iterator') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#935116', borderColor: '#572e0a' }}>
          Direction iterator
        </div>
      );
    }

    if (node.type === 'empty_itemstack') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#d32f2f', borderColor: '#b71c1c' }}>
          Empty itemstack
        </div>
      );
    }

    if (node.type === 'itemstack_from_deps') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#d32f2f', borderColor: '#b71c1c' }}>
          Provided itemstack
        </div>
      );
    }

    if (node.type === 'dimension_type_from_deps') {
      return (
        <div onClick={(e) => { e.stopPropagation(); }} className="px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0" style={{ backgroundColor: '#689f38', borderColor: '#558b2f' }}>
          Provided dimension type
        </div>
      );
    }
  }

  // World Data & GUI Getter Inline Value Blocks
  if (node.type.startsWith('world_data_') || node.type.startsWith('gui_get_') || node.type.startsWith('entity_from_')) {
    const wBg = node.type.startsWith('gui_') ? '#488b49' : '#5b80a5';
    const wBorder = node.type.startsWith('gui_') ? '#275728' : '#354d64';
    const xVal = node.values?.find(v => v.name === 'x')?.block;
    const yVal = node.values?.find(v => v.name === 'y')?.block;
    const zVal = node.values?.find(v => v.name === 'z')?.block;
    const entVal = node.values?.find(v => v.name === 'entity')?.block;
    const slotVal = node.values?.find(v => v.name === 'slot')?.block;

    return (
      <div
        onClick={(e) => { e.stopPropagation(); }}
        className="px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap"
        style={{ backgroundColor: wBg, borderColor: wBorder }}
      >
        <span className="font-bold text-[11px]">{node.title || node.explanation || node.type.replace(/_/g, ' ')}</span>
        {node.fields && Object.entries(node.fields).map(([k, v]) => (
          <span key={k} className="bg-white/95 text-[#14171d] font-bold px-1.5 py-0.2 rounded text-[10.5px] flex items-center gap-1 shadow-xs">
            {String(v)} <ChevronDown className="w-2.5 h-2.5 opacity-70" />
          </span>
        ))}
        {slotVal && (
          <>
            <span className="font-bold text-[11px]">slot</span>
            <InlineValueBlock node={slotVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />
          </>
        )}
        {(xVal || yVal || zVal) && (
          <span className="flex items-center gap-1 text-[11px] font-bold">
            {xVal && <><span>at x:</span><InlineValueBlock node={xVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /></>}
            {yVal && <><span>y:</span><InlineValueBlock node={yVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /></>}
            {zVal && <><span>z:</span><InlineValueBlock node={zVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /></>}
          </span>
        )}
        {entVal && <InlineValueBlock node={entVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // NBT Getters, Checks, and Tag Operations
  if (
    node.type.startsWith('entity_nbt_') ||
    node.type.startsWith('block_nbt_') ||
    node.type.startsWith('item_nbt_') ||
    node.type.startsWith('custom_nbt_')
  ) {
    const isCreate = node.type === 'custom_nbt_create';
    const isHas = node.type.includes('_has') || node.type.includes('_tag_has');
    const isList = node.type === 'custom_nbt_list_get';
    const tagName = node.values?.find(v => v.name === 'tagName' || v.name === 'tag')?.block;
    const entityBlock = node.values?.find(v => v.name === 'entity')?.block;
    const itemBlock = node.values?.find(v => v.name === 'item' || v.name === 'itemstack')?.block;
    const tagHolderBlock = node.values?.find(v => v.name === 'tag')?.block;
    const typeBlock = node.values?.find(v => v.name === 'type')?.block;
    const xVal = node.values?.find(v => v.name === 'x')?.block;
    const yVal = node.values?.find(v => v.name === 'y')?.block;
    const zVal = node.values?.find(v => v.name === 'z')?.block;

    const isBlockNbt = node.type.startsWith('block_nbt_');
    const isItemNbt = node.type.startsWith('item_nbt_');
    const isCustomNbt = node.type.startsWith('custom_nbt_');
    const typeLabel = node.type.includes('_num_') ? 'number' : node.type.includes('_logic_') ? 'logic' : node.type.includes('_text_') ? 'text' : node.type.includes('_compound_') ? 'compound' : 'tag';

    if (isCreate) {
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
            isSelected ? '' : ''
          }`}
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <span className="font-bold text-[10px] text-amber-300">📦 Create CompoundTag</span>
        </div>
      );
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap max-w-full ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
      >
        {isHas ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">
              {isBlockNbt ? 'Block has NBT tag' : isItemNbt ? 'Item has NBT tag' : isCustomNbt ? 'Tag exists in' : 'Entity has NBT tag'}
            </span>
            {tagName && (
              <InlineValueBlock
                node={tagName}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
            <span className="text-[10px] font-semibold text-white/70">in</span>
            {isBlockNbt ? (
              <span className="flex items-center gap-1 text-[10px]">
                x:{xVal && <InlineValueBlock node={xVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                y:{yVal && <InlineValueBlock node={yVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                z:{zVal && <InlineValueBlock node={zVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              </span>
            ) : isItemNbt ? (
              itemBlock ? <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">item</span>
            ) : isCustomNbt ? (
              tagHolderBlock ? <InlineValueBlock node={tagHolderBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">tag</span>
            ) : (
              entityBlock ? <InlineValueBlock node={entityBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">entity</span>
            )}
          </>
        ) : isList ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">Get NBT list tag</span>
            {tagName && (
              <InlineValueBlock
                node={tagName}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
            <span className="text-[10px] font-semibold text-white/70">of</span>
            {tagHolderBlock ? <InlineValueBlock node={tagHolderBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">tag</span>}
            <span className="text-[10px] font-semibold text-white/70">type</span>
            {typeBlock && <InlineValueBlock node={typeBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : (
          <>
            {isBlockNbt ? (
              <>
                <span className="text-[10px] font-semibold text-white/90">Get block NBT {typeLabel} tag</span>
                {tagName && <InlineValueBlock node={tagName} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                <span className="text-[10px] font-semibold text-white/70">at</span>
                <span className="flex items-center gap-1 text-[10px]">
                  x:{xVal && <InlineValueBlock node={xVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                  y:{yVal && <InlineValueBlock node={yVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                  z:{zVal && <InlineValueBlock node={zVal} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                </span>
              </>
            ) : isItemNbt ? (
              <>
                <span className="text-[10px] font-semibold text-white/90">Get</span>
                {itemBlock ? <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">itemstack</span>}
                <span className="text-[10px] font-semibold text-white/90">custom {typeLabel} NBT tag</span>
                {tagName && <InlineValueBlock node={tagName} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              </>
            ) : isCustomNbt ? (
              <>
                <span className="text-[10px] font-semibold text-white/90">Get NBT {typeLabel} tag</span>
                {tagName && <InlineValueBlock node={tagName} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
                <span className="text-[10px] font-semibold text-white/70">of</span>
                {tagHolderBlock ? <InlineValueBlock node={tagHolderBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">CompoundTag</span>}
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold text-white/90">Get</span>
                {entityBlock ? <InlineValueBlock node={entityBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">Event/target entity</span>}
                <span className="text-[10px] font-semibold text-white/90">custom {typeLabel} NBT tag</span>
                {tagName && <InlineValueBlock node={tagName} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // Entity Synced Data Parameters: For custom entity [entity] of type [Type] get [integer/logic/string] data parameter [accessor] value
  if (
    node.type === 'entity_data_integer_get' ||
    node.type === 'entity_data_logic_get' ||
    node.type === 'entity_data_string_get'
  ) {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const typeLabel = node.type === 'entity_data_logic_get' ? 'logic' : node.type === 'entity_data_string_get' ? 'string' : 'integer';
    const rawCustomEntity = node.fields?.customEntity || 'Entity';
    const customEntityName = rawCustomEntity.replace(/^CUSTOM:/, '');
    const accessor = node.fields?.accessor || 'parameter';

    const paramBg = node.type === 'entity_data_logic_get' ? '#324c82' : node.type === 'entity_data_string_get' ? '#2e6b52' : '#59659e';
    const paramBorder = node.type === 'entity_data_logic_get' ? '#233761' : node.type === 'entity_data_string_get' ? '#1d4736' : '#3f4873';

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap max-w-full ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: paramBg, borderColor: paramBorder }}
      >
        <span className="font-semibold text-white/90 text-[10.5px]">For custom entity</span>
        {entBlock ? (
          <InlineValueBlock
            node={entBlock}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ) : (
          <span className="bg-[#3b82f6]/40 border border-blue-400/50 px-1.5 py-0.2 rounded text-[10px] text-white font-mono">
            Event/target entity
          </span>
        )}
        <span className="font-semibold text-white/90 text-[10.5px]">of type</span>
        <span className="bg-white/90 text-[#14171d] font-bold px-1.5 py-0.2 rounded text-[10.5px] shadow-xs">
          {customEntityName}
        </span>
        <span className="font-semibold text-white/90 text-[10.5px]">get {typeLabel} data parameter</span>
        <span className="bg-white/90 text-[#14171d] font-bold px-1.5 py-0.2 rounded text-[10.5px] shadow-xs">
          {accessor}
        </span>
        <span className="font-semibold text-white/90 text-[10.5px]">value</span>
      </div>
    );
  }

  // Text binary compare: %1 = %2 (Blockly block: text_binary_ops)
  if (node.type === 'text_binary_ops') {
    const leftVal = node.values?.find(v => v.name === 'A')?.block;
    const rightVal = node.values?.find(v => v.name === 'B')?.block;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: '#2e6b52', borderColor: '#1d4736' }}
      >
        {leftVal && (
          <InlineValueBlock
            node={leftVal}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold px-1 py-0.2 rounded bg-black/30 border border-white/20 text-emerald-200 text-[10px]">
          =
        </span>
        {rightVal && (
          <InlineValueBlock
            node={rightVal}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Binary Arithmetic: [A] + [B]
  if (node.type === 'math_binary' || node.type === 'math_dual_ops') {
    const leftVal = node.values?.find(v => v.name === 'A')?.block;
    const rightVal = node.values?.find(v => v.name === 'B')?.block;
    const op = node.fields?.OP === 'ADD' ? '+' : node.fields?.OP === 'MINUS' ? '-' : node.fields?.OP === 'MULTIPLY' ? '×' : node.fields?.OP === 'DIVIDE' ? '÷' : node.fields?.OP || '+';

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border cursor-pointer shrink-0"
        style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
      >
        {leftVal && (
          <InlineValueBlock
            node={leftVal}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold px-1.5 py-0.2 rounded bg-white/95 text-[#14171d] text-[10px] flex items-center gap-0.5 shadow-xs">
          {op} <ChevronDown className="w-2.5 h-2.5 opacity-70" />
        </span>
        {rightVal && (
          <InlineValueBlock
            node={rightVal}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Comparison & Logic Binary (`==`, `!=`, `<`, `>`, `AND`, `OR`)
  if (node.type === 'logic_compare' || node.type === 'logic_binary') {
    const leftVal = node.values?.find((v) => v.name === 'A')?.block;
    const rightVal = node.values?.find((v) => v.name === 'B')?.block;
    const op = node.fields?.OP || node.title || '==';

    if (isExternal) {
      // True MCreator External Input Layout: Stacked vertically with socket notch indicators
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={`rounded text-white font-sans text-[11px] flex flex-col shadow-xs border cursor-pointer max-w-full overflow-hidden ${
            isSelected ? '' : ''
          }`}
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          {/* Top Row: Left value (Socket A) */}
          <div className="flex items-center gap-1.5 px-2 py-1 border-b border-black/15">
            <span className="w-2.5 h-2.5 rounded-xs bg-black/40 flex items-center justify-center text-[8px] opacity-70">◖</span>
            {leftVal && (
              <InlineValueBlock
                node={leftVal}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>

          {/* Bottom Row: Operator Dropdown + Right value (Socket B) */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/10">
            <span className="font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-yellow-200 text-[10px] flex items-center gap-1">
              {op} <span className="text-[8px] opacity-70">▼</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-xs bg-black/40 flex items-center justify-center text-[8px] opacity-70">◖</span>
            {rightVal && (
              <InlineValueBlock
                node={rightVal}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>
        </div>
      );
    }

    // True MCreator Inline Input Layout: Flat horizontal chain
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
      >
        {leftVal && (
          <InlineValueBlock
            node={leftVal}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
        <span className="font-bold px-1 py-0.2 rounded bg-black/30 border border-white/20 text-yellow-200 text-[10px] flex items-center gap-0.5">
          {op}
        </span>
        {rightVal && (
          <InlineValueBlock
            node={rightVal}
            inputLayoutMode={inputLayoutMode}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        )}
      </div>
    );
  }

  // Item Expression Getters
  if (
    node.type.startsWith('item_') ||
    node.type.startsWith('itemstack_') ||
    node.type.startsWith('entity_get_mainhand_item') ||
    node.type.startsWith('entity_get_offhand_item') ||
    node.type.startsWith('entity_get_armor_slot_item')
  ) {
    const itemBlock = node.values?.find(v => v.name === 'item' || v.name === 'itemstack')?.block;
    const enchBlock = node.values?.find(v => v.name === 'enhancement')?.block;
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    const slotBlock = node.values?.find(v => v.name === 'slot')?.block;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border flex-wrap cursor-pointer shrink-0 ${
          isSelected ? '' : ''
        }`}
        style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
      >
        {node.type === 'itemstack_get_count' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">number of items in</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_from_itemstack' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">get item from</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_get_damage' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">damage of</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_get_max_damage' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">max damage of</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_get_max_stack_size' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">max stack size of</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_get_display_name' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">display name of</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_get_enhancement' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">level of</span>
            {enchBlock && <InlineValueBlock node={enchBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/70">on</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'item_is_damageable' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">is</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/90">damageable</span>
          </>
        ) : node.type === 'item_is_enchanted' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">is</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/90">enchanted</span>
          </>
        ) : node.type === 'item_is_enchantable' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">is</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/90">enchantable</span>
          </>
        ) : node.type === 'item_is_food' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">is</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/90">food</span>
          </>
        ) : node.type === 'item_is_empty' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">is</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/90">empty</span>
          </>
        ) : node.type === 'item_copy' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">copy of</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        ) : node.type === 'entity_get_mainhand_item' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">item in main hand of</span>
            {entBlock ? <InlineValueBlock node={entBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">entity</span>}
          </>
        ) : node.type === 'entity_get_offhand_item' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">item in off hand of</span>
            {entBlock ? <InlineValueBlock node={entBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">entity</span>}
          </>
        ) : node.type === 'entity_get_armor_slot_item' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">item in armor slot</span>
            {slotBlock && <InlineValueBlock node={slotBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/70">of</span>
            {entBlock ? <InlineValueBlock node={entBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">entity</span>}
          </>
        ) : node.type === 'item_cooldown_get' ? (
          <>
            <span className="text-[10px] font-semibold text-white/90">is</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
            <span className="text-[10px] font-semibold text-white/90">on cooldown for</span>
            {entBlock ? <InlineValueBlock node={entBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} /> : <span className="text-white/60 text-[10px]">entity</span>}
          </>
        ) : (
          <>
            <span className="text-[10px] font-semibold text-white/90">{node.title || node.type}</span>
            {itemBlock && <InlineValueBlock node={itemBlock} inputLayoutMode={inputLayoutMode} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
          </>
        )}
      </div>
    );
  }

  // Default Value Pill / Getter Block
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border flex-wrap cursor-pointer shrink-0 ${
        isSelected ? '' : ''
      }`}
      style={{
        backgroundColor: theme.headerBg,
        borderColor: theme.border,
      }}
    >
      <span className="font-medium text-[11px]">{node.title}</span>

      {/* Fields */}
      {node.fields?.VAR && (
        <span className="font-mono font-bold bg-black/30 px-1 py-0.2 rounded text-purple-200 text-[10px]">
          {node.fields.VAR.replace('local:', '')}
        </span>
      )}
      {node.fields?.NUM && (
        <span className="font-mono font-bold bg-black/30 px-1 py-0.2 rounded text-purple-200 text-[10px]">
          {node.fields.NUM}
        </span>
      )}
      {node.fields?.TEXT && (
        <span className="font-mono bg-black/30 px-1 py-0.2 rounded text-green-200 text-[10px]">
          "{node.fields.TEXT}"
        </span>
      )}
      {node.fields?.BOOL && (
        <span className="font-mono font-bold bg-black/30 px-1 py-0.2 rounded text-blue-200 text-[10px]">
          {node.fields.BOOL}
        </span>
      )}

      {/* Nested Values */}
      {node.values && node.values.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {node.values.map((v, idx) =>
            v.block ? (
              <InlineValueBlock
                key={idx}
                node={v.block}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                     Tree AST Inspector Fallback View                       */
/* -------------------------------------------------------------------------- */

const TreeASTInspector: React.FC<{
  node: BlockASTNode;
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string, line?: number) => void;
}> = React.memo(({ node, selectedLineNumber, selectedBlockId, onSelectBlock }) => {
  const isSelected = checkIsNodeSelected(node, selectedLineNumber, selectedBlockId);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={`font-mono text-xs p-3 rounded border transition-all cursor-pointer ${
        isSelected
          ? ''
          : 'bg-[#181a20] border-[#2b303c] text-[#d8dee9] hover:border-[#4c566a]'
      } space-y-1.5`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#88c0d0]">{node.title}</span>
          <span className="px-1.5 py-0.5 rounded bg-[#3b4252] text-[10px] text-[#e5e9f0]">
            {node.type}
          </span>
        </div>
        {node.sourceLine && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-400 font-bold">
            Line {node.sourceLine}
          </span>
        )}
      </div>

      {node.fields && (
        <div className="pl-3 text-[10px] text-[#a3be8c]">
          Fields: {JSON.stringify(node.fields)}
        </div>
      )}

      {node.values && node.values.length > 0 && (
        <div className="pl-3 space-y-1">
          <div className="text-[10px] font-bold text-[#81a1c1] uppercase">Values (Sockets):</div>
          {node.values.map((v, idx) => (
            <div key={idx} className="pl-2 border-l border-[#4c566a]">
              <span className="text-[#d8dee9] font-semibold text-[10px]">{v.name}:</span>
              {v.block && (
                <TreeASTInspector
                  node={v.block}
                  selectedLineNumber={selectedLineNumber}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {node.statements && node.statements.length > 0 && (
        <div className="pl-3 space-y-1">
          <div className="text-[10px] font-bold text-[#ebcb8b] uppercase">
            Statements (C-Mouth):
          </div>
          {node.statements.map((s, idx) => (
            <div key={idx} className="pl-2 border-l border-[#d08770]">
              {s.block && (
                <TreeASTInspector
                  node={s.block}
                  selectedLineNumber={selectedLineNumber}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {node.next && (
        <div className="mt-1 pt-1 border-t border-[#3b4252]">
          <div className="text-[10px] font-bold text-[#88c0d0]">Next Connected Statement:</div>
          <TreeASTInspector
            node={node.next}
            selectedLineNumber={selectedLineNumber}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        </div>
      )}
    </div>
  );
});
