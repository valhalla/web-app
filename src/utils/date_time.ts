import { intervalToDuration } from 'date-fns'
const formatDuration = (durationInSeconds) => {
  const duration = intervalToDuration({
    start: 0,
    end: durationInSeconds * 1000,
  })

  let durationStr = ''
  if (duration.days > 0) {
    durationStr += duration.days + 'd '
  }
  if (duration.hours > 0) {
    durationStr += duration.hours + 'h '
  }
  if (duration.minutes > 0) {
    durationStr += duration.minutes + 'm '
  }
  if (duration.seconds > 0) {
    durationStr += duration.seconds + 's'
  }
  return durationStr
}
export default formatDuration
