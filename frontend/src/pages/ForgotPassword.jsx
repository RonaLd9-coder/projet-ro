import { useState } from 'react';
import apiFetch from '../api';

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(data.message);
      // En dev, le token est retourné directement
      if (data.devToken) setToken(data.devToken);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-box">
      <h2>Réinitialisation du mot de passe</h2>

      {step === 'request' && (
        <form onSubmit={handleRequest}>
          <input
            type="email" placeholder="Votre email" value={email}
            onChange={e => setEmail(e.target.value)} required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset}>
          {message && <p className="info">{message}</p>}
          <input
            type="text" placeholder="Token reçu par email" value={token}
            onChange={e => setToken(e.target.value)} required
          />
          <input
            type="password" placeholder="Nouveau mot de passe" value={password}
            onChange={e => setPassword(e.target.value)} required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <p className="success">Mot de passe réinitialisé ! Vous pouvez vous connecter.</p>
      )}

      <div className="auth-links">
        <button className="link-btn" onClick={onBack}>← Retour à la connexion</button>
      </div>
    </div>
  );
}