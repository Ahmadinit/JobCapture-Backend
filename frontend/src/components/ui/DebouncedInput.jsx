import { useEffect, useRef, useState } from 'react';

// Text input that commits its value to the parent after a pause, but still follows
// external changes (e.g. "Clear all" or removing a chip).
export default function DebouncedInput({ value, onCommit, delay = 350, trim = false, ...props }) {
  const [local, setLocal] = useState(value);
  const lastCommitted = useRef(value);
  const timer = useRef();

  useEffect(() => {
    if (value !== lastCommitted.current) {
      lastCommitted.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = e => {
    const next = e.target.value;
    setLocal(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const committed = trim ? next.trim() : next;
      lastCommitted.current = committed;
      onCommit(committed);
    }, delay);
  };

  return <input {...props} value={local} onChange={handleChange} />;
}
