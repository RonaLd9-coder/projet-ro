import { useState, useRef } from 'react';

const NODE_R = 22;
const PATH_COLORS = [
  '#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899',
  '#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16',
  '#e879f9','#fb7185','#a3e635','#38bdf8','#fcd34d',
];

export default function GraphViewer({ sheet }) {
  const { arcs, vertices, result } = sheet;
  const n = vertices;
  const finalMatrix = result?.finalMatrix;
  const svgRef = useRef(null);
  const nodes = initNodes(n);

  const allPaths = buildAllPaths(n, finalMatrix, arcs);

  const [selectedPath, setSelectedPath] = useState(null);

  const visiblePaths = selectedPath !== null ? [allPaths[selectedPath]] : allPaths;

  function getArcColor(from, to) {
    for (let i = 0; i < visiblePaths.length; i++) {
      const p = visiblePaths[i];
      for (let k = 0; k < p.path.length - 1; k++) {
        if (p.path[k] === from && p.path[k + 1] === to) {
          const colorIdx = selectedPath !== null ? selectedPath : allPaths.indexOf(p);
          return PATH_COLORS[colorIdx % PATH_COLORS.length];
        }
      }
    }
    return null;
  }

  const markerId = 'arrow-view';

  return (
    <div className="graph-viewer">
      <div className="gv-layout">
        <div className="gv-svg-wrap">
          <svg ref={svgRef} width="520" height="380" className="viewer-svg">
            <defs>
              <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#2e3150" />
              </marker>
              {PATH_COLORS.map((c, i) => (
                <marker key={i} id={`arrow-path-${i}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={c} />
                </marker>
              ))}
            </defs>

            {arcs.map((arc, i) => {
              const from = nodes.find(nd => nd.id === arc.from);
              const to   = nodes.find(nd => nd.id === arc.to);
              if (!from || !to) return null;
              const pathColor = getArcColor(arc.from, arc.to);
              const onPath = !!pathColor;
              const { x1, y1, x2, y2, mx, my } = calcArcPoints(from, to, nodes, arcs);
              const colorIdx = onPath
                ? allPaths.findIndex(p =>
                    p.path.some((v, k) => p.path[k] === arc.from && p.path[k+1] === arc.to))
                : -1;

              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={onPath ? pathColor : '#2e3150'}
                    strokeWidth={onPath ? 3 : 1.5}
                    markerEnd={`url(#${onPath ? `arrow-path-${colorIdx % PATH_COLORS.length}` : markerId})`}
                    opacity={onPath ? 1 : 0.35}
                    style={{ transition: 'all .3s' }}
                  />
                  <circle cx={mx} cy={my} r="11"
                    fill="#0f1117"
                    stroke={onPath ? pathColor : '#2e3150'}
                    strokeWidth={onPath ? 1.8 : 1}
                    opacity={onPath ? 1 : 0.4}
                    style={{ transition: 'all .3s' }}
                  />
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                    fontSize="10" fontWeight="700"
                    fill={onPath ? pathColor : '#4b5563'}
                    style={{ transition: 'all .3s' }}
                  >
                    {arc.value}
                  </text>
                </g>
              );
            })}

            {nodes.map((node, i) => {
              const isOnVisible = visiblePaths.some(p => p.path.includes(node.id));
              const color = isOnVisible ? '#a78bfa' : '#4b5563';
              return (
                <g key={node.id}>
                  {isOnVisible && (
                    <circle cx={node.x} cy={node.y} r={NODE_R + 5}
                      fill="none" stroke="#6c63ff" strokeWidth="1" opacity="0.3" />
                  )}
                  <circle cx={node.x} cy={node.y} r={NODE_R}
                    fill={isOnVisible ? '#1a1d27' : '#0f1117'}
                    stroke={color} strokeWidth={isOnVisible ? 2.5 : 1.5}
                    style={{ transition: 'all .3s' }}
                  />
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                    fontSize="13" fontWeight="700" fill={color}
                    style={{ transition: 'all .3s' }}
                  >
                    x{node.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="gv-paths">
          <div className="gv-paths-header">
            <h4>Chemins minimaux</h4>
            <button
              className={`btn-ghost btn-sm ${selectedPath === null ? 'active' : ''}`}
              onClick={() => setSelectedPath(null)}
            >Tous</button>
          </div>

          <div className="paths-list">
            {allPaths.length === 0 && (
              <p className="muted" style={{ padding: '12px 0' }}>Aucun chemin trouvé.</p>
            )}
            {allPaths.map((p, i) => {
              const color = PATH_COLORS[i % PATH_COLORS.length];
              const isSelected = selectedPath === i;
              return (
                <div key={i}
                  className={`path-item ${isSelected ? 'path-selected' : ''}`}
                  style={{ '--path-color': color }}
                  onClick={() => setSelectedPath(isSelected ? null : i)}
                >
                  <span className="path-dot" style={{ background: color }} />
                  <span className="path-route">
                    {p.path.map((v, k) => (
                      <span key={k}>
                        {k > 0 && <span className="path-arrow">→</span>}
                        <span className="path-node">x{v}</span>
                      </span>
                    ))}
                  </span>
                  <span className="path-cost" style={{ color }}>{p.cost}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="gv-legend">
        <span className="legend-item">
          <span style={{ width:20, height:3, background:'#6c63ff', display:'inline-block', borderRadius:2 }} />
          Arc sur chemin minimal
        </span>
        <span className="legend-item">
          <span style={{ width:20, height:3, background:'#2e3150', display:'inline-block', borderRadius:2 }} />
          Arc non utilisé
        </span>
      </div>
    </div>
  );
}

// ── Reconstruction des chemins ──────────────────────────────────────────
function buildAllPaths(n, finalMatrix, arcs) {
  if (!finalMatrix) return [];

  // Normaliser la matrice : '+∞' → Infinity, strings → numbers
  const mat = finalMatrix.map(row =>
    row.map(v => (v === '+∞' || v === null || v === undefined ? Infinity : Number(v)))
  );

  const paths = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const cost = mat[i][j];
      if (!isFinite(cost)) continue;

      const path = reconstructPath(i, j, mat, arcs, n);
      if (path && path.length >= 2) {
        paths.push({ from: i + 1, to: j + 1, cost, path });
      }
    }
  }
  return paths;
}

/**
 * Reconstruit le chemin de from0 vers to0 (indices 0-based).
 * Remonte depuis to0 vers from0 en cherchant à chaque étape
 * le prédécesseur p tel que : mat[from0][p] + arc_direct(p→current) ≈ mat[from0][current]
 */
function reconstructPath(from0, to0, mat, arcs, n) {
  const path = [to0 + 1]; // 1-based
  let current = to0;      // 0-based
  let safety = 0;

  while (current !== from0 && safety < n + 2) {
    safety++;
    const costToHere = mat[from0][current];
    if (!isFinite(costToHere)) return null;

    let found = false;

    // Chercher prédécesseur via arc direct p→current dans le graphe initial
    for (let p = 0; p < n; p++) {
      if (p === current) continue;

      // Il doit exister un arc direct p→current
      const directArc = arcs.find(a => a.from === p + 1 && a.to === current + 1);
      if (!directArc) continue;

      // Le coût de from0 vers p doit exister
      const costToP = mat[from0][p];

      // Cas spécial : p === from0, l'arc direct from0→current existe
      const costFrom0ToP = (p === from0) ? 0 : costToP;
      if (!isFinite(costFrom0ToP) && p !== from0) continue;

      if (Math.abs(costFrom0ToP + directArc.value - costToHere) < 0.001) {
        if (p !== from0) path.unshift(p + 1);
        else path.unshift(from0 + 1);
        current = p;
        found = true;
        break;
      }
    }

    if (!found) return null;
  }

  return path[0] === from0 + 1 ? path : null;
}

function initNodes(n) {
  const cx = 260, cy = 190, r = 140;
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { id: i + 1, x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)) };
  });
}

function calcArcPoints(from, to, nodes, arcs) {
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
  return { x1, y1, x2, y2, mx: (x1+x2)/2+ox, my: (y1+y2)/2+oy };
}