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
} from 'lucide-react';
import { GLOBAL_TRIGGERS } from '../lib/mcreatorConverter';

interface VisualBlockCanvasProps {
  ast?: BlockASTNode;
  eventTrigger?: string;
  procedureName?: string;
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string, sourceLine?: number) => void;
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
    headerBg: '#546e7a',
    bodyBg: '#455a64',
    border: '#263238',
    text: '#ffffff',
    accent: '#90a4ae',
    badgeBg: '#33434b',
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

function getNodeComplexity(node: BlockASTNode, depth = 0): { count: number; maxDepth: number; textLen: number } {
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
  return { count, maxDepth, textLen };
}

function shouldUseExternalInputs(node: BlockASTNode, layoutMode: string = 'auto'): boolean {
  if (layoutMode === 'inline') return false;
  if (layoutMode === 'external') return true;
  // Auto mode: check values count and depth
  if (!node.values || node.values.length === 0) return false;
  if (node.values.length >= 3) return true;
  const complexity = getNodeComplexity(node);
  return complexity.maxDepth >= 2 || complexity.textLen > 35 || complexity.count >= 4;
}

function checkIsNodeSelected(
  node: BlockASTNode,
  selectedLineNumber?: number | null,
  selectedBlockId?: string | null
): boolean {
  if (selectedBlockId && node.id === selectedBlockId) return true;
  if (selectedLineNumber !== undefined && selectedLineNumber !== null && node.sourceLine !== undefined) {
    if (node.sourceEndLine !== undefined) {
      return node.sourceLine <= selectedLineNumber && selectedLineNumber <= node.sourceEndLine;
    }
    return node.sourceLine === selectedLineNumber;
  }
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
  const [inputLayoutMode, setInputLayoutMode] = useState<'auto' | 'inline' | 'external'>('auto');
  const [showSnippetGuide, setShowSnippetGuide] = useState<boolean>(false);

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
    <div className="flex flex-col h-full bg-[#181a20] rounded-lg border border-[#2d323e] shadow-lg overflow-hidden font-sans text-xs">
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

          {/* Snippets Info Toggle */}
          <button
            onClick={() => setShowSnippetGuide(true)}
            className="flex items-center space-x-1 px-2 py-1 bg-[#28241e] hover:bg-[#342c22] border border-amber-600/40 text-amber-300 rounded transition text-[11px] cursor-pointer"
            title="Clarification on MCreator Custom Code Snippet Blocks"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Snippet Types</span>
          </button>
        </div>

        {/* Right: View Toggles & Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* Input Format Mode (Inline / External / Auto) */}
          <div className="flex items-center bg-[#14171d] p-0.5 rounded border border-[#2e3440] text-[10.5px]">
            <span className="text-[#6c768a] px-1.5 font-medium select-none hidden sm:inline">Inputs:</span>
            <button
              onClick={() => setInputLayoutMode('auto')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                inputLayoutMode === 'auto'
                  ? 'bg-[#434c5e] text-[#eceff4] shadow-xs'
                  : 'text-[#7e889b] hover:text-[#d8dee9]'
              }`}
              title="Automatically toggle inline or external inputs based on block complexity to prevent overlap"
            >
              Auto
            </button>
            <button
              onClick={() => setInputLayoutMode('inline')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                inputLayoutMode === 'inline'
                  ? 'bg-[#434c5e] text-[#eceff4] shadow-xs'
                  : 'text-[#7e889b] hover:text-[#d8dee9]'
              }`}
              title="Force horizontal inline inputs"
            >
              Inline
            </button>
            <button
              onClick={() => setInputLayoutMode('external')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                inputLayoutMode === 'external'
                  ? 'bg-[#434c5e] text-[#eceff4] shadow-xs'
                  : 'text-[#7e889b] hover:text-[#d8dee9]'
              }`}
              title="Force vertical stacked external input rows"
            >
              External
            </button>
          </div>

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

          {/* Zoom Buttons */}
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
          </div>
        </div>
      </div>

      {/* Snippet Types Clarification Modal */}
      {showSnippetGuide && (
        <div className="bg-[#1f1a14] border-b border-amber-600/40 p-3 px-4 text-xs text-amber-100 flex items-start justify-between gap-4 animate-fadeIn">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
              <Code2 className="w-4 h-4" />
              <span>MCreator Custom Code Snippet Blocks Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              In MCreator 2026.1, there are <strong>two distinct variants</strong> of the custom code snippet block:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-black/50 p-2.5 rounded border border-amber-500/30">
                <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/50 text-[10px]">Statement Snippet</span>
                  <span>(custom_code_snippet)</span>
                </div>
                <p className="text-[10.5px] text-stone-300 mt-1">
                  Features top puzzle notch & bottom tab. Inserts complete executable Java statements directly into the procedure flow.
                </p>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-amber-500/30">
                <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/50 text-[10px]">Expression Snippet</span>
                  <span>(custom_code_snippet_output)</span>
                </div>
                <p className="text-[10.5px] text-stone-300 mt-1">
                  Features an output tab on the left. Evaluates Java expressions or returns fallback values like <code>(null)</code> into condition/value sockets.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSnippetGuide(false)}
            className="text-amber-400 hover:text-amber-200 p-1 rounded hover:bg-black/30 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            <BlocklyNodeRenderer
              node={ast}
              eventTrigger={eventTrigger}
              inputLayoutMode={inputLayoutMode}
              selectedLineNumber={selectedLineNumber}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
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
        <span className="text-[10px] text-[#81a1c1] font-mono">
          Click any block to navigate to its Java source line
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                 MCreator Blockly Visual Node Component                     */
/* -------------------------------------------------------------------------- */

const BlocklyNodeRenderer: React.FC<{
  node: BlockASTNode;
  eventTrigger?: string;
  inputLayoutMode?: 'auto' | 'inline' | 'external';
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string, sourceLine?: number) => void;
}> = React.memo(({ node, eventTrigger, inputLayoutMode = 'auto', selectedLineNumber, selectedBlockId, onSelectBlock }) => {
  const theme = MCREATOR_CATEGORY_THEMES[node.category] || MCREATOR_CATEGORY_THEMES.control;
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
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
                  <div className="flex-1 p-1 bg-black/20 border-t border-b border-r border-black/30 min-h-[36px] rounded-r-md my-0.5">
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
            <div className="flex-1 p-1 bg-black/20 border-t border-b border-r border-black/30 min-h-[36px] rounded-r-md my-0.5">
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

  // 2.5 Specialized Variable Setter Block (Set number [Local: var] to: [val])
  if (
    node.type === 'variables_set_number' ||
    node.type === 'variables_set_logic' ||
    node.type === 'variables_set_string' ||
    node.type === 'variables_set_itemstack'
  ) {
    const valBlock = node.values?.find(v => v.name === 'VAL')?.block;
    const typeLabel = node.type.replace('variables_set_', '');
    const varName = node.fields?.VAR?.replace('local:', '') || 'var';

    return (
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[240px]"
          style={{
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        >
          <span className="font-bold text-[11px]">Set {typeLabel}</span>
          <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            Local: {varName} <ChevronDown className="w-3 h-3 opacity-70" />
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[280px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-3 py-2 text-white shadow border flex flex-col gap-1.5 min-w-[280px]"
          style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
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
            {node.sourceLine && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-300 font-mono ml-auto">
                L{node.sourceLine}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold pl-1">
            <span className="w-8 text-right font-medium text-white/90">to x:</span>
            {xBlock && (
              <InlineValueBlock
                node={xBlock}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold pl-1">
            <span className="w-8 text-right font-medium text-white/90">y:</span>
            {yBlock && (
              <InlineValueBlock
                node={yBlock}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold pl-1">
            <span className="w-8 text-right font-medium text-white/90">z:</span>
            {zBlock && (
              <InlineValueBlock
                node={zBlock}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>
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
    const tagHolderBlock = node.values?.find(v => v.name === 'tag' && v.name !== 'tagName')?.block;
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[280px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[280px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[280px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[320px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[320px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded-md px-2.5 py-1.5 text-white shadow border flex flex-col gap-1.5 min-w-[280px]"
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
        }`}
      >
        <div
          className="rounded px-2.5 py-1 text-white shadow border flex items-center gap-1.5 flex-wrap min-w-[220px]"
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
        onSelectBlock?.(node.id, node.sourceLine);
      }}
      className={`flex flex-col items-start font-sans my-0.5 select-none cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#14171d] rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''
      }`}
    >
      <div
        className="rounded-md px-2.5 py-1.5 text-white shadow border flex flex-col gap-1 min-w-[260px]"
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
              <div key={k} className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-black/20 border-black/20">
                <span className="text-white/80 font-medium text-[10px]">{k}:</span>
                <span className="font-bold text-yellow-200 text-[10px] break-all">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sockets for Sub-Values - External (Stacked Rows) vs Inline */}
        {node.values && node.values.length > 0 && (
          isExternal ? (
            <div className="flex flex-col gap-1 w-full pt-1 border-t border-black/20">
              {node.values.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-black/25 px-2 py-1 rounded border border-black/30 w-full">
                  <span className="text-white/80 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
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
                <div key={idx} className="flex items-center gap-1 bg-black/25 px-1.5 py-0.5 rounded border border-black/30">
                  <span className="text-white/70 text-[9px] font-semibold">{v.name}:</span>
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
  onSelectBlock?: (blockId: string, sourceLine?: number) => void;
}> = React.memo(({ node, inputLayoutMode = 'auto', selectedLineNumber, selectedBlockId, onSelectBlock }) => {
  const theme = MCREATOR_CATEGORY_THEMES[node.category] || MCREATOR_CATEGORY_THEMES.math;
  const isSelected = checkIsNodeSelected(node, selectedLineNumber, selectedBlockId);
  const isExternal = shouldUseExternalInputs(node, inputLayoutMode);

  // Logic Boolean Literal (`true` / `false`)
  if (node.type === 'logic_boolean') {
    const isTrue = node.fields?.BOOL === 'TRUE';
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shadow-xs border cursor-pointer shrink-0 ${
          isTrue ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-red-950/80 border-red-500/50 text-red-300'
        } ${isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2.5 py-0.5 rounded-full font-sans font-bold text-[11px] text-white shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded font-mono font-medium text-[11px] text-white shadow-xs flex items-center gap-1 cursor-pointer shrink-0 border ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
        }`}
        style={{ backgroundColor: '#5ba55b', borderColor: '#4d8c4d' }}
      >
        <span className="text-white/80 select-none text-[13px] font-sans">“</span>
        <span>{textVal}</span>
        <span className="text-white/80 select-none text-[13px] font-sans">”</span>
      </div>
    );
  }

  // Variables Getter: Get number [Local: var ▾]
  if (
    node.type === 'variables_get_number' ||
    node.type === 'variables_get_logic' ||
    node.type === 'variables_get_string' ||
    node.type === 'variables_get_itemstack'
  ) {
    const varName = node.fields?.VAR?.replace('local:', '') || node.title || 'var';
    const typeLabel = node.type.replace('variables_get_', '');
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
        }`}
        style={{ backgroundColor: '#a55b80', borderColor: '#874867' }}
      >
        <span className="font-medium text-[10.5px] text-white/95">Get {typeLabel}</span>
        <span className="bg-white/95 text-[#14171d] font-bold px-1.5 py-0.2 rounded text-[10.5px] flex items-center gap-1 shadow-xs">
          Local: {varName} <ChevronDown className="w-2.5 h-2.5 opacity-70" />
        </span>
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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

  // Math Dual Ops: Random [0,1)
  if (node.type === 'math_dual_ops' && (node.fields?.OP === 'RANDOM' || node.title?.includes('Random'))) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
        }`}
        style={{ backgroundColor: '#5b67a5', borderColor: '#485387' }}
      >
        <span className="bg-white/95 text-[#14171d] font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
          Random [0,1) <ChevronDown className="w-3 h-3 opacity-70" />
        </span>
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
        }`}
        style={{ backgroundColor: '#5ba58c', borderColor: '#498671' }}
      >
        Event/target entity
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
        onClick={(e) => { e.stopPropagation(); onSelectBlock?.(node.id, node.sourceLine); }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
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
        onClick={(e) => { e.stopPropagation(); onSelectBlock?.(node.id, node.sourceLine); }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
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
        onClick={(e) => { e.stopPropagation(); onSelectBlock?.(node.id, node.sourceLine); }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer flex-wrap ${isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
        style={{ backgroundColor: '#2d4a35', borderColor: '#1e3524' }}
      >
        {aBlock && <InlineValueBlock node={aBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
        <span className="font-bold text-emerald-300 text-[10px] bg-black/30 px-1 rounded">is in</span>
        <span className="font-bold text-emerald-300 text-[10px]">=</span>
        {bBlock && <InlineValueBlock node={bBlock} selectedLineNumber={selectedLineNumber} selectedBlockId={selectedBlockId} onSelectBlock={onSelectBlock} />}
      </div>
    );
  }

  // Entity food level block: entity_foodlevel / entity_get_food_level
  if (node.type === 'entity_foodlevel' || node.type === 'entity_get_food_level') {
    const entBlock = node.values?.find(v => v.name === 'entity')?.block;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelectBlock?.(node.id, node.sourceLine); }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans font-semibold text-[11px] shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-mono font-bold text-[11px] shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-950/70 border border-emerald-400/50 text-emerald-200 shadow-xs flex items-center gap-1 cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-950/70 border border-cyan-400/50 text-cyan-200 shadow-xs cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 transition-all ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md scale-[1.02]' : 'hover:brightness-110'
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
    const tagHolderBlock = node.values?.find(v => v.name === 'tag' && v.name !== 'tagName')?.block;
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
            onSelectBlock?.(node.id, node.sourceLine);
          }}
          className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
            isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap max-w-full ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 flex-wrap max-w-full ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
    const op = node.fields?.OP === 'ADD' ? '+' : node.fields?.OP === 'MINUS' ? '-' : node.fields?.OP || '+';

    if (isExternal) {
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectBlock?.(node.id, node.sourceLine);
          }}
          className={`p-1.5 rounded text-white font-sans text-[11px] flex flex-col gap-1 shadow-xs border cursor-pointer max-w-full ${
            isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
          }`}
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between gap-1 border-b border-black/20 pb-0.5">
            <span className="text-[10px] font-bold text-white/85">Math Operation</span>
            <span className="font-bold px-1.5 py-0.2 rounded bg-black/40 border border-white/20 text-yellow-200 text-[10px]">
              {op}
            </span>
          </div>
          <div className="flex flex-col gap-1 pl-1">
            {leftVal && (
              <InlineValueBlock
                node={leftVal}
                inputLayoutMode={inputLayoutMode}
                selectedLineNumber={selectedLineNumber}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
              />
            )}
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

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
        <span className="font-bold px-1 py-0.2 rounded bg-black/30 border border-white/20 text-yellow-200 text-[10px]">
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
            onSelectBlock?.(node.id, node.sourceLine);
          }}
          className={`rounded text-white font-sans text-[11px] flex flex-col shadow-xs border cursor-pointer max-w-full overflow-hidden ${
            isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-2 py-1 rounded text-white font-sans text-[11px] flex items-center gap-1.5 shadow-xs border cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
          onSelectBlock?.(node.id, node.sourceLine);
        }}
        className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border flex-wrap cursor-pointer shrink-0 ${
          isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
        onSelectBlock?.(node.id, node.sourceLine);
      }}
      className={`px-1.5 py-0.5 rounded text-white font-sans text-[11px] flex items-center gap-1 shadow-xs border flex-wrap cursor-pointer shrink-0 ${
        isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
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
  onSelectBlock?: (blockId: string, sourceLine?: number) => void;
}> = React.memo(({ node, selectedLineNumber, selectedBlockId, onSelectBlock }) => {
  const isSelected = checkIsNodeSelected(node, selectedLineNumber, selectedBlockId);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelectBlock?.(node.id, node.sourceLine);
      }}
      className={`font-mono text-xs p-3 rounded border transition-all cursor-pointer ${
        isSelected
          ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400 text-amber-200'
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
