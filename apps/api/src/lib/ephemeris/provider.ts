import type { EphemerisData } from '@ai-pandit/shared';

export type EphemerisProviderName = 'skyfield' | 'algorithmic';

export type EphemerisExecutionMode =
  | 'skyfield'
  | 'algorithmic'
  | 'algorithmic-fallback';

export interface EphemerisProviderStatus {
  configuredProvider: EphemerisProviderName;
  activeMode: EphemerisExecutionMode;
  ready: boolean;
  highPrecision: boolean;
}

export interface EphemerisComputationInput {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: number | string;
}

export interface EphemerisProvider {
  readonly name: EphemerisProviderName;
  init(): Promise<boolean>;
  calculate(input: EphemerisComputationInput): Promise<EphemerisData>;
}
