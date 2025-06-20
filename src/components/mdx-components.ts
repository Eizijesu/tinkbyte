// src/components/mdx-components.ts
import ImageBlock from './tina/ImageBlock.astro';
import VideoBlock from './tina/VideoBlock.astro';
import CalloutBox from './tina/CalloutBox.astro';
import ButtonBlock from './tina/ButtonBlock.astro';
import CodeBlock from './tina/CodeBlock.astro';
import Quote from './tina/Quote.astro';
import TableBlock from './tina/TableBlock.astro';
import ImageGallery from './tina/ImageGallery.astro';
import Newsletter from './tina/Newsletter.astro';
import TwoColumnLayout from './tina/TwoColumnLayout.astro';

export const components = {
  ImageBlock,
  VideoBlock,
  Callout: CalloutBox,
  ButtonBlock,
  CodeBlock: CodeBlock,
  Quote: Quote,
  TableBlock,
  ImageGallery,
  Newsletter: Newsletter,
  TwoColumnLayout,
};