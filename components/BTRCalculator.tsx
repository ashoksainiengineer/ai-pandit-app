'use client';

import { useState } from 'react';

export function BTRCalculator() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/btr-calculate/time-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startTime, endTime }),
    });

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        setProgress(prev => prev + chunk);
      }

      // TODO: Handle final results from the stream
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
        <button type="submit">Start BTR Scan</button>
      </form>
      <pre>Progress: {progress}</pre>
      {results && <pre>Results: {JSON.stringify(results, null, 2)}</pre>}
    </div>
  );
}
