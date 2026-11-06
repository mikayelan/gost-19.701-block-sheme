import { useEffect, useMemo, useRef, useState } from 'react'
import { parseCode } from './lib/parser.js'
import { buildGraph } from './lib/layout.js'
import { downloadDrawio, generateDrawioXml } from './lib/drawioExporter.js'
import './App.css'

const EXAMPLES = {
  linear: {
    name: 'Линейный алгоритм',
    code: `Начало
Ввод a, b
c = a + b
Вывод c
Конец`
  },
  branch: {
    name: 'Ветвление - max из двух',
    code: `Начало
Ввод a, b
Если a > b тогда
    max = a
Иначе
    max = b
Вывод max
Конец`
  },
  loop: {
    name: 'Цикл - сумма 1..N',
    code: `Начало
Ввод N
sum = 0
Для i от 1 до N
    sum = sum + i
Вывод sum
Конец`
  },
  nested: {
    name: 'Вложенные условия',
    code: `Начало
Ввод x, y
Если x > 0 тогда
    Если y > 0 тогда
        Вывод "I четверть"
    Иначе
        Вывод "IV четверть"
Иначе
    Если y > 0 тогда
        Вывод "II четверть"
    Иначе
        Вывод "III четверть"
Конец`
  },
  python: {
    name: 'Python - факториал',
    code: `n = int(input())
fact = 1
for i in range(1, n+1):
    fact = fact * i
print(fact)`
  },
  js: {
    name: 'JavaScript - поиск минимума',
    code: `let arr = [5, 2, 9, 1, 7]
let min = arr[0]
for (let i=1; i<arr.length; i++) {
  if (arr[i] < min) {
    min = arr[i]
  }
}
console.log(min)`
  },
  complex: {
    name: 'Сложный - оценка студента',
    code: `Начало
Ввод баллы, посещаемость
Если баллы >= 90 тогда
    оценка = "Отлично"
Иначе если баллы >= 75 тогда
    Если посещаемость >= 80 тогда
        оценка = "Хорошо"
    Иначе
        оценка = "Удовлетворительно"
Иначе
    оценка = "Неуд"
Вывод оценка
Конец`
  }
}

function GostShape({ node }) {
  const { type, label, x, y, w, h } = node
  const cx = x
  const cy = y + h / 2

  // Цвета по ГОСТ с современным оттенком
  const styles = {
    terminator: { fill: '#FFF7ED', stroke: '#9A3412', strokeWidth: 2.2 },
    process: { fill: '#EFF6FF', stroke: '#1E40AF', strokeWidth: 2 },
    data: { fill: '#FEFCE8', stroke: '#854D0E', strokeWidth: 2 },
    decision: { fill: '#F0FDF4', stroke: '#166534', strokeWidth: 2 },
    preparation: { fill: '#FDF2F8', stroke: '#9D174D', strokeWidth: 2 },
    predefined: { fill: '#F5F3FF', stroke: '#5B21B6', strokeWidth: 2 },
    connector: { fill: '#F1F5F9', stroke: '#334155', strokeWidth: 2 },
  }
  const s = styles[type] || styles.process

  if (type === 'terminator') {
    const rx = h / 2
    return (
      <g>
        <rect x={x - w / 2} y={y} width={w} height={h} rx={rx} ry={rx} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="600" fill="#1F2937" fontFamily="Inter, system-ui">
          {label}
        </text>
      </g>
    )
  }
  if (type === 'process') {
    return (
      <g>
        <rect x={x - w / 2} y={y} width={w} height={h} rx="6" fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="12.5" fill="#1E293B" fontFamily="Inter, JetBrains Mono, monospace">
          {label}
        </text>
      </g>
    )
  }
  if (type === 'data') {
    const skew = 18
    const points = [
      `${x - w / 2 + skew},${y}`,
      `${x + w / 2},${y}`,
      `${x + w / 2 - skew},${y + h}`,
      `${x - w / 2},${y + h}`,
    ].join(' ')
    return (
      <g>
        <polygon points={points} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="12.5" fill="#1F2937" fontFamily="Inter">
          {label}
        </text>
      </g>
    )
  }
  if (type === 'decision') {
    // Ромб
    const points = [
      `${cx},${y}`,
      `${x + w / 2},${cy}`,
      `${cx},${y + h}`,
      `${x - w / 2},${cy}`,
    ].join(' ')
    // разбиваем длинный текст по строкам
    const words = label.split(' ')
    let line1 = '', line2 = ''
    if (label.length > 18) {
      const mid = Math.ceil(words.length / 2)
      line1 = words.slice(0, mid).join(' ')
      line2 = words.slice(mid).join(' ')
    } else {
      line1 = label
    }
    return (
      <g>
        <polygon points={points} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#14532D" fontFamily="Inter">
          {line2 ? (
            <>
              <tspan x={cx} dy="-0.6em">{line1}</tspan>
              <tspan x={cx} dy="1.2em">{line2}</tspan>
            </>
          ) : (
            line1
          )}
        </text>
      </g>
    )
  }
  if (type === 'preparation') {
    // Шестиугольник для цикла (подготовка)
    const cut = 14
    const points = [
      `${x - w / 2 + cut},${y}`,
      `${x + w / 2 - cut},${y}`,
      `${x + w / 2},${y + h / 2}`,
      `${x + w / 2 - cut},${y + h}`,
      `${x - w / 2 + cut},${y + h}`,
      `${x - w / 2},${y + h / 2}`,
    ].join(' ')
    return (
      <g>
        <polygon points={points} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#831843" fontWeight="500" fontFamily="Inter">
          {label}
        </text>
      </g>
    )
  }
  if (type === 'predefined') {
    // Прямоугольник с двумя вертикальными линиями внутри
    return (
      <g>
        <rect x={x - w / 2} y={y} width={w} height={h} rx="4" fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        <line x1={x - w / 2 + 12} y1={y} x2={x - w / 2 + 12} y2={y + h} stroke={s.stroke} strokeWidth="1.8" />
        <line x1={x + w / 2 - 12} y1={y} x2={x + w / 2 - 12} y2={y + h} stroke={s.stroke} strokeWidth="1.8" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="11.5" fill="#4C1D95" fontFamily="Inter">
          {label}
        </text>
      </g>
    )
  }
  if (type === 'connector') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={w / 2} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
      </g>
    )
  }
  // fallback
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} fill={s.fill} stroke={s.stroke} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="12">{label}</text>
    </g>
  )
}

