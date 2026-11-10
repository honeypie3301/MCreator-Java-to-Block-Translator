import React from 'react';
import { TranslationResult } from '../types';
import { ShieldCheck, Variable, Cpu, AlertTriangle, Layers, Tag, Database } from 'lucide-react';

interface ProcedureSpecPanelProps {
  result: TranslationResult;
}

export const ProcedureSpecPanel: React.FC<ProcedureSpecPanelProps> = ({ result }) => {
  const [blockDatabase, setBlockDatabase] = React.useState<{ id: string; mcreatorType: string; description?: string }[]>([]);

  React.useEffect(() => {
    import('../data/mcreatorBlocksDatabase').then(mod => {
      setBlockDatabase(mod.MCREATOR_BLOCK_DATABASE);
    });
  }, []);
  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Element & Engine Spec */}
        <div className="bg-[#181614] border border-[#2E2925] rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2 text-[#FAF6F0] font-semibold border-b border-[#2E2925] pb-2">
            <Cpu className="w-4 h-4 text-[#CEB098]" />
            <span>Element Specification</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#A39B8E]">Element Name:</span>
              <span className="text-[#FAF6F0] font-semibold">{result.procedureName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A39B8E]">Blockly Extension:</span>
              <span className="text-[#CEB098] bg-[#24201D] px-2 py-0.5 rounded border border-[#3B342E] font-bold">
                {result.fileExtension}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A39B8E]">Root Trigger Block:</span>
              <span className="text-[#CEB098] bg-[#24201D] px-2 py-0.5 rounded border border-[#3B342E]">
                {result.eventTrigger}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A39B8E]">Target NeoForge Engine:</span>
              <span className="text-[#FAF6F0] font-bold">{result.targetNeoForgeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A39B8E]">Blocks Database Match:</span>
              <span className="text-[#CEB098] font-bold">{result.matchedBlocksCount} blocks</span>
            </div>
          </div>
        </div>

        {/* Card 2: Dependencies Required */}
        <div className="bg-[#181614] border border-[#2E2925] rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2 text-[#FAF6F0] font-semibold border-b border-[#2E2925] pb-2">
            <Layers className="w-4 h-4 text-[#CEB098]" />
            <span>MCreator Dependencies</span>
          </div>
          <p className="text-[11px] text-[#A39B8E]">
            Automatically provided by MCreator event bus context:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {result.dependencies.length > 0 ? (
              result.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="px-2 py-0.5 rounded bg-[#24201D] border border-[#3B342E] text-[#D8C4B6] text-xs flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-[#CEB098]" />
                  <span>{dep}</span>
                </span>
              ))
            ) : (
              <span className="text-[#6E665C] italic text-[11px]">No dependencies required</span>
            )}
          </div>
        </div>
      </div>

      {/* Variables Section */}
      <div className="bg-[#181614] border border-[#2E2925] rounded-lg p-3 space-y-2">
        <div className="flex items-center space-x-2 text-[#FAF6F0] font-semibold border-b border-[#2E2925] pb-2">
          <Variable className="w-4 h-4 text-[#CEB098]" />
          <span>Local Variables</span>
        </div>
        {result.variables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2E2925] text-[#8C857B]">
                  <th className="py-1 px-2 font-medium">Variable Name</th>
                  <th className="py-1 px-2 font-medium">Type</th>
                  <th className="py-1 px-2 font-medium">Initial Expression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24201D] text-[#FAF6F0]">
                {result.variables.map((v, i) => (
                  <tr key={i} className="hover:bg-[#1F1C19]">
                    <td className="py-1.5 px-2 font-semibold text-[#CEB098]">{v.name}</td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.5 bg-[#24201D] rounded border border-[#3B342E] text-[11px]">
                        {v.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-[#A39B8E] font-mono">
                      {String(v.initialValue ?? 'None')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#6E665C] italic text-xs py-1">No local procedure variables declared.</p>
        )}
      </div>

      {/* NeoForge Version Compatibility Details */}
      <div className="bg-[#181614] border border-[#2E2925] rounded-lg p-3 space-y-2">
        <div className="flex items-center space-x-2 text-[#CEB098] font-semibold border-b border-[#2E2925] pb-2">
          <ShieldCheck className="w-4 h-4 text-[#CEB098]" />
          <span>NeoForge {result.targetNeoForgeVersion} Syntax & Compatibility Mappings</span>
        </div>
        <p className="text-xs text-[#FAF6F0] leading-relaxed">
          {result.neoForgeVersionNotes.compatibilityInfo}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#A39B8E]">
          {result.neoForgeVersionNotes.syntaxDiffs.map((diff, i) => (
            <li key={i}>{diff}</li>
          ))}
        </ul>
      </div>

      {/* Database Reference Catalogue */}
      <div className="bg-[#181614] border border-[#2E2925] rounded-lg p-3 space-y-2">
        <div className="flex items-center space-x-2 text-[#FAF6F0] font-semibold border-b border-[#2E2925] pb-2">
          <Database className="w-4 h-4 text-[#CEB098]" />
          <span>MCreator Block Database Reference Catalog ({blockDatabase.length > 0 ? `${blockDatabase.length} blocks registered` : 'Loading…'})</span>
        </div>
        <p className="text-[11px] text-[#A39B8E]">
          Supported blocks from official MCreator GitHub repository specs:
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
          {blockDatabase.length > 0 ? blockDatabase.map((b) => (
            <span
              key={b.id}
              className="px-2 py-0.5 rounded bg-[#24201D] border border-[#3B342E] text-[#CEB098] text-[10px]"
              title={b.description}
            >
              {b.mcreatorType}
            </span>
          )) : (
            <span className="text-[#6E665C] italic text-[11px]">Loading database…</span>
          )}
        </div>
      </div>
    </div>
  );
};
