/// <reference types="vite/client" />

declare module '@jscad/io' {
  export const stlSerializer: {
    serialize: (options: { binary?: boolean }, ...objects: any[]) => ArrayBuffer[] | string[];
  };
}