// src/TimeUtils.js

// Converts a Date object to a time string (e.g., "09:15")
export const timeToHHMM = (date) => {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Generates time options in 15-minute intervals for a full 24-hour period.
export const generateTimeOptions = (interval = 15) => {
  const times = [];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Start at midnight

  // 24 * 60 = 1440 total minutes in a day
  for (let i = 0; i < (24 * 60) / interval; i++) {
    const time = new Date(startOfDay.getTime() + i * interval * 60000);
    times.push({
      label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: timeToHHMM(time),
      minutes: i * interval, // Total minutes from midnight
    });
  }
  return times;
};