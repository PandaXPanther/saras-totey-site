import React, { cloneElement, useId, useState } from 'react';

export default function BattleHint({ name, description, meta, children }) {
  const id = useId();
  const [pinned, setPinned] = useState(false);

  return (
    <div className="battle-hint" data-pinned={pinned} onBlur={({ currentTarget, relatedTarget }) => {
      if (!currentTarget.contains(relatedTarget)) setPinned(false);
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        setPinned(false);
        event.preventDefault();
      }
    }}>
      {children && cloneElement(children, { 'aria-describedby': id })}
      <button type="button" className={children ? 'battle-hint__info' : 'battle-hint__term'} aria-describedby={id}
        aria-label={children ? `About ${name}` : undefined} aria-expanded={pinned} onClick={() => setPinned((open) => !open)}>
        {children ? 'i' : name}
      </button>
      <div id={id} role="tooltip" className="battle-hint__bubble">
        <strong>{name}</strong>
        {meta && <small>{meta}</small>}
        <span>{description}</span>
      </div>
    </div>
  );
}
