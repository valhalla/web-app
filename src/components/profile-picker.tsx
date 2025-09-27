import { Button, Popup, type ButtonProps } from 'semantic-ui-react';

import { ReactComponent as BusSvg } from '@/images/bus.svg';
import { ReactComponent as ScooterSvg } from '@/images/scooter.svg';
import { ReactComponent as CarSvg } from '@/images/car.svg';
import { ReactComponent as TruckSvg } from '@/images/truck.svg';
import { ReactComponent as BikeSvg } from '@/images/bike.svg';
import { ReactComponent as PedestrianSvg } from '@/images/pedestrian.svg';
import { ReactComponent as MotorbikeSvg } from '@/images/motorbike.svg';
import type { Profile } from '@/reducers/common';

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
  group: string;
  loading: boolean;
  popupContent: string[];
  profiles: Profile[];
  activeProfile: Profile;
  handleUpdateProfile: (
    event: React.MouseEvent<HTMLButtonElement>,
    data: ButtonProps
  ) => void;
}

export const ProfilePicker = ({
  group,
  loading,
  popupContent,
  profiles,
  activeProfile,
  handleUpdateProfile,
}: ProfilePickerProps) => (
  <Button.Group basic size="small" style={{ height: '40px' }}>
    {profiles.map((profile, i) => (
      <Popup
        key={i}
        content={popupContent[i]}
        size="small"
        trigger={
          <Button
            active={profile === activeProfile}
            loading={profile === activeProfile ? loading : false}
            content={iconMap[profile as keyof typeof iconMap]}
            name="profile"
            valhalla_profile={profile}
            group={group}
            style={{ padding: '.5em' }}
            onClick={handleUpdateProfile}
            data-testid={`profile-button-` + profile}
          />
        }
      />
    ))}
  </Button.Group>
);
