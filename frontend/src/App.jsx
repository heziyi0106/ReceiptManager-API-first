import React, { useState } from 'react';
import ReceiptsList from './components/ReceiptsList';
import ReceiptDetail from './components/ReceiptDetail';
import CreateReceipt from './components/CreateReceipt';

export default function App(){
  const [selectedId, setSelectedId] = useState(null);
  const handleCreated = (newReceipt) => {
    // 當 mock 返回新物件，你可以選擇 refresh list 或顯示
    // 這裡簡單選擇切到 detail
    setSelectedId(newReceipt?.id);
    // 若要 refresh list，可使用事件或 global state
  };

  return (
    <div style={{display:'flex', gap: '2rem'}}>
      <div style={{flex:1}}>
        <CreateReceipt onCreated={handleCreated}/>
        <ReceiptsList onSelect={setSelectedId}/>
      </div>
      <div style={{flex:1}}>
        <ReceiptDetail id={selectedId}/>
      </div>
    </div>
  );
}