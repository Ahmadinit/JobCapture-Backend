// A short row of tags with a "+N" overflow. `primary` highlights the first item.
export default function JobTags({ items = [], max = 3, primary = false, className = '' }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className={`tag-row ${className}`}>
      {shown.map((item, i) => (
        <span className={`tag${primary && i === 0 ? ' tag-primary' : ''}`} key={item}>{item}</span>
      ))}
      {rest > 0 && <span className="tag tag-more" title={items.slice(max).join(', ')}>+{rest}</span>}
    </div>
  );
}
