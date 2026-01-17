'use client'

interface LockToggleProps {
  isLocked: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function LockToggle({ isLocked, onToggle, disabled }: LockToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        p-2 rounded-full transition-all duration-200
        ${isLocked
          ? 'bg-neutral-900 text-white'
          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isLocked ? 'Unlock this slot' : 'Lock this slot'}
    >
      {isLocked ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}
