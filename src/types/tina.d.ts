// src/types/tina.d.ts - TinaCMS type definitions
declare global {
    interface Window {
      tinaData?: any;
      tina?: {
        enabled: boolean;
        sidebar: {
          open: () => void;
          close: () => void;
          toggle: () => void;
        };
      };
    }
  }
  
  // TinaCMS content types
  export interface TinaMarkdownContent {
    type: 'rich-text';
    children: Array<{
      type: string;
      children?: Array<{
        type: 'text';
        text: string;
        bold?: boolean;
        italic?: boolean;
      }>;
    }>;
  }
  
  export interface TinaImageBlock {
    __typename: 'ImageBlock';
    src: string;
    alt: string;
    caption?: string;
  }
  
  export interface TinaVideoBlock {
    __typename: 'VideoBlock';
    url: string;
    title?: string;
    autoplay?: boolean;
  }
  
  export interface TinaCalloutBlock {
    __typename: 'CalloutBlock';
    type: 'info' | 'warning' | 'error' | 'success';
    title?: string;
    content: TinaMarkdownContent;
  }
  
  export {};