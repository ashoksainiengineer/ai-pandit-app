export {};

declare global {
  interface Window {
    __AI_PANDIT_TEST_MODE__?: boolean;
    __persisted?: boolean;
  }
}
