import React from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

interface BlocklyXmlViewerProps {
  xml: string;
  procedureName?: string;
  fileExtension: string;
  onCopyXml: () => void;
  onExportPt: () => void;
  copied: boolean;
}

export const BlocklyXmlViewer: React.FC<BlocklyXmlViewerProps> = ({
  xml,
  procedureName,
  fileExtension,
  onCopyXml,
  onExportPt,
  copied,
}) => {
  const lines = xml.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#181614] border border-[#2E2925] rounded-lg overflow-hidden font-mono text-xs shadow-sm">
      {/* Bar */}
      <div className="bg-[#121110] px-3 py-2 border-b border-[#2E2925] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-[#CEB098]" />
          <span className="font-semibold text-[#FAF6F0]">
            MCreator 2026.1 Blockly XML ({fileExtension})
          </span>
          <span className="text-[10px] bg-[#24201D] text-[#CEB098] px-2 py-0.5 rounded border border-[#3B342E]">
            {procedureName || 'Element'}{fileExtension}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCopyXml}
            className="px-2.5 py-1 bg-[#24201D] hover:bg-[#2E2925] text-[#FAF6F0] border border-[#3B342E] rounded transition flex items-center space-x-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#CEB098]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy XML'}</span>
          </button>

          <button
            onClick={onExportPt}
            className="px-2.5 py-1 bg-[#CEB098] hover:bg-[#E2D2C3] text-[#121110] font-semibold rounded transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-[#121110]" />
            <span>Download {fileExtension}</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="flex-1 bg-[#0F0E0D] p-3 overflow-auto flex">
        <div className="select-none pr-3 text-[#5C554D] border-r border-[#24201D] text-right min-w-[2.5rem] font-mono text-[11px] leading-5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <pre className="pl-3 text-[#E8D8C8] font-mono text-xs leading-5 whitespace-pre selection:bg-[#CEB098]/30 overflow-x-auto">
          {xml}
        </pre>
      </div>

      {/* Footer Info */}
      <div className="bg-[#121110] px-3 py-1.5 border-t border-[#2E2925] text-[11px] text-[#A39B8E] flex items-center justify-between">
        <span className="flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#CEB098]" />
          <span>Valid MCreator 2026.1 Blockly XML Structure</span>
        </span>
        <span>Ready for import into MCreator Workspace</span>
      </div>
    </div>
  );
};
