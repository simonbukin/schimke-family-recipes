export function convertDurationToMinutes(durationString: string) {
  const [timeNumber, timeUnit] = durationString.split(" ");
  if (timeUnit === "hour" || timeUnit === "hours") {
    return Number(timeNumber) * 60;
  } else {
    return Number(timeNumber);
  }
}
