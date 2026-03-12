export function Money({ value }: { value: number }) {
  return <span>₹{(value ?? 0).toFixed(2)}</span>;
}

