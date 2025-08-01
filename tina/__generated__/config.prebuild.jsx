// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.TINA_BRANCH || process.env.HEAD || "main";
var config_default = defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  ui: {
    previewUrl: (context) => {
      if (false) {
        return { url: "https://tinkbyte.com" };
      }
      return { url: "http://localhost:4321" };
    }
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
      static: false
    }
  },
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ["eng"]
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100
  },
  schema: {
    collections: [
      // ENHANCED BLOG COLLECTION (Fixed)
      {
        name: "blog",
        label: "\u{1F4DD} TinkByte Articles",
        path: "src/content/blog",
        format: "mdx",
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const title = values?.title;
              if (typeof title === "string") {
                return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
              }
              return "new-article";
            }
          },
          beforeSubmit: async ({ form, cms, values }) => {
            if (!values.filename && values.title && typeof values.title === "string") {
              values.filename = values.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
            }
            if (!values.readTime && values.body) {
              const wordCount = JSON.stringify(values.body).split(" ").length;
              values.readTime = `${Math.ceil(wordCount / 200)} min read`;
            }
            if (!values.pubDate) {
              values.pubDate = (/* @__PURE__ */ new Date()).toISOString();
            }
            return values;
          }
        },
        defaultItem: () => ({
          title: "New TinkByte Article",
          excerpt: "Brief description that captures the essence of this article...",
          pubDate: (/* @__PURE__ */ new Date()).toISOString(),
          authorInfo: {
            name: "Eiza",
            role: "Solution Architect & AI Product Manager"
          },
          heroImage: {
            imageType: "url",
            alt: ""
          },
          draft: true,
          featured: false,
          trending: false,
          tags: [],
          category: "build-thinking",
          storyType: "feature"
        }),
        fields: [
          // Editorial Workflow
          {
            type: "object",
            name: "editorial",
            label: "\u{1F4CB} Editorial Workflow",
            description: "Track article progress and editorial notes",
            ui: {
              component: "group"
            },
            fields: [
              {
                type: "string",
                name: "status",
                label: "Article Status",
                options: [
                  { label: "\u{1F4DD} Draft", value: "draft" },
                  { label: "\u270F\uFE0F In Review", value: "review" },
                  { label: "\u2705 Ready to Publish", value: "approved" },
                  { label: "\u{1F680} Published", value: "published" },
                  { label: "\u{1F504} Needs Revision", value: "revision" }
                ],
                ui: {
                  component: "radio-group"
                }
              },
              {
                type: "string",
                name: "assignedEditor",
                label: "Assigned Editor",
                options: [
                  { label: "Eiza", value: "Eiza" },
                  { label: "TinkByte Team", value: "TinkByte Team" },
                  { label: "Guest Editor", value: "Guest Editor" }
                ]
              },
              {
                type: "string",
                name: "editorNotes",
                label: "Editorial Notes",
                description: "Internal notes for the editorial team",
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          // Enhanced Title
          {
            type: "string",
            name: "title",
            label: "\u{1F4F0} Article Title",
            isTitle: true,
            required: true,
            description: "SEO-friendly title (max 100 characters)",
            ui: {
              validate: (value) => {
                if (!value) return "Title is required";
                if (value.length > 100) return "Title should be 100 characters or less for optimal SEO";
                if (value.length < 10) return "Title should be at least 10 characters for readability";
              },
              parse: (value) => value?.trim()
            }
          },
          // Enhanced Excerpt
          {
            type: "string",
            name: "excerpt",
            label: "\u{1F4C4} Article Excerpt",
            required: true,
            description: "Brief summary for previews and SEO (max 300 characters)",
            ui: {
              component: "textarea",
              validate: (value) => {
                if (!value) return "Excerpt is required";
                if (value && value.length > 300) {
                  return "Excerpt should be 300 characters or less for optimal SEO";
                }
                if (value.length < 20) return "Excerpt should be at least 20 characters";
              }
            }
          },
          // Publishing dates
          {
            type: "datetime",
            name: "pubDate",
            label: "\u{1F4C5} Publication Date",
            required: true,
            ui: {
              dateFormat: "YYYY-MM-DD",
              timeFormat: "HH:mm"
            }
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
            description: "Optional: When the post was last significantly updated"
          },
          // Enhanced Author Information
          {
            type: "object",
            name: "authorInfo",
            label: "\u{1F464} Author Information",
            description: "Author details (only name is required)",
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
                  { label: "Guest Author", value: "Guest Author" }
                ],
                ui: {
                  component: "select"
                }
              },
              {
                type: "string",
                name: "bio",
                label: "Author Bio",
                required: false,
                description: "Optional: Brief author description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "image",
                name: "avatar",
                label: "Author Avatar",
                required: false,
                description: "Optional: Author profile image"
              },
              {
                type: "string",
                name: "role",
                label: "Author Role",
                required: false,
                description: "Optional: Professional title"
              },
              {
                type: "object",
                name: "social",
                label: "Social Media Links",
                required: false,
                description: "Optional: Author's social media",
                fields: [
                  {
                    type: "string",
                    name: "twitter",
                    label: "Twitter URL",
                    required: false,
                    description: "Optional: Full Twitter URL"
                  },
                  {
                    type: "string",
                    name: "linkedin",
                    label: "LinkedIn URL",
                    required: false,
                    description: "Optional: Full LinkedIn URL"
                  },
                  {
                    type: "string",
                    name: "github",
                    label: "GitHub URL",
                    required: false,
                    description: "Optional: Full GitHub URL"
                  },
                  {
                    type: "string",
                    name: "website",
                    label: "Personal Website",
                    required: false,
                    description: "Optional: Full website URL"
                  }
                ]
              }
            ]
          },
          // Enhanced Hero Image (Fixed - showing both options)
          {
            type: "object",
            name: "heroImage",
            label: "\u{1F5BC}\uFE0F Featured Image Options",
            description: "Choose how to add your featured image",
            fields: [
              {
                type: "string",
                name: "imageType",
                label: "Image Source Type",
                required: true,
                options: [
                  { label: "\u{1F4C1} Upload Image File", value: "upload" },
                  { label: "\u{1F517} Use External URL", value: "url" }
                ],
                ui: {
                  component: "radio-group"
                }
              },
              {
                type: "image",
                name: "uploadedImage",
                label: "Upload Image File",
                description: "Upload an image (recommended: 1200x630px) - Use this if you selected 'Upload'"
              },
              {
                type: "string",
                name: "externalUrl",
                label: "External Image URL",
                description: "Paste the full URL (e.g., https://images.unsplash.com/photo-123...) - Use this if you selected 'URL'"
              },
              {
                type: "string",
                name: "alt",
                label: "Alt Text (Required)",
                required: true,
                description: "Describe the image for accessibility and SEO"
              },
              {
                type: "string",
                name: "caption",
                label: "Image Caption",
                description: "Optional caption displayed below the image"
              }
            ]
          },
          // Legacy image fields for backward compatibility
          {
            type: "image",
            name: "image",
            label: "Legacy Image (Backup)",
            description: "Fallback image field for existing posts"
          },
          {
            type: "string",
            name: "imageAlt",
            label: "Legacy Alt Text",
            description: "Alt text for legacy image field"
          },
          // Enhanced Categorization
          {
            type: "string",
            name: "category",
            label: "\u{1F3F7}\uFE0F Content Pillar",
            required: true,
            options: [
              // Core Themes
              { label: "\u{1F528} Build Thinking", value: "build-thinking" },
              { label: "\u{1F4DA} Learning by Doing", value: "learning-by-doing" },
              { label: "\u{1F504} Fail / Iterate / Ship", value: "fail-iterate-ship" },
              { label: "\u{1F4A1} Product Lessons", value: "product-lessons" },
              { label: "\u{1F680} Startup Insight", value: "startup-insight" },
              { label: "\u{1F3AF} Product Strategy", value: "product-strategy" },
              // Specialized Themes
              { label: "\u{1F9E0} AI Evolution", value: "ai-evolution" },
              { label: "\u{1F6E0}\uFE0F Developer Stack & Tools", value: "developer-stack-tools" },
              { label: "\u{1F4CA} Research Bites", value: "research-bites" },
              { label: "\u2699\uFE0F System Thinking", value: "system-thinking" },
              { label: "\u{1F5A5}\uFE0F The Interface", value: "the-interface" },
              { label: "\u{1F465} Tech Culture", value: "tech-culture" },
              { label: "\u{1F30D} Global Perspective", value: "global-perspective" },
              { label: "\u{1F91D} Community Innovation", value: "community-innovation" },
              // Extended Themes
              { label: "\u{1F4BC} Career Stacks", value: "career-stacks" },
              { label: "\u26A1 Future Stacks", value: "future-stacks" },
              { label: "\u{1F4B0} Business Models & Monetization", value: "business-models-monetization" },
              { label: "\u2B50 Creator Economy", value: "creator-economy" },
              { label: "\u{1F441}\uFE0F Consumer Behavior & Attention", value: "consumer-behavior-attention" },
              { label: "\u{1F5FA}\uFE0F Ecosystem Shifts & Market Maps", value: "ecosystem-shifts-market-maps" },
              { label: "\u{1F465} People Systems", value: "people-systems" }
            ],
            description: "Select the main content pillar for this post"
          },
          {
            type: "string",
            name: "storyType",
            label: "Story Layout",
            options: [
              { label: "Feature Story", value: "feature" },
              { label: "Technical Analysis", value: "technical-analysis" },
              { label: "Quick Read", value: "quick-read" },
              { label: "Data Story", value: "data-story" },
              { label: "Build Guide", value: "build-guide" },
              { label: "Failure Story", value: "failure-story" },
              { label: "Global Spotlight", value: "global-spotlight" }
            ],
            description: "Choose the story format and layout style"
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            description: "Add relevant tags (lowercase, hyphen-separated)",
            ui: {
              component: "tags",
              parse: (val) => {
                if (Array.isArray(val)) {
                  return val.map((tag) => {
                    const tagString = String(tag);
                    return tagString.toLowerCase().replace(/\s+/g, "-");
                  });
                }
                if (val) {
                  const valString = String(val);
                  return [valString.toLowerCase().replace(/\s+/g, "-")];
                }
                return [];
              },
              validate: (values) => {
                if (values && Array.isArray(values) && values.length > 8) {
                  return "Maximum 8 tags recommended for optimal SEO";
                }
                return void 0;
              }
            }
          },
          // Publishing Options
          {
            type: "boolean",
            name: "featured",
            label: "Featured Post",
            description: "Show this post in featured section on homepage"
          },
          {
            type: "boolean",
            name: "trending",
            label: "Trending Post",
            description: "Mark as trending (shows in trending section)"
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            description: "Save as draft (won't be published)"
          },
          {
            type: "string",
            name: "readTime",
            label: "Reading Time",
            description: "e.g., '5 min read' (auto-calculated if left empty)"
          },
          // Audio Content (Fixed - all fields visible)
          {
            type: "boolean",
            name: "hasAudio",
            label: "\u{1F3A7} Has Audio Version",
            description: "Check if this article has an audio version"
          },
          {
            type: "string",
            name: "audioUrl",
            label: "Audio File URL",
            description: "Link to MP3 or audio file (only fill if Has Audio is checked)"
          },
          {
            type: "string",
            name: "audioDuration",
            label: "Audio Duration",
            description: "e.g., '12:30' (only fill if Has Audio is checked)"
          },
          {
            type: "string",
            name: "audioTranscript",
            label: "Audio Transcript",
            description: "Full audio transcript for accessibility (only fill if Has Audio is checked)",
            ui: {
              component: "textarea"
            }
          },
          // Enhanced SEO Settings (Fixed - all fields visible)
          {
            type: "object",
            name: "seo",
            label: "\u{1F50D} SEO Settings",
            description: "Advanced SEO options (optional)",
            fields: [
              {
                type: "boolean",
                name: "customSEO",
                label: "Use Custom SEO",
                description: "Override default SEO with custom values"
              },
              {
                type: "string",
                name: "title",
                label: "SEO Title",
                description: "Custom title for search engines (max 60 chars) - only use if Custom SEO is checked",
                ui: {
                  validate: (value) => {
                    if (value && typeof value === "string" && value.length > 60) {
                      return "SEO title should be 60 characters or less";
                    }
                  }
                }
              },
              {
                type: "string",
                name: "description",
                label: "Meta Description",
                description: "Custom description for search engines (max 300 chars) - only use if Custom SEO is checked",
                ui: {
                  component: "textarea",
                  validate: (value) => {
                    if (value && typeof value === "string" && value.length > 300) {
                      return "Meta description should be 300 characters or less";
                    }
                  }
                }
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL",
                description: "If this content was published elsewhere first - only use if Custom SEO is checked"
              },
              {
                type: "boolean",
                name: "noindex",
                label: "No Index",
                description: "Prevent search engines from indexing this post"
              }
            ]
          },
          // Enhanced Rich Text Content (Fixed templates)
          {
            type: "rich-text",
            name: "body",
            label: "\u{1F4DD} Article Content",
            isBody: true,
            description: "Write your article content. Use the toolbar to add images, videos, and other media blocks.",
            templates: [
              // Newsletter Template 
              {
                name: "Newsletter",
                label: "\u{1F4E7} Newsletter Signup",
                ui: {
                  defaultItem: {
                    variant: "inline",
                    title: "Stay Updated with TinkByte",
                    description: "Get practical insights delivered weekly. No fluff, just actionable content.",
                    buttonText: "Subscribe",
                    showFeatures: true,
                    features: ["Weekly insights", "No spam", "Unsubscribe anytime"]
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "variant",
                    label: "Newsletter Style",
                    options: [
                      { label: "Inline (recommended)", value: "inline" },
                      { label: "Sidebar", value: "sidebar" },
                      { label: "Hero Banner", value: "hero" },
                      { label: "Minimal", value: "minimal" }
                    ]
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Newsletter Title",
                    description: "Keep it benefit-focused"
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Value Proposition",
                    ui: { component: "textarea" },
                    description: "What specific value do subscribers get?"
                  },
                  {
                    type: "string",
                    name: "buttonText",
                    label: "CTA Button Text",
                    description: "Action-oriented text (e.g., 'Get Weekly Insights')"
                  },
                  {
                    type: "boolean",
                    name: "showFeatures",
                    label: "Show Benefits List"
                  },
                  {
                    type: "string",
                    name: "features",
                    label: "Key Benefits",
                    list: true,
                    description: "3-4 key benefits subscribers get"
                  }
                ]
              },
              // Enhanced Image Block (Fixed)
              {
                name: "ImageBlock",
                label: "\u{1F4F7} Insert Image",
                ui: {
                  defaultItem: {
                    sourceType: "url",
                    alt: "",
                    caption: "",
                    size: "large"
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "sourceType",
                    label: "Image Source",
                    options: [
                      { label: "\u{1F517} External URL", value: "url" },
                      { label: "\u{1F4C1} Upload File", value: "upload" }
                    ],
                    ui: {
                      component: "radio-group"
                    }
                  },
                  {
                    type: "image",
                    name: "uploadedImage",
                    label: "Upload Image",
                    description: "Use this if you selected 'Upload File' above"
                  },
                  {
                    type: "string",
                    name: "externalUrl",
                    label: "Image URL",
                    description: "Paste image URL (e.g., https://images.unsplash.com/...) - Use this if you selected 'External URL' above"
                  },
                  {
                    type: "string",
                    name: "alt",
                    label: "Alt Text",
                    required: true
                  },
                  {
                    type: "string",
                    name: "caption",
                    label: "Caption",
                    description: "Optional caption below image"
                  },
                  {
                    type: "string",
                    name: "size",
                    label: "Size",
                    options: [
                      { label: "Small", value: "small" },
                      { label: "Medium", value: "medium" },
                      { label: "Large", value: "large" },
                      { label: "Full Width", value: "full" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "enableLightbox",
                    label: "Enable Lightbox",
                    description: "Allow image to be clicked for full-size view (recommended for medium/large/full images)"
                  }
                ]
              },
              // Enhanced Video Block (Fixed)
              {
                name: "VideoBlock",
                label: "\u{1F4F9} Video",
                ui: {
                  defaultItem: {
                    platform: "youtube",
                    url: "",
                    title: "Video Title",
                    description: ""
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "platform",
                    label: "Video Platform",
                    options: [
                      { label: "\u{1F4FA} YouTube", value: "youtube" },
                      { label: "\u{1F3A5} Vimeo", value: "vimeo" },
                      { label: "\u{1F517} Direct URL", value: "direct" }
                    ],
                    ui: {
                      component: "radio-group"
                    }
                  },
                  {
                    type: "string",
                    name: "url",
                    label: "Video URL",
                    required: true,
                    description: "Full URL to the video"
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Video Title",
                    description: "Title displayed above the video"
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Video Description",
                    description: "Optional description displayed below the video",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "string",
                    name: "aspectRatio",
                    label: "Aspect Ratio",
                    options: [
                      { label: "16:9 (Widescreen)", value: "16/9" },
                      { label: "4:3 (Standard)", value: "4/3" },
                      { label: "1:1 (Square)", value: "1/1" }
                    ],
                    description: "Video container aspect ratio"
                  },
                  {
                    type: "string",
                    name: "startTime",
                    label: "Start Time",
                    description: "Start time in seconds (for YouTube/Vimeo only)"
                  }
                ]
              },
              // Enhanced Callout (Fixed)
              {
                name: "Callout",
                label: "\u{1F4A1} Callout Box",
                ui: {
                  defaultItem: {
                    type: "info",
                    title: "Important Note",
                    content: "Add your callout content here..."
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "type",
                    label: "Callout Type",
                    options: [
                      { label: "\u{1F4A1} Info (Blue)", value: "info" },
                      { label: "\u26A0\uFE0F Warning (Yellow)", value: "warning" },
                      { label: "\u2705 Success (Green)", value: "success" },
                      { label: "\u274C Error (Red)", value: "error" },
                      { label: "\u{1F525} Tip (Purple)", value: "tip" },
                      { label: "\u{1F4DD} Note (Gray)", value: "note" },
                      { label: "\u{1F3AF} Custom", value: "custom" }
                    ]
                  },
                  {
                    type: "string",
                    name: "customColor",
                    label: "Custom Color",
                    description: "Hex color code for custom callout (only use if Custom type is selected)"
                  },
                  {
                    type: "string",
                    name: "title",
                    label: "Title"
                  },
                  {
                    type: "string",
                    // Changed from rich-text to string
                    name: "content",
                    label: "Content",
                    ui: {
                      component: "textarea"
                      // Use textarea for multi-line text
                    }
                  },
                  {
                    type: "boolean",
                    name: "dismissible",
                    label: "Dismissible",
                    description: "Allow users to close this callout (recommended for info/tip types)"
                  }
                ]
              },
              // Enhanced Code Block (Fixed)
              {
                name: "CodeBlock",
                label: "\u{1F4BB} Code Block",
                ui: {
                  defaultItem: {
                    language: "javascript",
                    code: "// Your code here\n"
                  }
                },
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
                      { label: "SQL", value: "sql" },
                      { label: "Go", value: "go" },
                      { label: "Rust", value: "rust" },
                      { label: "PHP", value: "php" },
                      { label: "Java", value: "java" },
                      { label: "Other", value: "other" }
                    ]
                  },
                  {
                    type: "string",
                    name: "customLanguage",
                    label: "Custom Language",
                    description: "Specify custom language name (only use if 'Other' is selected above)"
                  },
                  {
                    type: "string",
                    name: "filename",
                    label: "Filename (optional)",
                    description: "e.g., 'src/components/Header.astro'"
                  },
                  {
                    type: "string",
                    name: "code",
                    label: "Code",
                    required: true,
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "boolean",
                    name: "showLineNumbers",
                    label: "Show Line Numbers",
                    description: "Display line numbers in code block"
                  },
                  {
                    type: "string",
                    name: "highlightLines",
                    label: "Highlight Lines",
                    description: "Comma-separated line numbers to highlight (e.g., '1,3,5-7') - only use if line numbers are enabled"
                  }
                ]
              },
              // Enhanced Quote Template (Fixed)
              {
                name: "Quote",
                label: "\u{1F4AC} Quote",
                ui: {
                  defaultItem: {
                    quote: "The future belongs to those who build it.",
                    author: "TinkByte Team",
                    style: "default"
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "quote",
                    label: "Quote Text",
                    required: true,
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "string",
                    name: "author",
                    label: "Quote Author"
                  },
                  {
                    type: "string",
                    name: "role",
                    label: "Author Role/Title",
                    description: "Only fill if author is provided"
                  },
                  {
                    type: "string",
                    name: "company",
                    label: "Author Company",
                    description: "Only fill if author is provided"
                  },
                  {
                    type: "string",
                    name: "avatar",
                    label: "Author Avatar URL",
                    description: "Optional: Link to author's photo (recommended for card/featured styles)"
                  },
                  {
                    type: "string",
                    name: "style",
                    label: "Quote Style",
                    options: [
                      { label: "Default", value: "default" },
                      { label: "Card", value: "card" },
                      { label: "Minimal", value: "minimal" },
                      { label: "Featured", value: "featured" },
                      { label: "Pullquote", value: "pullquote" }
                    ]
                  },
                  {
                    type: "string",
                    name: "citation",
                    label: "Citation/Source",
                    description: "Source of the quote (book, article, etc.) - recommended for featured/card styles"
                  }
                ]
              },
              // Enhanced Button Block (Fixed)
              {
                name: "ButtonBlock",
                label: "\u{1F518} Button",
                ui: {
                  defaultItem: {
                    text: "Click Here",
                    url: "#",
                    style: "primary",
                    size: "medium",
                    alignment: "left"
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "text",
                    label: "Button Text",
                    required: true,
                    description: "Text displayed on the button"
                  },
                  {
                    type: "string",
                    name: "url",
                    label: "Button URL",
                    required: true,
                    description: "Where the button links to"
                  },
                  {
                    type: "string",
                    name: "style",
                    label: "Button Style",
                    options: [
                      { label: "\u{1F535} Primary", value: "primary" },
                      { label: "\u26AA Secondary", value: "secondary" },
                      { label: "\u{1F7E2} Success", value: "success" },
                      { label: "\u{1F7E1} Warning", value: "warning" },
                      { label: "\u{1F534} Danger", value: "danger" },
                      { label: "\u{1F517} Link", value: "link" },
                      { label: "\u{1F3A8} Custom", value: "custom" }
                    ]
                  },
                  {
                    type: "string",
                    name: "customColor",
                    label: "Custom Button Color",
                    description: "Hex color code for custom button (only use if Custom style is selected)"
                  },
                  {
                    type: "string",
                    name: "size",
                    label: "Button Size",
                    options: [
                      { label: "Small", value: "small" },
                      { label: "Medium", value: "medium" },
                      { label: "Large", value: "large" }
                    ]
                  },
                  {
                    type: "string",
                    name: "alignment",
                    label: "Button Alignment",
                    options: [
                      { label: "Left", value: "left" },
                      { label: "Center", value: "center" },
                      { label: "Right", value: "right" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "openInNewTab",
                    label: "Open in New Tab",
                    description: "Open the link in a new browser tab"
                  },
                  {
                    type: "string",
                    name: "icon",
                    label: "Button Icon",
                    description: "Optional emoji or icon (e.g., \u{1F680}, \u{1F4E7}, \u{1F4A1})"
                  },
                  {
                    type: "string",
                    name: "iconPosition",
                    label: "Icon Position",
                    options: [
                      { label: "Left", value: "left" },
                      { label: "Right", value: "right" }
                    ],
                    description: "Position of icon (only use if icon is provided)"
                  }
                ]
              },
              // Enhanced Table Block (Fixed)
              {
                name: "TableBlock",
                label: "\u{1F4CA} Table",
                ui: {
                  defaultItem: {
                    caption: "Data Table",
                    headers: ["Column 1", "Column 2", "Column 3"],
                    rows: [
                      { cells: ["Row 1, Col 1", "Row 1, Col 2", "Row 1, Col 3"] },
                      { cells: ["Row 2, Col 1", "Row 2, Col 2", "Row 2, Col 3"] }
                    ],
                    style: "default"
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "caption",
                    label: "Table Caption",
                    description: "Optional caption displayed above the table"
                  },
                  {
                    type: "boolean",
                    name: "hasHeaders",
                    label: "Has Header Row",
                    description: "First row contains column headers"
                  },
                  {
                    type: "string",
                    name: "headers",
                    label: "Table Headers",
                    list: true,
                    description: "Column headers for the table (only fill if Has Header Row is checked)"
                  },
                  {
                    type: "object",
                    name: "rows",
                    label: "Table Rows",
                    list: true,
                    description: "Table data rows",
                    ui: {
                      itemProps: (item) => ({
                        label: `Row ${item?.index + 1 || "New"}`
                      })
                    },
                    fields: [
                      {
                        type: "string",
                        name: "cells",
                        label: "Row Data",
                        list: true,
                        description: "Data for each cell in this row"
                      }
                    ]
                  },
                  {
                    type: "string",
                    name: "style",
                    label: "Table Style",
                    options: [
                      { label: "Default", value: "default" },
                      { label: "Striped", value: "striped" },
                      { label: "Bordered", value: "bordered" },
                      { label: "Compact", value: "compact" },
                      { label: "Responsive", value: "responsive" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "sortable",
                    label: "Sortable Columns",
                    description: "Allow users to sort table columns (recommended when headers are enabled)"
                  }
                ]
              },
              // Enhanced Two Column Layout (Fixed)
              {
                name: "TwoColumnLayout",
                label: "\u{1F4D1} Two Column Layout",
                ui: {
                  defaultItem: {
                    leftContent: "Left column content...",
                    rightContent: "Right column content...",
                    variant: "equal"
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "variant",
                    label: "Column Layout",
                    options: [
                      { label: "Equal Width", value: "equal" },
                      { label: "Left Larger (2/3 - 1/3)", value: "left-larger" },
                      { label: "Right Larger (1/3 - 2/3)", value: "right-larger" },
                      { label: "Custom Ratio", value: "custom" }
                    ]
                  },
                  {
                    type: "string",
                    name: "customRatio",
                    label: "Custom Ratio",
                    description: "e.g., '60-40', '70-30' (only use if Custom Ratio is selected)"
                  },
                  {
                    type: "rich-text",
                    name: "leftContent",
                    label: "Left Column",
                    description: "Content for the left column"
                  },
                  {
                    type: "rich-text",
                    name: "rightContent",
                    label: "Right Column",
                    description: "Content for the right column"
                  },
                  {
                    type: "string",
                    name: "gap",
                    label: "Column Gap",
                    options: [
                      { label: "Small", value: "small" },
                      { label: "Medium", value: "medium" },
                      { label: "Large", value: "large" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "stackOnMobile",
                    label: "Stack on Mobile",
                    description: "Stack columns vertically on mobile devices"
                  }
                ]
              },
              // Enhanced Image Gallery (Fixed)
              {
                name: "ImageGallery",
                label: "\u{1F5BC}\uFE0F Image Gallery",
                ui: {
                  defaultItem: {
                    images: [],
                    layout: "grid-2",
                    caption: ""
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "caption",
                    label: "Gallery Caption",
                    description: "Optional caption for the entire gallery"
                  },
                  {
                    type: "string",
                    name: "layout",
                    label: "Gallery Layout",
                    options: [
                      { label: "2 Column Grid", value: "grid-2" },
                      { label: "3 Column Grid", value: "grid-3" },
                      { label: "4 Column Grid", value: "grid-4" },
                      { label: "Masonry", value: "masonry" },
                      { label: "Carousel", value: "carousel" },
                      { label: "Lightbox Grid", value: "lightbox" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "autoplay",
                    label: "Auto-play Carousel",
                    description: "Automatically advance carousel slides (only use if Carousel layout is selected)"
                  },
                  {
                    type: "number",
                    name: "autoplaySpeed",
                    label: "Auto-play Speed (seconds)",
                    description: "Time between automatic slide changes (only use if auto-play is enabled)"
                  },
                  {
                    type: "object",
                    name: "images",
                    label: "Images",
                    list: true,
                    ui: {
                      itemProps: (item) => {
                        return { label: item?.alt || "Gallery Image" };
                      }
                    },
                    fields: [
                      {
                        type: "image",
                        name: "src",
                        label: "Image",
                        required: true
                      },
                      {
                        type: "string",
                        name: "alt",
                        label: "Alt Text",
                        required: true
                      },
                      {
                        type: "string",
                        name: "caption",
                        label: "Image Caption",
                        description: "Optional caption for this specific image"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      // NEWSLETTER COLLECTION 
      {
        name: "newsletter",
        label: "\u{1F4E7} Newsletter Issues",
        path: "src/content/newsletter",
        format: "mdx",
        ui: {
          router: ({ document }) => `/newsletter/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const issueNumber = values?.issueNumber;
              if (issueNumber) {
                return `issue-${issueNumber}`;
              }
              const title = values?.title;
              if (typeof title === "string") {
                return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
              }
              return "new-issue";
            }
          }
        },
        defaultItem: () => ({
          title: "TinkStacks Weekly - Issue #1",
          issueNumber: 1,
          publishDate: (/* @__PURE__ */ new Date()).toISOString(),
          status: "draft",
          featured: false,
          trackStats: false
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Issue Title",
            isTitle: true,
            required: true,
            description: "e.g., 'TinkStacks Weekly - Issue #25'"
          },
          {
            type: "number",
            name: "issueNumber",
            label: "Issue Number",
            required: true,
            description: "Sequential issue number"
          },
          {
            type: "string",
            name: "newsletterType",
            label: "Newsletter Type",
            required: true,
            options: [
              { label: "Tinkbyte Weekly", value: "tinkbyte-weekly" },
              { label: "Build Sheet", value: "build-sheet" },
              { label: "Stackdown", value: "stackdown" },
              { label: "Signal Drop", value: "signal-drop" },
              { label: "System Signal", value: "system-signal" },
              { label: "The Real Build", value: "the-real-build" },
              { label: "The Loop", value: "the-loop" },
              { label: "Data Slice", value: "data-slice" },
              { label: "The Mirror", value: "the-mirror" },
              { label: "Community Code", value: "community-code" },
              { label: "Start Here: Future Tech", value: "future-tech" }
            ],
            ui: {
              component: "select"
            }
          },
          {
            type: "string",
            name: "excerpt",
            label: "Issue Description",
            required: true,
            description: "Brief summary of this issue's content",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "boolean",
            name: "subscriberOnly",
            label: "Subscriber Only Content",
            description: "If true, only show excerpt to non-subscribers (require subscription for full content)"
          },
          {
            type: "string",
            name: "previewContent",
            label: "Preview Content",
            description: "Content shown to non-subscribers (if different from excerpt)",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "datetime",
            name: "publishDate",
            label: "Publish Date",
            required: true,
            ui: {
              dateFormat: "YYYY-MM-DD",
              timeFormat: "HH:mm"
            }
          },
          {
            type: "string",
            name: "status",
            label: "Issue Status",
            options: [
              { label: "\u{1F4DD} Draft", value: "draft" },
              { label: "\u{1F440} Review", value: "review" },
              { label: "\u{1F4E7} Scheduled", value: "scheduled" },
              { label: "\u2705 Published", value: "published" },
              { label: "\u{1F4CA} Archived", value: "archived" }
            ],
            ui: {
              component: "radio-group"
            }
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Issue",
            description: "Highlight this issue prominently"
          },
          {
            type: "image",
            name: "coverImage",
            label: "Issue Cover Image",
            description: "cover for this issue"
          },
          {
            type: "object",
            name: "highlights",
            label: "Issue Highlights",
            list: true,
            description: "Key topics covered in this issue",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Highlight Title",
                required: true
              },
              {
                type: "string",
                name: "description",
                label: "Highlight Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "link",
                label: "Related Link"
              }
            ]
          },
          {
            type: "boolean",
            name: "trackStats",
            label: "Track Statistics",
            description: "Enable statistics tracking for this issue"
          },
          {
            type: "object",
            name: "stats",
            label: "Issue Statistics",
            description: "Engagement metrics for this issue (only fill if Track Statistics is enabled)",
            fields: [
              {
                type: "number",
                name: "subscribers",
                label: "Subscriber Count",
                description: "Number of subscribers when sent"
              },
              {
                type: "number",
                name: "openRate",
                label: "Open Rate (%)",
                description: "Email open rate percentage"
              },
              {
                type: "number",
                name: "clickRate",
                label: "Click Rate (%)",
                description: "Link click rate percentage"
              }
            ]
          },
          // 
          {
            type: "string",
            name: "tags",
            label: "Issue Tags",
            list: true,
            ui: {
              component: "tags"
            }
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title"
              },
              {
                type: "string",
                name: "description",
                label: "SEO Description",
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Newsletter Content",
            isBody: true,
            description: "Main content of the newsletter issue",
            templates: [
              {
                name: "NewsletterSection",
                label: "\u{1F4F0} Newsletter Section",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Section Title",
                    required: true,
                    description: "e.g., 'This Week in Tech', 'Featured Articles'"
                  },
                  {
                    type: "string",
                    name: "icon",
                    label: "Section Icon",
                    description: "Emoji or icon for the section"
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Section Content"
                  }
                ]
              },
              {
                name: "ArticleHighlight",
                label: "\u2B50 Article Highlight",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Article Title",
                    required: true
                  },
                  {
                    type: "string",
                    name: "url",
                    label: "Article URL",
                    required: true,
                    description: "Link to the full article"
                  },
                  {
                    type: "string",
                    name: "excerpt",
                    label: "Article Excerpt",
                    description: "Brief summary for the newsletter",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "string",
                    name: "author",
                    label: "Article Author"
                  },
                  {
                    type: "string",
                    name: "readTime",
                    label: "Reading Time",
                    description: "e.g., '5 min read'"
                  }
                ]
              }
            ]
          }
        ]
      },
      // ALL TOPICS PAGE COLLECTION
      {
        name: "allTopicsPage",
        label: "\u{1F4D1} All Topics Page",
        path: "src/content/allTopics",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          }
        },
        match: {
          include: "index"
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              {
                type: "string",
                name: "badgeText",
                label: "Badge Text",
                required: true
              },
              {
                type: "string",
                name: "title",
                label: "Main Title",
                required: true
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Title Accent Text",
                required: true
              },
              {
                type: "string",
                name: "subtitle",
                label: "Subtitle",
                required: true,
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          {
            type: "object",
            name: "topics",
            label: "Topic Categories",
            list: true,
            fields: [
              {
                type: "string",
                name: "name",
                label: "Topic Name",
                required: true
              },
              {
                type: "string",
                name: "href",
                label: "Link Path",
                required: true,
                description: "e.g., '/blog/categories/build-thinking'"
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                required: true
              },
              {
                type: "string",
                name: "audience",
                label: "Target Audience",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "stats",
            label: "Statistics Section",
            fields: [
              {
                type: "number",
                name: "topicCount",
                label: "Number of Topics"
              },
              {
                type: "string",
                name: "articleCount",
                label: "Article Count Display",
                description: "e.g., '100+' or '150'"
              },
              {
                type: "string",
                name: "storiesLabel",
                label: "Stories Label",
                description: "e.g., 'Real' or 'Authentic'"
              }
            ]
          },
          {
            type: "object",
            name: "cta",
            label: "Call to Action Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "CTA Title",
                required: true
              },
              {
                type: "string",
                name: "description",
                label: "CTA Description",
                required: true
              },
              {
                type: "string",
                name: "primaryButtonText",
                label: "Primary Button Text",
                required: true
              },
              {
                type: "string",
                name: "primaryButtonLink",
                label: "Primary Button Link",
                required: true
              },
              {
                type: "string",
                name: "secondaryButtonText",
                label: "Secondary Button Text",
                required: true
              },
              {
                type: "string",
                name: "secondaryButtonLink",
                label: "Secondary Button Link",
                required: true
              }
            ]
          }
        ]
      },
      // PODCAST COLLECTION
      {
        name: "podcast",
        label: "\u{1F399}\uFE0F Podcast Episodes",
        path: "src/content/podcast",
        format: "md",
        ui: {
          router: ({ document }) => `/podcast/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const episodeNumber = values?.episode;
              if (episodeNumber) {
                return `episode-${episodeNumber}`;
              }
              const title = values?.title;
              if (typeof title === "string") {
                return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
              }
              return "new-episode";
            }
          }
        },
        defaultItem: () => ({
          title: "New Podcast Episode",
          episode: 1,
          pubDate: (/* @__PURE__ */ new Date()).toISOString(),
          status: "draft",
          featured: false,
          duration: "00:00",
          downloadable: false,
          guests: []
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Episode Title",
            isTitle: true,
            required: true
          },
          {
            type: "number",
            name: "episode",
            label: "Episode Number",
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Episode Description",
            required: true,
            ui: {
              component: "textarea"
            }
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publish Date",
            required: true
          },
          {
            type: "string",
            name: "status",
            label: "Episode Status",
            options: [
              { label: "\u{1F4DD} Draft", value: "draft" },
              { label: "\u{1F3AC} Recording", value: "recording" },
              { label: "\u2702\uFE0F Editing", value: "editing" },
              { label: "\u2705 Ready", value: "ready" },
              { label: "\u{1F399}\uFE0F Published", value: "published" }
            ],
            ui: {
              component: "radio-group"
            }
          },
          {
            type: "string",
            name: "duration",
            label: "Episode Duration",
            required: true,
            description: "Duration in MM:SS or HH:MM:SS format"
          },
          {
            type: "string",
            name: "audioUrl",
            label: "Audio File URL",
            description: "Direct link to the audio file"
          },
          {
            type: "boolean",
            name: "downloadable",
            label: "Allow Downloads",
            description: "Show download option for this episode"
          },
          {
            type: "image",
            name: "image",
            label: "Episode Cover Image"
          },
          {
            type: "object",
            name: "guests",
            label: "Episode Guests",
            list: true,
            fields: [
              {
                type: "string",
                name: "name",
                label: "Guest Name",
                required: true
              },
              {
                type: "string",
                name: "role",
                label: "Guest Role/Title"
              },
              {
                type: "string",
                name: "company",
                label: "Company/Organization"
              },
              {
                type: "string",
                name: "bio",
                label: "Guest Bio",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "image",
                name: "photo",
                label: "Guest Photo"
              },
              {
                type: "object",
                name: "social",
                label: "Social Links",
                fields: [
                  {
                    type: "string",
                    name: "twitter",
                    label: "Twitter URL"
                  },
                  {
                    type: "string",
                    name: "linkedin",
                    label: "LinkedIn URL"
                  }
                ]
              }
            ]
          },
          {
            type: "string",
            name: "tags",
            label: "Episode Tags",
            list: true,
            ui: {
              component: "tags"
            }
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Episode"
          },
          {
            type: "string",
            name: "transcript",
            label: "Episode Transcript",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title"
              },
              {
                type: "string",
                name: "description",
                label: "SEO Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL"
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Episode Show Notes",
            isBody: true
          }
        ]
      },
      {
        name: "contact",
        label: "\u{1F4C4} Contact Page",
        path: "src/content/contact",
        format: "mdx",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          }
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page Title",
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Page Description",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publication Date"
          },
          // Hero Section
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Main Title",
                description: "First part of the hero title"
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Accent Title",
                description: "Highlighted part of the title"
              },
              {
                type: "string",
                name: "subtitle",
                label: "Subtitle",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "responseTime",
                label: "Response Time Badge",
                description: "e.g., 'We usually respond within 24 hours'"
              },
              {
                type: "string",
                name: "badgeText",
                label: "Badge Text"
              }
            ]
          },
          // Contact Methods
          {
            type: "object",
            name: "contactMethods",
            label: "Contact Methods",
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.title || "Contact Method"
              })
            },
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "email",
                label: "Email Address",
                required: true
              },
              {
                type: "string",
                name: "icon",
                label: "Icon",
                description: "FontAwesome icon name (without 'fa-')",
                options: [
                  { value: "envelope", label: "Envelope" },
                  { value: "edit", label: "Edit" },
                  { value: "users", label: "Users" },
                  { value: "handshake", label: "Handshake" },
                  { value: "cog", label: "Settings" },
                  { value: "microphone", label: "Microphone" },
                  { value: "briefcase", label: "Briefcase" },
                  { value: "heart", label: "Heart" }
                ]
              },
              {
                type: "string",
                name: "color",
                label: "Color Theme",
                options: [
                  { value: "blue", label: "Blue" },
                  { value: "purple", label: "Purple" },
                  { value: "green", label: "Green" },
                  { value: "orange", label: "Orange" },
                  { value: "red", label: "Red" },
                  { value: "indigo", label: "Indigo" },
                  { value: "pink", label: "Pink" },
                  { value: "yellow", label: "Yellow" }
                ]
              },
              {
                type: "boolean",
                name: "featured",
                label: "Show on Page",
                description: "Display this contact method on the page"
              }
            ]
          },
          // Social Links
          {
            type: "object",
            name: "socialLinks",
            label: "Social Media Links",
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.name || "Social Link"
              })
            },
            fields: [
              {
                type: "string",
                name: "name",
                label: "Platform Name",
                required: true
              },
              {
                type: "string",
                name: "url",
                label: "URL",
                required: true
              },
              {
                type: "string",
                name: "icon",
                label: "Icon Class",
                description: "Full FontAwesome class (e.g., 'fab fa-twitter')"
              },
              {
                type: "string",
                name: "color",
                label: "Color Theme",
                options: [
                  { value: "blue", label: "Blue" },
                  { value: "purple", label: "Purple" },
                  { value: "green", label: "Green" },
                  { value: "orange", label: "Orange" },
                  { value: "red", label: "Red" },
                  { value: "pink", label: "Pink" },
                  { value: "gray", label: "Gray" }
                ]
              },
              {
                type: "boolean",
                name: "showInContact",
                label: "Show on Contact Page",
                description: "Display this social link on the contact page"
              }
            ]
          },
          // FAQ Section
          {
            type: "object",
            name: "faq",
            label: "FAQ Section",
            fields: [
              {
                type: "boolean",
                name: "enabled",
                label: "Enable FAQ Section"
              },
              {
                type: "string",
                name: "title",
                label: "Section Title",
                description: "First part of the FAQ title"
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Title Accent",
                description: "Highlighted part of the title"
              },
              {
                type: "string",
                name: "subtitle",
                label: "Section Subtitle",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                name: "items",
                label: "FAQ Items",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.question || "FAQ Item"
                  })
                },
                fields: [
                  {
                    type: "string",
                    name: "question",
                    label: "Question",
                    required: true
                  },
                  {
                    type: "rich-text",
                    name: "answer",
                    label: "Answer",
                    required: true,
                    templates: [
                      {
                        name: "link",
                        label: "Link",
                        fields: [
                          {
                            name: "url",
                            label: "URL",
                            type: "string"
                          },
                          {
                            name: "text",
                            label: "Link Text",
                            type: "string"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    type: "string",
                    name: "category",
                    label: "Category",
                    options: [
                      { value: "general", label: "General" },
                      { value: "content", label: "Content" },
                      { value: "business", label: "Business" },
                      { value: "technical", label: "Technical" },
                      { value: "community", label: "Community" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "featured",
                    label: "Show on Page",
                    description: "Display this FAQ item"
                  }
                ]
              }
            ]
          },
          // CTA Section
          {
            type: "object",
            name: "cta",
            label: "Call to Action Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "CTA Title"
              },
              {
                type: "string",
                name: "titleAccent",
                label: "Title Accent"
              },
              {
                type: "string",
                name: "subtitle",
                label: "CTA Subtitle",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                name: "primaryButton",
                label: "Primary Button",
                fields: [
                  {
                    type: "string",
                    name: "text",
                    label: "Button Text"
                  },
                  {
                    type: "string",
                    name: "link",
                    label: "Button Link"
                  }
                ]
              },
              {
                type: "object",
                name: "secondaryButton",
                label: "Secondary Button",
                fields: [
                  {
                    type: "string",
                    name: "text",
                    label: "Button Text"
                  },
                  {
                    type: "string",
                    name: "link",
                    label: "Button Link"
                  }
                ]
              }
            ]
          },
          // SEO Section
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title"
              },
              {
                type: "string",
                name: "description",
                label: "SEO Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL"
              },
              {
                type: "boolean",
                name: "noindex",
                label: "No Index",
                description: "Prevent search engines from indexing this page"
              }
            ]
          },
          // Rich text content for the main body
          {
            type: "rich-text",
            name: "body",
            label: "Page Content",
            isBody: true
          }
        ]
      },
      //  legal collection
      {
        name: "legal",
        label: "\u2696\uFE0F Legal Pages",
        path: "src/content/legal",
        format: "mdx",
        ui: {
          router: ({ document }) => `/legal/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const title = values?.title;
              if (typeof title === "string") {
                return String(title).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
              }
              return "new-legal-page";
            }
          }
        },
        defaultItem: () => ({
          title: "New Legal Document",
          description: "Legal document description",
          pubDate: (/* @__PURE__ */ new Date()).toISOString(),
          pageType: "legal",
          effectiveDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Document Title",
            isTitle: true,
            required: true,
            description: "e.g., 'Terms of Service', 'Privacy Policy'"
          },
          {
            type: "string",
            name: "description",
            label: "Document Description",
            required: true,
            description: "Brief description for SEO and navigation",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Created Date",
            required: true
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
            description: "When this document was last updated"
          },
          {
            type: "string",
            name: "effectiveDate",
            label: "Effective Date",
            description: "When these terms/policies take effect (YYYY-MM-DD format)"
          },
          {
            type: "string",
            name: "pageType",
            label: "Document Type",
            options: [
              { label: "Legal Document", value: "legal" },
              { label: "Privacy Policy", value: "privacy" },
              { label: "Terms of Service", value: "terms" },
              { label: "Cookie Policy", value: "cookies" },
              { label: "Disclaimer", value: "disclaimer" },
              { label: "GDPR Compliance", value: "gdpr" },
              { label: "Data Processing", value: "data" }
            ],
            description: "Type of legal document",
            ui: {
              component: "select"
            }
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
                label: "Legal Contact Email"
              },
              {
                type: "string",
                name: "address",
                label: "Business Address",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "phone",
                label: "Contact Phone"
              }
            ]
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title"
              },
              {
                type: "string",
                name: "description",
                label: "SEO Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "boolean",
                name: "noindex",
                label: "No Index",
                description: "Prevent search engines from indexing this page"
              }
            ]
          },
          // CORRECTED: Proper TinaCMS rich-text configuration
          {
            type: "rich-text",
            name: "body",
            label: "Legal Content",
            isBody: true,
            description: "Legal document content with full formatting support",
            templates: [
              {
                name: "section",
                label: "Content Section",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Section Title"
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Section Content"
                  }
                ]
              },
              {
                name: "contactInfo",
                label: "Contact Information Block",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Contact Title"
                  },
                  {
                    type: "string",
                    name: "email",
                    label: "Email"
                  },
                  {
                    type: "string",
                    name: "address",
                    label: "Address"
                  }
                ]
              }
            ]
          }
        ]
      },
      // PAGES COLLECTION (from your original)
      {
        name: "pages",
        label: "\u{1F4C4} Static Pages",
        path: "src/content/pages",
        format: "mdx",
        ui: {
          router: ({ document }) => `/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const title = values?.title;
              if (typeof title === "string") {
                return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
              }
              return "new-page";
            }
          }
        },
        defaultItem: () => ({
          title: "New Page",
          description: "Page description for SEO and navigation",
          pubDate: (/* @__PURE__ */ new Date()).toISOString(),
          layout: "default"
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page Title",
            isTitle: true,
            required: true,
            description: "Main title displayed on the page"
          },
          {
            type: "string",
            name: "description",
            label: "Page Description",
            required: true,
            description: "Brief description for SEO and navigation",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Created Date",
            required: true
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Last Updated",
            description: "When this page was last updated"
          },
          {
            type: "string",
            name: "layout",
            label: "Page Layout",
            options: [
              { label: "Default", value: "default" },
              { label: "Full Width", value: "full-width" },
              { label: "Minimal", value: "minimal" },
              { label: "Landing Page", value: "landing" },
              { label: "Contact", value: "contact" },
              { label: "Community", value: "community" }
            ],
            description: "Choose the layout template for this page",
            ui: {
              component: "select"
            }
          },
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Hero Title"
              },
              {
                type: "string",
                name: "subtitle",
                label: "Hero Subtitle",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "image",
                name: "image",
                label: "Hero Image"
              }
            ]
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            description: "Search engine optimization options",
            fields: [
              {
                type: "string",
                name: "title",
                label: "SEO Title",
                description: "Custom title for search engines"
              },
              {
                type: "string",
                name: "description",
                label: "Meta Description",
                description: "Custom description for search engines",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "canonical",
                label: "Canonical URL"
              },
              {
                type: "boolean",
                name: "noindex",
                label: "Hide from Search Engines",
                description: "Prevent search engines from indexing this page"
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Page Content",
            isBody: true,
            description: "Main content of the page"
          }
        ]
      },
      // CATEGORIES COLLECTION (Enhanced with all predefined categories)
      {
        name: "categories",
        label: "\u{1F3F7}\uFE0F Categories",
        path: "src/content/categories",
        format: "md",
        ui: {
          router: ({ document }) => `/blog/category/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const name = values?.name;
              if (typeof name === "string") {
                return name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
              }
              return "new-category";
            }
          }
        },
        defaultItem: () => ({
          name: "New Category",
          description: "Category description",
          color: "blue",
          icon: "tag",
          featured: false,
          slug: "",
          theme: "core"
        }),
        fields: [
          {
            type: "string",
            name: "name",
            label: "Category Name",
            isTitle: true,
            required: true,
            description: "Display name (e.g., 'Build Thinking')"
          },
          {
            type: "string",
            name: "slug",
            label: "Category Slug",
            required: true,
            description: "URL-friendly version (e.g., 'build-thinking')",
            ui: {
              validate: (value) => {
                if (!value) return "Slug is required";
                if (!/^[a-z0-9-]+$/.test(value)) {
                  return "Slug should only contain lowercase letters, numbers, and hyphens";
                }
              }
            }
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true,
            description: "Brief description of what this category covers",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "string",
            name: "theme",
            label: "Category Theme",
            required: true,
            options: [
              { label: "Core Themes", value: "core" },
              { label: "Specialized Themes", value: "specialized" },
              { label: "Extended Themes", value: "extended" }
            ],
            description: "Which theme group this category belongs to"
          },
          {
            type: "string",
            name: "icon",
            label: "Icon",
            description: "FontAwesome icon name",
            required: true,
            options: [
              // Core Theme Icons
              { label: "Hammer (Build)", value: "hammer" },
              { label: "Book (Learning)", value: "book" },
              { label: "Repeat (Iterate)", value: "repeat" },
              { label: "Lightbulb (Ideas)", value: "lightbulb" },
              { label: "Rocket (Startup)", value: "rocket" },
              { label: "Target (Strategy)", value: "target" },
              // Specialized Theme Icons
              { label: "Brain (AI)", value: "brain" },
              { label: "Tools (Developer)", value: "tools" },
              { label: "Chart Line (Research)", value: "chart-line" },
              { label: "Cog (System)", value: "cog" },
              { label: "Monitor (Interface)", value: "monitor" },
              { label: "Users (Culture)", value: "users" },
              { label: "Globe (Global)", value: "globe" },
              { label: "Users Group (Community)", value: "users" },
              // Extended Theme Icons
              { label: "Briefcase (Career)", value: "briefcase" },
              { label: "Zap (Future)", value: "zap" },
              { label: "Dollar Sign (Business)", value: "dollar-sign" },
              { label: "Star (Creator)", value: "star" },
              { label: "Eye (Consumer)", value: "eye" },
              { label: "Map (Ecosystem)", value: "map" },
              // General Icons
              { label: "Tag (General)", value: "tag" },
              { label: "Code (Programming)", value: "code" },
              { label: "Database (Data)", value: "database" },
              { label: "Shield (Security)", value: "shield-alt" },
              { label: "Mobile (Mobile Dev)", value: "mobile-alt" },
              { label: "Cloud (Cloud Tech)", value: "cloud" }
            ]
          },
          {
            type: "string",
            name: "color",
            label: "Color Theme",
            required: true,
            options: [
              { label: "Blue", value: "blue" },
              { label: "Green", value: "green" },
              { label: "Orange", value: "orange" },
              { label: "Purple", value: "purple" },
              { label: "Red", value: "red" },
              { label: "Indigo", value: "indigo" },
              { label: "Violet", value: "violet" },
              { label: "Emerald", value: "emerald" },
              { label: "Cyan", value: "cyan" },
              { label: "Slate", value: "slate" },
              { label: "Pink", value: "pink" },
              { label: "Teal", value: "teal" },
              { label: "Amber", value: "amber" },
              { label: "Yellow", value: "yellow" },
              { label: "Gray", value: "gray" }
            ]
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Category",
            description: "Show this category prominently on the homepage"
          },
          {
            type: "number",
            name: "sortOrder",
            label: "Sort Order",
            description: "Order for displaying categories (lower numbers first)"
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
                description: "Custom title for search engines"
              },
              {
                type: "string",
                name: "description",
                label: "SEO Description",
                description: "Custom description for search engines",
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Category Content",
            isBody: true,
            description: "Detailed description and content for the category page"
          }
        ]
      },
      // AUTHORS COLLECTION (from your original)
      {
        name: "authors",
        label: "\u{1F465} Authors",
        path: "src/content/authors",
        format: "md",
        ui: {
          router: ({ document }) => `/authors/${document._sys.filename}`,
          filename: {
            readonly: false,
            slugify: (values) => {
              const name = values?.name;
              if (typeof name === "string") {
                return name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
              }
              return "new-author";
            }
          }
        },
        fields: [
          {
            type: "string",
            name: "name",
            label: "Full Name",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "bio",
            label: "Biography",
            required: false,
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "avatar",
            label: "Profile Picture",
            required: false
          },
          {
            type: "string",
            name: "role",
            label: "Role/Title",
            required: false
          },
          {
            type: "string",
            name: "company",
            label: "Company",
            required: false,
            description: "Optional company affiliation"
          },
          {
            type: "string",
            name: "email",
            label: "Email Address",
            required: false,
            description: "Optional contact email"
          },
          {
            type: "object",
            name: "social",
            label: "Social Media",
            required: false,
            fields: [
              {
                type: "string",
                name: "twitter",
                label: "Twitter Handle",
                required: false,
                description: "Without @ symbol"
              },
              {
                type: "string",
                name: "linkedin",
                label: "LinkedIn Profile",
                required: false,
                description: "Full LinkedIn URL"
              },
              {
                type: "string",
                name: "github",
                label: "GitHub Username",
                required: false
              },
              {
                type: "string",
                name: "website",
                label: "Personal Website",
                required: false,
                description: "Full URL including https://"
              }
            ]
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Author",
            description: "Show on authors page prominently"
          },
          {
            type: "rich-text",
            name: "body",
            label: "Extended Bio",
            isBody: true,
            required: false,
            description: "Detailed author information for author page"
          }
        ]
      },
      // SETTINGS COLLECTION (Enhanced from your original)
      {
        name: "settings",
        label: "\u2699\uFE0F Site Settings",
        path: "src/content/settings",
        format: "md",
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false
          },
          filename: {
            readonly: true,
            slugify: () => "global-settings"
          }
        },
        match: {
          include: "global-settings"
        },
        defaultItem: () => ({
          title: "TinkByte Global Settings",
          description: "Global configuration for TinkByte website",
          site: {
            name: "TinkByte",
            description: "Building meaningful, data-driven products that solve real problems",
            url: "https://tinkbyte.com"
          },
          uiText: {
            audioAvailableLabel: "\u{1F3A7} Audio Available",
            audioTitle: "Listen to this article",
            byAuthorPrefix: "By",
            shareLabel: "Share",
            tocTitle: "Table of Contents",
            discussionTitle: "Join the Discussion",
            relatedTitle: "Related Articles"
          },
          community: {
            stats: [],
            platforms: []
          },
          research: {
            stats: [],
            reports: []
          },
          newsletter: {
            title: "TinkStacks Weekly",
            subtitle: "Weekly insights on AI, tech, and innovation",
            frequency: "weekly",
            subscriberCount: "1,200+"
          },
          social: {
            platforms: [],
            defaultShareText: "Check out this article from TinkByte"
          },
          analytics: {
            enableCookieConsent: false
          },
          performance: {
            enableImageOptimization: true,
            enableLazyLoading: true,
            enableServiceWorker: false,
            cacheMaxAge: 24
          }
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Settings Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            ui: {
              component: "textarea"
            }
          },
          // Site Configuration
          {
            type: "object",
            name: "site",
            label: "\u{1F310} Site Configuration",
            fields: [
              {
                type: "string",
                name: "name",
                label: "Site Name",
                required: true
              },
              {
                type: "string",
                name: "description",
                label: "Site Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                name: "url",
                label: "Site URL",
                description: "Full URL including https://"
              },
              {
                type: "string",
                name: "logo",
                label: "Logo URL",
                description: "Path to site logo"
              },
              // Include the original giscus configuration
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
                    description: "GitHub repository in format: username/repo-name"
                  },
                  {
                    type: "string",
                    name: "repoId",
                    label: "Repository ID",
                    description: "GitHub repository ID"
                  },
                  {
                    type: "string",
                    name: "category",
                    label: "Discussion Category",
                    description: "GitHub Discussions category name"
                  },
                  {
                    type: "string",
                    name: "categoryId",
                    label: "Category ID",
                    description: "GitHub Discussions category ID"
                  },
                  {
                    type: "string",
                    name: "mapping",
                    label: "Page-Discussion Mapping",
                    options: [
                      { label: "Pathname", value: "pathname" },
                      { label: "URL", value: "url" },
                      { label: "Title", value: "title" },
                      { label: "OG Title", value: "og:title" }
                    ]
                  },
                  {
                    type: "boolean",
                    name: "reactionsEnabled",
                    label: "Enable Reactions"
                  },
                  {
                    type: "boolean",
                    name: "emitMetadata",
                    label: "Emit Metadata"
                  },
                  {
                    type: "string",
                    name: "inputPosition",
                    label: "Input Position",
                    options: [
                      { label: "Top", value: "top" },
                      { label: "Bottom", value: "bottom" }
                    ]
                  },
                  {
                    type: "string",
                    name: "lang",
                    label: "Language",
                    description: "Interface language (e.g., 'en', 'es', 'fr')"
                  },
                  {
                    type: "string",
                    name: "loading",
                    label: "Loading Strategy",
                    options: [
                      { label: "Lazy", value: "lazy" },
                      { label: "Eager", value: "eager" }
                    ]
                  }
                ]
              }
            ]
          },
          // Category Settings (from original)
          {
            type: "object",
            name: "categories",
            label: "Category Configuration",
            fields: [
              {
                type: "string",
                name: "defaultColor",
                label: "Default Category Color",
                description: "Fallback color for categories without specific colors"
              },
              {
                type: "object",
                name: "categoryMappings",
                label: "Category Color Mappings",
                list: true,
                ui: {
                  defaultItem: () => ({
                    // Core Themes
                    categories: [
                      { slug: "build-thinking", name: "Build Thinking", description: "Mental models, product intuition, systems mindset", icon: "hammer", color: "blue", theme: "core" },
                      { slug: "learning-by-doing", name: "Learning by Doing", description: "Practical experiments, hands-on growth", icon: "book", color: "green", theme: "core" },
                      { slug: "fail-iterate-ship", name: "Fail / Iterate / Ship", description: "Process-focused iteration and reflection", icon: "repeat", color: "orange", theme: "core" },
                      { slug: "product-lessons", name: "Product Lessons", description: "Real build stories, what worked/didn't", icon: "lightbulb", color: "purple", theme: "core" },
                      { slug: "startup-insight", name: "Startup Insight", description: "Early-stage execution, traction, team dynamics", icon: "rocket", color: "red", theme: "core" },
                      { slug: "product-strategy", name: "Product Strategy", description: "Positioning, roadmap thinking, growth decisions", icon: "target", color: "indigo", theme: "core" },
                      // Specialized Themes
                      { slug: "ai-evolution", name: "AI Evolution", description: "Practical AI implementation, ethical considerations", icon: "brain", color: "violet", theme: "specialized" },
                      { slug: "developer-stack-tools", name: "Developer Stack & Tools", description: "Tooling, platforms, workflows, engineering stacks", icon: "tools", color: "emerald", theme: "specialized" },
                      { slug: "research-bites", name: "Research Bites", description: "Insights from data, behavior, experiments + pattern spotting", icon: "chart-line", color: "cyan", theme: "specialized" },
                      { slug: "system-thinking", name: "System Thinking", description: "Logic frameworks, mental models, automation design", icon: "cog", color: "slate", theme: "specialized" },
                      { slug: "the-interface", name: "The Interface", description: "UX/UI patterns, friction reduction", icon: "monitor", color: "pink", theme: "specialized" },
                      { slug: "tech-culture", name: "Tech Culture", description: "Social impact, ethics, workplace culture + team dynamics", icon: "users", color: "teal", theme: "specialized" },
                      { slug: "global-perspective", name: "Global Perspective", description: "Emerging regions, cross-border innovation", icon: "globe", color: "amber", theme: "specialized" },
                      { slug: "community-innovation", name: "Community Innovation", description: "Network effects, community-led growth", icon: "users", color: "violet", theme: "specialized" },
                      // Extended Themes
                      { slug: "career-stacks", name: "Career Stacks", description: "Roles, skills, transitions, growth strategies", icon: "briefcase", color: "indigo", theme: "extended" },
                      { slug: "future-stacks", name: "Future Stacks", description: "Emerging tech: AI, AR/VR, Quantum, Web3, Robotics, IoT", icon: "zap", color: "purple", theme: "extended" },
                      { slug: "business-models-monetization", name: "Business Models & Monetization", description: "Revenue strategies, pricing, monetization", icon: "dollar-sign", color: "green", theme: "extended" },
                      { slug: "creator-economy", name: "Creator Economy", description: "Tools, trends, case studies", icon: "star", color: "yellow", theme: "extended" },
                      { slug: "consumer-behavior-attention", name: "Consumer Behavior & Attention", description: "Audience shifts, demand patterns, psychology", icon: "eye", color: "red", theme: "extended" },
                      { slug: "ecosystem-shifts-market-maps", name: "Ecosystem Shifts & Market Maps", description: "Competitive changes, sector movements, market signals", icon: "map", color: "blue", theme: "extended" },
                      { slug: "people-systems", name: "People Systems", description: "Team building, communication frameworks, organizational design", icon: "users", color: "orange", theme: "extended" }
                    ]
                  })
                },
                fields: [
                  {
                    type: "string",
                    name: "name",
                    label: "Category Name",
                    description: "Must match category values in blog posts"
                  },
                  {
                    type: "string",
                    name: "slug",
                    label: "Category Slug",
                    description: "URL-friendly version (auto-generated from name)"
                  },
                  {
                    type: "string",
                    name: "color",
                    label: "Category Color",
                    description: "Theme color for this category"
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Category Description",
                    description: "Brief description of this category",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "string",
                    name: "icon",
                    label: "Category Icon",
                    description: "FontAwesome icon name"
                  },
                  {
                    type: "string",
                    name: "theme",
                    label: "Category Theme",
                    options: [
                      { label: "Core", value: "core" },
                      { label: "Specialized", value: "specialized" },
                      { label: "Extended", value: "extended" }
                    ]
                  }
                ]
              }
            ]
          },
          // UI Text Configuration (from original)
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
                description: "Text shown when audio is available"
              },
              {
                type: "string",
                name: "audioTitle",
                label: "Audio Section Title",
                description: "Title for the audio player section"
              },
              {
                type: "string",
                name: "audioSubtitle",
                label: "Audio Section Subtitle",
                description: "Subtitle for the audio player section"
              },
              {
                type: "string",
                name: "noAudioText",
                label: "No Audio Text",
                description: "Text shown when no audio is available"
              },
              {
                type: "string",
                name: "byAuthorPrefix",
                label: "Author Prefix",
                description: "Text before author name (e.g., 'By')"
              },
              {
                type: "string",
                name: "aboutAuthorTitle",
                label: "About Author Section Title",
                description: "Title for the author bio section"
              },
              {
                type: "string",
                name: "shareLabel",
                label: "Share Label",
                description: "Text for share functionality"
              },
              {
                type: "string",
                name: "shareArticleTitle",
                label: "Share Article Section Title",
                description: "Title for the share section in sidebar"
              },
              {
                type: "string",
                name: "continueReadingTitle",
                label: "Continue Reading Title",
                description: "Title for the navigation section"
              },
              {
                type: "string",
                name: "continueReadingSubtitle",
                label: "Continue Reading Subtitle",
                description: "Subtitle for the navigation section"
              },
              {
                type: "string",
                name: "previousArticleLabel",
                label: "Previous Article Label",
                description: "Text for previous article link"
              },
              {
                type: "string",
                name: "nextArticleLabel",
                label: "Next Article Label",
                description: "Text for next article link"
              },
              {
                type: "string",
                name: "reachedBeginningText",
                label: "Reached Beginning Text",
                description: "Text when there's no previous article"
              },
              {
                type: "string",
                name: "readAllText",
                label: "Read All Text",
                description: "Text when there's no next article"
              },
              {
                type: "string",
                name: "browseAllArticlesText",
                label: "Browse All Articles Text",
                description: "Text for browse all articles link"
              },
              {
                type: "string",
                name: "tocTitle",
                label: "Table of Contents Title",
                description: "Title for the table of contents section"
              },
              {
                type: "string",
                name: "topicsTitle",
                label: "Topics Section Title",
                description: "Title for the tags/topics section"
              },
              {
                type: "string",
                name: "readingProgressTitle",
                label: "Reading Progress Title",
                description: "Title for the reading progress section"
              },
              {
                type: "string",
                name: "imageCreditText",
                label: "Image Credit Text",
                description: "Default image credit text"
              },
              {
                type: "string",
                name: "readingTimePrefix",
                label: "Reading Time Prefix",
                description: "Text before reading time (e.g., 'Reading time:')"
              },
              {
                type: "string",
                name: "defaultCategoryLabel",
                label: "Default Category Label",
                description: "Fallback category label when none is specified"
              },
              {
                type: "string",
                name: "discussionTitle",
                label: "Discussion Section Title",
                description: "Title for the comments/discussion section"
              },
              {
                type: "string",
                name: "discussionSubtitle",
                label: "Discussion Section Subtitle",
                description: "Subtitle for the comments/discussion section"
              },
              {
                type: "string",
                name: "relatedTitle",
                label: "Related Content Title",
                description: "Title for the related posts section"
              },
              {
                type: "string",
                name: "relatedSubtitle",
                label: "Related Content Subtitle",
                description: "Subtitle for the related posts section"
              }
            ]
          },
          // Community Settings (from original)
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
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "number",
                    label: "Statistic Number",
                    description: "e.g., '1,200+', '50K'"
                  },
                  {
                    type: "string",
                    name: "label",
                    label: "Statistic Label",
                    description: "e.g., 'Active Members', 'Monthly Readers'"
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
                      { label: "Share", value: "share" }
                    ]
                  }
                ]
              },
              {
                type: "object",
                name: "platforms",
                label: "Community Platforms",
                list: true,
                ui: {
                  itemProps: (item) => {
                    return { label: item?.name || "New Platform" };
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "name",
                    label: "Platform Name",
                    description: "e.g., 'Discord', 'GitHub', 'Twitter'"
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Platform Description",
                    description: "Brief description of what happens on this platform",
                    ui: {
                      component: "textarea"
                    }
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
                      { label: "Slack", value: "slack" }
                    ]
                  },
                  {
                    type: "string",
                    name: "link",
                    label: "Platform URL",
                    description: "Full URL to the platform"
                  },
                  {
                    type: "string",
                    name: "members",
                    label: "Member Count",
                    description: "e.g., '1.2K members', '500+ contributors'"
                  },
                  {
                    type: "string",
                    name: "activity",
                    label: "Activity Level",
                    description: "e.g., 'Very Active', 'Daily Updates'"
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
                      { label: "Yellow", value: "yellow" }
                    ]
                  }
                ]
              }
            ]
          },
          // Research Settings (from original)
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
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "number",
                    label: "Statistic Number",
                    description: "e.g., '25+', '100K+'"
                  },
                  {
                    type: "string",
                    name: "label",
                    label: "Statistic Label",
                    description: "e.g., 'Research Reports', 'Data Points'"
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
                      { label: "Lightbulb", value: "lightbulb" }
                    ]
                  }
                ]
              },
              {
                type: "object",
                name: "reports",
                label: "Featured Research Reports",
                list: true,
                ui: {
                  itemProps: (item) => {
                    return { label: item?.title || "New Report" };
                  }
                },
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Report Title",
                    description: "Full title of the research report"
                  },
                  {
                    type: "string",
                    name: "description",
                    label: "Report Description",
                    description: "Brief summary of the report content",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "datetime",
                    name: "date",
                    label: "Publication Date",
                    description: "When the report was published"
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
                      { label: "Case Study", value: "case-study" }
                    ]
                  },
                  {
                    type: "number",
                    name: "pages",
                    label: "Page Count",
                    description: "Number of pages in the report"
                  },
                  {
                    type: "string",
                    name: "downloads",
                    label: "Download Count",
                    description: "e.g., '2.5K downloads', '500+ reads'"
                  },
                  {
                    type: "string",
                    name: "downloadUrl",
                    label: "Download URL",
                    description: "Link to download or view the report"
                  },
                  {
                    type: "image",
                    name: "coverImage",
                    label: "Report Cover Image",
                    description: "Cover image for the report"
                  },
                  {
                    type: "boolean",
                    name: "featured",
                    label: "Featured Report",
                    description: "Show this report prominently"
                  },
                  {
                    type: "string",
                    name: "tags",
                    label: "Report Tags",
                    list: true,
                    description: "Tags for categorizing the report"
                  }
                ]
              }
            ]
          },
          // Newsletter Settings (from original)
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
                description: "Main title for newsletter sections"
              },
              {
                type: "string",
                name: "subtitle",
                label: "Newsletter Subtitle",
                description: "Subtitle or description for newsletter",
                ui: {
                  component: "textarea"
                }
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
                  { label: "Irregular", value: "irregular" }
                ]
              },
              {
                type: "string",
                name: "subscriberCount",
                label: "Subscriber Count",
                description: "e.g., '1,200+', '5K+'"
              },
              {
                type: "string",
                name: "signupFormId",
                label: "Signup Form ID",
                description: "ID for your email service provider form"
              },
              {
                type: "string",
                name: "confirmationMessage",
                label: "Confirmation Message",
                description: "Message shown after successful signup",
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          // Social Media Settings (from original)
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
                      { label: "Discord", value: "discord" }
                    ]
                  },
                  {
                    type: "string",
                    name: "url",
                    label: "Profile URL",
                    description: "Full URL to your profile on this platform"
                  },
                  {
                    type: "string",
                    name: "username",
                    label: "Username/Handle",
                    description: "Your username on this platform (without @)"
                  },
                  {
                    type: "boolean",
                    name: "showInFooter",
                    label: "Show in Footer",
                    description: "Display this platform in the site footer"
                  },
                  {
                    type: "boolean",
                    name: "enableSharing",
                    label: "Enable Sharing",
                    description: "Include this platform in share buttons"
                  }
                ]
              },
              {
                type: "string",
                name: "defaultShareText",
                label: "Default Share Text",
                description: "Default text for social media shares",
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          // Analytics and Tracking (from original)
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
                description: "GA4 Measurement ID (e.g., G-XXXXXXXXXX)"
              },
              {
                type: "string",
                name: "googleTagManagerId",
                label: "Google Tag Manager ID",
                description: "GTM Container ID (e.g., GTM-XXXXXXX)"
              },
              {
                type: "boolean",
                name: "enableCookieConsent",
                label: "Enable Cookie Consent",
                description: "Show cookie consent banner"
              },
              {
                type: "string",
                name: "cookieConsentMessage",
                label: "Cookie Consent Message",
                description: "Message shown in cookie consent banner",
                ui: {
                  component: "textarea"
                }
              }
            ]
          },
          // Performance and Technical Settings (from original)
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
                description: "Automatically optimize images"
              },
              {
                type: "boolean",
                name: "enableLazyLoading",
                label: "Enable Lazy Loading",
                description: "Lazy load images and components"
              },
              {
                type: "boolean",
                name: "enableServiceWorker",
                label: "Enable Service Worker",
                description: "Enable offline functionality"
              },
              {
                type: "number",
                name: "cacheMaxAge",
                label: "Cache Max Age (hours)",
                description: "How long to cache static assets"
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
