export interface City {
    name: string;
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
    country: string;
}
export declare function searchCities(query: string): Promise<City[]>;
//# sourceMappingURL=cities.d.ts.map