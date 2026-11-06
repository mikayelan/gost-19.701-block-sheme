// Layout engine: converts parse tree -> graph with coordinates per GOST 19.701-90
let idCounter = 1;

export function buildGraph(tree, options = {}) {
  idCounter = 1;
  const nodes = []; // {id, type, label, x,y,w,h}
  const edges = []; // {id, from, to, label, style}
  const W = options.canvasWidth || 900;
  const CX = W / 2;
  const STEP_Y = 85;
  const BRANCH_DX = 220;

  const sizes = {
    terminator: { w: 170, h: 42 },
    process: { w: 180, h: 48 },
    data: { w: 180, h: 50 },
    decision: { w: 200, h: 80 },
    preparation: { w: 180, h: 48 },
    predefined: { w: 190, h: 54 },
    connector: { w: 28, h: 28 },
    comment: { w: 160, h: 44 },
  };

  function newId() {
    return 'n' + idCounter++;
  }
  function newEdgeId() {
    return 'e' + idCounter++;
  }

  function createNode(type, label, x, y) {
    const s = sizes[type] || sizes.process;
    const id = newId();
    const node = { id, type, label, x, y, w: s.w, h: s.h };
    nodes.push(node);
    return node;
  }

  // Рекурсивный layout последовательности
  function layoutSequence(seq, cx, startY) {
    if (!seq || seq.length === 0) {
      return { bottomY: startY, entryId: null, exitId: null };
    }
    let curY = startY;
    let entryId = null;
    let exitId = null;
    let prevId = null;

    for (const item of seq) {
      if (item.kind === 'node') {
        const node = createNode(item.type, item.label, cx, curY);
        if (!entryId) entryId = node.id;
        if (prevId) {
          edges.push({ id: newEdgeId(), from: prevId, to: node.id, label: '' });
        }
        prevId = node.id;
        exitId = node.id;
        curY += node.h + STEP_Y;
      } else if (item.kind === 'if') {
        // Decision node
        const decNode = createNode('decision', item.condition, cx, curY);
        if (!entryId) entryId = decNode.id;
        if (prevId) {
          edges.push({ id: newEdgeId(), from: prevId, to: decNode.id, label: '' });
        }
        prevId = null; // will be replaced by merge
        const decY = curY;
        curY += decNode.h + 45;

        // Ветки
        const leftX = cx - BRANCH_DX;
        const rightX = cx + BRANCH_DX;

        const hasThen = item.thenNodes && item.thenNodes.length > 0;
        const hasElse = item.elseNodes && item.elseNodes.length > 0;

        let thenRes = null;
        let elseRes = null;

        if (hasThen) {
          thenRes = layoutSequence(item.thenNodes, leftX, curY);
          if (thenRes.entryId) {
            edges.push({ id: newEdgeId(), from: decNode.id, to: thenRes.entryId, label: 'Да' });
          }
        } else {
          // Пустая ветка Да - создаем заглушку? Просто прямой проход без ветки
        }

        if (hasElse) {
          elseRes = layoutSequence(item.elseNodes, rightX, curY);
          if (elseRes.entryId) {
            edges.push({ id: newEdgeId(), from: decNode.id, to: elseRes.entryId, label: 'Нет' });
          }
        } else {
          // Если нет else, вторая ветка напрямую к merge
        }

        // Merge point
        let mergeY = curY;
        let maxBranchBottom = curY;
        if (thenRes) maxBranchBottom = Math.max(maxBranchBottom, thenRes.bottomY);
        if (elseRes) maxBranchBottom = Math.max(maxBranchBottom, elseRes.bottomY);
        // Если одна из веток пустая, merge чуть ниже decision
        if (!hasThen || !hasElse) {
          // хотя бы одна пустая - merge недалеко
          maxBranchBottom = Math.max(maxBranchBottom, curY + 10);
        }
        mergeY = maxBranchBottom + 35;

        const mergeNode = createNode('connector', '', cx, mergeY);
        // Соединяем ветки к merge
        if (thenRes && thenRes.exitId) {
          edges.push({ id: newEdgeId(), from: thenRes.exitId, to: mergeNode.id, label: '' });
        } else if (hasThen && thenRes && thenRes.entryId) {
          // ветка из одного узла
        } else if (!hasThen) {
          // пустая Да ветка напрямую
          edges.push({ id: newEdgeId(), from: decNode.id, to: mergeNode.id, label: 'Да', isDirectEmpty: true });
          // Но у нас уже есть Да к then, здесь дублируем? Нужно проверить
          // Удаляем дубли - если нет then, создаем прямую
          // Мы выше не создали edge для пустой, сейчас создаем
          // Однако у нас уже есть две ветки, одну мы не создали - сейчас создаем
        } else {
          // then ветка была пустая? все равно
          // если thenRes нет entry, соединяем decision напрямую
          // уже соединено?
        }

        if (elseRes && elseRes.exitId) {
          edges.push({ id: newEdgeId(), from: elseRes.exitId, to: mergeNode.id, label: '' });
        } else if (!hasElse) {
          if (hasThen) {
            // есть then, нет else => Нет напрямую к merge
            // Проверяем не дублируем ли
            const existsNo = edges.some(e => e.from === decNode.id && e.label === 'Нет');
            if (!existsNo) edges.push({ id: newEdgeId(), from: decNode.id, to: mergeNode.id, label: 'Нет', isDirectEmpty: true });
          } else {
            // обе ветки пустые - обе напрямую
            // (случай редкий)
          }
        }

        // Если обе ветки были пустые (не должно быть), decision -> merge двумя ребрами? Сделаем одно
        if (!hasThen && !hasElse) {
          // уже есть одно Да, второе не нужно
        }

        // Если одна ветка есть, а другая пустая, мы уже соединили пустую
        // Если обе есть, обе соединены через ветки

        // Для случая когда hasThen и hasElse оба false handled above

        // Корректировка: если thenRes был null, мы создали Да напрямую, аналогично для Нет
        // Проверяем дублирование: если мы создали прямую Да ранее, а thenRes существует, нет дубля

        // Следующий узел последовательности будет после merge
        entryId = entryId || decNode.id;
        prevId = mergeNode.id;
        exitId = mergeNode.id;
        curY = mergeY + mergeNode.h + 45;
      } else if (item.kind === 'loop') {
        // Loop: для for - подготовка, для while - решение
        const isFor = item.loopType === 'for';
        const headerType = isFor ? 'preparation' : 'decision';
        const headerLabel = item.condition;
        const headerNode = createNode(headerType, headerLabel, cx, curY);
        if (!entryId) entryId = headerNode.id;
        if (prevId) edges.push({ id: newEdgeId(), from: prevId, to: headerNode.id, label: '' });
        prevId = null;
        curY += headerNode.h + 40;

        // Тело цикла по центру (чуть смещаем для красоты петли)
        const bodyX = cx;
        const bodyStartY = curY;
        const bodyRes = layoutSequence(item.body, bodyX, bodyStartY);

        if (bodyRes.entryId) {
          const lbl = isFor ? '' : 'Да';
          edges.push({ id: newEdgeId(), from: headerNode.id, to: bodyRes.entryId, label: lbl });
        } else {
          // Пустое тело - петля в себя? создаем пустой переход
        }

        // Merge/exit после цикла
        let afterLoopY = bodyRes ? bodyRes.bottomY + 40 : curY + 20;
        if (!bodyRes.entryId) afterLoopY = curY + 20;

        const mergeNode = createNode('connector', '', cx, afterLoopY);

        // Выход из цикла
        if (isFor) {
          // Для for: условие заложено в заголовке, выход по завершению
          // Соединяем выход тела к заголовку (петля назад)
          if (bodyRes.exitId) {
            edges.push({ id: newEdgeId(), from: bodyRes.exitId, to: headerNode.id, label: '', isLoopBack: true });
          }
          // и заголовок к merge (выход)
          edges.push({ id: newEdgeId(), from: headerNode.id, to: mergeNode.id, label: '', loopExit: true });
        } else {
          // while: Нет -> выход
          edges.push({ id: newEdgeId(), from: headerNode.id, to: mergeNode.id, label: 'Нет' });
          if (bodyRes.exitId) {
            edges.push({ id: newEdgeId(), from: bodyRes.exitId, to: headerNode.id, label: '', isLoopBack: true });
          }
        }

        prevId = mergeNode.id;
        exitId = mergeNode.id;
        curY = afterLoopY + mergeNode.h + 45;
      }
    }

    return { bottomY: curY - STEP_Y + 20, entryId, exitId, startY };
  }

  // Добавляем терминаторы Начало/Конец автоматически, если их нет в дереве
  // Проверим, есть ли уже в начале и конце
  const hasExplicitStart = tree.length > 0 && tree[0].kind === 'node' && tree[0].type === 'terminator' && /начало|start|begin/i.test(tree[0].label);
  const hasExplicitEnd = tree.length > 0 && tree[tree.length - 1].kind === 'node' && tree[tree.length - 1].type === 'terminator' && /конец|end|stop/i.test(tree[tree.length - 1].label);

  let startNode = null;
  let endNode = null;
  let seqStartY = 20;

  if (!hasExplicitStart) {
    startNode = createNode('terminator', 'Начало', CX, seqStartY);
    seqStartY += startNode.h + STEP_Y;
  }

  // Основной layout
  const mainRes = layoutSequence(tree, CX, seqStartY);
  let overallBottom = mainRes.bottomY;

  if (startNode && mainRes.entryId) {
    edges.push({ id: newEdgeId(), from: startNode.id, to: mainRes.entryId, label: '' });
  } else if (startNode && !mainRes.entryId) {
    // пустая программа - старт к концу
    overallBottom = seqStartY;
  }

  if (!hasExplicitEnd) {
    const endY = (mainRes.exitId ? overallBottom + 55 : seqStartY + 20);
    endNode = createNode('terminator', 'Конец', CX, endY);
    if (mainRes.exitId) {
      edges.push({ id: newEdgeId(), from: mainRes.exitId, to: endNode.id, label: '' });
    } else if (startNode) {
      edges.push({ id: newEdgeId(), from: startNode.id, to: endNode.id, label: '' });
    }
    overallBottom = endY + endNode.h;
  } else {
    // есть явный конец, он уже в mainRes
    overallBottom = mainRes.bottomY + 20;
    if (startNode && !mainRes.entryId) {
      // пусто
    }
  }

  // Если дерево пустое, но мы добавили старт/конец, соединили выше

  // Вычисляем размеры canvas
  const minX = Math.min(...nodes.map(n => n.x - n.w / 2), CX - 300);
  const maxX = Math.max(...nodes.map(n => n.x + n.w / 2), CX + 300);
  const minY = Math.min(...nodes.map(n => n.y), 0);
  const maxY = Math.max(...nodes.map(n => n.y + n.h), overallBottom + 40);

  const width = maxX - minX + 80;
  const height = maxY - minY + 60;

  // Сдвигаем все к положительным координатам с отступом
  const offsetX = -minX + 40;
  const offsetY = -minY + 20;
  nodes.forEach(n => { n.x += offsetX; n.y += offsetY; });

  return { nodes, edges, width, height, offsetX, offsetY };
}
