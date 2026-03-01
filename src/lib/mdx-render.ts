import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import ReactDOMServer from "react-dom/server";
import { MDXComponents } from "../components/tina/DbMdxComponents";

const mdxLikePattern = /<\s*[A-Z][A-Za-z0-9]*\b/;

export function isMdxLike(source: string): boolean {
  return mdxLikePattern.test(source);
}

export async function renderMdxToHtml(source: string): Promise<string> {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    development: false,
  });

  return ReactDOMServer.renderToString(
    Content({ components: MDXComponents }) as any
  );
}
