import { MCreatorElementConfig, MCreatorElementType } from '../types';

export const ELEMENT_CONFIGS: Record<MCreatorElementType, MCreatorElementConfig> = {
  procedure: {
    type: 'procedure',
    extension: '.ptpl',
    name: 'Procedure',
    rootTriggerBlock: 'event_trigger',
    defaultXmlWrapper: 'xml',
  },
  ai_task: {
    type: 'ai_task',
    extension: '.aitpl',
    name: 'Entity AI Goal / Task',
    rootTriggerBlock: 'aitask_wrapper',
    defaultXmlWrapper: 'xml',
  },
  command: {
    type: 'command',
    extension: '.cmdtpl',
    name: 'Command Execution',
    rootTriggerBlock: 'command_trigger',
    defaultXmlWrapper: 'xml',
  },
  feature: {
    type: 'feature',
    extension: '.ftpl',
    name: 'Worldgen Feature',
    rootTriggerBlock: 'feature_container',
    defaultXmlWrapper: 'xml',
  },
};
