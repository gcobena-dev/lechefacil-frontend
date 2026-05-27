import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  maxItems?: number;
}

export function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  maxItems = 8,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = (
    value
      ? suggestions.filter((s) =>
          s.toLowerCase().includes(value.toLowerCase())
        )
      : suggestions
  ).slice(0, maxItems);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {filtered.map((s) => (
            <div
              key={s}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
