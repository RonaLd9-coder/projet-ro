import { useState, useRef, useCallback, useEffect } from 'react';

const COLORS = ['#6c63ff','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'];
const NODE_R = 22;

export default function GraphEditor({ vertices, onArcsChange }) {
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState(() => initNodes(vertices));
  const [arcs, setArcs] = useState([]);
  const [selecting, setSelecting] = useState(null); // first clicked node id
  const [dragging, setDragging] = useState(null);   // { id, offsetX, offsetY }
  const [popup, setPopup] = useState(null);         // { from, to, x, y }
  const [arcValue, setArcValue] = useState('');
  const [hovered, setHovered] = useState(null);

  // Re-init nodes when vertex count changes
  useEffect(() => {
    setNodes(initNodes(vertices));
    setArcs([]);
    setSelecting(null);
  }, [vertices]);

  // Notify parent
  useEffect(() => {
    onArcsChange(arcs);
  }, [arcs]);

  function initNodes(n) {
    const cx = 300, cy = 200, r = 140;
    return Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return { id: i + 1, x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)) };
    });
  }

  // ── Drag nodes ────────────────────────────────────────────────────────
  function onMouseDown(e, id) {
    e.stopPropagation();
    if (popup) return;
    const svg = svgRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === id);
    setDragging({ id, offsetX: e.clientX - svg.left - node.x, offsetY: e.clientY - svg.top - node.y });
  }

  function onMouseMove(e) {
    if (!dragging) return;
    const svg = svgRef.current.getBoundingClientRect();
    const x = Math.max(NODE_R, Math.min(600 - NODE_R, e.clientX - svg.left - dragging.offsetX));
    const y = Math.max(NODE_R, Math.min(400 - NODE_R, e.clientY - svg.top - dragging.offsetY));
    setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x, y } : n));
  }

  function onMouseUp() { setDragging(null); }

  // ── Click to select / connect ─────────────────────────────────────────
  function onNodeClick(e, id) {
    e.stopPropagation();
    if (dragging) return;

    if (!selecting) {
      setSelecting(id);
      return;
    }
    if (selecting === id) { setSelecting(null); return; }

    // Show popup to enter arc value
    const svg = svgRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === id);
    setPopup({
      from: selecting, to: id,
      x: node.x, y: node.y,
    });
    setArcValue('');
    setSelecting(null);
  }

  function confirmArc() {
    const v = parseFloat(arcValue);
    if (isNaN(v) || v < 0) return;
    setArcs(prev => {
      // Replace if exists
      const filtered = prev.filter(a => !(a.from === popup.from && a.to === popup.to));
      return [...filtered, { from: popup.from, to: popup.to, value: v }];
    });
    setPopup(null);
  }

  function removeArc(from, to) {
    setArcs(prev => prev.filter(a => !(a.from === from && a.to === to)));
  }

  function cancelPopup() { setPopup(null); }

  // Arrow marker id
  const markerId = 'arrow-editor';

  return (
    <div className="graph-editor">
      <div className="editor-hint">
        {selecting
          ? <span className="hint-active">✦ x{selecting} sélectionné — cliquez sur un autre sommet pour tracer un arc</span>
          : <span>Cliquez sur un sommet pour commencer · Glissez pour déplacer</span>
        }
      </div>

      <svg
        ref={svgRef}
        width="600" height="400"
        className="editor-svg"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={() => { setSelecting(null); }}
      >
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c63ff" />
          </marker>
          <marker id="arrow-hover" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Arcs */}
        {arcs.map((arc, i) => {
          const from = nodes.find(n => n.id === arc.from);
          const to   = nodes.find(n => n.id === arc.to);
          if (!from || !to) return null;
          const isHov = hovered === `${arc.from}-${arc.to}`;
          const { x1, y1, x2, y2, mx, my } = calcArcPoints(from, to, nodes, arcs);
          return (
            <g key={i}
              onMouseEnter={() => setHovered(`${arc.from}-${arc.to}`)}
              onMouseLeave={() => setHovered(null)}
              onClick={e => { e.stopPropagation(); if (confirm(`Supprimer arc x${arc.from}→x${arc.to} (${arc.value}) ?`)) removeArc(arc.from, arc.to); }}
              style={{ cursor: 'pointer' }}
            >
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isHov ? '#f59e0b' : '#6c63ff'}
                strokeWidth={isHov ? 2.5 : 1.8}
                markerEnd={`url(#${isHov ? 'arrow-hover' : markerId})`}
                opacity={isHov ? 1 : 0.7}
              />
              {/* Value label */}
              <circle cx={mx} cy={my} r="11" fill="#1a1d27" stroke={isHov ? '#f59e0b' : '#6c63ff'} strokeWidth="1.2" />
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill={isHov ? '#f59e0b' : '#a78bfa'} fontWeight="700">
                {arc.value}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const isSelecting = selecting === node.id;
          const color = COLORS[i % COLORS.length];
          return (
            <g key={node.id}
              onMouseDown={e => onMouseDown(e, node.id)}
              onClick={e => onNodeClick(e, node.id)}
              style={{ cursor: dragging?.id === node.id ? 'grabbing' : 'grab' }}
            >
              {isSelecting && (
                <circle cx={node.x} cy={node.y} r={NODE_R + 8}
                  fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 3" opacity="0.8">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={node.x} cy={node.y} r={NODE_R}
                fill={isSelecting ? color : '#1a1d27'}
                stroke={color}
                strokeWidth={isSelecting ? 2.5 : 2}
              />
              <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                fontSize="13" fontWeight="700"
                fill={isSelecting ? '#fff' : color}
              >
                x{node.id}
              </text>
            </g>
          );
        })}

        {/* Popup value input rendered inside SVG as foreignObject */}
        {popup && (() => {
          const px = Math.min(popup.x + 30, 460);
          const py = Math.min(popup.y - 20, 340);
          return (
            <foreignObject x={px} y={py} width="170" height="90">
              <div className="arc-popup">
                <span>Arc x{popup.from} → x{popup.to}</span>
                <input
                  type="number" min="0" step="any"
                  placeholder="Valeur"
                  value={arcValue}
                  onChange={e => setArcValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmArc(); if (e.key === 'Escape') cancelPopup(); }}
                  autoFocus
                />
                <div className="arc-popup-btns">
                  <button onClick={confirmArc}>✓</button>
                  <button onClick={cancelPopup}>✕</button>
                </div>
              </div>
            </foreignObject>
          );
        })()}
      </svg>

      {/* Arc list */}
      {arcs.length > 0 && (
        <div className="editor-arcs">
          {arcs.map((a, i) => (
            <span key={i} className="arc-badge">
              x{a.from}→x{a.to} : <strong>{a.value}</strong>
              <button onClick={() => removeArc(a.from, a.to)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Calcule les points de départ/arrivée d'un arc (évite chevauchement avec le nœud)
function calcArcPoints(from, to, nodes, arcs) {
  // Vérifier si l'arc inverse existe (décaler pour éviter superposition)
  const hasReverse = arcs.some(a => a.from === to.id && a.to === from.id);
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;

  let ox = 0, oy = 0;
  if (hasReverse) { ox = -uy * 10; oy = ux * 10; }

  const x1 = from.x + ux * NODE_R + ox;
  const y1 = from.y + uy * NODE_R + oy;
  const x2 = to.x - ux * (NODE_R + 6) + ox;
  const y2 = to.y - uy * (NODE_R + 6) + oy;
  const mx = (x1 + x2) / 2 + ox;
  const my = (y1 + y2) / 2 + oy;

  return { x1, y1, x2, y2, mx, my };
}