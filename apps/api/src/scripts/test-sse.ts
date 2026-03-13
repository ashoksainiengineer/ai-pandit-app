const sessionId = '2f207ae6-0387-4039-8fc8-72128f0bf361';

async function run() {
    const res = await fetch(`http://localhost:3001/api/stream/${sessionId}`, {
        headers: { 'Accept': 'text/event-stream' }
    });

    console.log(`STATUS: ${res.status}`);

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let streamDone = false;
    while (!streamDone) {
        const { value, done: chunkDone } = await reader.read();
        if (chunkDone) {
            streamDone = true;
            continue;
        }
        const text = decoder.decode(value);

        const events = text.split('\n\n').filter(Boolean);
        events.forEach(ev => {
            const lines = ev.split('\n');
            const eventTypeLine = lines.find(l => l.startsWith('event:'));
            const dataLine = lines.find(l => l.startsWith('data:'));

            if (eventTypeLine && dataLine) {
                const type = eventTypeLine.replace('event: ', '');
                const data = dataLine.replace('data: ', '');
                console.log(`\n--- Received event: ${type}, length: ${data.length} bytes ---`);

                if (type === 'ai_thinking') {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`  -> stage=${parsed.stage}, candidateTime=${parsed.candidateTime}, chunk_len=${parsed.chunk?.length}`);
                        if (parsed.chunk?.length > 1000) {
                            console.log(`  -> MASSIVE CHUNK FIRST 100: ${parsed.chunk.substring(0, 100)}`);
                        }
                    } catch {
                        // Ignore malformed JSON payloads in debug stream output.
                    }
                } else {
                    console.log(`  -> payload preview: ${data.substring(0, 150)}`);
                }
            }
        });
    }
}

run();
