/**
 * 🔱 AI-Pandit KP (Krishnamurti Paddhati) Types
 * ==========================================
 * KP sub-lord data, cuspal data, and event correlation.
 */

/**
 * KP Sub-lord data
 */
export interface KPSubLordData {
  readonly starLord: string;
  readonly subLord: string;
  readonly subSubLord: string;
  readonly subSubSubLord: string;
  readonly subSpan: number;
  readonly positionInSub: number;
}

/**
 * KP Cuspal data
 */
export interface KPCuspalData {
  readonly house: number;
  readonly cusp: number;
  readonly sign: string;
  readonly starLord: string;
  readonly subLord: string;
  readonly subSubLord: string;
}

/**
 * KP Event correlation
 */
export interface KPEventCorrelation {
  readonly eventId: string;
  readonly eventDate: Date;
  readonly dashaLord: string;
  readonly dashaLordAsCuspalSubLord: boolean;
  readonly dashaLordAsStarLord: boolean;
  readonly correlationScore: number;
  readonly timingPrecision: 'exact' | 'close' | 'approximate';
}
