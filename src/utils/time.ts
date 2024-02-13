export function convertDurationToMinutes(durationString: string) {
  const [timeNumber, timeUnit] = durationString.split(" ");
  if (isNaN(parseInt(timeNumber))) {
    throw new Error("Invalid duration string");
  }  
  if (timeUnit === "hour" || timeUnit === "hours") {
    return Number(timeNumber) * 60;
  } else {
    return Number(timeNumber);
  }
}
