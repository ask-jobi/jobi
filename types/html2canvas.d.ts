declare module 'html2canvas' {
  interface Options {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
  }

  function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export = html2canvas;
} 