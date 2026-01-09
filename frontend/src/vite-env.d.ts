/// <reference types="vite/client" />

declare module '@jscad/io' {
  export const serializers: {
    stl: {
      serialize: (options: { binary?: boolean }, ...objects: any[]) => ArrayBuffer[] | string[];
    };
  };
}