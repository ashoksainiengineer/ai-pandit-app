const http = require('http');

const sessionId = '2f207ae6-0387-4039-8fc8-72128f0bf361';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1/btr/stream/${sessionId}`,
    method: 'GET',
    headers: {
        'Accept': 'text/event-stream'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let totalBytes = 0;

    res.on('data', (chunk) => {
        totalBytes += chunk.length;
        const text = chunk.toString();

        // Don't print massive payloads entirely, just summary
        const events = text.split('\n\n').filter(Boolean);
        events.forEach(ev => {
            const lines = ev.split('\n');
            const eventTypeLine = lines.find(l => l.startsWith('event:'));
            const dataLine = lines.find(l => l.startsWith('data:'));

            if (eventTypeLine && dataLine) {
                const type = eventTypeLine.replace('event: ', '');
                const data = dataLine.replace('data: ', '');
                console.log(`Received event: ${type}, length: ${data.length} bytes`);
                if (type === 'ai_thinking') {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`  -> ai_thinking: stage=${parsed.stage}, candidateTime=${parsed.candidateTime}, len=${parsed.chunk?.length}`);
                        if (parsed.chunk?.length > 50000) {
                            console.log(`  -> MASSIVE CHUNK DETECTED: ${parsed.chunk.length} chars (First 50: ${parsed.chunk.substring(0, 50)})`);
                        }
                    } catch (e) { }
                }
                if (type === 'initial_state' || type === 'metadata' || type === 'ai_context') {
                    console.log(`  -> payload:`, data.substring(0, 200) + '...');
                }
            }
        });
    });

    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
