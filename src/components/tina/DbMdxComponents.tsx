import React from "react";

export const TableBlock = ({
  caption,
  headers = [],
  rows = [],
}: {
  caption?: string;
  headers?: string[];
  rows?: Array<{ cells?: string[] }>;
}) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeHeaders = Array.isArray(headers) ? headers : [];
  return (
    <div className="my-8">
      {caption ? (
        <h3 className="text-lg font-semibold mb-3 text-center text-gray-800 dark:text-gray-200">
          {caption}
        </h3>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full table-auto border-collapse border border-gray-300 text-left">
          {safeHeaders.length > 0 ? (
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {safeHeaders.map((header, i) => (
                  <th
                    key={`h-${i}`}
                    className="px-3 py-2 sm:px-4 sm:py-3 font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {safeRows.map((row, r) => (
              <tr key={`r-${r}`} className="even:bg-gray-50 dark:even:bg-gray-800/40">
                {(row?.cells || []).map((cell, c) => (
                  <td
                    key={`c-${r}-${c}`}
                    className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs sm:text-sm align-top"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CodeBlock = ({
  code = "",
  language = "text",
  filename,
}: {
  code?: string;
  language?: string;
  filename?: string;
}) => (
  <div className="my-8 border border-gray-800 bg-slate-900 text-gray-100">
    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-xs uppercase tracking-wide">
      <div className="flex gap-3 items-center">
        {filename ? <span className="font-semibold">{filename}</span> : null}
        <span className="bg-blue-700 text-white px-2 py-0.5">{language}</span>
      </div>
    </div>
    <pre className="overflow-x-auto p-4 text-xs sm:text-sm">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  </div>
);

export const Quote = ({
  text,
  author,
  source,
}: {
  text?: string;
  author?: string;
  source?: string;
}) => (
  <blockquote className="my-8 border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-200">
    {text ? <p>{text}</p> : null}
    {(author || source) ? (
      <footer className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {author ? <span>{author}</span> : null}
        {author && source ? " · " : null}
        {source ? <span>{source}</span> : null}
      </footer>
    ) : null}
  </blockquote>
);

export const ImageBlock = ({
  externalUrl,
  uploadedImage,
  alt = "",
  caption,
}: {
  externalUrl?: string;
  uploadedImage?: string;
  alt?: string;
  caption?: string;
}) => {
  const src = externalUrl || uploadedImage;
  if (!src) return null;
  return (
    <figure className="my-8">
      <img src={src} alt={alt} className="w-full h-auto" />
      {caption ? (
        <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
};

export const VideoBlock = ({
  url,
  title,
}: {
  url?: string;
  title?: string;
}) => {
  if (!url) return null;
  return (
    <div className="my-8">
      {title ? <h4 className="mb-2 font-semibold">{title}</h4> : null}
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full"
          src={url}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export const ButtonBlock = ({
  text,
  url,
}: {
  text?: string;
  url?: string;
}) => (
  <div className="my-6">
    <a
      href={url || "#"}
      className="inline-block bg-blue-600 text-white px-4 py-2 font-semibold"
    >
      {text || "Learn more"}
    </a>
  </div>
);

export const CalloutBox = ({
  title,
  content,
}: {
  title?: string;
  content?: string;
}) => (
  <div className="my-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
    {title ? <h4 className="font-semibold mb-1">{title}</h4> : null}
    {content ? <p>{content}</p> : null}
  </div>
);

export const Newsletter = () => (
  <div className="my-8 border border-gray-200 dark:border-gray-700 p-4">
    <h4 className="font-semibold mb-2">Newsletter</h4>
    <p>Subscribe for updates.</p>
  </div>
);

export const TwoColumnLayout = ({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>{left}</div>
    <div>{right}</div>
  </div>
);

export const ImageGallery = ({
  images = [],
}: {
  images?: Array<{ src?: string; alt?: string }>;
}) => (
  <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {images.map((img, i) => (
      <img key={i} src={img.src || ""} alt={img.alt || ""} />
    ))}
  </div>
);

export const MDXComponents = {
  TableBlock,
  CodeBlock,
  Quote,
  ImageBlock,
  VideoBlock,
  ButtonBlock,
  CalloutBox,
  Newsletter,
  TwoColumnLayout,
  ImageGallery,
};
