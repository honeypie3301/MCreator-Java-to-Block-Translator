import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JavaEditorPanel } from './components/JavaEditorPanel';
import { VisualBlockCanvas } from './components/VisualBlockCanvas';
import { BlocklyXmlViewer } from './components/BlocklyXmlViewer';
import { ProcedureSpecPanel } from './components/ProcedureSpecPanel';
import { BreakdownTable } from './components/BreakdownTable';
import { translateJavaToMCreator } from './lib/mcreatorConverter';
import { MCreatorElementType, NeoForgeVersion, TranslationResult } from './types';
import { Layers, FileCode, Cpu, ListCheck, Play, CheckCircle2, X } from 'lucide-react';
import { CustomDropdown } from './components/CustomDropdown';

const DEFAULT_JAVA_INPUT = `package com.backwoods.mod.procedures;

import net.neoforged.neoforge.event.tick.PlayerTickEvent;
import net.neoforged.bus.api.SubscribeEvent;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;

public class ParanoiaAudioLogicProcedure {
    @SubscribeEvent
    public void onPlayerTick(PlayerTickEvent.Post event) {
        Player player = event.getEntity();
        if (player.getHealth() < 10 || player.getFoodData().getFoodLevel() < 10) {
            if (Math.random() < 0.005) {
                if (player.level().dimension() == Backwoods) {
                    world.playSound("wood_creak_paranoia", x + Math.random()*10 - 5, y, z + Math.random()*10 - 5, 0.7f, 0.7f + Math.random()*0.3f, "ambient");
                }
            }
        }
    }
}`;

export default function App() {
  const [code, setCode] = useState<string>(DEFAULT_JAVA_INPUT);
  const [lastConvertedCode, setLastConvertedCode] = useState<string>('');
  const [targetEvent, setTargetEvent] = useState<string>('auto');
  const [elementType, setElementType] = useState<MCreatorElementType>('procedure');
  const [neoForgeVersion, setNeoForgeVersion] = useState<NeoForgeVersion>('1.21.1');

  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);

  // Line and Block Selection for Cross-Component Highlighting
  const [selectedLineNumber, setSelectedLineNumber] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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
      const res = translateJavaToMCreator(code, elementType, neoForgeVersion, targetEvent, methodToUse);
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
    setSelectedLineNumber(null);
    setSelectedBlockId(null);
  };

  // Copy XML to clipboard
  const handleCopyXml = () => {
    if (!result?.blocklyXml) return;
    navigator.clipboard.writeText(result.blocklyXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export .ptpl, .aitpl, .cmdtpl, or .ftpl
  const handleExportFile = () => {
    if (!result?.blocklyXml) return;
    const ext = result.fileExtension || '.ptpl';
    const filename = `${result.procedureName || 'MCreatorElement'}${ext}`;
    const blob = new Blob([result.blocklyXml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Selection handlers
  const handleSelectLine = (lineNumber: number) => {
    setSelectedLineNumber(lineNumber);
  };

  const handleSelectBlock = (blockId: string, sourceLine?: number) => {
    setSelectedBlockId(blockId);
    if (sourceLine) {
      setSelectedLineNumber(sourceLine);
    }
  };

  // Auto-translate on initial load and change of element type or version
  useEffect(() => {
    if (code.trim()) {
      handleTranslate(undefined, true);
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
        copied={copied}
        hasResult={!!result}
        isTranslating={isTranslating}
        fileExtension={result?.fileExtension || '.ptpl'}
      />

      {/* "Already Converted" Pop-up Alert Banner */}
      {showAlreadyConvertedToast && (
        <div className="bg-[#1e2316] border-b border-emerald-600/50 px-4 py-2.5 flex items-center justify-between text-emerald-200 text-xs shadow-md transition-all animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              <strong>Already Converted!</strong> This Java code has already been parsed and converted to MCreator Blockly blocks without any modifications.
            </span>
          </div>
          <button
            onClick={() => setShowAlreadyConvertedToast(false)}
            className="text-emerald-400 hover:text-emerald-100 p-1 rounded hover:bg-emerald-900/30 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid View */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1800px] w-full mx-auto overflow-hidden">
        {/* Left Column: Java Code Editor */}
        <div className="h-[calc(100vh-5.5rem)] min-h-[500px]">
          <JavaEditorPanel
            code={code}
            onChangeCode={(newCode) => {
              setCode(newCode);
              setSelectedMethod(undefined);
            }}
            targetEvent={targetEvent}
            onChangeTargetEvent={setTargetEvent}
            onTranslate={() => handleTranslate()}
            isTranslating={isTranslating}
            elementType={elementType}
            error={error}
            selectedLineNumber={selectedLineNumber}
            onSelectLine={handleSelectLine}
          />
        </div>

        {/* Right Column: MCreator Block Translation Canvas */}
        <div className="h-[calc(100vh-5.5rem)] min-h-[500px] flex flex-col bg-[#181614] border border-[#2E2925] rounded-lg overflow-hidden shadow-sm">
          {/* Navigation Tabs */}
          <div className="bg-[#121110] border-b border-[#2E2925] px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Visual Blocks</span>
              </button>

              <button
                onClick={() => setActiveTab('xml')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'xml'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Blockly XML ({result?.fileExtension || '.ptpl'})</span>
              </button>

              <button
                onClick={() => setActiveTab('spec')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'spec'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Element Spec</span>
              </button>

              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'breakdown'
                    ? 'bg-[#28231F] text-[#CEB098] border border-[#524438]'
                    : 'text-[#A39B8E] hover:text-[#FAF6F0] hover:bg-[#1A1816]'
                }`}
              >
                <ListCheck className="w-3.5 h-3.5" />
                <span>Line AST Mapping</span>
              </button>
            </div>

            {result && (
              <div className="flex items-center gap-2">
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
                <span className="text-[11px] font-mono text-[#CEB098] bg-[#24201D] px-2.5 py-0.5 rounded border border-[#3B342E]">
                  {result.procedureName}{result.fileExtension}
                </span>
              </div>
            )}
          </div>

          {/* Tab View Body */}
          <div className="flex-1 p-3 bg-[#0F0E0D] overflow-auto">
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
              <>
                {activeTab === 'visual' && (
                  <VisualBlockCanvas
                    ast={result.visualAST}
                    eventTrigger={result.eventTrigger}
                    procedureName={result.procedureName}
                    selectedLineNumber={selectedLineNumber}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={handleSelectBlock}
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
                    selectedLineNumber={selectedLineNumber}
                    onSelectLine={handleSelectLine}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

