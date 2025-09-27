import type React from 'react';
import { updateSettings } from '@/actions/commonActions';
import type { AnyAction } from 'redux';
import { Form, type StrictCheckboxProps } from 'semantic-ui-react';

interface CheckboxProps {
  option: {
    param: string;
    name: string;
    description?: string;
  };
  settings: Record<
    string,
    boolean | number | string | GeoJSON.GeoJSON[] | undefined
  >;
  dispatch: (action: AnyAction) => void;
}

export const Checkbox = ({ settings, option, dispatch }: CheckboxProps) => {
  const handleChange = (
    event: React.FormEvent<HTMLInputElement>,
    { checked }: StrictCheckboxProps
  ) => {
    const value = !!checked;
    dispatch(
      updateSettings({
        name: option.param,
        value,
      })
    );
  };

  return (
    <Form.Checkbox
      width={10}
      label={option.name}
      checked={Boolean(settings[option.param])}
      onChange={handleChange}
    />
  );
};
