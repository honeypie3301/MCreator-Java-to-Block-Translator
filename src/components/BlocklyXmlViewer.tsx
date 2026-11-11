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
      <div className="bg-[#121110] px-3 py-2 border-b border-[#2E2925] flex items-center justify-between gap-3 min-w-0 flex-wrap sm:flex-nowrap text-xs">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
          <FileCode className="w-4 h-4 text-[#CEB098] shrink-0" />
          <span className="font-semibold text-[#FAF6F0] shrink-0 hidden sm:inline whitespace-nowrap">
            MCreator 2026.1 Blockly XML
          </span>
          <span
            className="text-[10px] bg-[#24201D] text-[#CEB098] px-2.5 py-0.5 rounded border border-[#3B342E] truncate max-w-[200px] sm:max-w-[320px] md:max-w-[480px] shrink min-w-0 font-mono shadow-xs"
            title={`${procedureName || "Element"}${fileExtension}`}
          >
            {procedureName || "Element"}{fileExtension}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            onClick={onCopyXml}
            className="px-2.5 py-1 bg-[#24201D] hover:bg-[#2E2925] text-[#FAF6F0] border border-[#3B342E] rounded transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            title="Copy MCreator Blockly XML to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#CEB098]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="whitespace-nowrap">{copied ? "Copied" : "Copy XML"}</span>
          </button>

          <button
            onClick={onExportPt}
            className="px-2.5 py-1 bg-[#CEB098] hover:bg-[#E2D2C3] active:bg-[#B89980] text-[#121110] font-semibold rounded transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            title={`Download ${fileExtension} template for MCreator`}
          >
            <Download className="w-3.5 h-3.5 text-[#121110]" />
            <span className="whitespace-nowrap">Download {fileExtension}</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="flex-1 min-h-0 bg-[#0F0E0D] overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-auto flex select-text font-mono text-xs leading-5">
          {/* Synchronized Line Numbers Gutter */}
          <div className="select-none py-3 px-3 text-[#5C554D] bg-[#141210] border-r border-[#24201D] text-right min-w-[3.2rem] font-mono text-[11px] leading-5 shrink-0 sticky left-0 z-10">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* XML Code Body with Syntax Coloring */}
          <pre className="py-3 px-4 text-[#E8D8C8] font-mono text-xs leading-5 whitespace-pre selection:bg-[#CEB098]/30 overflow-visible flex-1">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="hover:bg-[#1A1816]/70 px-1 rounded-sm">
                  {highlightXmlLine(line)}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-[#121110] px-3 py-1.5 border-t border-[#2E2925] text-[11px] text-[#A39B8E] flex items-center justify-between shrink-0">
        <span className="flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#CEB098]" />
          <span>Valid MCreator 2026.1 Blockly XML Structure</span>
        </span>
        <span>Ready for import into MCreator Workspace</span>
      </div>
    </div>
  );
};

function highlightXmlLine(line: string): React.ReactNode {
  // Simple, safe XML token highlighting for tags, attributes, and text
  const parts: React.ReactNode[] = [];
  const regex = /(<\/?[a-zA-Z0-9_:-]+)|(\s+[a-zA-Z0-9_:-]+=)|("[^"]*")|(\/?>)|([^<]+)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    const [full, tag, attr, str, closing, text] = match;

    if (tag) {
      parts.push(<span key={match.index} className="text-[#E06C75] font-semibold">{tag}</span>);
    } else if (attr) {
      const eqIdx = attr.indexOf('=');
      const attrName = attr.substring(0, eqIdx);
      parts.push(
        <span key={match.index}>
          <span className="text-[#D19A66]">{attrName}</span>=
        </span>
      );
    } else if (str) {
      parts.push(<span key={match.index} className="text-[#98C379]">{str}</span>);
    } else if (closing) {
      parts.push(<span key={match.index} className="text-[#E06C75] font-semibold">{closing}</span>);
    } else if (text) {
      parts.push(<span key={match.index} className="text-[#E5C07B]">{text}</span>);
    } else {
      parts.push(full);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts.length > 0 ? parts : ' ';
}
