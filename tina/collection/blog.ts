export const blogCollection = {
  name: "blog",
  label: "Blog Posts",
  path: "src/content/blog",
  format: "mdx",
  fields: [
    {
      type: "string",
      label: "Title",
      name: "title",
      required: true,
    },
    {
      type: "datetime",
      label: "Publish Date",
      name: "pubDate",
      required: true,
    },
    {
      type: "image",
      label: "Featured Image",
      name: "image",
    },
    {
      type: "string",
      label: "Excerpt",
      name: "excerpt",
      ui: { component: "textarea" },
    },
    {
      type: "reference",
      label: "Author",
      name: "author",
      collections: ["authors"],
      required: true,
    },
    {
      type: "object",
      label: "Audio Version",
      name: "audio",
      required: false,
      fields: [
        {
          type: "string",
          label: "Audio File URL",
          name: "url",
          pattern: "^https?://.+",
          description: "URL to MP3 file (e.g., https://example.com/audio.mp3)",
        },
        {
          type: "string",
          label: "Duration",
          name: "duration",
          description: "MM:SS format (e.g., 23:15)",
          pattern: "^[0-5]\\d:[0-5]\\d$",
        },
        {
          type: "string",
          label: "Transcript",
          name: "transcript",
          ui: { component: "textarea" },
        },
      ],
    },
    {
      type: "rich-text",
      label: "Body",
      name: "body",
      isBody: true,
    },
  ],
};
