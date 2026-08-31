type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="search-wrap">
      <input
        className="search-input"
        data-testid="search"
        type="search"
        placeholder="Buscar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        enterKeyHint="search"
      />
    </div>
  );
}
