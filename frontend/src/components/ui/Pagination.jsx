import { pageRange } from '@/utils/pagination';

export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = pageRange(page, totalPages);
  const items = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) {
      items.push(<span className="page-ellipsis" key={`gap-${p}`}>…</span>);
    }
    items.push(
      <button
        key={p}
        className={`page-btn${p === page ? ' active' : ''}`}
        onClick={p === page ? undefined : () => onPage(p)}
      >
        {p}
      </button>
    );
  });

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
      {items}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
    </nav>
  );
}
