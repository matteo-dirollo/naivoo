import * as Crypto from "expo-crypto";

export async function googleReverseGeocode(lat: number, lng: number) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.results?.length) {
    throw new Error("No results");
  }

  return json.results[0]; // returns full address object
}

export function formatTime(minutes: number): string {
  const formattedMinutes = +minutes?.toFixed(0) || 0;

  if (formattedMinutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(formattedMinutes / 60);
    const remainingMinutes = formattedMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day < 10 ? "0" + day : day} ${month} ${year}`;
}

export function getShortBase36Id(length = 5) {
  // Use 3 bytes max (24 bits = 16,777,215) to stay safe
  const bytes = Crypto.getRandomBytes(3);

  // Convert bytes to number safely
  let randomNum = 0;
  for (let i = 0; i < bytes.length; i++) {
    randomNum = (randomNum << 8) | bytes[i];
  }

  // Convert to base36 and ensure correct length
  const maxValue = Math.pow(36, length);
  const result = (randomNum % maxValue).toString(36);

  // Pad with leading zeros if needed
  return result.padStart(length, "0").slice(0, length);
}
