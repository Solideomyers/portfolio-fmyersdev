import { useEffect, useState } from 'react';
import { OPTION_LABELS, type Field } from './lib/fields';

/** Reads a dotted path ("service.proof") out of a parsed item. */
export const getIn = (o: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], o);

export function Chips<T extends string | boolean>({
  options,
  value,
  onPick,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="ad-chips">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="ad-chip"
          aria-pressed={o.value === value}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// A number is kept as typed until it is a whole number, so clearing the box does not save "0".
function NumberInput({
  value,
  onChange,
  label,
}: {
  value: unknown;
  onChange: (v: number) => void;
  label: string;
}) {
  const [raw, setRaw] = useState(String(value ?? ''));
  useEffect(() => setRaw((r) => (Number(r) === value ? r : String(value ?? ''))), [value]);
  return (
    <input
      className="ad-input"
      inputMode="numeric"
      aria-label={label}
      aria-invalid={!/^\d+$/.test(raw)}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        if (/^\d+$/.test(e.target.value)) onChange(Number(e.target.value));
      }}
    />
  );
}

// One item per line. The text is kept as typed, so a new empty line is not swallowed.
const lines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
function ListInput({
  value,
  onChange,
  label,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const [raw, setRaw] = useState(value.join('\n'));
  useEffect(
    () =>
      setRaw((r) => (JSON.stringify(lines(r)) === JSON.stringify(value) ? r : value.join('\n'))),
    [value],
  );
  return (
    <textarea
      className="ad-input"
      rows={Math.max(3, raw.split('\n').length)}
      aria-label={`${label} (uno por línea)`}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(lines(e.target.value));
      }}
    />
  );
}

/**
 * One form control. `published` only decides input vs textarea: it is stable while typing, so the
 * element never swaps under the cursor.
 */
export function Control({
  field,
  value,
  published,
  onChange,
  label,
  type,
}: {
  field: Field;
  value: unknown;
  published: unknown;
  onChange: (v: unknown) => void;
  label: string;
  /** HTML input type for short text (email, tel, month). */
  type?: string;
}) {
  switch (field.type) {
    case 'text': {
      const long = String(published ?? '').length > 60 || String(published ?? '').includes('\n');
      const common = { className: 'ad-input', 'aria-label': label, value: String(value ?? '') };
      return long ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
      );
    }
    case 'number':
      return <NumberInput value={value} onChange={onChange} label={label} />;
    case 'list':
      return <ListInput value={(value as string[]) ?? []} onChange={onChange} label={label} />;
    case 'boolean':
      return (
        <Chips
          label={label}
          value={value === true}
          onPick={onChange}
          options={[
            { value: true, label: 'Sí' },
            { value: false, label: 'No' },
          ]}
        />
      );
    case 'select':
      return (
        <Chips
          label={label}
          value={String(value ?? '')}
          onPick={onChange}
          options={field.options.map((o) => ({ value: o, label: OPTION_LABELS[o] ?? o }))}
        />
      );
    default:
      return null;
  }
}
