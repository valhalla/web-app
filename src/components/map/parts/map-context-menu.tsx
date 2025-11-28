import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

interface MapContextMenuProps {
  activeTab: string;
  onAddWaypoint: (index: number) => void;
  onAddIsoWaypoint: () => void;
}

export function MapContextMenu({
  activeTab,
  onAddWaypoint,
  onAddIsoWaypoint,
}: MapContextMenuProps) {
  if (activeTab === 'directions') {
    return (
      <ButtonGroup
        orientation="vertical"
        data-testid="button-group-right-context"
      >
        <Button variant="outline" size="sm" onClick={() => onAddWaypoint(0)}>
          Directions from here
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddWaypoint(1)}>
          Add as via point
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddWaypoint(-1)}>
          Directions to here
        </Button>
      </ButtonGroup>
    );
  }

  return (
    <ButtonGroup orientation="vertical">
      <Button variant="outline" size="sm" onClick={onAddIsoWaypoint}>
        Set center here
      </Button>
    </ButtonGroup>
  );
}
