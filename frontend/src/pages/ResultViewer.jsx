import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';
import GraphViewer from '../components/GraphViewer';

export default function ResultViewer({ sheetId, onBack }) {
  const { token } = useAuth();
  const [sheet, setSheet] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/sheets/${sheetId}`, {}, token)
      .then(data => { setSheet(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sheetId]);

  if (loading) return <div className="page"><p className="muted">Chargement...</p></div>;
  if (!sheet || !sheet.result) return <div className="page"><p className="error">Résultat introuvable</p></div>;

  const { matrices, finalMatrix } = sheet.result;
  const totalSteps = matrices.length;
  const current = matrices[step];
  const isLast = step === totalSteps - 1;
  const n = sheet.vertices;

  function fmt(val) {
    return val === '+∞' || val === null || val === undefined ? '+∞' : val;
  }
  function isChanged(i, j) {
    if (step === 0) return false;
    return fmt(matrices[step-1].matrix[i][j]) !== fmt(current.matrix[i][j]);
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-ghost" onClick={onBack}>← Retour</button>
        <h2>{sheet.name}</h2>
        <span className="muted">{n} sommets</span>
      </div>

      {/* Arcs */}
      <section className="result-section">
        <h3>Graphe initial</h3>
        <div className="arc-list">
          {sheet.arcs.map((arc, i) => (
            <span key={i} className="arc-badge">
              x{arc.from} → x{arc.to} : <strong>{arc.value}</strong>
            </span>
          ))}
        </div>
      </section>

      {/* Navigation étapes */}
      <section className="result-section">
        <div className="step-nav">
          <button className="btn-ghost"
            onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}>
            ← Précédent
          </button>
          <div className="step-indicator">
            {matrices.map((_, i) => (
              <button key={i}
                className={`step-dot ${i===step?'active':''} ${i<step?'done':''}`}
                onClick={() => setStep(i)}>D{i+1}</button>
            ))}
          </div>
          <button className="btn-primary"
            onClick={() => setStep(s => Math.min(totalSteps-1, s+1))} disabled={isLast}>
            Suivant →
          </button>
        </div>

        <h3 className="matrix-title">
          Matrice D{current.k}
          {step===0 && <span className="badge">Matrice initiale</span>}
          {isLast && <span className="badge final">Matrice finale</span>}
        </h3>

        <div className="matrix-table-wrap">
          <table className="matrix-table result-matrix">
            <thead>
              <tr>
                <th />
                {Array.from({length:n},(_,j)=><th key={j}>x{j+1}</th>)}
              </tr>
            </thead>
            <tbody>
              {current.matrix.map((row, i) => (
                <tr key={i}>
                  <th>x{i+1}</th>
                  {row.map((cell, j) => (
                    <td key={j} className={`${i===j?'diag-cell':''} ${isChanged(i,j)?'changed-cell':''}`}>
                      {fmt(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {step > 0 && current.stepDetails?.length > 0 && (
          <div className="step-details">
            <h4>Calculs — k = {current.k} (pivot x{current.k})</h4>
            <div className="calcs">
              {current.stepDetails.map((d, idx) => (
                <div key={idx} className={`calc-row ${d.changed?'calc-changed':''}`}>
                  <span>
                    W{d.i}{d.j}({current.k-1}) = V{d.i}{d.pivot}({current.k-1}) + V{d.pivot}{d.j}({current.k-1})
                    {' '}= {d.vik} + {d.vkj} = <strong>{d.wij}</strong>
                  </span>
                  <span>
                    {' '}→ V{d.i}{d.j}({current.k}) = MIN({d.wij}, {d.oldVal}) = <strong className={d.changed?'highlight':''}>{fmt(d.newVal)}</strong>
                    {d.changed && <span className="changed-tag"> ✓ mis à jour</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Résultat final — chemins */}
      {isLast && (
        <section className="result-section final-section">
          <h3>Valeurs minimales — Matrice D{n-1}</h3>
          <p className="muted" style={{marginBottom:16}}>
            V<sub>ij</sub> = longueur du chemin minimal de x<sub>i</sub> vers x<sub>j</sub>.
            La ligne du minimum dans chaque colonne indique le prédécesseur.
          </p>
          <div className="paths-grid">
            {Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
              if (i===j) return null;
              const val = finalMatrix[i][j];
              if (val==='+∞'||val===null||val===undefined) return null;
              return (
                <div key={`${i}-${j}`} className="path-card">
                  <span className="path-label">x{i+1} → x{j+1}</span>
                  <span className="path-val">{val}</span>
                </div>
              );
            }))}
          </div>
        </section>
      )}

      {/* Schéma graphe avec chemins minimaux */}
      {isLast && (
        <section className="result-section">
          <h3>Schéma des chemins minimaux</h3>
          <p className="muted" style={{marginBottom:16}}>
            Cliquez sur un chemin dans la liste pour l'isoler. Cliquez à nouveau pour tout afficher.
          </p>
          <GraphViewer sheet={sheet} />
        </section>
      )}
    </div>
  );
}