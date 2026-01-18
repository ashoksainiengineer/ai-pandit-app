"use strict";
// lib/cities.ts - Stub for city search functionality
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCities = searchCities;
async function searchCities(query) {
    // Stub implementation - return some sample cities
    const cities = [
        { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, state: 'Maharashtra', country: 'India' },
        { name: 'Delhi', latitude: 28.7041, longitude: 77.1025, state: 'Delhi', country: 'India' },
        { name: 'New York', latitude: 40.7128, longitude: -74.0060, state: 'New York', country: 'USA' },
        { name: 'London', latitude: 51.5074, longitude: -0.1278, country: 'UK' },
    ];
    return cities.filter(city => city.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
}
//# sourceMappingURL=cities.js.map