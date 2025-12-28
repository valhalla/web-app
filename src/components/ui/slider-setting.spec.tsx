import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SliderSetting } from './slider-setting';

const mockOnValueChange = vi.fn();
const mockOnInputChange = vi.fn();

describe('SliderSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() =>
      render(
        <SliderSetting
          id="test-slider"
          label="Test Slider"
          description="A test slider"
          min={0}
          max={100}
          step={1}
          value={50}
          onValueChange={mockOnValueChange}
          onInputChange={mockOnInputChange}
        />
      )
    ).not.toThrow();
  });

  it('should render label', () => {
    render(
      <SliderSetting
        id="test-slider"
        label="Cycling Speed"
        description="Speed setting"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    expect(screen.getByText('Cycling Speed')).toBeInTheDocument();
  });

  it('should display current value', () => {
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={75}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should display unit when provided', () => {
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        unit="km/h"
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    expect(screen.getByText('km/h')).toBeInTheDocument();
  });

  it('should render slider element', () => {
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should render help button with accessible label', () => {
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    expect(
      screen.getByRole('button', { name: /More info about Test Slider/i })
    ).toBeInTheDocument();
  });

  it('should show description in popover when help button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="This is the description text"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /More info about Test Slider/i })
    );

    expect(
      await screen.findByText('This is the description text')
    ).toBeInTheDocument();
  });

  it('should switch to input mode when value button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('should focus and select input when switching to edit mode', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveFocus();
  });

  it('should call onInputChange when input value is changed and committed', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '75');
    await user.tab();

    expect(mockOnInputChange).toHaveBeenCalledWith([75]);
  });

  it('should commit on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '80{Enter}');

    expect(mockOnInputChange).toHaveBeenCalledWith([80]);
  });

  it('should cancel edit on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '99');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });
    expect(mockOnInputChange).not.toHaveBeenCalled();
  });

  it('should clamp value to max when input exceeds max', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '150{Enter}');

    expect(mockOnInputChange).toHaveBeenCalledWith([100]);
  });

  it('should clamp value to min when input is below min', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={10}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '5{Enter}');

    expect(mockOnInputChange).toHaveBeenCalledWith([10]);
  });

  it('should set value to min when input is NaN', async () => {
    const user = userEvent.setup();
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={0}
        max={100}
        step={1}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    await user.click(screen.getByRole('button', { name: '50' }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, 'abc{Enter}');

    expect(mockOnInputChange).toHaveBeenCalledWith([0]);
  });

  it('should have correct slider attributes', () => {
    render(
      <SliderSetting
        id="test-slider"
        label="Test Slider"
        description="A test slider"
        min={10}
        max={90}
        step={5}
        value={50}
        onValueChange={mockOnValueChange}
        onInputChange={mockOnInputChange}
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '10');
    expect(slider).toHaveAttribute('aria-valuemax', '90');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });
});
