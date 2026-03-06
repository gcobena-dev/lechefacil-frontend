import { useState, useRef, useEffect } from "react";
import { useTechnicians } from "@/hooks/useReproduction";
import { Input } from "@/components/ui/input";

interface TechnicianAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function TechnicianAutocomplete({
  value,
  onChange,
  placeholder,
  id,
}: TechnicianAutocompleteProps) {
  const { data: technicians = [] } = useTechnicians();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = value
    ? technicians.filter((t) =>
        t.toLowerCase().includes(value.toLowerCase())
      )
    : technicians;

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
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {filtered.map((t) => (
            <div
              key={t}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
              onMouseDown={() => {
                onChange(t);
                setOpen(false);
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
