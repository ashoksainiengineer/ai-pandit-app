import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import sessionRouter from '../sessions.js';
import { db } from '@ai-pandit/db';
import { encryptData, safeDecrypt } from '../../lib/encryption/index.js';

// Setup Mock Express App
const app = express();
app.use(express.json());

// Mock Auth Middleware
vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.clerkId = 'real_user_789';
        req.userId = 1;
        next();
    }
}));

app.use('/api/sessions', sessionRouter);

// Database Mocking
vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            sessions: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            }
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ id: 'mocked-id' }])
            }))
        })),
    },
    executeWithRetry: vi.fn(async (cb) => {
        return await cb();
    })
}));

describe('Physical and Forensic Traits API Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully save and parse highly detailed, real-world forensic and physical traits', async () => {
        
        const mockClerkId = 'real_user_789';
        
        // Mock existing session before update
        const existingSession = {
            id: 'real-session-456',
            clerkId: mockClerkId,
            userId: 1,
            status: 'draft',
        };

        (db.query.sessions.findFirst as any).mockResolvedValueOnce(existingSession);

        // Highly detailed real-world traits data matching actual user input
        const realWorldPhysicalTraits = {
            height: { cm: 178, feet: 5, inches: 10 },
            build: "athletic",
            complexion: "wheatish",
            faceShape: "square",
            eyeColor: "dark brown",
            hairColor: "black"
        };

        const realWorldForensicTraits = {
            physical: {
                facialStructure: {
                    forehead: "broad",
                    eyeShape: "almond",
                    noseType: "straight",
                    teethAlignment: "even with slight gap",
                    voicePitch: "deep baritone"
                },
                skinHair: {
                    texture: "smooth",
                    hairType: "wavy thick",
                    complexion: "olive",
                    marks: ["birthmark on left shoulder", "scar on right knee"]
                },
                build: "mesomorph with broad shoulders",
                height: { cm: 178, feet: 5, inches: 10 }
            },
            psychographic: {
                speechStyle: "measured and authoritative",
                decisionMaking: "analytical but intuitive under pressure",
                stressResponse: "calm globally, internalizes anxiety",
                sleepCycle: "night owl, irregular patterns",
                temperament: "introverted but confident in social settings"
            },
            biological: {
                prakriti: "Pitta-Vata",
                sensitivity: {
                    heat: "moderate",
                    cold: "high sensitivity"
                },
                recurringHealthIssues: ["migraines triggered by stress", "acid reflux", "lower back stiffness"]
            },
            family: {
                siblingPosition: "eldest",
                brotherCount: 1,
                sisterCount: 1,
                fatherStatusAtBirth: "working away from home",
                motherHealthAtBirth: "complicated delivery, minor hemorrhaging"
            }
        };

        // Capture db.update set call to verify payload
        let capturedUpdateData: any = null;
        (db.update as any).mockImplementationOnce(() => ({
            set: vi.fn().mockImplementation((val) => {
                capturedUpdateData = val;
                return { where: vi.fn().mockResolvedValue([{ id: existingSession.id }]) };
            })
        }));

        const response = await request(app)
            .put(`/api/sessions/${existingSession.id}`)
            .send({
                physicalTraits: realWorldPhysicalTraits,
                forensicTraits: realWorldForensicTraits
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify Data Integrity
        expect(capturedUpdateData).toBeDefined();
        
        // Decrypt to ensure strings match exactly
        const decryptedPhysical = JSON.parse(safeDecrypt(capturedUpdateData.physicalTraits, mockClerkId));
        const decryptedForensic = JSON.parse(safeDecrypt(capturedUpdateData.forensicTraits, mockClerkId));

        // Assert deeply nested physical properties
        expect(decryptedPhysical.build).toBe("athletic");
        expect(decryptedPhysical.height.cm).toBe(178);

        // Assert deeply nested forensic psychographics
        expect(decryptedForensic.psychographic.speechStyle).toBe("measured and authoritative");
        expect(decryptedForensic.psychographic.temperament).toBe("introverted but confident in social settings");

        // Assert biological vulnerabilities array
        expect(decryptedForensic.biological.recurringHealthIssues).toContain("migraines triggered by stress");
        
        // Assert family dynamics
        expect(decryptedForensic.family.fatherStatusAtBirth).toBe("working away from home");
        expect(decryptedForensic.family.motherHealthAtBirth).toBe("complicated delivery, minor hemorrhaging");
    });
});
