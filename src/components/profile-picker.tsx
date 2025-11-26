import { ReactComponent as BusSvg } from '@/images/bus.svg';
import { ReactComponent as ScooterSvg } from '@/images/scooter.svg';
import { ReactComponent as CarSvg } from '@/images/car.svg';
import { ReactComponent as TruckSvg } from '@/images/truck.svg';
import { ReactComponent as BikeSvg } from '@/images/bike.svg';
import { ReactComponent as PedestrianSvg } from '@/images/pedestrian.svg';
import { ReactComponent as MotorbikeSvg } from '@/images/motorbike.svg';
import type { Profile } from '@/reducers/common';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import {
  resetSettings,
  updatePermalink,
  updateProfile,
} from '@/actions/common-actions';
import { Loader2 } from 'lucide-react';

const iconMap = {
  truck: <TruckSvg />,
  car: <CarSvg />,
  bicycle: <BikeSvg />,
  pedestrian: <PedestrianSvg />,
  motor_scooter: <ScooterSvg />,
  bus: <BusSvg />,
  motorcycle: <MotorbikeSvg />,
};

interface ProfilePickerProps {
  loading: boolean;
  profiles: { value: Profile; label: string }[];
  activeProfile: Profile;
  onProfileChange: (value: Profile) => void;
}

export const ProfilePicker = ({
  loading,
  profiles,
  activeProfile,
  onProfileChange,
}: ProfilePickerProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleUpdateProfile = useCallback(
    (value: Profile) => {
      dispatch(updateProfile({ profile: value }));
      dispatch(resetSettings());
      dispatch(updatePermalink());
      onProfileChange(value);
    },
    [dispatch, onProfileChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <TooltipProvider>
        <ToggleGroup
          type="single"
          variant="outline"
          value={activeProfile}
          onValueChange={(value: Profile) => {
            if (value && value !== activeProfile) {
              handleUpdateProfile(value);
            }
          }}
        >
          {profiles.map((profile, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={profile.value}
                  aria-label={`Select ${profile.label} profile`}
                  data-testid={`profile-button-` + profile.value}
                  data-state={profile.value === activeProfile ? 'on' : 'off'}
                >
                  {profile.value === activeProfile && loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    iconMap[profile.value as keyof typeof iconMap]
                  )}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>{profile.label}</TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
};
