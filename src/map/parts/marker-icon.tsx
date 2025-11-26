import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type MarkerColor = 'green' | 'purple' | 'blue';

const markerIconVariants = cva('relative cursor-pointer w-[35px] h-[45px]', {
  variants: {
    color: {
      green: '[&_path]:fill-[#28a745]',
      purple: '[&_path]:fill-[#6f42c1]',
      blue: '[&_path]:fill-[#007bff]',
    },
  },
  defaultVariants: {
    color: 'green',
  },
});

interface MarkerIconProps extends VariantProps<typeof markerIconVariants> {
  number?: string;
  className?: string;
}

export function MarkerIcon({ color, number, className }: MarkerIconProps) {
  return (
    <div
      className={cn(markerIconVariants({ color, className }))}
      aria-label={`Map marker ${number}`}
    >
      <svg
        width="35"
        height="45"
        viewBox="0 0 35 45"
        className="drop-shadow-md"
      >
        <path
          d="M17.5,0 C7.8,0 0,7.8 0,17.5 C0,30.6 17.5,45 17.5,45 S35,30.6 35,17.5 C35,7.8 27.2,0 17.5,0 Z"
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>
      {number && (
        <div className="absolute top-2 left-0 w-[35px] text-center text-white font-bold text-base pointer-events-none">
          {number}
        </div>
      )}
    </div>
  );
}
