'use client';

// components/rectify/BirthPlacePicker.tsx
// Advanced birth place selection with 3 modes:
// 1. City autocomplete with full address
// 2. Manual coordinates input
// 3. Interactive map picker

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { debounce } from '@/lib/debounce';

// Dynamically import map to avoid SSR issues with Leaflet
const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-72 bg-[#1A1F2E] rounded-xl flex items-center justify-center border border-[#D4AF37]/20">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[#8C7F72] text-sm mt-2">Loading map...</p>
            </div>
        </div>
    )
});

interface LocationResult {
    id: string;
    city: string;
    district: string;
    state: string;
    country: string;
    pincode: string;
    latitude: number;
    longitude: number;
    timezone: string;
    displayName: string;
}

interface BirthPlacePickerProps {
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: number;
    onUpdate: (updates: {
        birthPlace: string;
        latitude: number;
        longitude: number;
        timezone: number;
    }) => void;
}

type InputMode = 'search' | 'manual' | 'map';

export default function BirthPlacePicker({
    birthPlace,
    latitude,
    longitude,
    timezone,
    onUpdate
}: BirthPlacePickerProps) {
    const [mode, setMode] = useState<InputMode>('search');
    const [searchQuery, setSearchQuery] = useState(birthPlace);
    const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

    // Manual input states
    const [manualLat, setManualLat] = useState(latitude?.toString() || '');
    const [manualLng, setManualLng] = useState(longitude?.toString() || '');
    const [manualTimezone, setManualTimezone] = useState(timezone?.toString() || '5.5');

    // Map states
    const [mapQuery, setMapQuery] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: latitude || 28.6139, lng: longitude || 77.2090 });
    const [mapZoom, setMapZoom] = useState(5);
    const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search for cities using Nominatim API (free, no API key needed)
    const searchCities = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&accept-language=en`,
                    { headers: { 'User-Agent': 'AIPandit/1.0' } }
                );

                if (!response.ok) throw new Error('Search failed');

                const data = await response.json();

                const results: LocationResult[] = data.map((item: any, index: number) => ({
                    id: `${index}-${item.place_id}`,
                    city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.name || '',
                    district: item.address?.county || item.address?.state_district || '',
                    state: item.address?.state || '',
                    country: item.address?.country || '',
                    pincode: item.address?.postcode || '',
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                    timezone: getTimezoneForCountry(item.address?.country || '', parseFloat(item.lon)),
                    displayName: item.display_name
                }));

                setSearchResults(results);
                setShowDropdown(results.length > 0);
            } catch (error) {
                console.error('City search failed:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        []
    );

    // Get timezone based on country (accurate for major countries)
    const getTimezoneForCountry = (country: string, lng: number): string => {
        // Country-specific timezone mappings
        const countryTimezones: Record<string, string> = {
            'India': '5.5',       // IST
            'Nepal': '5.75',      // NPT
            'Pakistan': '5',      // PKT
            'Bangladesh': '6',    // BST
            'Sri Lanka': '5.5',   // IST
            'Myanmar': '6.5',     // MMT
            'Thailand': '7',      // ICT
            'Vietnam': '7',       // ICT
            'Malaysia': '8',      // MYT
            'Singapore': '8',     // SGT
            'Indonesia': '7',     // WIB (main)
            'Philippines': '8',   // PHT
            'China': '8',         // CST
            'Japan': '9',         // JST
            'South Korea': '9',   // KST
            'Australia': '10',    // AEST
            'New Zealand': '12',  // NZST
            'United Kingdom': '0', // GMT
            'United States': '-5', // EST (default)
            'Canada': '-5',       // EST
            'Brazil': '-3',       // BRT
            'Germany': '1',       // CET
            'France': '1',        // CET
            'Italy': '1',         // CET
            'Spain': '1',         // CET
            'Russia': '3',        // MSK
            'UAE': '4',           // GST
            'Saudi Arabia': '3',  // AST
            'South Africa': '2',  // SAST
            'Egypt': '2',         // EET
            'Kenya': '3',         // EAT
            'Nigeria': '1',       // WAT
        };

        // Check for country match (partial match)
        for (const [countryName, tz] of Object.entries(countryTimezones)) {
            if (country.toLowerCase().includes(countryName.toLowerCase())) {
                return tz;
            }
        }

        // Fallback: approximate from longitude
        const offset = Math.round(lng / 15 * 2) / 2;
        return offset.toString();
    };

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        searchCities(value);
    };

    // Handle location selection
    const handleSelectLocation = (location: LocationResult) => {
        setSelectedLocation(location);
        setSearchQuery(location.displayName);
        setShowDropdown(false);

        const formattedPlace = [
            location.city,
            location.district,
            location.state,
            location.country,
            location.pincode
        ].filter(Boolean).join(', ');

        onUpdate({
            birthPlace: formattedPlace,
            latitude: location.latitude,
            longitude: location.longitude,
            timezone: parseFloat(location.timezone)
        });
    };

    // Handle manual coordinate update
    const handleManualUpdate = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        const tz = parseFloat(manualTimezone);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return;
        }

        onUpdate({
            birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
            latitude: lat,
            longitude: lng,
            timezone: tz
        });
    };

    // Handle map search
    const handleMapSearch = async () => {
        if (!mapQuery.trim()) return;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapQuery)}&limit=1&addressdetails=1`,
                { headers: { 'User-Agent': 'AIPandit/1.0' } }
            );

            const data = await response.json();
            if (data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                setMapCenter({ lat, lng });
                setMapZoom(12); // Zoom in to city level
                setMapMarker({ lat, lng });

                const location: LocationResult = {
                    id: result.place_id,
                    city: result.address?.city || result.address?.town || result.name || '',
                    district: result.address?.county || '',
                    state: result.address?.state || '',
                    country: result.address?.country || '',
                    pincode: result.address?.postcode || '',
                    latitude: lat,
                    longitude: lng,
                    timezone: getTimezoneForCountry(result.address?.country || '', lng),
                    displayName: result.display_name
                };

                const formattedPlace = [
                    location.city,
                    location.district,
                    location.state,
                    location.country,
                    location.pincode
                ].filter(Boolean).join(', ');

                onUpdate({
                    birthPlace: formattedPlace,
                    latitude: lat,
                    longitude: lng,
                    timezone: parseFloat(location.timezone)
                });
            }
        } catch (error) {
            console.error('Map search failed:', error);
        }
    };

    // Handle map click (simulated for static map)
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // For a static map, we calculate approximate coordinates from click position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Map dimensions
        const mapWidth = rect.width;
        const mapHeight = rect.height;

        // Calculate approximate lat/lng (rough approximation for demo)
        const zoomLevel = 5;
        const scale = 156543.03392 / Math.pow(2, zoomLevel);

        const lng = mapCenter.lng + ((x - mapWidth / 2) * scale) / 111320;
        const lat = mapCenter.lat - ((y - mapHeight / 2) * scale) / 110540;

        setMapMarker({ lat, lng });

        onUpdate({
            birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
            latitude: lat,
            longitude: lng,
            timezone: parseFloat(getTimezoneForCountry('', lng))
        });
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-[#C4B8AD] mb-2">
                Birth Place *
            </label>

            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-[#2A3442] rounded-lg">
                {[
                    { id: 'search', label: 'Search City', icon: '🔍' },
                    { id: 'manual', label: 'Coordinates', icon: '📍' },
                    { id: 'map', label: 'Map', icon: '🗺️' }
                ].map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id as InputMode)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${mode === m.id
                            ? 'bg-[#D4AF37] text-[#0F1419] font-semibold'
                            : 'text-[#8C7F72] hover:text-[#C4B8AD] hover:bg-white/5'
                            }`}
                    >
                        <span>{m.icon}</span>
                        <span className="hidden sm:inline">{m.label}</span>
                    </button>
                ))}
            </div>

            {/* Mode 1: City Search with Autocomplete */}
            {mode === 'search' && (
                <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            className="input-field pr-10"
                            placeholder="Type city name (e.g., Mumbai, Delhi, Patna)"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Dropdown Results */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1A1F2E] border border-[#D4AF37]/30 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                            {searchResults.map((result) => (
                                <button
                                    key={result.id}
                                    type="button"
                                    onClick={() => handleSelectLocation(result)}
                                    className="w-full text-left px-4 py-3 hover:bg-[#D4AF37]/10 transition-colors border-b border-white/5 last:border-0"
                                >
                                    {/* City & District */}
                                    <div className="font-medium text-[#F5F0EB]">
                                        {result.city || 'Unknown Location'}
                                        {result.district && <span className="text-[#8C7F72]"> • {result.district}</span>}
                                    </div>

                                    {/* State & Country */}
                                    <div className="text-xs text-[#8C7F72] mt-1">
                                        {[result.state, result.country].filter(Boolean).join(', ')}
                                    </div>

                                    {/* Coordinates & Timezone */}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-[#D4AF37]">
                                        <span>📍 {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°</span>
                                        <span>🕐 UTC{parseFloat(result.timezone) >= 0 ? '+' : ''}{result.timezone}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected Location Display */}
                    {selectedLocation && (
                        <div className="mt-3 p-3 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-lg">
                            <div className="flex items-center gap-2 text-[#2D7A5C] text-sm font-medium">
                                <span>✓</span>
                                <span>Location Selected</span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-[#8C7F72]">City:</span>
                                    <span className="text-[#F5F0EB] ml-1">{selectedLocation.city}</span>
                                </div>
                                {selectedLocation.district && (
                                    <div>
                                        <span className="text-[#8C7F72]">District:</span>
                                        <span className="text-[#F5F0EB] ml-1">{selectedLocation.district}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[#8C7F72]">State:</span>
                                    <span className="text-[#F5F0EB] ml-1">{selectedLocation.state}</span>
                                </div>
                                <div>
                                    <span className="text-[#8C7F72]">Country:</span>
                                    <span className="text-[#F5F0EB] ml-1">{selectedLocation.country}</span>
                                </div>
                                {selectedLocation.pincode && (
                                    <div>
                                        <span className="text-[#8C7F72]">Pin Code:</span>
                                        <span className="text-[#F5F0EB] ml-1">{selectedLocation.pincode}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[#8C7F72]">Coordinates:</span>
                                    <span className="text-[#D4AF37] ml-1 font-mono text-[10px]">
                                        {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mode 2: Manual Coordinates */}
            {mode === 'manual' && (
                <div className="space-y-4">
                    <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg">
                        <p className="text-xs text-[#D4AF37]">
                            💡 Enter exact coordinates if you know them. You can find coordinates from Google Maps.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-[#8C7F72] mb-1">Latitude (-90 to 90)</label>
                            <input
                                type="number"
                                step="0.0001"
                                min="-90"
                                max="90"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                className="input-field font-mono"
                                placeholder="e.g., 28.6139"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#8C7F72] mb-1">Longitude (-180 to 180)</label>
                            <input
                                type="number"
                                step="0.0001"
                                min="-180"
                                max="180"
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                className="input-field font-mono"
                                placeholder="e.g., 77.2090"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-[#8C7F72] mb-1">Timezone (UTC offset in hours)</label>
                        <select
                            value={manualTimezone}
                            onChange={(e) => setManualTimezone(e.target.value)}
                            className="input-field"
                        >
                            <option value="-12">UTC-12:00</option>
                            <option value="-11">UTC-11:00</option>
                            <option value="-10">UTC-10:00 (Hawaii)</option>
                            <option value="-9">UTC-09:00 (Alaska)</option>
                            <option value="-8">UTC-08:00 (Pacific)</option>
                            <option value="-7">UTC-07:00 (Mountain)</option>
                            <option value="-6">UTC-06:00 (Central)</option>
                            <option value="-5">UTC-05:00 (Eastern)</option>
                            <option value="-4">UTC-04:00 (Atlantic)</option>
                            <option value="-3">UTC-03:00 (Brazil)</option>
                            <option value="-2">UTC-02:00</option>
                            <option value="-1">UTC-01:00</option>
                            <option value="0">UTC+00:00 (London)</option>
                            <option value="1">UTC+01:00 (Paris)</option>
                            <option value="2">UTC+02:00 (Cairo)</option>
                            <option value="3">UTC+03:00 (Moscow)</option>
                            <option value="3.5">UTC+03:30 (Tehran)</option>
                            <option value="4">UTC+04:00 (Dubai)</option>
                            <option value="4.5">UTC+04:30 (Kabul)</option>
                            <option value="5">UTC+05:00 (Pakistan)</option>
                            <option value="5.5">UTC+05:30 (India - IST)</option>
                            <option value="5.75">UTC+05:45 (Nepal)</option>
                            <option value="6">UTC+06:00 (Bangladesh)</option>
                            <option value="6.5">UTC+06:30 (Myanmar)</option>
                            <option value="7">UTC+07:00 (Bangkok)</option>
                            <option value="8">UTC+08:00 (Singapore, China)</option>
                            <option value="9">UTC+09:00 (Japan, Korea)</option>
                            <option value="9.5">UTC+09:30 (Australia Central)</option>
                            <option value="10">UTC+10:00 (Sydney)</option>
                            <option value="11">UTC+11:00</option>
                            <option value="12">UTC+12:00 (New Zealand)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleManualUpdate}
                        className="w-full py-3 bg-[#D4AF37] text-[#0F1419] font-semibold rounded-lg hover:bg-[#E8C54D] transition-colors"
                    >
                        Apply Coordinates
                    </button>

                    {latitude && longitude && (
                        <div className="p-3 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-lg text-sm">
                            <span className="text-[#2D7A5C]">✓ Current:</span>
                            <span className="text-[#F5F0EB] ml-2 font-mono">
                                {latitude.toFixed(4)}°, {longitude.toFixed(4)}° (UTC{timezone >= 0 ? '+' : ''}{timezone})
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Mode 3: Map Picker */}
            {mode === 'map' && (
                <div className="space-y-4">
                    {/* Search on map */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={mapQuery}
                            onChange={(e) => setMapQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                            className="input-field flex-1"
                            placeholder="Search location on map..."
                        />
                        <button
                            type="button"
                            onClick={handleMapSearch}
                            className="px-4 py-2 bg-[#D4AF37] text-[#0F1419] font-semibold rounded-lg hover:bg-[#E8C54D] transition-colors"
                        >
                            Search
                        </button>
                    </div>

                    {/* Interactive Map */}
                    <InteractiveMap
                        center={mapCenter}
                        zoom={mapZoom}
                        marker={mapMarker}
                        onLocationSelect={async (lat, lng) => {
                            setMapMarker({ lat, lng });

                            // Reverse geocode to get country for timezone
                            try {
                                const response = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                                    { headers: { 'User-Agent': 'AIPandit/1.0' } }
                                );
                                const data = await response.json();
                                const country = data.address?.country || '';
                                const city = data.address?.city || data.address?.town || data.address?.village || '';
                                const state = data.address?.state || '';

                                const formattedPlace = [city, state, country].filter(Boolean).join(', ') ||
                                    `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

                                onUpdate({
                                    birthPlace: formattedPlace,
                                    latitude: lat,
                                    longitude: lng,
                                    timezone: parseFloat(getTimezoneForCountry(country, lng))
                                });
                            } catch {
                                // Fallback if reverse geocoding fails
                                onUpdate({
                                    birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
                                    latitude: lat,
                                    longitude: lng,
                                    timezone: parseFloat(getTimezoneForCountry('', lng))
                                });
                            }
                        }}
                        onCenterChange={setMapCenter}
                    />

                    {/* Current Coordinates Display */}
                    {mapMarker && (
                        <div className="p-3 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-lg">
                            <div className="flex items-center gap-2 text-[#2D7A5C] text-sm font-medium">
                                <span>📍</span>
                                <span>Selected Location</span>
                            </div>
                            <div className="mt-2 font-mono text-sm text-[#F5F0EB]">
                                Lat: {mapMarker.lat.toFixed(6)}°, Lng: {mapMarker.lng.toFixed(6)}°
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-[#8C7F72]">
                        💡 Tip: Search for your city, then click on the map to fine-tune the exact location.
                    </p>
                </div>
            )}

            {/* Current Selection Summary (always visible) */}
            {(latitude && longitude && mode !== 'search') && (
                <div className="p-3 bg-[#2A3442] rounded-lg">
                    <div className="text-xs text-[#8C7F72] mb-1">Current Birth Place</div>
                    <div className="text-sm text-[#F5F0EB]">{birthPlace || 'Not set'}</div>
                    <div className="text-xs text-[#D4AF37] font-mono mt-1">
                        {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E • UTC{timezone >= 0 ? '+' : ''}{timezone}
                    </div>
                </div>
            )}
        </div>
    );
}
