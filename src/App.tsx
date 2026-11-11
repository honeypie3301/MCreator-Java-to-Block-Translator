import React, { useState, useEffect, Suspense, lazy } from 'react';
import * as pako from 'pako';
import { Header } from './components/Header';
import { JavaEditorPanel } from './components/JavaEditorPanel';
import { translateJavaToMCreator } from './lib/mcreatorConverter';
import { MCreatorElementType, NeoForgeVersion, TranslationResult } from './types';
import { Layers, FileCode, Cpu, ListCheck, Play, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { CustomDropdown } from './components/CustomDropdown';

import { BlockLibraryModal } from './components/BlockLibraryModal';

const VisualBlockCanvas = lazy(() => import('./components/VisualBlockCanvas').then(m => ({ default: m.VisualBlockCanvas })));
const BlocklyXmlViewer = lazy(() => import('./components/BlocklyXmlViewer').then(m => ({ default: m.BlocklyXmlViewer })));
const ProcedureSpecPanel = lazy(() => import('./components/ProcedureSpecPanel').then(m => ({ default: m.ProcedureSpecPanel })));
const BreakdownTable = lazy(() => import('./components/BreakdownTable').then(m => ({ default: m.BreakdownTable })));

const DEFAULT_JAVA_INPUT = `package net.mcreator.thebackwoods.procedures;

/* imports omitted */

public class SharpenedSplinterShardItemInInventoryTickProcedure {
	public static void execute(LevelAccessor world, Entity entity) {
		if (entity == null)
			return;
		if (world.getLevelData().getGameTime() % 160 == 0) {
			if (entity instanceof LivingEntity && !(entity instanceof LivingEntity _livEnt1 && _livEnt1.hasEffect(TheBackwoodsModMobEffects.INOCULATION_EFFECT))) {
				entity.hurt(new DamageSource(world.holderOrThrow(DamageTypes.THORNS)), (float) 0.08);
			}
		}
	}
}`;

export default function App() {
  const [code, setCode] = useState<string>(DEFAULT_JAVA_INPUT);
  const [lastConvertedCode, setLastConvertedCode] = useState<string>('');
  const [elementType, setElementType] = useState<MCreatorElementType>('procedure');
  const [neoForgeVersion, setNeoForgeVersion] = useState<NeoForgeVersion>('1.21.1');

  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);
  const [isBlockLibraryOpen, setIsBlockLibraryOpen] = useState<boolean>(false);

  // "Already Converted" Popup State
  const [showAlreadyConvertedToast, setShowAlreadyConvertedToast] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'visual' | 'xml' | 'spec' | 'breakdown'>('visual');

  // Convert Java code to MCreator Blockly XML deterministically
  const handleTranslate = (methodOverride?: string, force?: boolean) => {
    if (!code.trim()) return;

    // Check if code has already been converted without changes
    const methodToUse = methodOverride !== undefined ? methodOverride : selectedMethod;
    if (
      !force &&
      result &&
      code.trim() === lastConvertedCode.trim() &&
      methodToUse === selectedMethod
    ) {
      setShowAlreadyConvertedToast(true);
      setTimeout(() => setShowAlreadyConvertedToast(false), 4000);
      return;
    }

    setIsTranslating(true);
    setError(null);
    setShowAlreadyConvertedToast(false);

    try {
      // Deterministic AST & Blockly XML conversion based on MCreator GitHub database
      const res = translateJavaToMCreator(code, elementType, neoForgeVersion, 'auto', methodToUse);
      setResult(res);
      setLastConvertedCode(code);
      if (res.activeMethodName) {
        setSelectedMethod(res.activeMethodName);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to convert Java code into MCreator Blockly XML.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Reset editor code
  const handleReset = () => {
    setCode('');
    setLastConvertedCode('');
    setResult(null);
    setError(null);
  };

  // Copy XML to clipboard
  const handleCopyXml = () => {
    if (!result?.blocklyXml) return;
    navigator.clipboard.writeText(result.blocklyXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export native MCreator .ptpl, .aitpl, .cmdtpl, or .ftpl template files (XML -> Base64 -> GZip)
  const handleExportFile = () => {
    if (!result?.blocklyXml) return;
    const ext = result.fileExtension || '.ptpl';
    const filename = `${result.procedureName || 'MCreatorElement'}${ext}`;
    
    try {
      const xmlText = result.blocklyXml;
      const b64Text = btoa(unescape(encodeURIComponent(xmlText)));
      const compressedGzip = pako.gzip(b64Text);

      const blob = new Blob([compressedGzip], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export GZip template file:', err);
      const blob = new Blob([result.blocklyXml], { type: 'text/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  // Auto-translate on initial load and change of element type or version
  const isFirstMount = React.useRef(true);

  // Initial load auto-translate — deferred so UI paints first
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim()) handleTranslate(undefined, true);
    }, 50);
    return () => clearTimeout(timer);
  }, []); // only on mount

  // Re-translate when element type or version changes (skip the very first mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (code.trim()) {
      const timer = setTimeout(() => handleTranslate(undefined, true), 0);
      return () => clearTimeout(timer);
    }
  }, [elementType, neoForgeVersion]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#121110] text-[#F5F2EB]">
      {/* Top Header */}
      <Header
        elementType={elementType}
        onChangeElementType={setElementType}
        neoForgeVersion={neoForgeVersion}
        onChangeNeoForgeVersion={setNeoForgeVersion}
        onReset={handleReset}
        onExportFile={handleExportFile}
        onCopyXml={handleCopyXml}
        onOpenBlockLibrary={() => setIsBlockLibraryOpen(true)}
        copied={copied}
        hasResult={!!result}
        isTranslating={isTranslating}
        fileExtension={result?.fileExtension || '.ptpl'}
      />

      {/* Block Library Modal */}
      <BlockLibraryModal
        isOpen={isBlockLibraryOpen}
        onClose={() => setIsBlockLibraryOpen(false)}
      />

      {/* "Already Converted" Pop-up Alert Banner */}
      {showAlreadyConvertedToast && (
        <div className="bg-[#1e2316] border-b border-emerald-600/50 px-3 py-1.5 flex items-center justify-between gap-2 text-emerald-200 text-xs min-w-0 shadow-md transition-all animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium text-[11px]">
              <strong>Already Converted!</strong> This Java code has already been parsed and converted to MCreator Blockly blocks without any modifications.
            </span>
          </div>
          <button
            onClick={() => setShowAlreadyConvertedToast(false)}
            className="text-emerald-400 hover:text-emerald-100 p-0.5 rounded hover:bg-emerald-900/30 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feature (.ftpl) Single Window Warning Banner */}
      {elementType === 'feature' && (
        <div className="bg-[#2a1d18] border-b border-amber-600/50 px-3 py-1.5 flex items-center justify-between gap-2 text-amber-200 text-xs min-w-0 flex-wrap sm:flex-nowrap shadow-md transition-all animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium text-[11px]">
              <strong>Feature (.ftpl) Unsupported in Single Window:</strong> Minecraft 1.20+ features require dual JSON definitions (Configured & Placed Feature). Multi-file feature conversion is not supported in a single input window.
            </span>
          </div>
          <button
            onClick={() => setElementType('procedure')}
            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded font-mono text-[10px] transition cursor-pointer shrink-0 ml-2"
          >
            Switch to Procedure (.ptpl)
          </button>
        </div>
      )}

      {/* Main Grid View - Responsive Layout */}
      <main className="flex-1 p-1.5 sm:p-2.5 grid grid-cols-1 lg:grid-cols-12 gap-2.5 max-w-[1920px] w-full mx-auto min-h-0 lg:h-[calc(100vh-3.2rem)]">
        {/* Left Column: Java Code Editor */}
        <div className="lg:col-span-5 flex flex-col h-[520px] lg:h-full min-h-[380px]">
          <JavaEditorPanel
            code={code}
            onChangeCode={(newCode) => {
              setCode(newCode);
              setSelectedMethod(undefined);
            }}
            onTranslate={() => handleTranslate()}
            isTranslating={isTranslating}
            elementType={elementType}
            error={error}
          />
        </div>

        {/* Right Column: MCreator Block Translation Canvas */}
        <div className="lg:col-span-7 flex flex-col h-[560px] lg:h-full min-h-[420px] bg-[#181614] border border-[#2E2925] rounded-lg overflow-hidden shadow-sm">
          {/* Navigation Tabs - Responsive */}
          <div className="bg-[#121110] border-b border-[#2E2925] px-2.5 py-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs min-w-0">
            {/* Horizontal Scrollable Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto min-w-0 scrollbar-none py-0.5 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Visual Blocks</span>
                <span className="sm:hidden">Visual</span>
              </button>

              <button
                onClick={() => setActiveTab('xml')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'xml'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Blockly XML ({result?.fileExtension || '.ptpl'})</span>
                <span className="sm:hidden">XML ({result?.fileExtension || '.ptpl'})</span>
              </button>

              <button
                onClick={() => setActiveTab('spec')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'spec'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Element Spec</span>
                <span className="sm:hidden">Spec</span>
              </button>

              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === 'breakdown'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <ListCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Line AST Mapping</span>
                <span className="sm:hidden">AST</span>
              </button>
            </div>

            {/* Right: Method selector & Procedure Name Pill */}
            {result && (
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 min-w-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-[#221E1B]">
                {result.detectedMethods && result.detectedMethods.length > 1 && (
                  <CustomDropdown
                    value={result.activeMethodName || result.detectedMethods[0]?.signature}
                    onChange={(m) => {
                      setSelectedMethod(m);
                      handleTranslate(m, true);
                    }}
                    prefix="Method:"
                    mono
                    align="right"
                    options={result.detectedMethods.map((m) => {
                      const isDelegator = /^execute\s*\([\s\S]*?\);?$/.test(m.body.trim().replace(/\/\/.*$/gm, '').trim());
                      let badge = '';
                      if (m.isMainProcedure) badge = '★ Procedure Logic';
                      else if (isDelegator) badge = 'Bridge -> execute';
                      return {
                        value: m.signature,
                        label: `${m.name} (${m.statementCount} stmts)${m.isMainProcedure ? ' ★' : ''}`,
                        description: badge ? `${badge} • ${m.signature}` : m.signature,
                      };
                    })}
                  />
                )}
                <span
                  className="text-[11px] font-mono text-[#CEB098] bg-[#24201D] px-2.5 py-0.5 rounded border border-[#3B342E] truncate max-w-[200px] sm:max-w-[260px] md:max-w-[340px] shrink min-w-0 shadow-xs"
                  title={`${result.procedureName}${result.fileExtension}`}
                >
                  {result.procedureName}{result.fileExtension}
                </span>
              </div>
            )}
          </div>
          {/* Tab View Body */}
          <div className="flex-1 p-3 bg-[#0F0E0D] overflow-auto min-h-0 flex flex-col">
            {isTranslating ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <div className="w-8 h-8 border-2 border-[#CEB098]/30 border-t-[#CEB098] rounded-full animate-spin" />
                <p className="text-xs font-mono text-[#FAF6F0]">
                  Converting Java AST to MCreator 2026.1 Blockly XML...
                </p>
              </div>
            ) : !result ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#8C857B] font-mono text-xs space-y-2 py-12">
                <Play className="w-8 h-8 text-[#5C554D]" />
                <p>Input your Java code and click "Convert Code to Blocks".</p>
              </div>
            ) : (
              <Suspense fallback={
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12 text-[#A39B8E]">
                  <div className="w-6 h-6 border-2 border-[#CEB098]/30 border-t-[#CEB098] rounded-full animate-spin" />
                  <span className="text-xs font-mono">Loading workspace view...</span>
                </div>
              }>
                {activeTab === 'visual' && (
                  <VisualBlockCanvas
                    ast={result.visualAST}
                    eventTrigger={result.eventTrigger}
                    procedureName={result.procedureName}
                  />
                )}

                {activeTab === 'xml' && (
                  <BlocklyXmlViewer
                    xml={result.blocklyXml}
                    procedureName={result.procedureName}
                    fileExtension={result.fileExtension}
                    onCopyXml={handleCopyXml}
                    onExportPt={handleExportFile}
                    copied={copied}
                  />
                )}

                {activeTab === 'spec' && <ProcedureSpecPanel result={result} />}

                {activeTab === 'breakdown' && (
                  <BreakdownTable
                    breakdown={result.translationBreakdown}
                  />
                )}
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

