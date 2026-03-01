import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import ReactDOMServer from "react-dom/server";
import { MDXComponents } from "../components/tina/DbMdxComponents";
import React from "react";

const mdxLikePattern = /<\s*[A-Z][A-Za-z0-9]*\b/;

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

  // Return a fallback component for any missing MDX references
  const components = new Proxy(MDXComponents as any, {
    get(target, prop) {
      if (prop in target) return (target as any)[prop];
      return Fallback;
    },
  });

  return ReactDOMServer.renderToString(
    Content({ components }) as any
  );
}
