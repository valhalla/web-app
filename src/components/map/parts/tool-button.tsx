import type { ReactNode } from 'react';

interface ToolButtonProps {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function ToolButton({
  title,
  icon,
  onClick,
  className,
  disabled = false,
  'data-testid': testId,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={className}
      style={{
        width: '42px',
        height: '42px',
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        boxShadow: '0 0 0 2px rgba(0,0,0,0.1)',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span aria-hidden={true} style={{ display: 'flex' }}>
        {icon}
      </span>
    </button>
  );
}
