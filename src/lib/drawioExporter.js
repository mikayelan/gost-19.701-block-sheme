// Генерация .drawio XML по ГОСТ 19.701-90
export function generateDrawioXml(graph, title = 'Блок-схема по ГОСТ 19.701-90') {
  const { nodes, edges, width, height } = graph;

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#xa;');

  // Стили по ГОСТ
  function styleFor(node) {
    const base = 'whiteSpace=wrap;html=1;strokeWidth=2;strokeColor=#111827;';
    switch (node.type) {
      case 'terminator':
        // Овал - терминатор (начало/конец)
        return base + 'ellipse;fillColor=#FFF7ED;strokeColor=#9A3412;';
      case 'process':
        // Прямоугольник - процесс
        return base + 'rounded=0;fillColor=#EFF6FF;strokeColor=#1E40AF;';
      case 'data':
        // Параллелограмм - ввод/вывод
        return base + 'shape=parallelogram;fillColor=#FEFCE8;strokeColor=#854D0E;';
      case 'decision':
        // Ромб - решение
        return base + 'rhombus;fillColor=#F0FDF4;strokeColor=#166534;';
      case 'preparation':
        // Шестиугольник - подготовка (цикл for)
        return base + 'shape=hexagon;fillColor=#FDF2F8;strokeColor=#9D174D;';
      case 'predefined':
        // Предопределенный процесс - прямоугольник с полосами
        return base + 'shape=process;whiteSpace=wrap;backgroundOutline=1;fillColor=#F5F3FF;strokeColor=#5B21B6;';
      case 'connector':
        // Соединитель - окружность малая
        return base + 'ellipse;fillColor=#F1F5F9;strokeColor=#334155;aspect=fixed;';
      default:
        return base + 'rounded=0;fillColor=#ffffff;';
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<mxfile host="app.diagrams.net" version="21.1.2" type="device">\n`;
  xml += `  <diagram name="${esc(title)}" id="gost-19-701-${Date.now()}">\n`;
  xml += `    <mxGraphModel dx="1422" dy="768" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${Math.ceil(width)}" pageHeight="${Math.ceil(height)}" math="0" shadow="0">\n`;
  xml += `      <root>\n`;
  xml += `        <mxCell id="0"/>\n`;
  xml += `        <mxCell id="1" parent="0"/>\n`;

  // Вершины
  for (const n of nodes) {
    const val = n.label ? esc(n.label) : '';
    // Для коннектора без текста оставляем пусто
    const style = styleFor(n);
    const x = Math.round(n.x - n.w / 2);
    const y = Math.round(n.y);
    const w = Math.round(n.w);
    const h = Math.round(n.h);
    xml += `        <mxCell id="${n.id}" value="${val}" style="${style}" vertex="1" parent="1">\n`;
    xml += `          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/>\n`;
    xml += `        </mxCell>\n`;
  }

  // Ребра
  for (const e of edges) {
    const lbl = e.label ? esc(e.label) : '';
    // Orthogonal с закруглением
    let edgeStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#0F172A;endArrow=block;endFill=1;';
    if (e.isLoopBack) {
      edgeStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=1.8;strokeColor=#DC2626;endArrow=block;endFill=1;dashed=1;';
    }
    xml += `        <mxCell id="${e.id}" value="${lbl}" style="${edgeStyle}" edge="1" parent="1" source="${e.from}" target="${e.to}">\n`;
    xml += `          <mxGeometry relative="1" as="geometry"/>\n`;
    xml += `        </mxCell>\n`;
  }

  xml += `      </root>\n`;
  xml += `    </mxGraphModel>\n`;
  xml += `  </diagram>\n`;
  xml += `</mxfile>\n`;

  return xml;
}

export function downloadDrawio(graph, filename = 'blok-shema_GOST_19.701.drawio') {
  const xml = generateDrawioXml(graph);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return xml;
}
