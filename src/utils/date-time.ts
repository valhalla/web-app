import { intervalToDuration } from 'date-fns';

export const formatDuration = (durationInSeconds: number) => {
  const duration = intervalToDuration({
    start: 0,
    end: durationInSeconds * 1000,
  });

  const formatParts = [
    { value: duration.days, unit: 'd' },
    { value: duration.hours, unit: 'h' },
    { value: duration.minutes, unit: 'm' },
    { value: duration.seconds, unit: 's' },
  ];

  const formattedParts = formatParts
    .filter((part) => part.value && part.value > 0)
    .map((part) => `${part.value}${part.unit}`);

  return formattedParts.join(' ');
};

export const getDateTimeString = (): string => {
  const dtNow = new Date();
  return (
    [dtNow.getMonth() + 1, dtNow.getDate(), dtNow.getFullYear()].join('/') +
    '_' +
    [dtNow.getHours(), dtNow.getMinutes(), dtNow.getSeconds()].join(':')
  );
};
