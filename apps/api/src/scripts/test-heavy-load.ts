import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function runHeavyLoadTest() {
    console.log("🚀 STARTING HEAVY LOAD TEST ON BACKEND ENGINE...");

    // 1. Find a recent completed session to copy its encrypted data
    const recentSession = await db.select().from(sessions).where(
        or(eq(sessions.status, 'complete'), eq(sessions.status, 'failed'))
    ).orderBy(desc(sessions.updatedAt)).limit(1);

    if (recentSession.length === 0) {
        console.error("No recent session found to clone data from. Run an analysis from UI first.");
        return process.exit(1);
    }

    const template = recentSession[0];
    const newSessionId = randomUUID();

    console.log(`📋 Cloning session ${template.id} into NEW test session ${newSessionId}`);

    // 2. Insert new session into Queue
    await db.insert(sessions).values({
        id: newSessionId,
        userId: template.userId,
        externalId: template.externalId,
        status: 'local-test',
        fullName: template.fullName,
        dateOfBirth: template.dateOfBirth,
        tentativeTime: template.tentativeTime,
        birthPlace: template.birthPlace,
        latitude: template.latitude,
        longitude: template.longitude,
        timezone: template.timezone,
        lifeEvents: template.lifeEvents,
        spouseData: template.spouseData,
        offsetConfig: template.offsetConfig,
        progressData: null,
        analysisResult: null,
        errorMessage: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    console.log("✅ Inserted into queue. Engine should pick it up within seconds.");
    console.log(`📡 Connecting to SSE stream to monitor live chunks (ID: ${newSessionId})...`);

    // We will bypass Clerk Auth for the test script by setting a special test secret header
    try {
        const response = await fetch(`http://localhost:3001/api/stream/${newSessionId}`, {
            headers: { 'x-test-bypass-auth': 'super-secret-test-key' }
        });

        if (!response.ok) {
            console.error(`❌ Failed to connect to SSE stream: ${response.status} ${response.statusText}`);
            return process.exit(1);
        }

        console.log("🟢 Connected to SSE stream. Listening for events...");

        // Stream reader
        if (response.body) {
            response.body.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        // console.log(`\n\x1b[36m[EVENT]\x1b[0m ${line.replace('event: ', '')}`);
                    } else if (line.startsWith('data: ')) {
                        try {
                            const payload = JSON.parse(line.replace('data: ', ''));
                            if (payload.type === 'ai_thinking') {
                                process.stdout.write(`\x1b[32m[AI THINKING S${payload.stage}]\x1b[0m ${payload.candidateTime || 'general'}: ${payload.chunk || ''}\n`);
                            } else if (payload.type === 'ai_context') {
                                console.log(`\n\x1b[34m[AI CONTEXT S${payload.stage}]\x1b[0m Context updated for ${payload.candidateTime}`);
                            } else if (payload.type === 'candidate_score') {
                                console.log(`\n\x1b[33m[SCORE S${payload.stage}]\x1b[0m Candidate ${payload.time || payload.candidateTime} scored ${payload.score} (${payload.reason})`);
                            } else if (payload.type === 'stage_completed') {
                                console.log(`\n\x1b[35m[STAGE COMPLETED]\x1b[0m Stage ${payload.stage} finished with ${payload.candidatesOut} variations.`);
                            } else if (payload.type === 'step_progress') {
                                console.log(`\n\x1b[37m[PROGRESS]\x1b[0m ${payload.message}`);
                            } else if (payload.type === 'complete') {
                                console.log(`\n\x1b[32m✅ [TEST PASSED]\x1b[0m Analysis completed. Verdict: ${JSON.stringify(payload.data || payload)}`);
                                process.exit(0);
                            } else if (payload.type === 'error') {
                                console.error(`\n\x1b[31m❌ [SSE ERROR]\x1b[0m ${payload.error}`);
                                process.exit(1);
                            }
                        } catch (e) {
                            // ignore parsing errors on empty or malformed lines
                            // console.error(e);
                        }
                    }
                }
            });

            response.body.on('end', () => {
                console.log("\n📡 SSE stream closed by server.");
            });
        }

    } catch (err: any) {
        console.error(`❌ Connection error: ${err.message}`);
    }

    // Keep polling just in case stream fails silently
    let lastStatus = '';
    const interval = setInterval(async () => {
        const check = await db.select({
            status: sessions.status,
            errorMessage: sessions.errorMessage,
        }).from(sessions).where(eq(sessions.id, newSessionId)).limit(1);

        if (check.length > 0) {
            const current = check[0];
            if (current.status !== lastStatus) {
                lastStatus = current.status as string;
            }

            if (current.status === 'failed') {
                console.error(`\n❌ [TEST FAILED] Engine crashed or aborted: ${current.errorMessage}`);
                clearInterval(interval);
                process.exit(1);
            }
            if (current.status === 'complete') {
                clearInterval(interval);
                process.exit(0);
            }
        }
    }, 5000);

    // Timeout after 15 minutes
    setTimeout(() => {
        console.error("\n❌ [TIMEOUT] Test took too long (15 minutes). Aborting.");
        clearInterval(interval);
        process.exit(1);
    }, 15 * 60 * 1000);
}

runHeavyLoadTest().catch(console.error);
