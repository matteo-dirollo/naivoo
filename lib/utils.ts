// import { Ride } from "@/types/type";
//
//
// export const sortRides = (rides: Ride[]): Ride[] => {
//   const result = rides.sort((a, b) => {
//     const dateA = new Date(`${a.created_at}T${a.ride_time}`);
//     const dateB = new Date(`${b.created_at}T${b.ride_time}`);
//     return dateB.getTime() - dateA.getTime();
//   });
//
//   return result.reverse();
// };


export async function googleReverseGeocode(lat: number, lng: number) {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_API_KEY
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
