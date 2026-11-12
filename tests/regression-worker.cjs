const { parentPort, workerData } = require('node:worker_threads');
const { parseExpressionToAST, translateJavaToMCreator } = require(workerData.converter);

try {
  if (workerData.expression) {
    parentPort.postMessage({ ast: parseExpressionToAST(workerData.source, 1) });
  } else {
    const result = translateJavaToMCreator(workerData.source, 'procedure', workerData.version);
    parentPort.postMessage({ ast: result.visualAST, xml: result.blocklyXml, warnings: result.warnings, trigger: result.eventTrigger });
  }
} catch (error) {
  parentPort.postMessage({ error: error.stack || String(error) });
}
