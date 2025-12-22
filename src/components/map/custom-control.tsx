import * as React from 'react';

import { createPortal } from 'react-dom';

import type { PropsWithChildren, ReactNode } from 'react';

type CustomControlProps = {
  position: keyof typeof controlPositions;
};

const controlPositions = {
  topLeft: '.maplibregl-ctrl-top-left',
  topRight: '.maplibregl-ctrl-top-right',
  bottomLeft: '.maplibregl-ctrl-bottom-left',
  bottomRight: '.maplibregl-ctrl-bottom-right',
};

export const CustomControl = ({
  position,
  children,
}: PropsWithChildren<CustomControlProps>) => {
  const [groupContainer, setGroupContainer] =
    React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const parentElement = document.querySelector(controlPositions[position]);
    const groupDiv = document.createElement('div');

    if (parentElement) {
      groupDiv.classList.add('maplibregl-ctrl', 'maplibregl-ctrl-group');

      setGroupContainer(groupDiv);
      parentElement.appendChild(groupDiv);
    }

    return () => {
      if (parentElement) {
        parentElement.removeChild(groupDiv);
      }
    };
  }, [position]);

  if (!groupContainer) return null;

  return createPortal(<>{children}</>, groupContainer);
};

type ControlButtonProps = {
  title: string;
  icon: ReactNode;
};

export const ControlButton = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithoutRef<'button'>, 'title'> & ControlButtonProps
>(({ title, icon, type = 'button', ...props }, ref) => {
  return (
    <button ref={ref} type={type} aria-label={title} title={title} {...props}>
      <span className="flex justify-center items-center" aria-hidden={true}>
        {icon}
      </span>
    </button>
  );
});

ControlButton.displayName = 'ControlButton';
