import React, { useState } from "react";

type Item = { id: string | number; name: string };

type Props = {
  items: Item[];
  selected: (string | number)[];
  setSelected: (selected: (string | number)[]) => void;
};

const SearchableCheckboxList: React.FC<Props> = ({
  items,
  selected,
  setSelected,
}) => {
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string | number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i) => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2"></label>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-1 mb-2 border rounded"
      />
      <div className="max-h-40 overflow-y-auto border p-2 rounded">
        {filtered.map((item) => (
          <label key={item.id} className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
            />
            {item.name}
          </label>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500">No results</p>}
      </div>
    </div>
  );
};

export default SearchableCheckboxList;
