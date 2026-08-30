import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { listBlocked, blockRegisterNumber, unblockRegisterNumber, getBlockedRegisterNumber, unblockAllRegisterNumbers } from '../services/adminBlockedService';
import { usePageTitle } from '../hooks/usePageTitle';
import { HACKATHON } from '../constants/hackathon';

export function AdminBlockedPage() {
  usePageTitle(`${HACKATHON.eventName} · Blocked users`);
  const { admin } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [registerNumber, setRegisterNumber] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listBlocked();
      setItems(res.data || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    if (admin && mounted) {
      reload();
    }
    return () => {
      mounted = false;
    };
  }, [admin]);

  async function onBlock(e) {
    e.preventDefault();
    if (!registerNumber) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await blockRegisterNumber({ registerNumber: String(registerNumber).trim().toUpperCase(), reason });
      setRegisterNumber('');
      setReason('');
      await reload();
      setMessage(res.message || 'Blocked');
    } catch (err) {
      setError(err?.message || 'Failed to block');
    } finally {
      setLoading(false);
    }
  }

  async function onUnblock(key) {
    if (!window.confirm(`Unblock ${key}?`)) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await unblockRegisterNumber(key);
      await reload();
      setMessage(res.message || 'Unblocked');
    } catch (err) {
      setError(err?.message || 'Failed to unblock');
    } finally {
      setLoading(false);
    }
  }

  async function onUnblockAll() {
    if (!items || items.length === 0) return;
    if (!window.confirm(`Unblock ALL (${items.length}) register numbers? This cannot be undone.`)) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await unblockAllRegisterNumbers();
      await reload();
      setMessage(res.message || 'All unblocked');
    } catch (err) {
      setError(err?.message || 'Failed to unblock all');
    } finally {
      setLoading(false);
    }
  }

  async function onSearch(e) {
    e?.preventDefault();
    if (!searchQuery) return;
    setSearchLoading(true);
    setMessage('');
    setError('');
    setSearchResult(null);
    try {
      const res = await getBlockedRegisterNumber(String(searchQuery).trim().toUpperCase());
      setSearchResult(res.data || null);
    } catch (err) {
      setError(err?.message || 'Not found');
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="admin-panel admin-blocked">
      <div className="admin-panel__head">
        <h2>Blocked register numbers</h2>
      </div>

      <form className="admin-form" onSubmit={onBlock}>
        <label>
          Register number
          <input value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} required />
        </label>
        <label>
          Reason (optional)
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="admin-actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Working...' : 'Block'}
          </button>
        </div>
      </form>

      <form className="admin-form admin-form--search" onSubmit={onSearch}>
        <label>
          Search blocked register
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter register number" />
        </label>
        <div className="admin-actions">
          <button className="btn" type="submit" disabled={searchLoading}>{searchLoading ? 'Searching...' : 'Search'}</button>
        </div>
        {searchResult ? (
          <div className="admin-search-result">
            <strong>{searchResult.registerNumber}</strong>
            <span>{searchResult.reason || ''}</span>
            <button className="btn btn--link" onClick={() => onUnblock(searchResult.registerNumber)}>
              Unblock
            </button>
          </div>
        ) : null}
      </form>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Currently blocked</h3>
        </div>
        <div className="admin-block-controls">
          <button className="btn btn--danger" onClick={onUnblockAll} disabled={loading || !items || items.length === 0}>
            Unblock All
          </button>
        </div>
        {message ? <div className="admin-message admin-message--success">{message}</div> : null}
        {error ? <div className="admin-message admin-message--error">{error}</div> : null}
        <ul className="admin-recent">
          {items.map((row) => (
            <li key={row.registerNumber}>
              <strong>{row.registerNumber}</strong>
              <span>{row.reason || ''}</span>
              <button className="btn btn--link" onClick={() => onUnblock(row.registerNumber)}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
