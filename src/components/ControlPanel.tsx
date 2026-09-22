type Props = {
  count: number
  onUpload: () => void
}

export function ControlPanel({ count, onUpload }: Props) {
  return (
    <div className="explosion-count" role="status" aria-live="polite" aria-atomic="true">
      <span className="explosion-count__value">{count}</span>
      <span className="explosion-count__label">
        homework assignment{count === 1 ? '' : 's'} exploded
      </span>
      <button type="button" className="add" onClick={onUpload} aria-label="Upload images">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 16V6m0 0-3.5 3.5M12 6l3.5 3.5M5 16.5v1A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5v-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
