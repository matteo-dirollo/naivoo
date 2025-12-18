/**
 * Formats a Google Places address into a shorter, more readable format * : Street name + Street number, ZIP code + City + City Department Acronym. Country
 */
export const extractAddressString = (googleAddress: any) => {
  if (!googleAddress) return null;

  // Priority 1: Use formatted_address if available
  if (googleAddress.formatted_address) {
    return googleAddress.formatted_address;
  }

  // Priority 2: Use name and region if available
  if (googleAddress.name && googleAddress.region) {
    return `${googleAddress.name}, ${googleAddress.region}`;
  }

  // Priority 3: Build from address components
  if (googleAddress.address_components) {
    const streetNumber = googleAddress.address_components.find((c: any) =>
      c.types.includes("street_number"),
    )?.long_name;

    const route = googleAddress.address_components.find((c: any) =>
      c.types.includes("route"),
    )?.long_name;

    const city = googleAddress.address_components.find((c: any) =>
      c.types.includes("locality"),
    )?.long_name;

    const region = googleAddress.address_components.find((c: any) =>
      c.types.includes("administrative_area_level_1"),
    )?.long_name;

    const parts = [streetNumber, route, city, region].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  return null;
};

export const getConciseAddress = (data: any) => {
  if (!data) return null;

  const mainText = data.structured_formatting?.main_text;

  if (!mainText) return data.description;

  // Extract city and country from terms
  const terms = data.terms || [];
  const cityIndex = Math.min(2, terms.length - 2); // Usually index 2 for city
  const city = terms[cityIndex]?.value;
  const country = terms[terms.length - 1]?.value;

  if (city && country) {
    return `${mainText}, ${city}, ${country}`;
  }

  return mainText;
};

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
