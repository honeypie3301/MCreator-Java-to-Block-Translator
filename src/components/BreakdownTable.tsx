import React from 'react';
import { FileCode, ArrowRight, CornerDownRight } from 'lucide-react';
import { TranslationBreakdownItem } from '../types';

interface BreakdownTableProps {
  breakdown: TranslationBreakdownItem[];
  selectedLineNumber?: number | null;
  selectedBlockId?: string | null;
  onSelect?: (lineNumber?: number, blockId?: string) => void;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({
  breakdown,
  selectedLineNumber,
  selectedBlockId,
  onSelect,
}) => {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="text-center py-8 text-[#8C857B] font-mono text-xs">
        No direct line mappings generated yet. Enter Java statements to view line-by-line block AST mapping.
      </div>
    );
  }

  return (
    <div className="bg-[#181614] border border-[#2E2925] rounded-lg overflow-hidden font-mono text-xs">
      <div className="bg-[#121110] px-3 py-2 border-b border-[#2E2925] font-semibold text-[#FAF6F0] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-[#CEB098]" />
          <span>Java Code to MCreator Block AST Mapping</span>
        </div>
        <span className="text-[11px] text-[#A39B8E]">
          Click any row to jump & highlight block in Visual Canvas
        </span>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#141210] text-[#8C857B] border-b border-[#2E2925] text-[11px]">
              <th className="py-2 px-3 font-medium w-14 text-center">Line</th>
              <th className="py-2 px-3 font-medium w-2/5">Java Source Statement</th>
              <th className="py-2 px-3 font-medium w-1/4">MCreator Block</th>
              <th className="py-2 px-3 font-medium">AST Deterministic Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#24201D] text-xs">
            {breakdown.map((item, index) => {
              const isSelected =
                (selectedLineNumber !== undefined && selectedLineNumber !== null && item.lineNumber === selectedLineNumber) ||
                (selectedBlockId !== undefined && selectedBlockId !== null && item.blockId === selectedBlockId);

              return (
                <tr
                  key={index}
                  onClick={() => onSelect?.(item.lineNumber, item.blockId)}
                  className={`transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 text-amber-200 ring-1 ring-inset ring-amber-500/40'
                      : 'hover:bg-[#1F1C19]'
                  }`}
                >
                  <td className="py-2 px-2 text-center text-[#8C857B] font-mono text-[11px]">
                    {item.lineNumber ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#24201D] border border-[#3B342E] text-amber-400 font-bold">
                        L{item.lineNumber}
                      </span>
                    ) : (
                      <span className="text-stone-600">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-[#FAF6F0] font-mono bg-[#0F0E0D]/60 whitespace-pre-wrap break-all">
                    {item.javaLine}
                  </td>
                  <td className="py-2 px-3 text-[#CEB098] font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#8C857B] shrink-0" />
                      <span>{item.mcreatorBlock}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[#A39B8E] leading-relaxed">
                    {item.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

