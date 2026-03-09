import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';
import GraphEditor from '../components/GraphEditor';

export default function GraphInput({ onBack, onResult }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [vertices, setVertices] = useState('');
  const [inputMode, setInputMode] = useState('visual');
  const [arcs, setArcs] = useState([{ from: '', to: '', value: '' }]);
  const [visualArcs, setVisualArcs] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function initMatrix(n) {
    setMatrix(Array.from({ length: n }, () => Array(n).fill('')));
  }
  function handleVerticesChange(val) {
    setVertices(val);
    const n = parseInt(val);
    if (n >= 2 && n <= 20) initMatrix(n);
  }
  function addArc() { setArcs(prev => [...prev, { from: '', to: '', value: '' }]); }
  function removeArc(idx) { setArcs(prev => prev.filter((_, i) => i !== idx)); }
  function updateArc(idx, field, val) {
    setArcs(prev => prev.map((arc, i) => i === idx ? { ...arc, [field]: val } : arc));
  }
  function updateCell(i, j, val) {
    setMatrix(prev => prev.map((row, ri) =>
      ri === i ? row.map((cell, ci) => ci === j ? val : cell) : row));
  }
  function matrixToArcs(mat) {
    const result = [];
    for (let i = 0; i < mat.length; i++)
      for (let j = 0; j < mat[i].length; j++)
        if (i !== j && mat[i][j] !== '') {
          const v = parseFloat(mat[i][j]);
          if (!isNaN(v)) result.push({ from: i + 1, to: j + 1, value: v });
        }
    return result;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const n = parseInt(vertices);
    if (!name.trim()) return setError('Nom de la feuille requis');
    if (isNaN(n) || n < 2 || n > 20) return setError('Nombre de sommets entre 2 et 20');

    let finalArcs;
    if (inputMode === 'visual') finalArcs = visualArcs;
    else if (inputMode === 'list') {
      finalArcs = arcs
        .filter(a => a.from !== '' && a.to !== '' && a.value !== '')
        .map(a => ({ from: parseInt(a.from), to: parseInt(a.to), value: parseFloat(a.value) }));
    } else finalArcs = matrixToArcs(matrix);

    if (!finalArcs || finalArcs.length === 0) return setError('Aucun arc saisi');

    setLoading(true);
    try {
      const sheet = await apiFetch('/sheets', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), vertices: n, arcs: finalArcs, inputMode }),
      }, token);
      onResult(sheet);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const n = parseInt(vertices);
  const validN = !isNaN(n) && n >= 2 && n <= 20;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-ghost" onClick={onBack}>← Retour</button>
        <h2>Nouvelle feuille</h2>
      </div>

      <form onSubmit={handleSubmit} className="graph-form">
        <div className="field">
          <label>Nom de la feuille</label>
          <input type="text" placeholder="Ex: Exercice 1"
            value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="field">
          <label>Nombre de sommets (2–20)</label>
          <input type="number" min="2" max="20" placeholder="Ex: 6"
            value={vertices} onChange={e => handleVerticesChange(e.target.value)} />
        </div>

        <div className="field">
          <label>Mode de saisie</label>
          <div className="toggle-group">
            {[
              { key: 'visual', label: '🖊 Éditeur visuel' },
              { key: 'list',   label: '≡ Liste d\'arcs' },
              { key: 'matrix', label: '⊞ Matrice' },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                className={inputMode === key ? 'toggle-active' : 'toggle'}
                onClick={() => setInputMode(key)}
                disabled={key !== 'list' && !validN}
              >{label}</button>
            ))}
          </div>
        </div>

        {inputMode === 'visual' && validN && (
          <GraphEditor vertices={n} onArcsChange={setVisualArcs} />
        )}
        {inputMode === 'visual' && !validN && (
          <p className="muted">Entrez le nombre de sommets pour afficher l'éditeur.</p>
        )}

        {inputMode === 'list' && (
          <div className="arcs-section">
            <label>Arcs</label>
            <div className="arcs-header"><span>De</span><span>Vers</span><span>Valeur</span><span /></div>
            {arcs.map((arc, idx) => (
              <div key={idx} className="arc-row">
                <input type="number" min="1" max={vertices||99} placeholder="1"
                  value={arc.from} onChange={e => updateArc(idx,'from',e.target.value)} />
                <input type="number" min="1" max={vertices||99} placeholder="2"
                  value={arc.to} onChange={e => updateArc(idx,'to',e.target.value)} />
                <input type="number" min="0" step="any" placeholder="0"
                  value={arc.value} onChange={e => updateArc(idx,'value',e.target.value)} />
                <button type="button" className="btn-remove" onClick={() => removeArc(idx)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={addArc}>+ Ajouter un arc</button>
          </div>
        )}

        {inputMode === 'matrix' && validN && (
          <div className="matrix-section">
            <label>Matrice d'adjacence (vide = +∞)</label>
            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr><th />{Array.from({length:n},(_,j)=><th key={j}>{j+1}</th>)}</tr>
                </thead>
                <tbody>
                  {Array.from({length:n},(_,i)=>(
                    <tr key={i}>
                      <th>{i+1}</th>
                      {Array.from({length:n},(_,j)=>(
                        <td key={j}>
                          {i===j ? <span className="diag">∞</span>
                            : <input type="number" min="0" step="any" placeholder="∞"
                                value={matrix[i]?.[j]??''} onChange={e=>updateCell(i,j,e.target.value)}
                                className="matrix-cell" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Calcul en cours...' : '⚡ Calculer'}
        </button>
      </form>
    </div>
  );
}