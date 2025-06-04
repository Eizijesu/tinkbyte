import { defineConfig } from "tinacms";

const branch = process.env.TINA_BRANCH || process.env.HEAD || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      // Blog Posts Collection - Fixed category values to match display names
      {
        name: "blog",
        label: "Blog Posts",
        path: "src/content/blog",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.title
                ?.toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;
            },
          },
          defaultItem: () => {
            return {
              title: "New Blog Post",
              excerpt: "Brief description of this post...",
              pubDate: new Date().toISOString(),
              author: "TinkByte Team",
              draft: true,
              featured: false,
              trending: false,
              tags: [],
              category: "Tech Culture", // Fixed: Use display name to match your content
            };
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
            description: "SEO-friendly title (max 100 characters)",
            ui: {
              validate: (value) => {
                if (value && value.length > 100) {
                  return "Title should be 100 characters or less";
                }
              },
            },
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            description: "Brief summary for previews and SEO (max 160 characters)",
            ui: {
              component: "textarea",
              validate: (value) => {
                if (value && value.length > 160) {
                  return "Excerpt should be 160 characters or less for optimal SEO";
                }
              },
            },
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publication Date",
            required: true,
            ui: {
              dateFormat: "YYYY-MM-DD",
              timeFormat: "HH:mm",
            },
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
            description: "Optional: When the post was last significantly updated",
          },
          
          // Author Information - Fixed to match your schema (string, not object)
          {
            type: "string",
            name: "author",
            label: "Author Name",
            required: true,
            options: [
              { label: "TinkByte Team", value: "TinkByte Team" },
              { label: "Eiza", value: "Eiza" },
              { label: "Dr. Elena Vasquez", value: "Dr. Elena Vasquez" },
              { label: "Alex Chen", value: "Alex Chen" },
              { label: "Sarah Kim", value: "Sarah Kim" },
              { label: "Marcus Rodriguez", value: "Marcus Rodriguez" },
              { label: "Dr. James Liu", value: "Dr. James Liu" },
              { label: "Rachel Torres", value: "Rachel Torres" },
              { label: "Guest Author", value: "Guest Author" },
            ],
          },
          {
            type: "string",
            name: "authorBio",
            label: "Author Bio",
            description: "Brief author description",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "image",
            name: "authorAvatar",
            label: "Author Avatar",
            description: "Author profile image",
          },
          {
            type: "string",
            name: "authorRole",
            label: "Author Role",
            description: "e.g., 'Chief AI Officer', 'Senior Product Manager'",
          },
          {
            type: "object",
            name: "authorSocial",
            label: "Author Social Links",
            fields: [
              {
                type: "string",
                name: "twitter",
                label: "Twitter Handle",
                description: "Without @ symbol",
              },
              {
                type: "string",
                name: "linkedin",
                label: "LinkedIn Username",
              },
              {
                type: "string",
                name: "github",
                label: "GitHub Username",
              },
              {
                type: "string",
                name: "website",
                label: "Personal Website",
                description: "Full URL including https://",
              },
            ],
          },

          // Media and Visuals
          {
            type: "image",
            name: "image",
            label: "Featured Image",
            description: "Main article image (recommended: 1200x630px)",
          },
          {
            type: "string",
            name: "imageAlt",
            label: "Image Alt Text",
            description: "Describe the image for accessibility and SEO",
          },

          // Categorization - FIXED: Use display names to match your existing content
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true,
            options: [
              { label: "AI Evolution", value: "AI Evolution" },
              { label: "Product Strategy", value: "Product Strategy" },
              { label: "Tech Culture", value: "Tech Culture" },
              { label: "Startup Lessons", value: "Startup Lessons" },
              { label: "Developer Tools", value: "Developer Tools" },
              { label: "Industry Analysis", value: "Industry Analysis" },
              { label: "Emerging Tech", value: "Emerging Tech" },
              { label: "Future Tech", value: "Future Tech" },
            ],
            description: "Select the main category for this post",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            description: "Add relevant tags (lowercase, hyphen-separated)",
            ui: {
              component: "tags",
            },
          },

          // Publishing Options
          {
            type: "boolean",
            name: "featured",
            label: "Featured Post",
            description: "Show this post in featured section on homepage",
          },
          {
            type: "boolean",
            name: "trending",
            label: "Trending Post",
            description: "Mark as trending (shows in trending section)",
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            description: "Save as draft (won't be published)",
          },

          // Reading Experience
          {
            type: "string",
            name: "readTime",
            label: "Reading Time",
            description: "e.g., '5 min read' (auto-calculated if left empty)",
          },

          // Audio Content
          {
            type: "string",
            name: "audioUrl",
            label: "Audio File URL",
            description: "Link to MP3 or audio file (optional)",
          },
          {
            type: "string",
            name: "audioDuration",
            label: "Audio Duration",
            description: "e.g., '12:30' (optional)",
          },
          {
            type: "string",
            name: "audioTranscript",
            label: "Audio Transcript",
            description: "Full audio transcript for accessibility (optional)",
            ui: {
              component: "textarea",
            },
          },

          // SEO Settings
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            description: "Advanced SEO options (optional)",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title",
                description: "Custom title for search engines (max 60 chars)",
              },
              {
                type: "string",
                name: "description",
                label: "Meta Description",
                description: "Custom description for search engines (max 160 chars)",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL",
                description: "If this content was published elsewhere first",
              },
              {
                type: "boolean",
                name: "noindex",
                label: "No Index",
                description: "Prevent search engines from indexing this post",
              },
            ],
          },

          // Content Body
          {
            type: "rich-text",
            name: "body",
            label: "Article Content",
            isBody: true,
            templates: [
              {
                name: "callout",
                label: "Callout Box",
                fields: [
                  {
                    type: "string",
                    name: "type",
                    label: "Callout Type",
                    options: [
                      { label: "Info", value: "info" },
                      { label: "Warning", value: "warning" },
                      { label: "Success", value: "success" },
                      { label: "Error", value: "error" },
                      { label: "Tip", value: "tip" },
                    ],
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Title",
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Content",
                  },
                ],
              },
              {
                name: "codeBlock",
                label: "Code Block",
                fields: [
                  {
                    type: "string",
                    name: "language",
                    label: "Programming Language",
                    options: [
                      { label: "JavaScript", value: "javascript" },
                      { label: "TypeScript", value: "typescript" },
                      { label: "Python", value: "python" },
                      { label: "Bash/Shell", value: "bash" },
                      { label: "CSS", value: "css" },
                      { label: "HTML", value: "html" },
                      { label: "JSON", value: "json" },
                      { label: "Astro", value: "astro" },
                      { label: "React/JSX", value: "jsx" },
                      { label: "Vue", value: "vue" },
                      { label: "Markdown", value: "markdown" },
                    ],
                  },
                  {
                    type: "string",
                    name: "filename",
                    label: "Filename (optional)",
                    description: "e.g., 'src/components/Header.astro'",
                  },
                  {
                    type: "string",
                    name: "code",
                    label: "Code",
                    ui: {
                      component: "textarea",
                    },
                  },
                ],
              },
              {
                name: "quote",
                label: "Quote",
                fields: [
                  {
                    type: "string",
                    name: "quote",
                    label: "Quote Text",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "string",
                    name: "author",
                    label: "Quote Author",
                  },
                  {
                    type: "string",
                    name: "role",
                    label: "Author Role/Title",
                  },
                ],
              },
              {
                name: "newsletter",
                label: "Newsletter Signup",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "CTA Title",
                    description: "e.g., 'Want more insights like this?'",
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Description",
                    ui: {
                      component: "textarea",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },

      // Categories Collection - Fixed to match your schema
      {
        name: "categories",
        label: "Categories",
        path: "src/content/categories",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.name
                ?.toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;
            },
          },
          defaultItem: () => {
            return {
              name: "New Category",
              description: "Category description",
              color: "blue",
              icon: "tag",
              featured: false,
            };
          },
        },
        fields: [
          {
            type: "string",
            name: "name",
            label: "Category Name",
            isTitle: true,
            required: true,
            description: "Display name (e.g., 'AI Evolution')",
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true,
            description: "Brief description of what this category covers",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "string",
            name: "icon",
            label: "Icon",
            description: "FontAwesome icon name",
            required: true,
            options: [
              { label: "Brain (AI)", value: "brain" },
              { label: "Lightbulb (Ideas)", value: "lightbulb" },
              { label: "Users (Culture)", value: "users" },
              { label: "Rocket (Startup)", value: "rocket" },
              { label: "Tools (Developer)", value: "tools" },
              { label: "Chart (Analysis)", value: "chart-line" },
              { label: "Sparkles (Future)", value: "sparkles" },
              { label: "Tag (General)", value: "tag" },
            ],
          },
          {
            type: "string",
            name: "color",
            label: "Color Theme",
            required: true,
            options: [
              { label: "Purple", value: "purple" },
              { label: "Green", value: "green" },
              { label: "Blue", value: "blue" },
              { label: "Cyan", value: "cyan" },
              { label: "Orange", value: "orange" },
              { label: "Red", value: "red" },
              { label: "Pink", value: "pink" },
              { label: "Yellow", value: "yellow" },
            ],
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Category",
            description: "Show this category prominently on the homepage",
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title",
                description: "Custom title for category pages",
              },
              {
                type: "string",
                name: "description",
                label: "Meta Description",
                description: "Description for search engines",
                ui: {
                  component: "textarea",
                },
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Category Content",
            isBody: true,
            description: "Detailed description and content for the category page",
          },
        ],
      },

      // Keep all your other collections as they are - they look perfect!
      {
        name: "authors",
        label: "Authors",
        path: "src/content/authors",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.name
                ?.toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;
            },
          },
        },
        fields: [
          {
            type: "string",
            name: "name",
            label: "Full Name",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "bio",
            label: "Biography",
            required: true,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "image",
            name: "avatar",
            label: "Profile Picture",
            required: true,
          },
          {
            type: "string",
            name: "role",
            label: "Role/Title",
            required: true,
          },
          {
            type: "string",
            name: "company",
            label: "Company",
            description: "Optional company affiliation",
          },
          {
            type: "string",
            name: "email",
            label: "Email Address",
            description: "Optional contact email",
          },
          {
            type: "object",
            name: "social",
            label: "Social Media",
            fields: [
              {
                type: "string",
                name: "twitter",
                label: "Twitter Handle",
                description: "Without @ symbol",
              },
              {
                type: "string",
                name: "linkedin",
                label: "LinkedIn Profile",
                description: "Full LinkedIn URL",
              },
              {
                type: "string",
                name: "github",
                label: "GitHub Username",
              },
              {
                type: "string",
                name: "website",
                label: "Personal Website",
                description: "Full URL including https://",
              },
            ],
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Author",
            description: "Show on authors page prominently",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Extended Bio",
            isBody: true,
            description: "Detailed author information for author page",
          },
        ],
      },
      // Podcast Collection - Added to match your content schema
      {
        name: "podcast",
        label: "Podcast Episodes",
        path: "src/content/podcast",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `episode-${values?.episode || "new"}`;
            },
          },
          defaultItem: () => {
            return {
              title: "New Episode",
              pubDate: new Date().toISOString(),
              episode: 1,
              featured: false,
            };
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Episode Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Episode Description",
            required: true,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publication Date",
            required: true,
          },
          {
            type: "string",
            name: "duration",
            label: "Duration",
            required: true,
            description: "e.g., '45:30'",
          },
          {
            type: "string",
            name: "audioUrl",
            label: "Audio File URL",
            required: true,
            description: "Direct link to MP3 file",
          },
          {
            type: "image",
            name: "image",
            label: "Episode Artwork",
            description: "Episode cover image",
          },
          {
            type: "string",
            name: "guests",
            label: "Guests",
            list: true,
            description: "List of guest names",
          },
          {
            type: "string",
            name: "transcript",
            label: "Transcript",
            description: "Full episode transcript",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "number",
            name: "season",
            label: "Season Number",
            description: "Optional season grouping",
          },
          {
            type: "number",
            name: "episode",
            label: "Episode Number",
            required: true,
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Episode",
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title",
              },
              {
                type: "string",
                name: "description",
                label: "Meta Description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL",
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Show Notes",
            isBody: true,
            description: "Detailed show notes and links",
          },
        ],
      },

      // Newsletter Collection - Enhanced
      {
        name: "newsletter",
        label: "Newsletter Issues",
        path: "src/content/newsletter",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `issue-${values?.issue || "new"}`;
            },
          },
          defaultItem: () => {
            return {
              title: "TinkStacks Weekly #1",
              pubDate: new Date().toISOString(),
              issue: 1,
              featured: false,
            };
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Issue Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "excerpt",
            label: "Issue Summary",
            required: true,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publication Date",
            required: true,
          },
          {
            type: "number",
            name: "issue",
            label: "Issue Number",
            required: true,
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Issue",
            description: "Highlight this issue",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Newsletter Content",
            isBody: true,
          },
        ],
      },

      // Pages Collection - Enhanced
      {
        name: "pages",
        label: "Static Pages",
        path: "src/content/pages",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.title
                ?.toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;
            },
          },
          defaultItem: () => {
            return {
              title: "New Page",
              description: "Page description",
              pubDate: new Date().toISOString(),
            };
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Page Description",
            required: true,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Created Date",
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
          },
          {
            type: "string",
            name: "layout",
            label: "Layout Template",
            description: "Optional custom layout",
            options: [
              { label: "Default", value: "default" },
              { label: "Full Width", value: "full-width" },
              { label: "Minimal", value: "minimal" },
            ],
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title",
              },
              {
                type: "string",
                name: "description",
                label: "Meta Description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL",
              },
              {
                type: "boolean",
                name: "noindex",
                label: "No Index",
                description: "Prevent search engines from indexing this page",
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Page Content",
            isBody: true,
          },
        ],
      },
    ],
  },
});