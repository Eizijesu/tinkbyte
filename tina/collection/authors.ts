export const authorCollection = {
  name: "author",
  label: "Authors",
  path: "src/content/authors",
  fields: [
    {
      type: "string",
      label: "Name",
      name: "name",
      required: true,
    },
    {
      type: "image",
      label: "Avatar",
      name: "avatar",
    },
    {
      type: "string",
      label: "Bio",
      name: "bio",
      ui: { component: "textarea" },
    },
    {
      type: "object",
      label: "Social Links",
      name: "social",
      list: true,
      fields: [
        {
          type: "string",
          label: "Platform",
          name: "platform",
          options: ["twitter", "linkedin", "github"],
        },
        {
          type: "string",
          label: "URL",
          name: "url",
        },
      ],
    },
  ],
};
