import React from 'react';
import { Blocks, Download, Copy, Check, RefreshCw, Layers } from 'lucide-react';
import { MCreatorElementType, NeoForgeVersion } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface HeaderProps {
  elementType: MCreatorElementType;
  onChangeElementType: (type: MCreatorElementType) => void;
  neoForgeVersion: NeoForgeVersion;
  onChangeNeoForgeVersion: (ver: NeoForgeVersion) => void;
  onReset: () => void;
  onExportFile: () => void;
  onCopyXml: () => void;
  copied: boolean;
  hasResult: boolean;
  isTranslating: boolean;
  fileExtension: string;
}

export const Header: React.FC<HeaderProps> = ({
  elementType,
  onChangeElementType,
  neoForgeVersion,
  onChangeNeoForgeVersion,
  onReset,
  onExportFile,
  onCopyXml,
  copied,
  hasResult,
  isTranslating,
  fileExtension,
}) => {
  return (
    <header className="border-b border-[#2A2622] bg-[#161412] px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 text-[#F5F2EB]">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-[#2A241F] border border-[#52463C] text-[#E8D8C8] flex items-center justify-center shadow-inner">
          <Blocks className="w-5 h-5 text-[#CEB098]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold tracking-tight text-[#FAF6F0]">
              MCreator Block Translator
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2A241F] text-[#CEB098] border border-[#52463C]">
              2026.1+
            </span>
          </div>
          <p className="text-xs text-[#A39B8E] hidden sm:block">
            Deterministic Java AST to Blockly Block Converter for NeoForge
          </p>
        </div>
      </div>

      {/* Selectors & Actions */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Element Type Selector (.ptpl, .aitpl, .cmdtpl, .ftpl) */}
        <CustomDropdown<MCreatorElementType>
          value={elementType}
          onChange={onChangeElementType}
          icon={<Layers className="w-3.5 h-3.5 text-[#CEB098] shrink-0" />}
          align="left"
          options={[
            { value: 'procedure', label: 'Procedure (.ptpl)', description: 'Event listener & procedural logic' },
            { value: 'ai_task', label: 'Entity AI Goals (.aitpl)', description: 'Extracts registerGoals() from Entity Java' },
            { value: 'command', label: 'Command (.cmdtpl)', description: 'Chat & console command listener' },
            { value: 'feature', label: 'Feature (.ftpl)', description: 'Worldgen feature placement' },
          ]}
        />

        {/* NeoForge Version Selector */}
        <CustomDropdown<NeoForgeVersion>
          value={neoForgeVersion}
          onChange={onChangeNeoForgeVersion}
          prefix="NeoForge:"
          mono
          align="right"
          options={[
            { value: '1.21.1', label: '1.21.1', description: 'Standard NeoForge 1.21.1 LTS syntax' },
            { value: '26.1.2', label: '26.1.2', description: 'MCreator 2026.1 modern syntax' },
          ]}
        />

        {/* Actions */}
        {hasResult && (
          <>
            <button
              onClick={onCopyXml}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#24201D] hover:bg-[#2E2925] text-[#FAF6F0] border border-[#423A33] transition flex items-center space-x-1.5"
              title="Copy MCreator Blockly XML"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#CEB098]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy XML'}</span>
            </button>

            <button
              onClick={onExportFile}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#CEB098] hover:bg-[#E2D2C3] active:bg-[#B89980] text-[#1A1816] transition flex items-center space-x-1.5 shadow-sm"
              title={`Download ${fileExtension} template for MCreator`}
            >
              <Download className="w-3.5 h-3.5 text-[#1A1816]" />
              <span>Export {fileExtension}</span>
            </button>
          </>
        )}

        <button
          onClick={onReset}
          disabled={isTranslating}
          className="p-1.5 rounded-md bg-[#1F1C19] hover:bg-[#2A2622] text-[#A39B8E] hover:text-[#FAF6F0] border border-[#3B342E] transition disabled:opacity-40"
          title="Clear Code Input"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
