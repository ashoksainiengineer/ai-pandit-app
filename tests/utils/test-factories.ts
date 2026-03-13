/**
 * Test Factories - Object Mother Pattern
 * 
 * Creates test objects with sensible defaults,
 * following the Object Mother / Factory pattern.
 */

import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserFactoryOptions {
    id?: string;
    clerkId?: string;
    email?: string;
    fullName?: string;
    isActive?: boolean;
    role?: 'user' | 'admin' | 'superadmin';
}

export interface SessionFactoryOptions {
    id?: string;
    userId?: string;
    clerkId?: string;
    fullName?: string;
    dateOfBirth?: string;
    tentativeTime?: string;
    birthPlace?: string;
    latitude?: number;
    longitude?: number;
    timezone?: number;
    gender?: string;
    physicalTraits?: string;
    forensicTraits?: string;
    status?: 'draft' | 'submitted' | 'processing' | 'completed' | 'error';
    rectifiedTime?: string | null;
    accuracy?: number | null;
    analysisResult?: string | null;
}

export interface CalculationFactoryOptions {
    id?: string;
    sessionId?: string;
    birthDateTime?: string;
    latitude?: number;
    longitude?: number;
    timezone?: number;
    ephemerisData?: Record<string, unknown>;
    success?: boolean;
    cacheHitCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class UserFactory {
    static create(overrides: UserFactoryOptions = {}) {
        const timestamp = new Date().toISOString();
        
        return {
            id: overrides.id ?? uuidv4(),
            clerkId: overrides.clerkId ?? `user_${Math.random().toString(36).substring(7)}`,
            email: overrides.email ?? `test-${Date.now()}@example.com`,
            fullName: overrides.fullName ?? 'Test User',
            isActive: overrides.isActive ?? true,
            role: overrides.role ?? 'user',
            lastLoginAt: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp,
        };
    }

    static createMany(count: number, overrides: UserFactoryOptions = {}) {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    static createAdmin(overrides: UserFactoryOptions = {}) {
        return this.create({ ...overrides, role: 'admin' });
    }

    static createInactive(overrides: UserFactoryOptions = {}) {
        return this.create({ ...overrides, isActive: false });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class SessionFactory {
    private static defaultCoordinates = {
        mumbai: { lat: 19.0760, lng: 72.8777, timezone: 5.5 },
        delhi: { lat: 28.6139, lng: 77.2090, timezone: 5.5 },
        newYork: { lat: 40.7128, lng: -74.0060, timezone: -5 },
        london: { lat: 51.5074, lng: -0.1278, timezone: 0 },
        sydney: { lat: -33.8688, lng: 151.2093, timezone: 11 },
    };

    static create(overrides: SessionFactoryOptions = {}) {
        const timestamp = new Date().toISOString();
        const coords = this.defaultCoordinates.mumbai;
        
        return {
            id: overrides.id ?? uuidv4(),
            userId: overrides.userId ?? uuidv4(),
            clerkId: overrides.clerkId ?? `user_${Math.random().toString(36).substring(7)}`,
            fullName: overrides.fullName ?? 'Test Subject',
            dateOfBirth: overrides.dateOfBirth ?? '1990-05-15',
            tentativeTime: overrides.tentativeTime ?? '12:00:00',
            birthPlace: overrides.birthPlace ?? 'Mumbai, India',
            latitude: overrides.latitude ?? coords.lat,
            longitude: overrides.longitude ?? coords.lng,
            timezone: overrides.timezone ?? coords.timezone,
            gender: overrides.gender ?? 'male',
            physicalTraits: JSON.stringify({ complexion: 'fair', height: 'average' }),
            forensicTraits: JSON.stringify({}), 
            lifeEvents: JSON.stringify([]),
            status: overrides.status ?? 'draft',
            rectifiedTime: overrides.rectifiedTime ?? null,
            accuracy: overrides.accuracy ?? null,
            analysisResult: null,
            progressData: null,
            errorMessage: null,
            errorCode: null,
            createdAt: timestamp,
            updatedAt: timestamp,
        };
    }

    static createMany(count: number, overrides: SessionFactoryOptions = {}) {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    static createSubmitted(overrides: SessionFactoryOptions = {}) {
        return this.create({
            ...overrides,
            status: 'submitted',
            physicalTraits: JSON.stringify({ complexion: 'fair', height: 'average', build: 'medium' }),
            forensicTraits: JSON.stringify({ dominantHand: 'right', hairType: 'straight' }),
        });
    }

    static createCompleted(overrides: SessionFactoryOptions = {}) {
        return this.create({
            ...overrides,
            status: 'completed',
            rectifiedTime: '12:05:30',
            accuracy: 85,
            analysisResult: JSON.stringify({ confidence: 'high' }),
        });
    }

    static createWithLocation(city: keyof typeof SessionFactory.defaultCoordinates, overrides: SessionFactoryOptions = {}) {
        const coords = this.defaultCoordinates[city];
        return this.create({
            ...overrides,
            latitude: coords.lat,
            longitude: coords.lng,
            timezone: coords.timezone,
            birthPlace: city.charAt(0).toUpperCase() + city.slice(1),
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATION FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class CalculationFactory {
    static create(overrides: CalculationFactoryOptions = {}) {
        const timestamp = new Date().toISOString();
        
        return {
            id: overrides.id ?? uuidv4(),
            sessionId: overrides.sessionId ?? uuidv4(),
            birthDateTime: overrides.birthDateTime ?? '1990-05-15T12:00:00Z',
            latitude: overrides.latitude ?? 19.0760,
            longitude: overrides.longitude ?? 72.8777,
            timezone: overrides.timezone ?? 5.5,
            ephemerisData: JSON.stringify(overrides.ephemerisData ?? {
                sun: { longitude: 45.5, latitude: 0 },
                moon: { longitude: 120.3, latitude: -5 },
                ascendant: 85.2,
            }),
            algorithmVersion: '2.0.0',
            ephemerisVersion: 'de440',
            processingTime: 150,
            cacheHitCount: 0,
            success: overrides.success ?? true,
            createdAt: timestamp,
        };
    }

    static createMany(count: number, overrides: CalculationFactoryOptions = {}) {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    static createFailed(overrides: CalculationFactoryOptions = {}) {
        return this.create({ ...overrides, success: false });
    }

    static createCached(overrides: CalculationFactoryOptions = {}) {
        return this.create({ ...overrides, cacheHitCount: 5 });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART DATA FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class ChartDataFactory {
    static createValid() {
        return {
            dateOfBirth: '1990-05-15',
            time: '12:00:00',
            latitude: 19.0760,
            longitude: 72.8777,
            timezone: 5.5,
        };
    }

    static createInvalid() {
        return {
            dateOfBirth: 'invalid-date',
            time: '25:99:99',
            latitude: 999,
            longitude: -999,
            timezone: 99,
        };
    }

    static createEdgeCase() {
        return {
            dateOfBirth: '2000-02-29', // Leap year
            time: '23:59:59',
            latitude: 0, // Equator
            longitude: 0, // Prime meridian
            timezone: 0,
        };
    }

    static createWithSign(sign: 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 
                                  'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces') {
        const signDates: Record<string, { month: number; day: number }> = {
            aries: { month: 4, day: 5 },
            taurus: { month: 5, day: 5 },
            gemini: { month: 6, day: 5 },
            cancer: { month: 7, day: 5 },
            leo: { month: 8, day: 5 },
            virgo: { month: 9, day: 5 },
            libra: { month: 10, day: 5 },
            scorpio: { month: 11, day: 5 },
            sagittarius: { month: 12, day: 5 },
            capricorn: { month: 1, day: 5 },
            aquarius: { month: 2, day: 5 },
            pisces: { month: 3, day: 5 },
        };
        
        const date = signDates[sign];
        return {
            ...this.createValid(),
            dateOfBirth: `1990-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEQUENCE BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export class TestSequenceBuilder {
    private users: ReturnType<typeof UserFactory.create>[] = [];
    private sessions: ReturnType<typeof SessionFactory.create>[] = [];
    private calculations: ReturnType<typeof CalculationFactory.create>[] = [];

    withUser(overrides?: UserFactoryOptions) {
        const user = UserFactory.create(overrides);
        this.users.push(user);
        return this;
    }

    withUsers(count: number, overrides?: UserFactoryOptions) {
        this.users.push(...UserFactory.createMany(count, overrides));
        return this;
    }

    withSession(userId?: string, overrides?: SessionFactoryOptions) {
        const session = SessionFactory.create({
            userId: userId ?? this.users[0]?.id,
            ...overrides,
        });
        this.sessions.push(session);
        return this;
    }

    withCalculation(sessionId?: string, overrides?: CalculationFactoryOptions) {
        const calc = CalculationFactory.create({
            sessionId: sessionId ?? this.sessions[0]?.id,
            ...overrides,
        });
        this.calculations.push(calc);
        return this;
    }

    build() {
        return {
            users: this.users,
            sessions: this.sessions,
            calculations: this.calculations,
        };
    }

    static create() {
        return new TestSequenceBuilder();
    }
}