function Edge({ from, to, label, isLoopBack }, nodesMap) {
  const a = nodesMap[from]
  const b = nodesMap[to]
  if (!a || !b) return null

  const ax = a.x
  const ay = a.y + (a.type === 'decision' ? a.h : a.h) // bottom center
  // для ромба нижняя точка = y+h
  const aBottom = a.y + a.h
  const bTop = b.y

  // Для ромба выход сбоку: ромб имеет вершины по бокам
  // но в layout мы соединяем от центра низа ромба? упростим: от нижней вершины ромба выходит вниз, а для боковых веток из боковых вершин
  // Определяем тип соединения по label и разнице X
  let path = ''
  const isBranch = a.type === 'decision' && (label === 'Да' || label === 'Нет')
  const dx = b.x - a.x
  const dy = bTop - aBottom

  if (isLoopBack) {
    // пунктирная петля слева: из низа target (?) рисуем обход слева
    // from = тело.exit -> to = header
    // Рисуем: от низа from вниз 15, влево 60, вверх к header левой стороне, затем к header левой середине
    const fx = a.x
    const fy = a.y + a.h
    const tx = b.x - b.w / 2
    const ty = b.y + b.h / 2
    path = `M ${fx} ${fy} V ${fy + 22} H ${fx - 80} V ${ty} H ${tx}`
  } else if (Math.abs(dx) < 10) {
    // вертикаль
    path = `M ${ax} ${aBottom} V ${bTop}`
  } else {
    // ортогональная с изгибом
    const midY = aBottom + dy / 2
    // Если это ветка от решения, стартуем от боковой вершины ромба
    let startX = ax
    let startY = aBottom
    if (a.type === 'decision') {
      if (dx < 0) {
        // левая ветка
        startX = a.x - a.w / 2
        startY = a.y + a.h / 2
        path = `M ${startX} ${startY} H ${b.x} V ${bTop}`
      } else {
        startX = a.x + a.w / 2
        startY = a.y + a.h / 2
        path = `M ${startX} ${startY} H ${b.x} V ${bTop}`
      }
    } else {
      // обычный изгиб вниз-вбок-вниз
      path = `M ${ax} ${aBottom} V ${aBottom + 18} H ${b.x} V ${bTop}`
    }
  }

  const isDashed = !!isLoopBack
  return (
    <g>
      <path d={path} fill="none" stroke={isDashed ? '#DC2626' : '#0F172A'} strokeWidth={isDashed ? 1.6 : 1.9} strokeDasharray={isDashed ? '6 4' : 'none'} markerEnd={isDashed ? 'url(#arrow-red)' : 'url(#arrow)'} />
      {label && (
        <g>
          <rect x={ax + (isBranch ? (label === 'Да' ? -40 : 10) : -14)} y={a.type === 'decision' ? a.y + a.h / 2 - 10 : aBottom - 2} width={label === 'Да' ? 28 : 30} height="16" rx="8" fill="white" stroke="#CBD5E1" strokeWidth="0.8" />
          <text
            x={ax + (isBranch ? (label === 'Да' ? -26 : 25) : 0)}
            y={a.type === 'decision' ? a.y + a.h / 2 + 1 : aBottom + 10}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={label === 'Да' ? '#166534' : label === 'Нет' ? '#9F1239' : '#334155'}
            fontFamily="Inter"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

export default function App() {
  const [code, setCode] = useState(EXAMPLES.branch.code)
  const [exampleKey, setExampleKey] = useState('branch')
  const [zoom, setZoom] = useState(0.85)
  const [title, setTitle] = useState('Блок-схема_ГОСТ_19.701')
  const canvasRef = useRef(null)
  const [showGrid, setShowGrid] = useState(true)
  const [strictGost, setStrictGost] = useState(false)

  const tree = useMemo(() => {
    try {
      return parseCode(code)
    } catch (e) {
      console.error(e)
      return []
    }
  }, [code])

  const graph = useMemo(() => {
    try {
      return buildGraph(tree)
    } catch (e) {
      console.error(e)
      return { nodes: [], edges: [], width: 900, height: 600 }
    }
  }, [tree])

  const nodesMap = useMemo(() => {
    const m = {}
    graph.nodes.forEach(n => (m[n.id] = n))
    return m
  }, [graph])

  const handleExampleChange = (key) => {
    setExampleKey(key)
    setCode(EXAMPLES[key].code)
    setTitle(EXAMPLES[key].name.replace(/\s+/g, '_'))
  }

  const handleDownloadDrawio = () => {
    downloadDrawio(graph, title + '.drawio')
  }

  const handleDownloadXmlView = () => {
    const xml = generateDrawioXml(graph, title)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleDownloadSVG = () => {
    if (!canvasRef.current) return
    const svgEl = canvasRef.current.querySelector('svg')
    if (!svgEl) return
    const clone = svgEl.cloneNode(true)
    const serializer = new XMLSerializer()
    const str = serializer.serializeToString(clone)
    const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = title + '.svg'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleDownloadPNG = async () => {
    if (!canvasRef.current) return
    const svgEl = canvasRef.current.querySelector('svg')
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      canvas.width = svgEl.viewBox.baseVal.width * 2
      canvas.height = svgEl.viewBox.baseVal.height * 2
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = title + '.png'
        a.click()
        URL.revokeObjectURL(pngUrl)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = url
  }

  const handleOpenInDrawio = () => {
    // Открываем app.diagrams.net, пользователь импортирует .drawio вручную
    window.open('https://app.diagrams.net/', '_blank')
  }

  // авто-зум под размер
  useEffect(() => {
    const w = window.innerWidth
    if (w < 1280) setZoom(0.65)
    else if (w < 1600) setZoom(0.85)
    else setZoom(0.95)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="badge"><span className="dot" /> ГОСТ 19.701-90 • ЕСПД</div>
          <h1>Генератор блок-схем <span>по ГОСТу — сделано Микаеляном</span></h1>
          <p className="subtitle">Кидаешь код → получаешь каноничную блок-схему + <b>.drawio</b> для diagrams.net / защиты диплома</p>
        </div>
        <div className="header-right">
          <div className="stats">
            <div><b>{graph.nodes.length}</b> блоков</div>
            <div><b>{graph.edges.length}</b> связей</div>
            <div className="status ok">● ГОСТ-совместимо</div>
          </div>
          <a className="ghost-link" href="https://app.diagrams.net/" target="_blank" rel="noreferrer">Открыть diagrams.net ↗</a>
        </div>
      </header>

      <div className="layout">
        <aside className="panel left">
          <div className="panel-head">
            <h2>1 — Исходный код</h2>
            <select value={exampleKey} onChange={e => handleExampleChange(e.target.value)} className="select">
              {Object.entries(EXAMPLES).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="editor-wrap">
            <div className="editor-toolbar">
              <span>Поддерживается: Python, JS, C++, Pascal, псевдокод (рус/eng)</span>
              <span className="lines">{code.split('\n').length} строк</span>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              placeholder="Вставь код сюда..."
              className="code-input"
            />
          </div>

          <div className="controls">
            <label className="field">
              <span>Имя файла</span>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" />
            </label>
            <div className="toggles">
              <label className="check"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Сетка</label>
              <label className="check"><input type="checkbox" checked={strictGost} onChange={e => setStrictGost(e.target.checked)} /> Строгий ч/б ГОСТ</label>
            </div>
          </div>

          <div className="action-grid">
            <button className="btn primary" onClick={handleDownloadDrawio}>⬇ Скачать .drawio</button>
            <button className="btn" onClick={handleDownloadSVG}>⬇ SVG</button>
            <button className="btn" onClick={handleDownloadPNG}>⬇ PNG</button>
            <button className="btn ghost" onClick={handleDownloadXmlView}>👁 XML предпросмотр</button>
            <button className="btn ghost" onClick={handleOpenInDrawio}>Открыть в diagrams.net</button>
          </div>

          <div className="hint">
            <h3>Как это работает?</h3>
            <ol>
              <li>Парсер 33-летнего сеньора понимает отступы, <code>{`{ }`}</code>, <code>Если/Тогда/Иначе</code>, <code>for/while</code></li>
              <li>Строит дерево → раскладывает по ГОСТ символам (ромб = решение, параллелограмм = ввод/вывод)</li>
              <li>Генерит корректный <code>.drawio</code> XML — открывается без ошибок в draw.io / diagrams.net</li>
              <li>Можно двигать блоки в draw.io после импорта — всё — группы edg'и</li>
            </ol>
            <p className="muted">Tip: пишешь <code>Ввод</code>/<code>Вывод</code> — будет параллелограмм. <code>Для ...</code> — шестиугольник. Одиночный <code>func()</code> — предопред. процесс.</p>
          </div>

          <div className="legend">
            <h3>Легенда ГОСТ 19.701-90</h3>
            <div className="legend-grid">
              <div className="leg"><span className="shape oval" /> Терминатор — начало/конец</div>
              <div className="leg"><span className="shape rect" /> Процесс — действие/вычисление</div>
              <div className="leg"><span className="shape para" /> Данные — ввод/вывод</div>
              <div className="leg"><span className="shape rhomb" /> Решение — условие (Да/Нет)</div>
              <div className="leg"><span className="shape hex" /> Подготовка — цикл for</div>
              <div className="leg"><span className="shape predef" /> Предопр. процесс — вызов</div>
              <div className="leg"><span className="shape circle" /> Соединитель</div>
            </div>
          </div>
        </aside>

        <main className="canvas-area" ref={canvasRef}>
          <div className="canvas-toolbar">
            <div className="zoom-group">
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.6, z + 0.1))}>+</button>
              <button className="reset" onClick={() => setZoom(0.85)}>Сброс</button>
            </div>
            <div className="canvas-title">
              Предпросмотр • {title}.drawio • {graph.width.toFixed(0)}×{graph.height.toFixed(0)}
            </div>
            <div className="canvas-actions">
              <span className="badge-sm">Live SVG — 1:1 как в draw.io</span>
            </div>
          </div>

          <div className={`canvas-viewport ${strictGost ? 'strict' : ''}`} style={{ background: strictGost ? '#fff' : undefined }}>
            {showGrid && <div className="grid" />}
            <div className="svg-wrap" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <svg
                width={graph.width}
                height={graph.height}
                viewBox={`0 0 ${graph.width} ${graph.height}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0F172A" />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
                  </marker>
                  <pattern id="smallGrid" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path d="M 22 0 H 0 V 22" fill="none" stroke={strictGost ? '#E5E7EB' : '#E2E8F0'} strokeWidth="0.7" />
                  </pattern>
                </defs>

                {showGrid && <rect width="100%" height="100%" fill="url(#smallGrid)" />}

                {/* Edges behind */}
                {graph.edges.map(e => (
                  <Edge key={e.id} {...e} nodesMap={nodesMap} />
                ))}

                {/* Nodes on top */}
                {graph.nodes.map(n => (
                  <GostShape key={n.id} node={n} />
                ))}
              </svg>
            </div>
          </div>

          <div className="canvas-footer">
            <span>Совет сеньора: после скачивания <b>.drawio</b> просто перетяни файл в окно <a href="https://app.diagrams.net" target="_blank" rel="noreferrer">app.diagrams.net</a> — схема откроется послойно, можно печатать по ГОСТу.</span>
          </div>
        </main>
      </div>

      <footer className="footer">
        <span>Сделано Микаеляном • ГОСТ 19.701-90 (Схемы алгоритмов, программ, данных и систем) • Символы: ГОСТ 19.003-80 • Экспорт: draw.io / diagrams.net mxfile</span>
        <span className="muted">© 2026 Микаелян • v1.0</span>
      </footer>
    </div>
  )
}
