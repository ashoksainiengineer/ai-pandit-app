
import { runBtrScan } from '@/lib/btr-iteration-engine';
import { auth } from '@clerk/nextjs/server';
import type { BirthData } from '@/types';
import { db } from '@/database/drizzle';
import { calculations } from '@/database/schema';
import { v4 as uuidv4 } from 'uuid';

// Placeholder for calling the Moonshot AI
async function getAiAnalysis(model: string, data: any): Promise<string> {
    // In a real implementation, this would make a fetch call to the AI service
    console.log(`Sending ${data.length} results to AI model: ${model}`);
    // This simulates the AI returning a final rectification summary
    return `Based on the analysis of ${data.length} charts, the most likely birth time is determined to be [AI-determined time].`;
}

export async function POST(request: Request) {
    const { userId } = auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { startTime, endTime, ...unvalidatedBirthData } = body;

    const birthData: Omit<BirthData, 'tentativeTime'> = {
        fullName: unvalidatedBirthData.fullName || 'Sample Name',
        birthDate: unvalidatedBirthData.birthDate || '1990-01-01',
        birthLocation: unvalidatedBirthData.birthLocation || 'New York, USA',
        timeUncertainty: unvalidatedBirthData.timeUncertainty || '30min'
    };

    if (!startTime || !endTime) {
        return new Response("Invalid time range", { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let minuteCount = 0;
            const allChartResults: any[] = [];

            const sendEvent = (event: string, data: any) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            // Sequential processing of the scan
            for await (const result of runBtrScan(birthData, startTime, endTime)) {
                minuteCount++;
                allChartResults.push(result);
                sendEvent('progress', { message: `Minute ${minuteCount}/120 scanned...` });
            }
            
            sendEvent('progress', { message: 'Analysis complete. Sending to AI for final rectification...' });

            // Get AI analysis from Moonshot
            const moonshotModel = process.env.MOONSHOT_MODEL || 'moonshot-v1-8k';
            const aiSummary = await getAiAnalysis(moonshotModel, allChartResults);

            sendEvent('progress', { message: 'AI analysis received. Saving results...' });

            // Save the final result to the Turso database
            const calculationId = uuidv4();
            await db.insert(calculations).values({
                id: calculationId,
                userId: userId,
                birthData: JSON.stringify(birthData),
                timeRange: `${startTime} - ${endTime}`,
                results: JSON.stringify(allChartResults),
                aiSummary: aiSummary,
                createdAt: new Date(),
            });

            sendEvent('complete', { finalSummary: aiSummary, calculationId: calculationId });
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
