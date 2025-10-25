import PropTypes from 'prop-types';
import { Input, Dropdown } from 'semantic-ui-react';

export interface DateTimePickerProps {
  type: number;
  value: string;
  onChange: (field: 'type' | 'value', value: number | string) => void;
}

export const DateTimePicker = ({
  type,
  value,
  onChange,
}: DateTimePickerProps) => {
  return (
    <div className="pa2 flex flex-wrap justify-between">
      <Dropdown
        clearable
        options={[
          { key: 0, text: 'No specific time', value: -1 },
          { key: 1, text: 'Leave now', value: 0 },
          { key: 2, text: 'Depart at', value: 1 },
          { key: 3, text: 'Arrive at', value: 2 },
        ]}
        selection
        defaultValue={type}
        style={{ marginLeft: '3px' }}
        onChange={(e, data) => {
          onChange('type', data.value as string | number);
        }}
      />
      <Input placeholder="Search..." style={{ marginLeft: '3px' }}>
        <input
          data-testid="date-time-picker"
          type="datetime-local"
          value={value}
          onChange={(e) => onChange('value', e.target.value)}
          disabled={type < 0}
        />
      </Input>
    </div>
  );
};

DateTimePicker.propTypes = {
  type: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func,
};
