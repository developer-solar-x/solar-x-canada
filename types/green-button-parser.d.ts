declare module '@cityssm/green-button-parser/contentUpdaters' {
  export function updateGreenButtonContent(content: any): void;
}

// Suppress type errors in node_modules for green-button-parser
declare module '@cityssm/green-button-parser/*' {
  const content: any;
  export default content;
}

