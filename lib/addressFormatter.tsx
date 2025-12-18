/**
 * Formats a Google Places address into a shorter, more readable format
 * Format: Street name + Street number, ZIP code + City + City Department Acronym. Country
 *
 * Example:
 * Input: "Via di San Calepodio, 14, Rome, Metropolitan City of Rome Capital, Italy"
 * Output: "Via di San Calepodio 14, 00152 Rome RM, Italy"
 */
export function formatAddress(fullAddress: string): string {
  // If address is already short or doesn't need formatting
  if (!fullAddress || fullAddress.length < 20) {
    return fullAddress;
  }

  // Split by commas and trim each part
  const parts = fullAddress.split(",").map((p) => p.trim());

  // Try to identify components
  let street = "";
  let city = "";
  let region = "";
  let country = "";
  let postalCode = "";

  // Check if we have postal code in any part (usually 5 digits in Italy)
  const postalMatch = fullAddress.match(/\b\d{5}\b/);
  if (postalMatch) {
    postalCode = postalMatch[0];
  }

  // Last part is usually country
  if (parts.length > 0) {
    country = parts[parts.length - 1];
  }

  // Try to identify region (contains "Metropolitan City of", "Province of", etc.)
  const regionPart = parts.find(
    (p) =>
      p.includes("Metropolitan City") ||
      p.includes("Province") ||
      p.includes("Capital"),
  );

  if (regionPart) {
    // Extract region acronym (e.g., "Metropolitan City of Rome Capital" -> "RM")
    // Common patterns: "City of X", "Province of X", etc.
    const cityMatch = regionPart.match(
      /(?:Metropolitan City|Province|City) of ([^,]+)/i,
    );
    if (cityMatch) {
      const regionName = cityMatch[1].trim();
      // Generate acronym from first letters of each word
      region = regionName
        .split(" ")
        .filter((w) => w.length > 2) // Skip short words like "of", "the"
        .map((w) => w[0].toUpperCase())
        .join("");
    }
  }

  // City is usually before region
  const regionIndex = parts.findIndex((p) => p === regionPart);
  if (regionIndex > 0) {
    city = parts[regionIndex - 1];
  } else if (parts.length >= 3) {
    city = parts[parts.length - 2];
  }

  // Street is usually the first part(s)
  // Combine first parts that aren't city/region/country
  const streetParts = parts.filter((p, i) => {
    return (
      p !== city && p !== regionPart && p !== country && i < parts.length - 2
    );
  });

  street = streetParts.join(", ");

  // Build formatted address
  const addressComponents = [];

  if (street) {
    // Remove comma from street number if present
    street = street.replace(/,\s*(\d+)/, " $1");
    addressComponents.push(street);
  }

  const cityPart = [postalCode, city, region].filter(Boolean).join(" ");
  if (cityPart) {
    addressComponents.push(cityPart);
  }

  if (country) {
    addressComponents.push(country);
  }

  return addressComponents.join(", ") || fullAddress;
}

/**
 * Alternative formatter using Google Geocoding API result components
 * This is more reliable if you have access to the structured address components
 */
export function formatAddressFromComponents(components: {
  route?: string;
  street_number?: string;
  postal_code?: string;
  locality?: string;
  administrative_area_level_2?: string;
  country?: string;
}): string {
  const parts = [];

  // Street name and number
  if (components.route) {
    const streetPart = components.street_number
      ? `${components.route} ${components.street_number}`
      : components.route;
    parts.push(streetPart);
  }

  // City with postal code and region acronym
  const cityParts = [];
  if (components.postal_code) cityParts.push(components.postal_code);
  if (components.locality) cityParts.push(components.locality);

  // Extract region acronym
  if (components.administrative_area_level_2) {
    const region = components.administrative_area_level_2
      .split(" ")
      .filter((w) => w.length > 2)
      .map((w) => w[0].toUpperCase())
      .join("");
    if (region) cityParts.push(region);
  }

  if (cityParts.length > 0) {
    parts.push(cityParts.join(" "));
  }

  // Country
  if (components.country) {
    parts.push(components.country);
  }

  return parts.join(", ");
}
