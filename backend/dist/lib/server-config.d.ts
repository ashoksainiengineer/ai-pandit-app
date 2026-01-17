export declare const serverConfig: {
    kimi: {
        apiKey: string;
        baseUrl: string;
        model: string;
        maxTokens: number;
        temperature: number;
        thinkingBudget: number;
    };
    database: {
        url: string;
        authToken: string | undefined;
    };
    maxRetries: number;
    timeout: number;
};
export declare const kimiClient: {
    messages: {
        create: (options: any) => Promise<{
            content: ({
                type: string;
                thinking: string;
                text?: undefined;
            } | {
                type: string;
                text: string;
                thinking?: undefined;
            })[];
        }>;
    };
};
//# sourceMappingURL=server-config.d.ts.map