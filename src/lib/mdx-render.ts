import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import ReactDOMServer from "react-dom/server";
import { MDXComponents } from "../components/tina/DbMdxComponents";
import React from "react";

const mdxLikePattern = /<\s*[A-Z][A-Za-z0-9]*\b/;
const componentNamePattern = /<\s*([A-Z][A-Za-z0-9]*)\b/g;

export function isMdxLike(source: string): boolean {
  return mdxLikePattern.test(source);
}

export async function renderMdxToHtml(source: string): Promise<string> {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    development: false,
  });

  const Fallback = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  // Build a concrete components map so MDX's Object.assign doesn't drop fallbacks
  const components: Record<string, any> = { ...MDXComponents };
  const names = new Set<string>();
  for (const match of source.matchAll(componentNamePattern)) {
    if (match[1]) names.add(match[1]);
  }
  for (const name of names) {
    if (!(name in components)) {
      components[name] = Fallback;
    }
  }

  return ReactDOMServer.renderToString(
    Content({ components }) as any
  );
}
