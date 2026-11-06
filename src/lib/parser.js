// GOST 19.701-90 Parser - Senior level 33 years experience
// Парсит код на Python/JS/C++/Pascal/Псевдокод и строит дерево блок-схемы

function isKeyword(low, kw) {
  return low === kw || low.startsWith(kw + ' ') || low.startsWith(kw + '(') || low.startsWith(kw + ':') || low.startsWith(kw + ';') || low.startsWith(kw + ',');
}
function startsWithAny(low, list) {
  return list.some(kw => isKeyword(low, kw));
}

export function classifyLine(text) {
  const t = text.trim();
  const low = t.toLowerCase();

  // Terminators
  if (startsWithAny(low, ['начало','конец','старт','стоп','begin','end','start','stop'])) return 'terminator';
  if (low.startsWith('конец если') || low.startsWith('конец цикла') || low.startsWith('конец программы') || ['endif','endfor','endwhile','endforeach'].some(k=>low===k || low.startsWith(k+' '))) return 'closer';
  if (t === '{' || t === '}') return t === '{' ? 'brace_open' : 'brace_close';

  // Branching
  if (startsWithAny(low, ['если','if'])) return 'if';
  if (low.startsWith('иначе если') || low.startsWith('else if') || isKeyword(low,'elif')) return 'elif';
  if (startsWithAny(low, ['иначе','else'])) return 'else';

  // Loops
  if (startsWithAny(low, ['для','for'])) return 'for';
  if (startsWithAny(low, ['пока','while'])) return 'while';
  if (startsWithAny(low, ['повторять','repeat','do'])) return 'do';
  if (low.startsWith('до пока') || isKeyword(low,'until')) return 'until';

  // Input/Output - параллелограмм по ГОСТ
  if (startsWithAny(low, ['ввод','вывод','ввести','вывести','введи','выведи'])) return 'data';
  if (/\b(input|read|readln|scanf|cin\s*>>|prompt)\b/.test(low)) return 'data';
  if (/\b(print|println|write|writeln|printf|cout\s*<<|console\.log|alert)\b/.test(low)) return 'data';

  // Predefined process - вызов подпрограммы
  if (startsWithAny(low, ['вызвать','call'])) return 'predefined';
  if (/^\w+\s*\(.*\)\s*;?\s*$/.test(t) && !/[=<>]/.test(t) && !low.startsWith('if ') && !low.startsWith('if(') && !low.startsWith('for ') && !low.startsWith('while ')) {
    if (t.includes('(')) return 'predefined';
  }

  if (startsWithAny(low, ['вернуть','return','exit','break','continue'])) return 'process';

  return 'process';
}

