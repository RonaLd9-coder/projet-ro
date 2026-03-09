import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';

export default function Register({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas');
    if (password.length < 6) return setError('Mot de passe trop court (6 caractères min)');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-box">
      <h2>Créer un compte</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
        />
        <input
          type="password" placeholder="Mot de passe" value={password}
          onChange={e => setPassword(e.target.value)} required
        />
        <input
          type="password" placeholder="Confirmer le mot de passe" value={confirm}
          onChange={e => setConfirm(e.target.value)} required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
      <div className="auth-links">
        <button className="link-btn" onClick={onSwitch}>Déjà un compte ? Se connecter</button>
      </div>
    </div>
  );
}