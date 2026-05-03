
export interface TestProfile {
    id: string;
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    expectedTime: string; // The known baseline time
    latitude: number;
    longitude: number;
    timezone: string | number;
    offsetConfig: { preset?: any; customMinutes?: number; description: string };
    lifeEvents: any[];
    forensicTraits: any;
}

export const TEST_PROFILES: TestProfile[] = [
    {
        id: 'CRIC-VK-1988',
        fullName: 'Virat Kohli',
        dateOfBirth: '1988-11-05',
        tentativeTime: '10:28:00',
        expectedTime: '10:28:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        offsetConfig: { preset: 'custom', customMinutes: 5, description: 'Test Custom Range' },
        lifeEvents: [
            { id: 'vk1', category: 'family', eventType: 'death', eventDate: '2006-12-18', datePrecision: 'exact_date', importance: 'critical' },
            { id: 'vk2', category: 'career', eventType: 'debut', eventDate: '2008-08-18', datePrecision: 'exact_date', importance: 'high' },
            { id: 'vk3', category: 'career', eventType: 'achievement', eventDate: '2011-04-02', datePrecision: 'exact_date', importance: 'high' },
            { id: 'vk4', category: 'marriage', eventType: 'marriage', eventDate: '2017-12-11', datePrecision: 'exact_date', importance: 'critical' },
            { id: 'vk5', category: 'children', eventType: 'birth', eventDate: '2021-01-11', datePrecision: 'exact_date', importance: 'high' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'TECH-SJ-1955',
        fullName: 'Steve Jobs',
        dateOfBirth: '1955-02-24',
        tentativeTime: '19:15:00',
        expectedTime: '19:15:00',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: -8,
        offsetConfig: { preset: '1hour', description: 'Standard' },
        lifeEvents: [
            { id: 'sj1', category: 'career', eventType: 'employment', eventDate: '1974-02-01', datePrecision: 'month_year', importance: 'high' }, // Atari
            { id: 'sj2', category: 'career', eventType: 'foundation', eventDate: '1976-04-01', datePrecision: 'exact_date', importance: 'critical' }, // Apple
            { id: 'sj3', category: 'marriage', eventType: 'marriage', eventDate: '1991-03-18', datePrecision: 'exact_date', importance: 'high' },
            { id: 'sj4', category: 'career', eventType: 'rejoining', eventDate: '1997-02-01', datePrecision: 'month_year', importance: 'critical' }, // Return to Apple
            { id: 'sj5', category: 'health', eventType: 'surgery', eventDate: '2004-07-31', datePrecision: 'exact_date', importance: 'high' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'ACTR-AB-1942',
        fullName: 'Amitabh Bachchan',
        dateOfBirth: '1942-10-11',
        tentativeTime: '16:00:00',
        expectedTime: '16:00:00',
        latitude: 25.4358,
        longitude: 81.8463,
        timezone: 5.5,
        offsetConfig: { preset: 'custom', customMinutes: 5, description: 'Test Custom Range' },
        lifeEvents: [
            { id: 'ab1', category: 'career', eventType: 'debut', eventDate: '1969-11-07', datePrecision: 'exact_date', importance: 'high' },
            { id: 'ab2', category: 'marriage', eventType: 'marriage', eventDate: '1973-06-03', datePrecision: 'exact_date', importance: 'critical' },
            { id: 'ab3', category: 'health', eventType: 'accident', eventDate: '1982-07-26', datePrecision: 'exact_date', importance: 'critical' }, // Coolie
            { id: 'ab4', category: 'career', eventType: 'achievement', eventDate: '2000-07-03', datePrecision: 'exact_date', importance: 'high' }, // KBC
            { id: 'ab5', category: 'children', eventType: 'birth', eventDate: '1974-03-17', datePrecision: 'exact_date', importance: 'high' } // Shweta
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'TECH-EM-1971',
        fullName: 'Elon Musk',
        dateOfBirth: '1971-06-28',
        tentativeTime: '07:30:00',
        expectedTime: '07:30:00',
        latitude: -25.7479,
        longitude: 28.2293,
        timezone: 2,
        offsetConfig: { preset: '1hour', description: 'Standard' },
        lifeEvents: [
            { id: 'em1', category: 'career', eventType: 'foundation', eventDate: '1995-01-01', datePrecision: 'month_year', importance: 'high' }, // Zip2
            { id: 'em2', category: 'career', eventType: 'foundation', eventDate: '2002-03-14', datePrecision: 'exact_date', importance: 'critical' }, // SpaceX
            { id: 'em3', category: 'marriage', eventType: 'marriage', eventDate: '2000-01-01', datePrecision: 'month_year', importance: 'high' },
            { id: 'em4', category: 'career', eventType: 'ipo', eventDate: '2010-06-29', datePrecision: 'exact_date', importance: 'high' }, // Tesla IPO
            { id: 'em5', category: 'children', eventType: 'birth', eventDate: '2002-01-01', datePrecision: 'month_year', importance: 'high' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'TECH-BG-1955',
        fullName: 'Bill Gates',
        dateOfBirth: '1955-10-28',
        tentativeTime: '22:00:00',
        expectedTime: '22:00:00',
        latitude: 47.6062,
        longitude: -122.3321,
        timezone: -8,
        offsetConfig: { preset: '45min', description: 'Standard' },
        lifeEvents: [
            { id: 'bg1', category: 'career', eventType: 'foundation', eventDate: '1975-04-04', datePrecision: 'exact_date', importance: 'critical' },
            { id: 'bg2', category: 'career', eventType: 'ipo', eventDate: '1986-03-13', datePrecision: 'exact_date', importance: 'high' },
            { id: 'bg3', category: 'marriage', eventType: 'marriage', eventDate: '1994-01-01', datePrecision: 'exact_date', importance: 'high' },
            { id: 'bg4', category: 'career', eventType: 'resignation', eventDate: '2000-01-13', datePrecision: 'exact_date', importance: 'high' },
            { id: 'bg5', category: 'family', eventType: 'death', eventDate: '2020-09-14', datePrecision: 'exact_date', importance: 'medium' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'SCIE-AE-1879',
        fullName: 'Albert Einstein',
        dateOfBirth: '1879-03-14',
        tentativeTime: '11:30:00',
        expectedTime: '11:30:00',
        latitude: 48.4011,
        longitude: 9.9876,
        timezone: 1,
        offsetConfig: { preset: 'custom', customMinutes: 5, description: 'Test Custom Range' },
        lifeEvents: [
            { id: 'ae1', category: 'career', eventType: 'employment', eventDate: '1902-06-23', datePrecision: 'exact_date', importance: 'high' },
            { id: 'ae2', category: 'career', eventType: 'achievement', eventDate: '1905-06-09', datePrecision: 'month_year', importance: 'critical' }, // Annus Mirabilis
            { id: 'ae3', category: 'marriage', eventType: 'marriage', eventDate: '1903-01-06', datePrecision: 'exact_date', importance: 'high' },
            { id: 'ae4', category: 'career', eventType: 'achievement', eventDate: '1922-11-09', datePrecision: 'exact_date', importance: 'critical' }, // Nobel announced
            { id: 'ae5', category: 'location', eventType: 'relocation', eventDate: '1933-10-17', datePrecision: 'exact_date', importance: 'high' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'ACTR-LM-1929',
        fullName: 'Lata Mangeshkar',
        dateOfBirth: '1929-09-28',
        tentativeTime: '23:48:00',
        expectedTime: '23:48:00',
        latitude: 22.7196,
        longitude: 75.8577,
        timezone: 5.5,
        offsetConfig: { preset: '20min', description: 'Standard' },
        lifeEvents: [
            { id: 'lm1', category: 'family', eventType: 'death', eventDate: '1942-05-22', datePrecision: 'exact_date', importance: 'critical' },
            { id: 'lm2', category: 'career', eventType: 'debut', eventDate: '1942-01-01', datePrecision: 'month_year', importance: 'high' },
            { id: 'lm3', category: 'career', eventType: 'achievement', eventDate: '1969-01-01', datePrecision: 'month_year', importance: 'high' }, // Padma Bhushan
            { id: 'lm4', category: 'career', eventType: 'achievement', eventDate: '2001-01-26', datePrecision: 'exact_date', importance: 'critical' }, // Bharat Ratna
            { id: 'lm5', category: 'health', eventType: 'surgery', eventDate: '2019-11-11', datePrecision: 'exact_date', importance: 'medium' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'LEAD-MG-1869',
        fullName: 'Mahatma Gandhi',
        dateOfBirth: '1869-10-02',
        tentativeTime: '07:12:00',
        expectedTime: '07:12:00',
        latitude: 21.6417,
        longitude: 69.6293,
        timezone: 5.5,
        offsetConfig: { preset: '30min', description: 'Standard' },
        lifeEvents: [
            { id: 'mg1', category: 'marriage', eventType: 'marriage', eventDate: '1883-05-01', datePrecision: 'month_year', importance: 'high' },
            { id: 'mg2', category: 'location', eventType: 'relocation', eventDate: '1888-09-04', datePrecision: 'exact_date', importance: 'high' }, // London
            { id: 'mg3', category: 'location', eventType: 'relocation', eventDate: '1893-04-01', datePrecision: 'month_year', importance: 'high' }, // South Africa
            { id: 'mg4', category: 'location', eventType: 'relocation', eventDate: '1915-01-09', datePrecision: 'exact_date', importance: 'critical' }, // India Return
            { id: 'mg5', category: 'career', eventType: 'achievement', eventDate: '1930-03-12', datePrecision: 'exact_date', importance: 'critical' } // Dandi March
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'ROYA-PD-1961',
        fullName: 'Princess Diana',
        dateOfBirth: '1961-07-01',
        tentativeTime: '19:45:00',
        expectedTime: '19:45:00',
        latitude: 52.8286,
        longitude: 0.5097,
        timezone: 1, // BST usually +1
        offsetConfig: { preset: '45min', description: 'Standard' },
        lifeEvents: [
            { id: 'pd1', category: 'marriage', eventType: 'marriage', eventDate: '1981-07-29', datePrecision: 'exact_date', importance: 'critical' },
            { id: 'pd2', category: 'children', eventType: 'birth', eventDate: '1982-06-21', datePrecision: 'exact_date', importance: 'high' },
            { id: 'pd3', category: 'children', eventType: 'birth', eventDate: '1984-09-15', datePrecision: 'exact_date', importance: 'high' },
            { id: 'pd4', category: 'marriage', eventType: 'separation', eventDate: '1992-12-09', datePrecision: 'exact_date', importance: 'high' },
            { id: 'pd5', category: 'marriage', eventType: 'divorce', eventDate: '1996-08-28', datePrecision: 'exact_date', importance: 'critical' }
        ] as any[],
        forensicTraits: {} as any
    },
    {
        id: 'LEAD-NM-1950',
        fullName: 'Narendra Modi',
        dateOfBirth: '1950-09-17',
        tentativeTime: '11:00:00',
        expectedTime: '11:00:00',
        latitude: 23.7853,
        longitude: 72.6450,
        timezone: 5.5,
        offsetConfig: { preset: '30min', description: 'Standard' },
        lifeEvents: [
            { id: 'nm1', category: 'career', eventType: 'appointment', eventDate: '2001-10-07', datePrecision: 'exact_date', importance: 'high' }, // CM Gujarat
            { id: 'nm2', category: 'career', eventType: 'achievement', eventDate: '2014-05-26', datePrecision: 'exact_date', importance: 'critical' }, // PM 1
            { id: 'nm3', category: 'career', eventType: 'decision', eventDate: '2016-11-08', datePrecision: 'exact_date', importance: 'high' }, // Demonetization
            { id: 'nm4', category: 'career', eventType: 'achievement', eventDate: '2019-05-30', datePrecision: 'exact_date', importance: 'critical' }, // PM 2
            { id: 'nm5', category: 'career', eventType: 'achievement', eventDate: '2023-09-09', datePrecision: 'exact_date', importance: 'high' } // G20
        ] as any[],
        forensicTraits: {} as any
    }
];