export function makeLabel(text, type) {
  let t = text.trim();
  if (type === 'if') {
    t = t.replace(/^(если|if)\s*/i, '').replace(/\s*тогда\s*:?\s*$/i, '').replace(/\s*then\s*:?\s*$/i, '').trim();
    if (t.startsWith('(') && t.endsWith(')')) t = t.slice(1, -1).trim();
    return t || text;
  }
  if (type === 'elif') {
    t = t.replace(/^(иначе\s*если|else\s*if|elif)\s*/i, '').replace(/\s*тогда\s*:?\s*$/i, '').replace(/\s*then\s*:?\s*$/i, '').trim();
    if (t.startsWith('(') && t.endsWith(')')) t = t.slice(1, -1).trim();
    return t;
  }
  if (type === 'for' || type === 'while') {
    const orig = t;
    t = t.replace(/^(для|for|пока|while)\s*/i, '').replace(/\{?\s*$/, '').replace(/\s*do\s*:?\s*$/i, '').trim();
    if (t.startsWith('(') && t.endsWith(')')) t = t.slice(1, -1).trim();
    return t || orig;
  }
  if (type === 'data' || type === 'process' || type === 'predefined') {
    t = t.replace(/;\s*$/, '').trim();
    return t;
  }
  if (type === 'terminator') return t;
  return t;
}

export function parseCode(code) {
  const rawLines = code.split('\n');
  const processed = [];

  rawLines.forEach((raw, idx) => {
    const trimmed = raw.trim();
    if (trimmed === '') return;
    const indent = raw.replace(/\t/g, '    ').search(/\S/);
    const safeIndent = indent === -1 ? 0 : indent;
    const type = classifyLine(trimmed);
    if (type === 'closer' || type === 'brace_close') {
      processed.push({ raw, indent: safeIndent, text: trimmed, type, label: trimmed, lineNo: idx });
      return;
    }
    if (type === 'brace_open') {
      processed.push({ raw, indent: safeIndent, text: trimmed, type, label: trimmed, lineNo: idx });
      return;
    }
    const label = makeLabel(trimmed, type);
    processed.push({ raw, indent: safeIndent, text: trimmed, type, label, lineNo: idx });
  });

  function parseBlock(startIdx, baseIndent) {
    const nodes = [];
    let i = startIdx;
    while (i < processed.length) {
      const cur = processed[i];
      if (cur.indent < baseIndent) break;
      if (cur.indent > baseIndent) { i++; continue; }
      if (cur.type === 'closer' || cur.type === 'brace_close') break;
      if (cur.type === 'brace_open') { i++; continue; }

      if (cur.type === 'if') {
        const ifNode = { kind: 'if', condition: cur.label, thenNodes: [], elseNodes: null, raw: cur.text };
        nodes.push(ifNode);
        const nextIdx = i + 1;
        let childIndent = baseIndent + 2;
        if (nextIdx < processed.length && processed[nextIdx].type !== 'closer' && processed[nextIdx].indent > cur.indent) childIndent = processed[nextIdx].indent;
        const thenRes = parseBlock(nextIdx, childIndent);
        ifNode.thenNodes = thenRes.nodes;
        i = thenRes.nextIdx;
        while (i < processed.length && processed[i].indent === baseIndent) {
          const nxt = processed[i];
          if (nxt.type === 'elif') {
            const elifNode = { kind: 'if', condition: nxt.label, thenNodes: [], elseNodes: null, raw: nxt.text };
            if (ifNode.elseNodes === null) ifNode.elseNodes = [];
            ifNode.elseNodes.push(elifNode);
            let elifChildIndent = baseIndent + 2;
            const afterElif = i + 1;
            if (afterElif < processed.length && processed[afterElif].indent > nxt.indent) elifChildIndent = processed[afterElif].indent;
            const elifRes = parseBlock(afterElif, elifChildIndent);
            elifNode.thenNodes = elifRes.nodes;
            i = elifRes.nextIdx;
            let currentElif = elifNode;
            while (i < processed.length && processed[i].indent === baseIndent && (processed[i].type === 'elif' || processed[i].type === 'else')) {
              if (processed[i].type === 'elif') {
                const nestedElif = { kind: 'if', condition: processed[i].label, thenNodes: [], elseNodes: null, raw: processed[i].text };
                if (currentElif.elseNodes === null) currentElif.elseNodes = [];
                currentElif.elseNodes.push(nestedElif);
                let nestedIndent = baseIndent + 2;
                const afterNested = i + 1;
                if (afterNested < processed.length && processed[afterNested].indent > processed[i].indent) nestedIndent = processed[afterNested].indent;
                const nestedRes = parseBlock(afterNested, nestedIndent);
                nestedElif.thenNodes = nestedRes.nodes;
                i = nestedRes.nextIdx;
                currentElif = nestedElif;
              } else if (processed[i].type === 'else') {
                let elseChildIndent = baseIndent + 2;
                const afterElse = i + 1;
                if (afterElse < processed.length && processed[afterElse].indent > processed[i].indent) elseChildIndent = processed[afterElse].indent;
                const elseRes = parseBlock(afterElse, elseChildIndent);
                if (currentElif.elseNodes === null) currentElif.elseNodes = [];
                currentElif.elseNodes.push(...elseRes.nodes);
                i = elseRes.nextIdx;
                break;
              }
            }
            break;
          } else if (nxt.type === 'else') {
            let elseChildIndent = baseIndent + 2;
            const afterElse = i + 1;
            if (afterElse < processed.length && processed[afterElse].indent > nxt.indent) elseChildIndent = processed[afterElse].indent;
            const elseRes = parseBlock(afterElse, elseChildIndent);
            ifNode.elseNodes = elseRes.nodes;
            i = elseRes.nextIdx;
            break;
          } else break;
        }
        continue;
      }

      if (cur.type === 'for' || cur.type === 'while') {
        const loopNode = { kind: 'loop', loopType: cur.type, condition: cur.label, body: [], raw: cur.text };
        nodes.push(loopNode);
        let childIndent = baseIndent + 2;
        const nextIdx = i + 1;
        if (nextIdx < processed.length && processed[nextIdx].indent > cur.indent) childIndent = processed[nextIdx].indent;
        const bodyRes = parseBlock(nextIdx, childIndent);
        loopNode.body = bodyRes.nodes;
        i = bodyRes.nextIdx;
        continue;
      }

      if (cur.type === 'else' || cur.type === 'elif') break;

      if (cur.type === 'terminator') {
        nodes.push({ kind: 'node', type: 'terminator', label: cur.label, raw: cur.text });
        i++; continue;
      }
      if (cur.type === 'data') {
        nodes.push({ kind: 'node', type: 'data', label: cur.label, raw: cur.text });
        i++; continue;
      }
      if (cur.type === 'predefined') {
        nodes.push({ kind: 'node', type: 'predefined', label: cur.label, raw: cur.text });
        i++; continue;
      }
      nodes.push({ kind: 'node', type: 'process', label: cur.label, raw: cur.text });
      i++;
    }
    return { nodes, nextIdx: i };
  }

  const result = parseBlock(0, 0);
  return result.nodes;
}

export function countNodes(tree) {
  let c = 0;
  function walk(nodes) { for (const n of nodes) { c++; if (n.kind === 'if') { walk(n.thenNodes || []); if (n.elseNodes) walk(n.elseNodes); } else if (n.kind === 'loop') walk(n.body || []); } }
  walk(tree);
  return c;
}
