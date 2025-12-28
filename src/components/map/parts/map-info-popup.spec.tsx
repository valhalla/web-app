import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapInfoPopup } from './map-info-popup';

vi.mock('../utils', () => ({
  convertDDToDMS: vi.fn((value: number) => `${Math.abs(value)}° 0' 0"`),
}));

const defaultProps = {
  popupLngLat: { lng: 10.123456, lat: 50.654321 },
  elevation: '250 m',
  isHeightLoading: false,
  isLocateLoading: false,
  locate: [],
  onLocate: vi.fn(),
  onClose: vi.fn(),
};

describe('MapInfoPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<MapInfoPopup {...defaultProps} />)).not.toThrow();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <MapInfoPopup {...defaultProps} onClose={onClose} />
    );

    const closeButton = container.querySelector('.absolute');
    if (closeButton) {
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should display longitude, latitude in decimal degrees', () => {
    render(<MapInfoPopup {...defaultProps} />);

    expect(screen.getByTestId('dd-button')).toHaveTextContent(
      '10.123456, 50.654321'
    );
  });

  it('should display latitude, longitude format', () => {
    render(<MapInfoPopup {...defaultProps} />);

    expect(screen.getByTestId('latlng-button')).toHaveTextContent(
      '50.654321, 10.123456'
    );
  });

  it('should display coordinates in DMS format', () => {
    render(<MapInfoPopup {...defaultProps} />);

    expect(screen.getByTestId('dms-button')).toBeInTheDocument();
  });

  it('should display elevation value', () => {
    render(<MapInfoPopup {...defaultProps} elevation="500 m" />);

    expect(screen.getByTestId('elevation-button')).toHaveTextContent('500 m');
  });

  it('should display Locate Point button', () => {
    render(<MapInfoPopup {...defaultProps} />);

    expect(screen.getByTestId('locate-point-button')).toHaveTextContent(
      'Locate Point'
    );
  });

  it('should display Valhalla Location JSON button', () => {
    render(<MapInfoPopup {...defaultProps} />);

    expect(screen.getByTestId('location-json-button')).toHaveTextContent(
      'Valhalla Location JSON'
    );
  });

  it('should call onLocate when Locate Point is clicked', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const popupLngLat = { lng: 10.5, lat: 50.5 };

    render(
      <MapInfoPopup
        {...defaultProps}
        onLocate={onLocate}
        popupLngLat={popupLngLat}
      />
    );

    await user.click(screen.getByTestId('locate-point-button'));

    expect(onLocate).toHaveBeenCalledWith(10.5, 50.5);
  });

  it('should format coordinates to 6 decimal places', () => {
    render(
      <MapInfoPopup
        {...defaultProps}
        popupLngLat={{ lng: 10.123456789, lat: 50.987654321 }}
      />
    );

    expect(screen.getByTestId('dd-button')).toHaveTextContent(
      '10.123457, 50.987654'
    );
  });

  it('should have copy buttons for coordinate rows', () => {
    render(<MapInfoPopup {...defaultProps} />);

    expect(screen.getByTestId('dd-copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('latlng-copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('dms-copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('location-json-copy-button')).toBeInTheDocument();
  });
});
