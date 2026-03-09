import type { ReactNode } from 'react';

interface ToolButtonProps {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
}

export function ToolButton({
  title,
  icon,
  onClick,
  className,
  'data-testid': testId,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      data-testid={testId}
      className={className}
      style={{
        width: '48px',
        height: '48px',
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        boxShadow: '0 0 0 2px rgba(0,0,0,0.1)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <span aria-hidden={true} style={{ display: 'flex' }}>
        {icon}
      </span>
    </button>
  );
}
