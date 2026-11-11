export type MCreatorElementType = 'procedure' | 'ai_task' | 'command' | 'feature';

export type NeoForgeVersion = '1.21.1' | '26.1.2';

export interface MCreatorElementConfig {
  type: MCreatorElementType;
  extension: '.ptpl' | '.aitpl' | '.cmdtpl' | '.ftpl';
  name: string;
  rootTriggerBlock: string;
  defaultXmlWrapper: string;
}

export interface VariableDecl {
  name: string;
  type: 'number' | 'logic' | 'string' | 'itemstack' | 'entity';
  initialValue?: string | number | boolean;
}

export type BlockCategory = 
  | 'event' 
  | 'control' 
  | 'logic' 
  | 'math' 
  | 'action' 
  | 'variable' 
  | 'world' 
  | 'entity' 
  | 'ai' 
  | 'command' 
  | 'command_entry'
  | 'command_param'
  | 'command_action'
  | 'command_action_any'
  | 'feature'
  | 'feature_misc'
  | 'feature_ore'
  | 'feature_tree'
  | 'feature_advanced'
  | 'feature_blocks'
  | 'feature_int_provider'
  | 'feature_placement_common'
  | 'feature_placement_height'
  | 'feature_placement_conditional'
  | 'text'
  | 'datetime'
  | 'player'
  | 'item'
  | 'block'
  | 'direction'
  | 'damage'
  | 'projectile'
  | 'vector'
  | 'mcreator_link'
  | 'advanced'
  | 'component'
  | 'gui'
  | 'code';

export interface BlockDefinition {
  id: string;
  mcreatorType: string;
  category: BlockCategory;
  title: string;
  description: string;
  supportedElements: MCreatorElementType[];
  fields?: string[];
  fieldTypes?: Record<string, string>;
  inputs?: string[];
  valueInputs?: string[];
  statementInputs?: string[];
  inputNames?: string[];
  statements?: string[];
  javaPatterns: string[];
  javaTemplateSnippet?: string;
  toolbox?: string;
  toolboxPath?: string;
  label?: string;
  tooltip?: string;
  output?: string;
  outputType?: string;
  inputChecks?: Record<string, string>;
  previousStatement?: boolean | string;
  nextStatement?: boolean | string;
  inlineInputs?: boolean;
  mutator?: string;
  extensions?: string[];
  dynamic?: boolean;
  external?: boolean;
  blockClassification?: 'built_in' | 'core_static' | 'dynamic' | 'external' | 'neoforge_1_21_1' | 'mutator_helper' | 'trigger_root';
  dependenciesRequired?: string[];
  generatorTemplate?: string;
  sourceFile?: string;
  sourceLine?: number;
}

export interface BlockASTNode {
  id: string;
  type: string;
  category: BlockCategory;
  title: string;
  fields?: Record<string, string>;
  values?: { name: string; block?: BlockASTNode }[];
  statements?: { name: string; block?: BlockASTNode }[];
  next?: BlockASTNode;
  comment?: string;
  explanation?: string;
  sourceLine?: number;
  sourceEndLine?: number;
  rawJava?: string;
  isSnippetValue?: boolean;
}

export interface DetectedMethod {
  name: string;
  signature: string;
  body: string;
  isMainProcedure: boolean;
  eventTrigger?: string;
  statementCount: number;
  startLine?: number;
  bodyStartLine?: number;
}

export interface TranslationBreakdownItem {
  javaLine: string;
  lineNumber?: number;
  blockId?: string;
  mcreatorBlock: string;
  explanation: string;
}

export interface TranslationResult {
  procedureName: string;
  elementType: MCreatorElementType;
  fileExtension: '.ptpl' | '.aitpl' | '.cmdtpl' | '.ftpl';
  targetNeoForgeVersion: NeoForgeVersion;
  eventTrigger: string;
  dependencies: string[];
  variables: VariableDecl[];
  blocklyXml: string;
  visualAST: BlockASTNode;
  translationBreakdown: TranslationBreakdownItem[];
  neoForgeVersionNotes: {
    version: NeoForgeVersion;
    compatibilityInfo: string;
    syntaxDiffs: string[];
  };
  matchedBlocksCount: number;
  warnings: string[];
  detectedMethods?: DetectedMethod[];
  activeMethodName?: string;
}
