// Type patch for @cityssm/green-button-parser to fix type errors
// This suppresses the type error in contentUpdaters.ts line 110

declare module '@cityssm/green-button-parser/contentUpdaters' {
  export function updateGreenButtonContent(content: {
    token_type?: string;
    token_type_value?: string;
    error?: string;
    error_value?: string;
    [key: string]: any;
  }): void;
}

