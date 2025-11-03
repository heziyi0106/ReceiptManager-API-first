import React, { useEffect, useState } from 'react';
import { request } from '../api';

export default function ReceiptsList({ onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    request('get', '/receipts')
      .then(env => {
        setItems(env.payload || []);
      })
      .catch(e => {
        console.error(e);
        setErr(e.message || 'Error');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading receipts...</div>;
  if (err) return <div style={{color:'red'}}>Error: {String(err)}</div>;

  return (
    <div>
      <h2>Receipts</h2>
      <ul>
        {items.map(r => (
          <li key={r.id}>
            <button onClick={() => onSelect(r.id)}>{r.title} — {r.amount}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}