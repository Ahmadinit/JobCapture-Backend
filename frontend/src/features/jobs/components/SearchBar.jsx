import DebouncedInput from '@/components/ui/DebouncedInput.jsx';
import { SearchIcon } from '@/components/ui/Icons.jsx';

export default function SearchBar({ value, onCommit }) {
  return (
    <div className="search" role="search">
      <SearchIcon />
      <DebouncedInput
        className="input"
        type="search"
        placeholder="Search by title, company or keyword"
        aria-label="Search jobs"
        value={value}
        trim
        onCommit={onCommit}
      />
    </div>
  );
}
