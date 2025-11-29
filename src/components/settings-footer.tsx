export const SettingsFooter = () => {
  return (
    <small className="text-xs">
      Calculations by{' '}
      <a
        className="font-medium text-primary underline underline-offset-3"
        href="https://github.com/valhalla/valhalla"
        target="_blank"
        rel="noopener noreferrer"
      >
        Valhalla
      </a>{' '}
      • Visualized with{' '}
      <a
        className="font-medium text-primary underline underline-offset-3"
        href="https://github.com/gis-ops/valhalla-app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Valhalla App
      </a>
    </small>
  );
};
