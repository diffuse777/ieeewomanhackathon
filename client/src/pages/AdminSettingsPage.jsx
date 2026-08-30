import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminSettings, updateAdminSettings } from '../services/adminSettingsService';
import { usePageTitle } from '../hooks/usePageTitle';
import { HACKATHON } from '../constants/hackathon';

function toInputDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  return local;
}

function fromInputDateTime(value) {
  if (!value) return null;
  // treat as local time
  const dt = new Date(value);
  return dt.toISOString();
}

export function AdminSettingsPage() {
  usePageTitle(`${HACKATHON.eventName} · Registration limit`);
  const { admin } = useAdminAuth();
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [limit, setLimit] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    getAdminSettings()
      .then((res) => {
        const data = res.data || null;
        if (!mounted) return;
        if (data) {
          setStartAt(toInputDateTime(data.startAt));
          setEndAt(toInputDateTime(data.endAt));
          setLimit(data.limit ?? 0);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [admin]);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        startAt: fromInputDateTime(startAt),
        endAt: fromInputDateTime(endAt),
        limit: Number.parseInt(limit, 10) || 0,
      };
      const res = await updateAdminSettings(payload);
      setMessage(res.message || 'Saved');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel admin-settings">
      <div className="admin-panel__head">
        <h2>Registration limit</h2>
      </div>

      <form className="admin-form" onSubmit={onSave}>
        <label>
          Start (day & time)
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </label>

        <label>
          End (day & time)
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </label>

        <label>
          Limit
          <input type="number" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </label>

        <div className="admin-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          {message ? <span className="admin-message">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
