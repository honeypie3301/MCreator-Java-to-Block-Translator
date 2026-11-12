import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Play, Trash2, Code2, AlertCircle } from 'lucide-react';
import { MCreatorElementType } from '../types';

interface JavaEditorPanelProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  targetEvent?: string;
  onChangeTargetEvent?: (event: string) => void;
  onTranslate: () => void;
  isTranslating: boolean;
  elementType: MCreatorElementType;
  error?: string | null;
  selectedLineNumber?: number | null;
  onSelectLine?: (lineNumber: number) => void;
}

const LINE_HEIGHT = 18; // 18px compact line height

export const JavaEditorPanel: React.FC<JavaEditorPanelProps> = ({
  code,
  onChangeCode,
  targetEvent,
  onChangeTargetEvent,
  onTranslate,
  isTranslating,
  elementType,
  error,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(400);

  const rafRef = useRef<number | null>(null);

  const totalLines = useMemo(() => {
    if (!code) return 1;
    let lines = 1;
    const len = code.length;
    for (let i = 0; i < len; i++) {
      if (code.charCodeAt(i) === 10) lines++;
    }
    return lines;
  }, [code]);

  const charCount = code.length;

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

  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setScrollTop(top);
          rafRef.current = null;
        });
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onTranslate();
    }
  };

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
      <div className="bg-[#121110] px-2.5 py-1.5 border-b border-[#2E2925] flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center space-x-1.5">
          <Code2 className="w-3.5 h-3.5 text-[#CEB098]" />
          <span className="font-bold text-[#FAF6F0]">Java Source Code Input</span>
          <span className="text-[10px] text-[#A39B8E] font-mono">
            {totalLines.toLocaleString()} lines | {charCount.toLocaleString()} chars
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 bg-[#0F0E0D] font-mono text-[11px] flex overflow-hidden select-text"
      >
        <div
          ref={lineNumbersRef}
          className="select-none bg-[#141210] border-r border-[#24201D] text-[#5C554D] text-right font-mono text-[10px] overflow-hidden shrink-0 z-10 pointer-events-auto"
          style={{ width: totalLines > 9999 ? '4rem' : totalLines > 999 ? '3.25rem' : '2.5rem' }}
        >
          <div
            style={{
              height: `${totalLines * LINE_HEIGHT + 16}px`,
              position: 'relative',
            }}
          >
            {visibleLines.map((lineNum) => {
              return (
                <div
                  key={lineNum}
                  className="px-1.5 leading-[18px] absolute w-full left-0 hover:text-[#FAF6F0]"
                  style={{
                    top: `${(lineNum - 1) * LINE_HEIGHT + 8}px`,
                    height: `${LINE_HEIGHT}px`,
                  }}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex-1 h-full overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            wrap="off"
            placeholder="// Enter or paste your NeoForge 1.21.1+ Java code here...
// Supporting events (@SubscribeEvent), logic structures (if/else/while/for), math expressions, potion effects, heal, and damage calls."
            className="w-full h-full p-2 pt-2 bg-transparent text-[#FAF6F0] placeholder-[#5C554D] resize-none outline-none font-mono text-[11px] selection:bg-[#CEB098]/30 overflow-auto"
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              whiteSpace: 'pre',
              tabSize: 4,
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#2A1816] border-t border-[#5C2B25] p-2.5 px-3 flex items-start space-x-2 text-xs text-[#E8A59E]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#E8A59E] mt-0.5" />
          <div className="flex-1 font-mono text-[11px] leading-tight">{error}</div>
        </div>
      )}

      <div className="bg-[#121110] p-2 sm:p-2.5 border-t border-[#2E2925] flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-[#A39B8E] shrink-0">
          <kbd className="px-1.5 py-0.5 bg-[#24201D] border border-[#3B342E] rounded text-[#FAF6F0] font-mono text-[10px]">
            Ctrl + Enter
          </kbd>
          <span>to convert into blocks</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-auto">
          <button
            onClick={() => onChangeCode('')}
            disabled={!code || isTranslating}
            className="px-2.5 py-1.5 text-xs text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#24201D] border border-[#2E2925] rounded transition flex items-center space-x-1 disabled:opacity-40 cursor-pointer shrink-0"
            title="Clear Code"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={onTranslate}
            disabled={!code.trim() || isTranslating}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#121110] bg-[#CEB098] hover:bg-[#E2D2C3] active:bg-[#B89980] rounded transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer flex-1 sm:flex-none justify-center whitespace-nowrap"
          >
            {isTranslating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#121110]/30 border-t-[#121110] rounded-full animate-spin shrink-0" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Convert Code to Blocks</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
