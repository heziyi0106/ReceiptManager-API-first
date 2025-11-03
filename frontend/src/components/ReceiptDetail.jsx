import React, { useEffect, useState } from 'react';
import { request } from '../api';

export default function ReceiptDetail({ id }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    request('get', `/receipts/${id}`)
      .then(env => setItem(env.payload))
      .catch(e => {
        console.error(e);
        setErr(e.message || 'Error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return <div>Select a receipt</div>;
  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{color:'red'}}>Error: {String(err)}</div>;

  if (!item) return <div>Not found</div>;

  return (
    <div>
      <h3>Receipt #{item.id}</h3>
      <div>Title: {item.title}</div>
      <div>Amount: {item.amount}</div>
      <div>Date: {item.date}</div>
    </div>
  );
}