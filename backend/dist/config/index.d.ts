/**
 * 🔱 AI-Pandit Unified Configuration System
 * ==========================================
 * Centralized, type-safe configuration with validation.
 * Follows 12-factor app principles with environment-based config.
 */
export declare const serverConfig: {
    readonly env: "development" | "production" | "test";
    readonly port: number;
    readonly backendUrl: string;
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly isTest: boolean;
};
export declare const databaseConfig: {
    readonly url: string;
    readonly authToken: string;
    readonly connectionTimeout: 30000;
    readonly maxRetries: 3;
};
export declare const aiConfig: {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly model: string;
    readonly maxTokens: number;
    readonly thinkingBudget: number;
    readonly temperature: number;
    readonly retryAttempts: number;
    readonly retryDelayMs: number;
    readonly timeoutMs: number;
    readonly providerOrder: readonly ["Google Vertex", "Together", "DeepInfra"];
    readonly allowFallbacks: true;
    readonly dataCollection: "deny";
};
export declare const queueConfig: {
    readonly maxConcurrent: number;
    readonly pollIntervalMs: number;
    readonly maxSize: number;
    readonly staleTimeoutMs: number;
    readonly baseAnalysisTime: 240;
    readonly contentionMultiplier: 0.25;
};
export declare const memoryConfig: {
    readonly thresholdPercent: number;
    readonly gcThresholdGB: number;
    readonly pressureThresholdGB: 10;
    readonly criticalThresholdGB: 12;
};
export declare const securityConfig: {
    readonly internalApiKey: string | undefined;
    readonly clerkSecretKey: string;
    readonly clerkPublishableKey: string;
    readonly rateLimitWindowMs: 60000;
    readonly rateLimitMaxRequests: 100;
};
export declare const featureFlags: {
    readonly enableDetailedLogging: boolean;
    readonly enableGodTierEnhancement: boolean;
};
export declare const btrConfig: {
    readonly maxBatchSize: 10;
    readonly survivorsPerBatch: 3;
    readonly refinementGridMinutes: 5;
    readonly refinementGridInterval: 60;
    readonly microGridMinutes: 0.5;
    readonly microGridInterval: 6;
    readonly stages: readonly [{
        readonly id: "grid";
        readonly name: "Exhaustive Data Generation";
    }, {
        readonly id: "coarse";
        readonly name: "Batch Tournament";
    }, {
        readonly id: "fine";
        readonly name: "Refinement Grid";
    }, {
        readonly id: "deep";
        readonly name: "Deep Multi-Dasha Analysis";
    }, {
        readonly id: "micro";
        readonly name: "Micro Precision Grid";
    }, {
        readonly id: "final";
        readonly name: "Final Precision";
    }];
    readonly godTierMinConsensus: 85;
    readonly godTierConfidenceLevel: "VERY_HIGH";
};
export declare const loggingConfig: {
    readonly level: "debug" | "info";
    readonly format: "json" | "pretty";
    readonly includeTimestamp: true;
    readonly includeStackTrace: boolean;
    readonly redactFields: readonly ["apiKey", "authToken", "password", "secret", "token"];
};
export declare const config: {
    readonly server: {
        readonly env: "development" | "production" | "test";
        readonly port: number;
        readonly backendUrl: string;
        readonly isDevelopment: boolean;
        readonly isProduction: boolean;
        readonly isTest: boolean;
    };
    readonly database: {
        readonly url: string;
        readonly authToken: string;
        readonly connectionTimeout: 30000;
        readonly maxRetries: 3;
    };
    readonly ai: {
        readonly apiKey: string;
        readonly baseUrl: string;
        readonly model: string;
        readonly maxTokens: number;
        readonly thinkingBudget: number;
        readonly temperature: number;
        readonly retryAttempts: number;
        readonly retryDelayMs: number;
        readonly timeoutMs: number;
        readonly providerOrder: readonly ["Google Vertex", "Together", "DeepInfra"];
        readonly allowFallbacks: true;
        readonly dataCollection: "deny";
    };
    readonly queue: {
        readonly maxConcurrent: number;
        readonly pollIntervalMs: number;
        readonly maxSize: number;
        readonly staleTimeoutMs: number;
        readonly baseAnalysisTime: 240;
        readonly contentionMultiplier: 0.25;
    };
    readonly memory: {
        readonly thresholdPercent: number;
        readonly gcThresholdGB: number;
        readonly pressureThresholdGB: 10;
        readonly criticalThresholdGB: 12;
    };
    readonly security: {
        readonly internalApiKey: string | undefined;
        readonly clerkSecretKey: string;
        readonly clerkPublishableKey: string;
        readonly rateLimitWindowMs: 60000;
        readonly rateLimitMaxRequests: 100;
    };
    readonly features: {
        readonly enableDetailedLogging: boolean;
        readonly enableGodTierEnhancement: boolean;
    };
    readonly btr: {
        readonly maxBatchSize: 10;
        readonly survivorsPerBatch: 3;
        readonly refinementGridMinutes: 5;
        readonly refinementGridInterval: 60;
        readonly microGridMinutes: 0.5;
        readonly microGridInterval: 6;
        readonly stages: readonly [{
            readonly id: "grid";
            readonly name: "Exhaustive Data Generation";
        }, {
            readonly id: "coarse";
            readonly name: "Batch Tournament";
        }, {
            readonly id: "fine";
            readonly name: "Refinement Grid";
        }, {
            readonly id: "deep";
            readonly name: "Deep Multi-Dasha Analysis";
        }, {
            readonly id: "micro";
            readonly name: "Micro Precision Grid";
        }, {
            readonly id: "final";
            readonly name: "Final Precision";
        }];
        readonly godTierMinConsensus: 85;
        readonly godTierConfidenceLevel: "VERY_HIGH";
    };
    readonly logging: {
        readonly level: "debug" | "info";
        readonly format: "json" | "pretty";
        readonly includeTimestamp: true;
        readonly includeStackTrace: boolean;
        readonly redactFields: readonly ["apiKey", "authToken", "password", "secret", "token"];
    };
};
export type Config = typeof config;
export default config;
//# sourceMappingURL=index.d.ts.map