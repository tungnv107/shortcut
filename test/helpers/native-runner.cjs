// A deliberately small model of the native action subset, for regression tests.
// This is NOT Apple's Shortcuts runtime and does not verify device permissions/UI.
async function runWorkflow(workflow, { input, prompt, choose = items => items[0], request, save = () => {} }) {
  const values = new Map(); const variables = new Map();
  const alerts = []; const notifications = []; const requests = []; const saved = [];
  const actions = workflow.WFWorkflowActions;
  const array = value => value == null || value === '' ? [] : Array.isArray(value) ? value : [value];
  const stringify = value => array(value).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('\n');
  // Text slots do not accept every serialization that generic variable slots do.
  // A bare attachment in Get URLs can appear disconnected after iOS import.
  const textSlot = value => typeof value === 'string' || value?.WFSerializationType === 'WFTextTokenString'
    ? stringify(resolve(value)) : '';
  function resolve(value) {
    if (value == null || typeof value !== 'object') return value;
    if (value.WFSerializationType === 'WFTextTokenAttachment') return resolve(value.Value);
    if (value.WFSerializationType === 'WFTextTokenString') {
      let str = value.Value.string;
      const replacements = Object.entries(value.Value.attachmentsByRange || {}).map(([range, item]) => [Number(range.match(/\d+/)[0]), item]);
      for (const [i, item] of replacements.sort((a,b) => b[0] - a[0])) str = str.slice(0,i) + stringify(resolve(item)) + str.slice(i+1);
      return str;
    }
    if (value.Type === 'ExtensionInput') return input;
    if (value.Type === 'ActionOutput') return values.get(value.OutputUUID);
    if (value.Type === 'Variable') return value.Variable ? resolve(value.Variable) : variables.get(value.VariableName);
    throw new Error('Unsupported token: ' + JSON.stringify(value));
  }
  const stopped = Symbol('Stop');
  const blocks = new Map(); const stack = [];
  actions.forEach((a,i) => {
    const p = a.WFWorkflowActionParameters;
    if (p.WFControlFlowMode === 0) stack.push({start:i});
    if (p.WFControlFlowMode === 1) stack.at(-1).otherwise = i;
    if (p.WFControlFlowMode === 2) { const b = stack.pop(); blocks.set(b.start, {...b,end:i}); }
  });
  async function run(start, end) {
    for (let i = start; i < end; i++) {
      const a = actions[i], p = a.WFWorkflowActionParameters;
      const id = a.WFWorkflowActionIdentifier.replace('is.workflow.actions.', '');
      let out;
      if (id === 'conditional') {
        const b = blocks.get(i), x = resolve(p.WFInput), expected = p.WFConditionalActionString ?? p.WFNumberValue;
        const yes = ({100:()=>array(x).length>0,101:()=>array(x).length===0,4:()=>x===expected,5:()=>x!==expected,2:()=>Number(x)>Number(expected)})[p.WFCondition]();
        if (yes) await run(i+1,b.otherwise ?? b.end);
        else if (b.otherwise != null) await run(b.otherwise+1,b.end);
        i = b.end; continue;
      }
      if (id === 'repeat.each') {
        const b = blocks.get(i), previous = variables.get('Repeat Item');
        for (const item of array(resolve(p.WFInput))) { variables.set('Repeat Item',item); await run(i+1,b.end); }
        variables.set('Repeat Item',previous); i = b.end; continue;
      }
      switch (id) {
        case 'comment': case 'nothing': break;
        case 'setvariable': out = resolve(p.WFInput); variables.set(p.WFVariableName,out); break;
        case 'appendvariable': out = [...array(variables.get(p.WFVariableName)),...array(resolve(p.WFInput))]; variables.set(p.WFVariableName,out); break;
        case 'gettext': out = resolve(p.WFTextActionText); break;
        case 'ask': out = prompt; break;
        case 'detect.link': out = textSlot(p.WFInput).match(/https?:\/\/[^\s<>"\u201d]+/gi) || []; break;
        case 'text.match': out = stringify(resolve(p.text)).match(new RegExp(p.WFMatchTextPattern,p.WFMatchTextCaseSensitive ? 'g':'gi')) || []; break;
        case 'text.replace': out = stringify(resolve(p.WFInput)).replace(new RegExp(p.WFReplaceTextFind,p.WFReplaceTextCaseSensitive ? 'g':'gi'),resolve(p.WFReplaceTextReplace)); break;
        case 'getvalueforkey': out = resolve(p.WFInput)?.[p.WFDictionaryKey]; break;
        case 'getitemfromlist': out = array(resolve(p.WFInput))[0]; break;
        case 'geturlcomponent': out = new URL(resolve(p.WFURL)).hostname; break;
        case 'urlencode': out = encodeURIComponent(resolve(p.WFInput)); break;
        case 'count': out = array(resolve(p.Input)).length; break;
        case 'choosefromlist': out = choose(array(resolve(p.WFInput))); break;
        case 'downloadurl': {
          const url = resolve(p.WFURL); const headers = {};
          for(const item of p.WFHTTPHeaders?.Value.WFDictionaryFieldValueItems || []) headers[resolve(item.WFKey)] = resolve(item.WFValue);
          requests.push({url,headers}); out = await request(url,headers); break;
        }
        case 'savetocameraroll': out = resolve(p.WFInput); await save(out); saved.push(out); break;
        case 'notification': notifications.push(resolve(p.WFNotificationActionBody)); break;
        case 'alert': alerts.push(resolve(p.WFAlertActionMessage)); break;
        case 'exit': throw stopped;
        default: throw new Error('Unmodelled action: ' + id);
      }
      values.set(p.UUID,out);
    }
  }
  try { await run(0,actions.length); }
  catch (error) { if (error !== stopped) throw error; }
  return { alerts, notifications, requests, saved };
}
module.exports = { runWorkflow };
