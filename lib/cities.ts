// Global city/location interface
export interface City {
  name: string;
  latitude: number;
  longitude: number;
  displayName?: string;
  district?: string;
  state?: string;
  country?: string;
}

// Helper to extract district/state/country from display_name and address
const parseLocationDetails = (displayName: string, address: any): { district: string; state: string; country: string } => {
  let district = '';
  let state = '';
  let country = '';
  
  // First try to get from structured address data
  if (address) {
    district = address.county || address.district || address.borough || '';
    state = address.state || address.province || address.region || address.state_district || '';
    country = address.country || '';
  }
  
  // If not found, parse from display_name
  // Format typically: City, District, State, Country
  if (displayName && (!state || !country)) {
    const parts = displayName.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
      if (!state) state = parts[parts.length - 2];
      if (!country) country = parts[parts.length - 1];
    }
    
    if (parts.length >= 3 && !district) {
      district = parts[1];
    }
  }
  
  return { district, state, country };
};

// Search cities worldwide using Nominatim API (OpenStreetMap)
export const searchCities = async (query: string): Promise<City[]> => {
  if (!query.trim() || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) return [];
    
    const results = await response.json();
    
    return results.map((result: any) => {
      const address = result.address || {};
      const cityName = address.city || address.town || address.village || address.county || result.name || '';
      
      const { district, state, country } = parseLocationDetails(result.display_name || '', address);
      
      return {
        name: cityName,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name || '',
        district: district,
        state: state,
        country: country
      };
    }).filter((city: City) => city.name); // Filter out empty results
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
};

// Reverse geocode - get city name from coordinates
export const getCityFromCoordinates = async (latitude: number, longitude: number): Promise<City | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) return null;
    
    const result = await response.json();
    const address = result.address || {};
    
    const cityName = address.city || address.town || address.village || address.county || result.name || '';
    
    const { district, state, country } = parseLocationDetails(result.display_name || '', address);
    
    if (!cityName) return null;
    
    return {
      name: cityName,
      latitude,
      longitude,
      displayName: result.display_name || '',
      district: district,
      state: state,
      country: country
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};
