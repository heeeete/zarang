import { Search, X } from 'lucide-react';

interface ExploreSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const ExploreSearchBar = ({ value, onChange }: ExploreSearchBarProps) => {
  return (
    <div className="relative w-full">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="내용, 닉네임으로 검색"
        className="h-10 w-full rounded-xl bg-neutral-100 pr-10 pl-9 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-neutral-200 p-0.5 text-neutral-500 hover:bg-neutral-300"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
