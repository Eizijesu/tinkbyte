// tina/config.ts
import { defineConfig } from "@tinacms/cli";

const branch = process.env.TINA_BRANCH || process.env.HEAD || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN!,
  
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
      static: false,
    },
  },
  
  admin: {
    auth: {
      useLocalAuth: true
    }
  },
  
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ['eng']
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100
  },
  
  schema: {
    collections: [
      // Blog Posts Collection
      {
        name: "blog",
        label: "Blog Posts",
        path: "src/content/blog",
        format: "md",
        ui: {
          router: ({ document }) => {
            return `/blog/${document._sys.filename}?tina-admin=true`;
          },
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.title
                ?.toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}`;
            },
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
            category: "build-thinking",
            storyType: "feature",
          };
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
                if (value && value.length > 300) {
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
          // Consolidated author information object
          {
            type: "object",
            name: "authorInfo",
            label: "Author Information",
            description: "Comprehensive author details (only name is required)",
            fields: [
              {
                type: "string",
                name: "name",
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
                name: "bio",
                label: "Author Bio",
                description: "Optional: Brief author description for enhanced reader engagement",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "image",
                name: "avatar",
                label: "Author Avatar",
                description: "Optional: Author profile image (recommended: 200x200px for optimal display)",
              },
              {
                type: "string",
                name: "role",
                label: "Author Role",
                description: "Optional: Professional title (e.g., 'Chief AI Officer', 'Senior Product Manager')",
              },
              {
                type: "string",
                name: "company",
                label: "Company",
                description: "Optional: Company affiliation or organization",
              },
              {
                type: "string",
                name: "email",
                label: "Contact Email",
                description: "Optional: Professional contact email for author inquiries",
              },
              {
                type: "object",
                name: "social",
                label: "Social Media Links",
                description: "Optional: Author's social media presence",
                fields: [
                  {
                    type: "string",
                    name: "twitter",
                    label: "Twitter Handle",
                    description: "Without @ symbol (e.g., 'username')",
                  },
                  {
                    type: "string",
                    name: "linkedin",
                    label: "LinkedIn Profile",
                    description: "Full LinkedIn URL or username",
                  },
                  {
                    type: "string",
                    name: "github",
                    label: "GitHub Username",
                    description: "GitHub profile username",
                  },
                  {
                    type: "string",
                    name: "website",
                    label: "Personal Website",
                    description: "Full URL including https://",
                  },
                ],
              },
            ],
          },
          // Enhanced optional image handling
          {
            type: "image",
            name: "image",
            label: "Featured Image",
            description: "Optional: Main article image (recommended: 1200x630px for optimal performance)",
          },
          {
            type: "string",
            name: "imageAlt",
            label: "Image Alt Text",
            description: "Describe the image for accessibility and SEO (recommended when image is provided)",
            ui: {
              validate: (value, data) => {
                if (data.image && !value) {
                  return "Alt text is highly recommended when an image is provided for better accessibility";
                }
              },
            },
          },
          // Categorization - TinkByte Content Pillars
          {
            type: "string",
            name: "category",
            label: "Content Pillar",
            required: true,
            options: [
              { label: "🔨 Build Thinking", value: "build-thinking" },
              { label: "🤝 Community Innovation", value: "community-innovation" },
              { label: "📚 Learning by Doing", value: "learning-by-doing" },
              { label: "🎯 No-Fluff Tech Coverage", value: "no-fluff-coverage" },
              { label: "📊 Research-Backed", value: "research-backed" },
              { label: "🌍 Global Perspective", value: "global-perspective" },
            ],
            description: "Select the main content pillar for this post",
          },
          // Story Layout Type
          {
            type: "string",
            name: "storyType",
            label: "Story Layout",
            options: [
              { label: "Feature Story", value: "feature" },
              { label: "Deep Dive", value: "deep-dive" },
              { label: "Quick Read", value: "quick-read" },
              { label: "Data Story", value: "data-story" },
              { label: "Build Guide", value: "build-guide" },
              { label: "Failure Story", value: "failure-story" },
              { label: "Global Spotlight", value: "global-spotlight" },
            ],
            description: "Choose the story format and layout style",
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
            ui: {
              component: "rich-text",
            },
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
              {
                name: "TwoColumnLayout",
                label: "Two Column Layout",
                ui: {
                  defaultItem: {
                    leftContent: "Left column content...",
                    rightContent: "Right column content...",
                  },
                },
                fields: [
                  {
                    type: "rich-text",
                    name: "leftContent",
                    label: "Left Column",
                  },
                  {
                    type: "rich-text",
                    name: "rightContent",
                    label: "Right Column",
                  },
                ],
              },
              {
                name: "VideoBlock",
                label: "Video Block",
                fields: [
                  {
                    type: "string",
                    name: "url",
                    label: "Video URL",
                    description: "YouTube, Vimeo, or direct video URL",
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Video Title",
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
              {
                name: "ImageGallery",
                label: "Image Gallery",
                fields: [
                  {
                    type: "object",
                    name: "images",
                    label: "Images",
                    list: true,
                    fields: [
                      {
                        type: "image",
                        name: "src",
                        label: "Image",
                      },
                      {
                        type: "string",
                        name: "alt",
                        label: "Alt Text",
                      },
                      {
                        type: "string",
                        name: "caption",
                        label: "Caption",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      // Categories Collection
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
        fields: [
          {
            type: "string",
            name: "name",
            label: "Category Name",
            isTitle: true,
            required: true,
            description: "Display name (e.g., 'Build Thinking')",
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
              { label: "Hammer (Build)", value: "hammer" },
              { label: "Users (Community)", value: "users" },
              { label: "Book (Learning)", value: "book" },
              { label: "Target (No-Fluff)", value: "bullseye" },
              { label: "Chart (Research)", value: "chart-line" },
              { label: "Globe (Global)", value: "globe" },
              { label: "Brain (AI)", value: "brain" },
              { label: "Lightbulb (Ideas)", value: "lightbulb" },
              { label: "Rocket (Startup)", value: "rocket" },
              { label: "Tools (Developer)", value: "tools" },
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

      // Authors Collection
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

      // Podcast Collection
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
        },
        defaultItem: () => {
          return {
            title: "New Episode",
            pubDate: new Date().toISOString(),
            episode: 1,
            featured: false,
          };
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

      // Newsletter Collection
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
        },
        defaultItem: () => {
          return {
            title: "TinkStacks Weekly #1",
            pubDate: new Date().toISOString(),
            issue: 1,
            featured: false,
          };
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

      // Pages Collection
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
        },
        defaultItem: () => {
          return {
            title: "New Page",
            description: "Page description",
            pubDate: new Date().toISOString(),
          };
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
            templates: [
              {
                name: "Hero",
                label: "Hero Section",
                ui: {
                  defaultItem: {
                    title: "Welcome to TinkByte",
                    subtitle: "Building meaningful, data-driven products",
                    backgroundImage: "",
                  },
                },
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Hero Title",
                  },
                  {
                    type: "string",
                    name: "subtitle",
                    label: "Hero Subtitle",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "image",
                    name: "backgroundImage",
                    label: "Background Image",
                  },
                  {
                    type: "object",
                    name: "cta",
                    label: "Call to Action",
                    fields: [
                      {
                        type: "string",
                        name: "text",
                        label: "Button Text",
                      },
                      {
                        type: "string",
                        name: "url",
                        label: "Button URL",
                      },
                    ],
                  },
                ],
              },
              {
                name: "ContentBlock",
                label: "Content Block",
                ui: {
                  defaultItem: {
                    content: "Start writing your content here...",
                  },
                },
                fields: [
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Content",
                    ui: {
                      component: "rich-text",
                    },
                  },
                ],
              },
              {
                name: "ImageBlock",
                label: "Image Block",
                ui: {
                  defaultItem: {
                    caption: "Image caption",
                    layout: "full-width",
                  },
                },
                fields: [
                  {
                    type: "image",
                    name: "src",
                    label: "Image",
                  },
                  {
                    type: "string",
                    name: "alt",
                    label: "Alt Text",
                  },
                  {
                    type: "string",
                    name: "caption",
                    label: "Caption",
                  },
                  {
                    type: "string",
                    name: "layout",
                    label: "Layout",
                    options: [
                      { label: "Full Width", value: "full-width" },
                      { label: "Centered", value: "centered" },
                      { label: "Float Left", value: "float-left" },
                      { label: "Float Right", value: "float-right" },
                    ],
                  },
                ],
              },
              {
                name: "CalloutBox",
                label: "Callout Box",
                ui: {
                  defaultItem: {
                    type: "info",
                    title: "Important Note",
                    content: "Add your callout content here...",
                  },
                },
                fields: [
                  {
                    type: "string",
                    name: "type",
                    label: "Callout Type",
                    options: [
                      { label: "💡 Info", value: "info" },
                      { label: "⚠️ Warning", value: "warning" },
                      { label: "✅ Success", value: "success" },
                      { label: "❌ Error", value: "error" },
                      { label: "💡 Tip", value: "tip" },
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

      // Legal Pages Collection
      {
        name: "legalPages",
        label: "Legal Pages",
        path: "src/content/legal",
        format: "md",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return `${values?.title?.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")}`;
            },
          },
        },
        defaultItem: () => {
          return {
            title: "New Legal Page",
            description: "Legal page description",
            pubDate: new Date().toISOString(),
            pageType: "legal",
          };
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page Title",
            isTitle: true,
            required: true,
            description: "e.g., 'Terms of Service', 'Privacy Policy'",
          },
          {
            type: "string",
            name: "description",
            label: "Page Description",
            required: true,
            description: "Brief description for SEO and meta tags",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Created Date",
            required: true,
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
            description: "When this legal document was last updated",
          },
          {
            type: "string",
            name: "pageType",
            label: "Page Type",
            options: [
              { label: "Legal Document", value: "legal" },
              { label: "Policy", value: "policy" },
              { label: "Terms", value: "terms" },
              { label: "General Page", value: "general" },
            ],
            description: "Type of legal/policy page",
          },
          {
            type: "string",
            name: "effectiveDate",
            label: "Effective Date",
            description: "When these terms/policies take effect (optional)",
          },
          {
            type: "object",
            name: "contact",
            label: "Contact Information",
            description: "Contact details for legal inquiries",
            fields: [
              {
                type: "string",
                name: "email",
                label: "Legal Email",
                description: "e.g., legal@tinkbyte.com",
              },
              {
                type: "string",
                name: "address",
                label: "Legal Address",
                description: "Company legal address",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "phone",
                label: "Contact Phone",
                description: "Optional phone number",
              },
            ],
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            description: "Advanced SEO options",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title",
                description: "Custom title for search engines",
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
              {
                type: "boolean",
                name: "noindex",
                label: "No Index",
                description: "Prevent search engines from indexing",
              },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Legal Content",
            isBody: true,
            description: "The main legal document content",
            templates: [
              {
                name: "legalSection",
                label: "Legal Section",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Section Title",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "number",
                    label: "Section Number",
                    description: "e.g., '01', '02' (optional)",
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Section Content",
                  },
                ],
              },
              {
                name: "legalList",
                label: "Legal List",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "List Title",
                  },
                  {
                    type: "string",
                    name: "items",
                    label: "List Items",
                    list: true,
                    ui: {
                      component: "list",
                    },
                  },
                  {
                    type: "string",
                    name: "listType",
                    label: "List Style",
                    options: [
                      { label: "Bullet Points", value: "bullets" },
                      { label: "Numbered List", value: "numbered" },
                      { label: "Enhanced List", value: "enhanced" },
                    ],
                  },
                ],
              },
              {
                name: "contactInfo",
                label: "Contact Information Block",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Contact Section Title",
                    description: "e.g., 'Contact Us', 'Get in Touch'",
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Contact Description",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "object",
                    name: "contactMethods",
                    label: "Contact Methods",
                    list: true,
                    fields: [
                      {
                        type: "string",
                        name: "type",
                        label: "Contact Type",
                        options: [
                          { label: "Email", value: "email" },
                          { label: "Phone", value: "phone" },
                          { label: "Address", value: "address" },
                          { label: "Website", value: "website" },
                        ],
                      },
                      {
                        type: "string",
                        name: "value",
                        label: "Contact Value",
                        description: "Email address, phone number, etc.",
                      },
                      {
                        type: "string",
                        name: "label",
                        label: "Display Label",
                        description: "How to display this contact method",
                      },
                    ],
                  },
                ],
              },
              {
                name: "disclaimer",
                label: "Disclaimer Box",
                fields: [
                  {
                    type: "string",
                    name: "type",
                    label: "Disclaimer Type",
                    options: [
                      { label: "Important", value: "important" },
                      { label: "Warning", value: "warning" },
                      { label: "Note", value: "note" },
                      { label: "Legal Notice", value: "legal" },
                    ],
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Disclaimer Title",
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Disclaimer Content",
                  },
                ],
              },
            ],
          },
        ],
      },

      // Settings Collection
      {
        name: "settings",
        label: "Site Settings",
        path: "src/content/settings",
        format: "md",
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false,
          },
          filename: {
            readonly: true,
            slugify: () => "global-settings"
          },
        },
        match: {
          include: "global-settings"
        },
        defaultItem: () => ({
          site: {
            name: "TinkByte",
            description: "Building meaningful, data-driven products that solve real problems",
            url: "https://tinkbyte.com",
          },
          uiText: {
            audioAvailableLabel: "🎧 Audio Available",
            audioTitle: "Listen to this article",
            byAuthorPrefix: "By",
            shareLabel: "Share",
            tocTitle: "Table of Contents",
            discussionTitle: "Join the Discussion",
            relatedTitle: "Related Articles",
          },
          community: {
            stats: [],
            platforms: [],
          },
          research: {
            stats: [],
            reports: [],
          },
          newsletter: {
            title: "TinkStacks Weekly",
            subtitle: "Weekly insights on AI, tech, and innovation",
            frequency: "weekly",
            subscriberCount: "1,200+",
          },
          social: {
            platforms: [],
            defaultShareText: "Check out this article from TinkByte",
          },
          analytics: {
            enableCookieConsent: false,
          },
          performance: {
            enableImageOptimization: true,
            enableLazyLoading: true,
            enableServiceWorker: false,
            cacheMaxAge: 24,
          },
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Settings Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            ui: {
              component: "textarea",
            },
          },
          // Site Configuration
          {
            type: "object",
            name: "site",
            label: "Site Configuration",
            fields: [
              {
                type: "string",
                name: "name",
                label: "Site Name",
                required: true,
              },
              {
                type: "string",
                name: "description",
                label: "Site Description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "url",
                label: "Site URL",
                description: "Full URL including https://",
              },
              {
                type: "string",
                name: "logo",
                label: "Logo URL",
                description: "Path to site logo",
              },
              {
                type: "object",
                name: "giscus",
                label: "Giscus Comments Configuration",
                description: "Configure GitHub Discussions for comments",
                fields: [
                  {
                    type: "string",
                    name: "repo",
                    label: "Repository",
                    description: "GitHub repository in format: username/repo-name",
                  },
                  {
                    type: "string",
                    name: "repoId",
                    label: "Repository ID",
                    description: "GitHub repository ID",
                  },
                  {
                    type: "string",
                    name: "category",
                    label: "Discussion Category",
                    description: "GitHub Discussions category name",
                  },
                  {
                    type: "string",
                    name: "categoryId",
                    label: "Category ID",
                    description: "GitHub Discussions category ID",
                  },
                  {
                    type: "string",
                    name: "mapping",
                    label: "Page-Discussion Mapping",
                    options: [
                      { label: "Pathname", value: "pathname" },
                      { label: "URL", value: "url" },
                      { label: "Title", value: "title" },
                      { label: "OG Title", value: "og:title" },
                    ],
                  },
                  {
                    type: "boolean",
                    name: "reactionsEnabled",
                    label: "Enable Reactions",
                  },
                  {
                    type: "boolean",
                    name: "emitMetadata",
                    label: "Emit Metadata",
                  },
                  {
                    type: "string",
                    name: "inputPosition",
                    label: "Input Position",
                    options: [
                      { label: "Top", value: "top" },
                      { label: "Bottom", value: "bottom" },
                    ],
                  },
                  {
                    type: "string",
                    name: "lang",
                    label: "Language",
                    description: "Interface language (e.g., 'en', 'es', 'fr')",
                  },
                  {
                    type: "string",
                    name: "loading",
                    label: "Loading Strategy",
                    options: [
                      { label: "Lazy", value: "lazy" },
                      { label: "Eager", value: "eager" },
                    ],
                  },
                ],
              },
            ],
          },
          // Category Settings
          {
            type: "object",
            name: "categories",
            label: "Category Configuration",
            fields: [
              {
                type: "string",
                name: "defaultColor",
                label: "Default Category Color",
                description: "Fallback color for categories without specific colors",
                ui: {
                  component: "color",
                },
              },
              {
                type: "object",
                name: "categoryMappings",
                label: "Category Color Mappings",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "name",
                    label: "Category Name",
                    description: "Must match category values in blog posts",
                  },
                  {
                    type: "string",
                    name: "slug",
                    label: "Category Slug",
                    description: "URL-friendly version (auto-generated from name)",
                  },
                  {
                    type: "string",
                    name: "color",
                    label: "Category Color",
                    description: "Hex color code for this category",
                    ui: {
                      component: "color",
                    },
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Category Description",
                    description: "Brief description of this category",
                    ui: {
                      component: "textarea",
                    },
                  },
                ],
              },
            ],
          },
          // UI Text Configuration
          {
            type: "object",
            name: "uiText",
            label: "UI Text Configuration",
            description: "Customize all text labels throughout the site",
            fields: [
              {
                type: "string",
                name: "audioAvailableLabel",
                label: "Audio Available Badge",
                description: "Text shown when audio is available",
              },
              {
                type: "string",
                name: "audioTitle",
                label: "Audio Section Title",
                description: "Title for the audio player section",
              },
              {
                type: "string",
                name: "audioSubtitle",
                label: "Audio Section Subtitle",
                description: "Subtitle for the audio player section",
              },
              {
                type: "string",
                name: "noAudioText",
                label: "No Audio Text",
                description: "Text shown when no audio is available",
              },
              {
                type: "string",
                name: "byAuthorPrefix",
                label: "Author Prefix",
                description: "Text before author name (e.g., 'By')",
              },
              {
                type: "string",
                name: "aboutAuthorTitle",
                label: "About Author Section Title",
                description: "Title for the author bio section",
              },
              {
                type: "string",
                name: "shareLabel",
                label: "Share Label",
                description: "Text for share functionality",
              },
              {
                type: "string",
                name: "shareArticleTitle",
                label: "Share Article Section Title",
                description: "Title for the share section in sidebar",
              },
              {
                type: "string",
                name: "continueReadingTitle",
                label: "Continue Reading Title",
                description: "Title for the navigation section",
              },
              {
                type: "string",
                name: "continueReadingSubtitle",
                label: "Continue Reading Subtitle",
                description: "Subtitle for the navigation section",
              },
              {
                type: "string",
                name: "previousArticleLabel",
                label: "Previous Article Label",
                description: "Text for previous article link",
              },
              {
                type: "string",
                name: "nextArticleLabel",
                label: "Next Article Label",
                description: "Text for next article link",
              },
              {
                type: "string",
                name: "reachedBeginningText",
                label: "Reached Beginning Text",
                description: "Text when there's no previous article",
              },
              {
                type: "string",
                name: "readAllText",
                label: "Read All Text",
                description: "Text when there's no next article",
              },
              {
                type: "string",
                name: "browseAllArticlesText",
                label: "Browse All Articles Text",
                description: "Text for browse all articles link",
              },
              {
                type: "string",
                name: "tocTitle",
                label: "Table of Contents Title",
                description: "Title for the table of contents section",
              },
              {
                type: "string",
                name: "topicsTitle",
                label: "Topics Section Title",
                description: "Title for the tags/topics section",
              },
              {
                type: "string",
                name: "readingProgressTitle",
                label: "Reading Progress Title",
                description: "Title for the reading progress section",
              },
              {
                type: "string",
                name: "imageCreditText",
                label: "Image Credit Text",
                description: "Default image credit text",
              },
              {
                type: "string",
                name: "readingTimePrefix",
                label: "Reading Time Prefix",
                description: "Text before reading time (e.g., 'Reading time:')",
              },
              {
                type: "string",
                name: "defaultCategoryLabel",
                label: "Default Category Label",
                description: "Fallback category label when none is specified",
              },
              {
                type: "string",
                name: "discussionTitle",
                label: "Discussion Section Title",
                description: "Title for the comments/discussion section",
              },
              {
                type: "string",
                name: "discussionSubtitle",
                label: "Discussion Section Subtitle",
                description: "Subtitle for the comments/discussion section",
              },
              {
                type: "string",
                name: "relatedTitle",
                label: "Related Content Title",
                description: "Title for the related posts section",
              },
              {
                type: "string",
                name: "relatedSubtitle",
                label: "Related Content Subtitle",
                description: "Subtitle for the related posts section",
              },
            ],
          },
          // Community Settings
          {
            type: "object",
            name: "community",
            label: "Community Settings",
            description: "Configure community-related content and stats",
            fields: [
              {
                type: "object",
                name: "stats",
                label: "Community Statistics",
                list: true,
                ui: {
                  itemProps: (item) => {
                    return { label: item?.label || "New Stat" };
                  },
                },
                fields: [
                  {
                    type: "string",
                    name: "number",
                    label: "Statistic Number",
                    description: "e.g., '1,200+', '50K'",
                  },
                  {
                    type: "string",
                    name: "label",
                    label: "Statistic Label",
                    description: "e.g., 'Active Members', 'Monthly Readers'",
                  },
                  {
                    type: "string",
                    name: "icon",
                    label: "Icon",
                    description: "FontAwesome icon name",
                    options: [
                      { label: "Users", value: "users" },
                      { label: "Eye", value: "eye" },
                      { label: "Heart", value: "heart" },
                      { label: "Star", value: "star" },
                      { label: "Download", value: "download" },
                      { label: "Share", value: "share" },
                    ],
                  },
                ],
              },
              {
                type: "object",
                name: "platforms",
                label: "Community Platforms",
                list: true,
                ui: {
                  itemProps: (item) => {
                    return { label: item?.name || "New Platform" };
                  },
                },
                fields: [
                  {
                    type: "string",
                    name: "name",
                    label: "Platform Name",
                    description: "e.g., 'Discord', 'GitHub', 'Twitter'",
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Platform Description",
                    description: "Brief description of what happens on this platform",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "string",
                    name: "icon",
                    label: "Platform Icon",
                    description: "FontAwesome brand icon name",
                    options: [
                      { label: "Discord", value: "discord" },
                      { label: "GitHub", value: "github" },
                      { label: "Twitter", value: "twitter" },
                      { label: "LinkedIn", value: "linkedin" },
                      { label: "YouTube", value: "youtube" },
                      { label: "Slack", value: "slack" },
                    ],
                  },
                  {
                    type: "string",
                    name: "link",
                    label: "Platform URL",
                    description: "Full URL to the platform",
                  },
                  {
                    type: "string",
                    name: "members",
                    label: "Member Count",
                    description: "e.g., '1.2K members', '500+ contributors'",
                  },
                  {
                    type: "string",
                    name: "activity",
                    label: "Activity Level",
                    description: "e.g., 'Very Active', 'Daily Updates'",
                  },
                  {
                    type: "string",
                    name: "color",
                    label: "Platform Color Theme",
                    options: [
                      { label: "Purple", value: "purple" },
                      { label: "Blue", value: "blue" },
                      { label: "Green", value: "green" },
                      { label: "Gray", value: "gray" },
                      { label: "Red", value: "red" },
                      { label: "Yellow", value: "yellow" },
                    ],
                  },
                ],
              },
            ],
          },
          // Research Settings
          {
            type: "object",
            name: "research",
            label: "Research Settings",
            description: "Configure research-related content and reports",
            fields: [
              {
                type: "object",
                name: "stats",
                label: "Research Statistics",
                list: true,
                ui: {
                  itemProps: (item) => {
                    return { label: item?.label || "New Stat" };
                  },
                },
                fields: [
                  {
                    type: "string",
                    name: "number",
                    label: "Statistic Number",
                    description: "e.g., '25+', '100K+'",
                  },
                  {
                    type: "string",
                    name: "label",
                    label: "Statistic Label",
                    description: "e.g., 'Research Reports', 'Data Points'",
                  },
                  {
                    type: "string",
                    name: "icon",
                    label: "Icon",
                    description: "icon name",
                    options: [
                      { label: "Chart Line", value: "chart-line" },
                      { label: "File Alt", value: "file-alt" },
                      { label: "Database", value: "database" },
                      { label: "Microscope", value: "microscope" },
                      { label: "Brain", value: "brain" },
                      { label: "Lightbulb", value: "lightbulb" },
                    ],
                  },
                ],
              },
              {
                type: "object",
                name: "reports",
                label: "Featured Research Reports",
                list: true,
                ui: {
                  itemProps: (item) => {
                    return { label: item?.title || "New Report" };
                  },
                },
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Report Title",
                    description: "Full title of the research report",
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Report Description",
                    description: "Brief summary of the report content",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "datetime",
                    name: "date",
                    label: "Publication Date",
                    description: "When the report was published",
                  },
                  {
                    type: "string",
                    name: "type",
                    label: "Report Type",
                    description: "e.g., 'Industry Analysis', 'Technical Deep Dive'",
                    options: [
                      { label: "Industry Analysis", value: "industry-analysis" },
                      { label: "Technical Deep Dive", value: "technical-deep-dive" },
                      { label: "Market Research", value: "market-research" },
                      { label: "User Study", value: "user-study" },
                      { label: "Trend Report", value: "trend-report" },
                      { label: "Case Study", value: "case-study" },
                    ],
                  },
                  {
                    type: "number",
                    name: "pages",
                    label: "Page Count",
                    description: "Number of pages in the report",
                  },
                  {
                    type: "string",
                    name: "downloads",
                    label: "Download Count",
                    description: "e.g., '2.5K downloads', '500+ reads'",
                  },
                  {
                    type: "string",
                    name: "downloadUrl",
                    label: "Download URL",
                    description: "Link to download or view the report",
                  },
                  {
                    type: "image",
                    name: "coverImage",
                    label: "Report Cover Image",
                    description: "Cover image for the report",
                  },
                  {
                    type: "boolean",
                    name: "featured",
                    label: "Featured Report",
                    description: "Show this report prominently",
                  },
                  {
                    type: "string",
                    name: "tags",
                    label: "Report Tags",
                    list: true,
                    description: "Tags for categorizing the report",
                  },
                ],
              },
            ],
          },
          // Newsletter Settings
          {
            type: "object",
            name: "newsletter",
            label: "Newsletter Configuration",
            description: "Configure newsletter signup and content",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Newsletter Title",
                description: "Main title for newsletter sections",
              },
              {
                type: "string",
                name: "subtitle",
                label: "Newsletter Subtitle",
                description: "Subtitle or description for newsletter",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "frequency",
                label: "Newsletter Frequency",
                description: "How often the newsletter is sent",
                options: [
                  { label: "Weekly", value: "weekly" },
                  { label: "Bi-weekly", value: "bi-weekly" },
                  { label: "Monthly", value: "monthly" },
                  { label: "Irregular", value: "irregular" },
                ],
              },
              {
                type: "string",
                name: "subscriberCount",
                label: "Subscriber Count",
                description: "e.g., '1,200+', '5K+'",
              },
              {
                type: "string",
                name: "signupFormId",
                label: "Signup Form ID",
                description: "ID for your email service provider form",
              },
              {
                type: "string",
                name: "confirmationMessage",
                label: "Confirmation Message",
                description: "Message shown after successful signup",
                ui: {
                  component: "textarea",
                },
              },
            ],
          },
          // Social Media Settings
          {
            type: "object",
            name: "social",
            label: "Social Media Configuration",
            description: "Configure social media links and sharing",
            fields: [
              {
                type: "object",
                name: "platforms",
                label: "Social Media Platforms",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "name",
                    label: "Platform Name",
                    options: [
                      { label: "Twitter", value: "twitter" },
                      { label: "LinkedIn", value: "linkedin" },
                      { label: "GitHub", value: "github" },
                      { label: "YouTube", value: "youtube" },
                      { label: "Instagram", value: "instagram" },
                      { label: "TikTok", value: "tiktok" },
                      { label: "Discord", value: "discord" },
                    ],
                  },
                  {
                    type: "string",
                    name: "url",
                    label: "Profile URL",
                    description: "Full URL to your profile on this platform",
                  },
                  {
                    type: "string",
                    name: "username",
                    label: "Username/Handle",
                    description: "Your username on this platform (without @)",
                  },
                  {
                    type: "boolean",
                    name: "showInFooter",
                    label: "Show in Footer",
                    description: "Display this platform in the site footer",
                  },
                  {
                    type: "boolean",
                    name: "enableSharing",
                    label: "Enable Sharing",
                    description: "Include this platform in share buttons",
                  },
                ],
              },
              {
                type: "string",
                name: "defaultShareText",
                label: "Default Share Text",
                description: "Default text for social media shares",
                ui: {
                  component: "textarea",
                },
              },
            ],
          },
          // Analytics and Tracking
          {
            type: "object",
            name: "analytics",
            label: "Analytics Configuration",
            description: "Configure tracking and analytics",
            fields: [
              {
                type: "string",
                name: "googleAnalyticsId",
                label: "Google Analytics ID",
                description: "GA4 Measurement ID (e.g., G-XXXXXXXXXX)",
              },
              {
                type: "string",
                name: "googleTagManagerId",
                label: "Google Tag Manager ID",
                description: "GTM Container ID (e.g., GTM-XXXXXXX)",
              },
              {
                type: "boolean",
                name: "enableCookieConsent",
                label: "Enable Cookie Consent",
                description: "Show cookie consent banner",
              },
              {
                type: "string",
                name: "cookieConsentMessage",
                label: "Cookie Consent Message",
                description: "Message shown in cookie consent banner",
                ui: {
                  component: "textarea",
                },
              },
            ],
          },
          // Performance and Technical Settings
          {
            type: "object",
            name: "performance",
            label: "Performance Settings",
            description: "Configure performance-related options",
            fields: [
              {
                type: "boolean",
                name: "enableImageOptimization",
                label: "Enable Image Optimization",
                description: "Automatically optimize images",
              },
              {
                type: "boolean",
                name: "enableLazyLoading",
                label: "Enable Lazy Loading",
                description: "Lazy load images and components",
              },
              {
                type: "boolean",
                name: "enableServiceWorker",
                label: "Enable Service Worker",
                description: "Enable offline functionality",
              },
              {
                type: "number",
                name: "cacheMaxAge",
                label: "Cache Max Age (hours)",
                description: "How long to cache static assets",
              },
            ],
          },
        ],
      },
    ],
  },
});