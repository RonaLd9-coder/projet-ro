import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';

export default function Dashboard({ onOpen, onCreate }) {
  const { token, logout, user } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSheets();
  }, []);

  async function loadSheets() {
    try {
      const data = await apiFetch('/sheets', {}, token);
      setSheets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Supprimer cette feuille ?')) return;
    try {
      await apiFetch(`/sheets/${id}`, { method: 'DELETE' }, token);
      setSheets(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>Algorithme de Demoucron</h1>
          <span className="dash-email">{user?.email}</span>
        </div>
        <div className="dash-actions">
          <button className="btn-primary" onClick={onCreate}>+ Nouvelle feuille</button>
          <button className="btn-ghost" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main className="dash-main">
        {loading ? (
          <p className="muted">Chargement...</p>
        ) : sheets.length === 0 ? (
          <div className="empty-state">
            <p>Aucune feuille pour l'instant.</p>
            <button className="btn-primary" onClick={onCreate}>Créer ma première feuille</button>
          </div>
        ) : (
          <div className="sheet-grid">
            {sheets.map(sheet => (
              <div key={sheet.id} className="sheet-card" onClick={() => onOpen(sheet.id)}>
                <div className="sheet-card-body">
                  <h3>{sheet.name}</h3>
                  <p>{sheet.vertices} sommets · mode {sheet.inputMode === 'list' ? 'liste d\'arcs' : 'matrice'}</p>
                  <p className="muted">{new Date(sheet.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}</p>
                </div>
                <button
                  className="btn-delete"
                  onClick={e => handleDelete(sheet.id, e)}
                  title="Supprimer"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}