
import { runBtrScan } from '@/lib/btr-iteration-engine';
import { auth } from '@clerk/nextjs/server';
import type { BirthData } from '@/types';

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

            for await (const result of runBtrScan(birthData, startTime, endTime)) {
                const progressMessage = `Analyzing minute ${minuteCount++}...\n\n`;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressMessage)}\n\n`));
                // We are not sending the full chart data to the client for now to avoid overwhelming the connection
            }
            
            // TODO: Send the results to Moonshot AI for analysis
            // TODO: Save the final analysis to Turso DB

            controller.enqueue(encoder.encode('event: end\ndata: BTR scan completed successfully\n\n'));
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
