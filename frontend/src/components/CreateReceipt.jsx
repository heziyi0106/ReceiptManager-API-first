import React, { useState } from 'react';
import { request } from '../api';

export default function CreateReceipt({ onCreated }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const body = { title, amount: parseFloat(amount), date };
      const env = await request('post', '/receipts', body);
      // env.payload 可能是新建立的 receipt
      onCreated && onCreated(env.payload);
      setTitle(''); setAmount(''); setDate('');
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h3>Create Receipt</h3>
      <div>
        <label>Title: <input value={title} onChange={e=>setTitle(e.target.value)} required /></label>
      </div>
      <div>
        <label>Amount: <input value={amount} onChange={e=>setAmount(e.target.value)} required type="number" step="0.01" /></label>
      </div>
      <div>
        <label>Date: <input value={date} onChange={e=>setDate(e.target.value)} type="date" /></label>
      </div>
      <div>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
      </div>
      {err && <div style={{color:'red'}}>Error: {String(err)}</div>}
    </form>
  );
}