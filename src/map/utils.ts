export const convertDDToDMS = (decimalDegrees: number): string => {
  const absDegrees =
    (decimalDegrees < 0 ? -decimalDegrees : decimalDegrees) + 1e-4;

  const minutes = Math.floor((absDegrees % 1) * 60);
  const seconds = Math.floor(((absDegrees * 60) % 1) * 60);

  return `${0 | decimalDegrees}° ${minutes}' ${seconds}"`;
};
