// src/lib/admin-api.ts
import { supabase, AuthState } from './supabase';
import { ClientAdminAuth } from './admin/auth';
import { config } from './config';


// ==========================================
// **ENHANCED TYPE DEFINITIONS** 
// ==========================================

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GrowthDataPoint {
  date: string;
  users: number;
  comments: number;
  subscribers: number;
  articles: number;
  article_likes?: number;
  article_saves?: number;
  comment_likes?: number;
}
interface DashboardStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    admins: number;
    newLast30Days: number;
    newLast7Days: number;
  };
  comments: {
    total: number;
    pending: number;
    flagged: number;
    approved: number;
    last30Days: number;
  };
  content: {
    totalArticles: number;
    publishedArticles: number;
    totalCategories: number;
    totalAuthors: number;
    totalPodcasts: number;
  };
  newsletter: {
    totalNewsletters: number;
    totalSubscribers: number;
    activeSubscribers: number;
  };
  engagement: {
    totalArticleLikes: number;
    totalArticleSaves: number;
    totalCommentReactions: number;
    avgEngagementPerArticle: number;
  };
  recentActivity: {
    recentComments: Array<any>;
    recentUsers: Array<any>;
    recentArticles: Array<any>;
    recentSubscriptions: Array<any>;
    topContent: Array<any>;
    topEngagedUsers: Array<any>; 
  };
  generatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: any; // JSON content
  template_type: 'newsletter' | 'welcome' | 'promotional';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailCampaign {
  id: string;
  newsletter_id?: string;
  template_id?: string;
  subject: string;
  content: any;
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

interface AnalyticsData {
  period: string;
  growth: GrowthDataPoint[]; // Fixed: Properly typed array
  topUsers: any[];
  topArticles: any[];
  topCategories: any[];
  generatedAt: string;
}

interface UserWithEngagement {
  id: string;
  display_name?: string;
  email?: string;
  bio?: string;
  avatar_type?: string;
  avatar_preset_id?: number;
  avatar_url?: string;
  reputation_score?: number;
  is_admin?: boolean;
  is_blocked?: boolean;
  membership_type?: string;
  total_comments?: number;
  total_reads?: number;
  followers_count?: number;
  following_count?: number;
  created_at: string;
  engagement?: {
    articleLikes: number;
    articleSaves: number;
    articleFollows: number;
    authorFollows: number;
    categoryFollows: number;
    newsletterSubscriptions: number;
    totalComments: number;
    commentLikes: number;
    commentBookmarks: number;
  };
}

// ==========================================
// **COMPLETE SINGLETON ADMIN API MANAGER**
// ==========================================

class AdminAPIManager {
  private static instance: AdminAPIManager;
  private isInitialized: boolean = false;
  private authState: AuthState | null = null;
  private currentSession: any = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AdminAPIManager {
    if (!AdminAPIManager.instance) {
      AdminAPIManager.instance = new AdminAPIManager();
    }
    return AdminAPIManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      
      
      // Initialize auth state
      this.authState = AuthState.getInstance();
      await this.authState.initialize();
      
      // Verify admin session
      await this.verifyAdminSession();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Admin API Manager initialization failed:', error);
      throw error;
    }
  }

  private async verifyAdminSession(): Promise<void> {
    const adminUser = await ClientAdminAuth.getCurrentUser();
    if (!adminUser) {
      throw new Error('No valid admin session found');
    }
    this.currentSession = adminUser;
  }

  async requireAdmin(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.currentSession) {
      await this.verifyAdminSession();
    }
    
    return this.currentSession;
  }

  // ==========================================
  // **DASHBOARD & ANALYTICS METHODS**
  // ==========================================

  async getDashboardStats(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getDashboardStats();
  }

  async getAnalyticsData(period?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getAnalyticsData(period);
  }

  async testConnection(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.testConnection();
  }

  // ==========================================
  // **USER MANAGEMENT METHODS**
  // ==========================================

  async getUsers(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getUsers(options);
  }

  async getUserDetails(userId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getUserDetails(userId);
  }

  async updateUser(userId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateUser(userId, updateData);
  }

  async performUserAction(userId: string, action: string, reason?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.performUserAction(userId, action, reason);
  }

  async bulkUserAction(userIds: string[], action: string, reason?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.bulkUserAction(userIds, action, reason);
  }

  async exportUsers(format: 'csv' | 'json' = 'csv'): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.exportUsers(format);
  }

  // ==========================================
  // **COMMENT MANAGEMENT METHODS**
  // ==========================================

  async getComments(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getComments(options);
  }

  async getPendingComments(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getPendingComments(options);
  }

  async moderateComment(commentId: string, action: string, reason?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.moderateComment(commentId, action, reason);
  }

  async bulkModerateComments(commentIds: string[], action: string, reason?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.bulkModerateComments(commentIds, action, reason);
  }

  // ==========================================
  // **ARTICLES MANAGEMENT METHODS**
  // ==========================================

  async getArticles(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getArticles(options);
  }

  async getArticle(articleId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getArticle(articleId);
  }

  async createArticle(articleData: any): Promise<any> {
    // No longer require admin - allow any authenticated user
    // Just verify user is authenticated (handled in AdminAPI.createArticle)
    return AdminAPI.createArticle(articleData);
  }

  async updateArticle(articleId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateArticle(articleId, updateData);
  }

  async updateArticleStatus(articleId: string, status: 'publish' | 'unpublish' | 'feature' | 'unfeature'): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateArticleStatus(articleId, status);
  }

  async deleteArticle(articleId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.deleteArticle(articleId);
  }

  async getArticleEngagementStats(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getArticleEngagementStats();
  }

  async getArticleEngagementDetails(articleSlug: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getArticleEngagementDetails(articleSlug);
  }

  async updateArticleStats(articleSlug: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateArticleStats(articleSlug);
  }

  // ==========================================
  // **AUTHORS MANAGEMENT METHODS**
  // ==========================================

  async getAuthors(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getAuthors(options);
  }

  async getAuthor(authorId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getAuthor(authorId);
  }

  async createAuthor(authorData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.createAuthor(authorData);
  }

  async updateAuthor(authorId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateAuthor(authorId, updateData);
  }

  async deleteAuthor(authorId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.deleteAuthor(authorId);
  }

  // ==========================================
  // **CATEGORIES MANAGEMENT METHODS**
  // ==========================================

  async getCategories(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getCategories();
  }

  async getCategory(categoryId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getCategory(categoryId);
  }

  async createCategory(categoryData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.createCategory(categoryData);
  }

  async updateCategory(categoryId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateCategory(categoryId, updateData);
  }

  async deleteCategory(categoryId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.deleteCategory(categoryId);
  }

  // ==========================================
  // **PODCASTS MANAGEMENT METHODS**
  // ==========================================

  async getPodcasts(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getPodcasts(options);
  }

  async getPodcast(podcastId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getPodcast(podcastId);
  }

  async createPodcast(podcastData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.createPodcast(podcastData);
  }

  async updatePodcast(podcastId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updatePodcast(podcastId, updateData);
  }

  async deletePodcast(podcastId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.deletePodcast(podcastId);
  }

  // ==========================================
  // **NEWSLETTER MANAGEMENT METHODS**
  // ==========================================

  async getNewsletters(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getNewsletters();
  }

  async getNewsletterSubscribers(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getNewsletterSubscribers(options);
  }

  async createNewsletter(newsletterData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.createNewsletter(newsletterData);
  }

  async updateNewsletter(newsletterId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateNewsletter(newsletterId, updateData);
  }

  async updateNewsletterSubscription(subscriptionId: string, updateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateNewsletterSubscription(subscriptionId, updateData);
  }

  async getNewsletterSegments(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getNewsletterSegments();
  }

  // ==========================================
  // **EMAIL TEMPLATE MANAGEMENT METHODS**
  // ==========================================

  async getEmailTemplates(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getEmailTemplates();
  }

  async createEmailTemplate(templateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.createEmailTemplate(templateData);
  }

  async updateEmailTemplate(id: string, templateData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateEmailTemplate(id, templateData);
  }

  async deleteEmailTemplate(id: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.deleteEmailTemplate(id);
  }

  async getEmailAnalytics(campaignId?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getEmailAnalytics(campaignId);
  }

  async sendTestEmail(emailData: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.sendTestEmail(emailData);
  }

  async scheduleNewsletter(newsletterId: string, templateId: string, scheduledAt: string, subscribers: string[]): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.scheduleNewsletter(newsletterId, templateId, scheduledAt, subscribers);
  }

  async sendNewsletter(newsletterId: string, templateId: string, subscribers: string[]): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.sendNewsletter(newsletterId, templateId, subscribers);
  }

  // ==========================================
  // **FEEDBACK MANAGEMENT METHODS**
  // ==========================================

  async getFeedback(options: any = {}): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getFeedback(options);
  }

  async getFeedbackStats(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getFeedbackStats();
  }

  async getFeedbackDetails(feedbackId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getFeedbackDetails(feedbackId);
  }

  async updateFeedbackStatus(feedbackId: string, status: 'pending' | 'resolved' | 'dismissed', adminNotes?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.updateFeedbackStatus(feedbackId, status, adminNotes);
  }

  async bulkUpdateFeedback(feedbackIds: string[], status: 'pending' | 'resolved' | 'dismissed', adminNotes?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.bulkUpdateFeedback(feedbackIds, status, adminNotes);
  }

  async deleteFeedback(feedbackId: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.deleteFeedback(feedbackId);
  }

  async exportFeedback(format: 'csv' | 'json' = 'csv', filters?: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.exportFeedback(format, filters);
  }

  async submitFeedback(feedbackData: any): Promise<any> {
    // Note: This might not require admin auth, but keeping it here for consistency
    return AdminAPI.submitFeedback(feedbackData);
  }

  // ==========================================
  // **SETTINGS MANAGEMENT METHODS**
  // ==========================================

  async getSettings(section?: string): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.getSettings(section);
  }

  async saveSettings(section: string, settings: any): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.saveSettings(section, settings);
  }

  // ==========================================
  // **UTILITY METHODS**
  // ==========================================

  async searchContent(query: string, type: 'all' | 'articles' | 'users' | 'comments' = 'all'): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.searchContent(query, type);
  }

  async fixGoogleUserEmails(): Promise<any> {
    await this.requireAdmin();
    return AdminAPI.fixGoogleUserEmails();
  }

  // ==========================================
  // **LIFECYCLE METHODS**
  // ==========================================

  destroy(): void {
    this.isInitialized = false;
    this.currentSession = null;
    this.authState = null;
  }

  getStatus(): { initialized: boolean; authenticated: boolean } {
    return {
      initialized: this.isInitialized,
      authenticated: !!this.currentSession
    };
  }
}


// ==========================================
// **MAIN ADMIN API CLASS** 
// ==========================================

class AdminAPI {
  // Static admin verification for client-side
  private static async verifyAdmin(): Promise<{ user: any }> {
    if (typeof window === 'undefined') {
      throw new Error('Admin operations require client-side execution');
    }

    const user = await ClientAdminAuth.requireAdmin();
    return { user };
  }

  // Static user verification for client-side (allows any authenticated user)
  private static async verifyUser(): Promise<{ user: any }> {
    if (typeof window === 'undefined') {
      throw new Error('User operations require client-side execution');
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      throw new Error('Authentication required. Please sign in to create articles.');
    }

    return { user: session.user };
  }

  private static async executeQuery<T>(
    queryFn: () => Promise<any>,
    errorContext: string
  ): Promise<ApiResponse<T>> {
    try {
      const result = await queryFn();
      
      if (result.error) {
        console.error(`${errorContext} error:`, result.error);
        return { success: false, error: result.error.message };
      }
      
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error(`${errorContext} exception:`, error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  static async fixGoogleUserEmails(): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    

    // Get profiles without email
    const { data: profilesWithoutEmail, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('environment', config.environment)
      .or('email.is.null,email.eq.""');

    if (profilesError) {
      return { success: false, error: profilesError.message };
    }

    if (!profilesWithoutEmail || profilesWithoutEmail.length === 0) {
      return { success: true, message: 'No profiles need email updates' };
    }

    

    let updatedCount = 0;
    let errorCount = 0;

    for (const profile of profilesWithoutEmail) {
      try {
        // Get email from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError || !authUser?.user?.email) {
          console.warn(`⚠️ No auth email found for user ${profile.id}`);
          errorCount++;
          continue;
        }

        // Update profile with email from auth
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            email: authUser.user.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ Failed to update email for ${profile.id}:`, updateError);
          errorCount++;
        } else {
          
          updatedCount++;
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing user ${profile.id}:`, error);
        errorCount++;
      }
    }

    return {
      success: true,
      data: {
        totalProcessed: profilesWithoutEmail.length,
        updated: updatedCount,
        errors: errorCount
      },
      message: `Updated ${updatedCount} user emails, ${errorCount} errors`
    };

  } catch (error: any) {
    console.error('❌ Fix Google user emails error:', error);
    return { success: false, error: error.message };
  }
}
  // ==========================================
  // **DASHBOARD & ANALYTICS** 
  // ==========================================
  
  // Dashboard & Analytics
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  try {
    await this.verifyAdmin();
    

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const queries = await Promise.allSettled([
      // User stats (0-5) - Try with environment first, fallback to all if needed
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', false),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', last30Days.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', last7Days.toISOString()),
      
      // Comment stats (6-10) - KEEP EXISTING
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('environment', config.environment),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending').eq('environment', config.environment),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('moderation_status', 'flagged').eq('environment', config.environment),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('moderation_status', 'approved').eq('environment', config.environment),
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', last30Days.toISOString()).eq('environment', config.environment),
      
      // Content stats (11-15) - KEEP EXISTING
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('authors').select('*', { count: 'exact', head: true }),
      supabase.from('podcasts').select('*', { count: 'exact', head: true }),
      
      // Newsletter stats (16-18) - KEEP EXISTING
      supabase.from('newsletters').select('*', { count: 'exact', head: true }),
      supabase.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('environment', config.environment),
      supabase.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('environment', config.environment),
      
      // ADD NEW ENGAGEMENT QUERIES (19-22)
      supabase.from('article_likes').select('*', { count: 'exact', head: true }).gte('created_at', last30Days.toISOString()),
      supabase.from('article_saves').select('*', { count: 'exact', head: true }).gte('created_at', last30Days.toISOString()),
      supabase.from('comment_likes').select('*', { count: 'exact', head: true }).eq('environment', config.environment).gte('created_at', last30Days.toISOString()),
      supabase.from('comment_reactions').select('*', { count: 'exact', head: true }).eq('environment', config.environment).gte('created_at', last30Days.toISOString()),
      
      // ENHANCED RECENT ACTIVITY DATA (23-27)
      supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          moderation_status,
          article_id,
          like_count,
          profiles!inner(
            id,
            display_name,
            avatar_type,
            avatar_preset_id,
            avatar_url,
            is_admin
          ),
          articles(title, slug)
        `)
        .eq('environment', config.environment)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5),
        
      supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          created_at,
          reputation_score,
          avatar_type,
          avatar_preset_id,
          avatar_url,
          membership_type,
          is_admin,
          total_comments,
          total_reads
        `)
        .eq('environment', config.environment)
        .order('reputation_score', { ascending: false })
        .limit(10),
        
      supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          created_at,
          is_published,
          view_count,
          like_count,
          comment_count,
          authors(name, slug)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5),
        
      supabase
        .from('newsletter_subscriptions')
        .select('id, email, subscribed_at, newsletter_type, is_active')
        .eq('environment', config.environment)
        .order('subscribed_at', { ascending: false })
        .limit(5),
        
      supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          view_count,
          like_count,
          comment_count,
          authors(name, slug)
        `)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5)
    ]);

    // Extract counts safely
    const getCounts = (results: PromiseSettledResult<any>[]) => 
      results.map(result => 
        result.status === 'fulfilled' ? (result.value.count || 0) : 0
      );

    // Extract data safely
    const getData = (result: PromiseSettledResult<any>) => 
      result.status === 'fulfilled' ? (result.value.data || []) : [];

    const counts = getCounts(queries.slice(0, 23)); // CHANGED from 19 to 23

    // ENHANCED stats object
    const stats: DashboardStats = {
      users: {
        total: counts[0],
        active: counts[1],
        blocked: counts[2],
        admins: counts[3],
        newLast30Days: counts[4],
        newLast7Days: counts[5]
      },
      comments: {
        total: counts[6],
        pending: counts[7],
        flagged: counts[8],
        approved: counts[9],
        last30Days: counts[10]
      },
      content: {
        totalArticles: counts[11],
        publishedArticles: counts[12],
        totalCategories: counts[13],
        totalAuthors: counts[14],
        totalPodcasts: counts[15]
      },
      newsletter: {
        totalNewsletters: counts[16],
        totalSubscribers: counts[17],
        activeSubscribers: counts[18]
      },
      // ADD NEW ENGAGEMENT SECTION
      engagement: {
        totalArticleLikes: counts[19],
        totalArticleSaves: counts[20],
        totalCommentReactions: counts[21] + counts[22], // combine likes + reactions
        avgEngagementPerArticle: counts[12] > 0 ? Math.round((counts[19] + counts[20]) / counts[12]) : 0
      },
      recentActivity: {
        recentComments: getData(queries[23]),
        recentUsers: getData(queries[24]),
        recentArticles: getData(queries[25]),
        recentSubscriptions: getData(queries[26]),
        topContent: getData(queries[27]),
        topEngagedUsers: getData(queries[24]) // ADD this line
      },
      generatedAt: new Date().toISOString()
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('❌ Enhanced dashboard stats error:', error);
    return { success: false, error: error.message };
  }
}

  static async testConnection(): Promise<ApiResponse> {
    try {
      const { user } = await this.verifyAdmin();
      
      // Test basic queries
      const tests = await Promise.allSettled([
        supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1),
        supabase.from('comments').select('count', { count: 'exact', head: true }).eq('environment', config.environment).limit(1),
        supabase.from('articles').select('count', { count: 'exact', head: true }).limit(1)
      ]);
      
      const results = tests.map((test, index) => ({
        table: ['profiles', 'comments', 'articles'][index],
        status: test.status,
        error: test.status === 'rejected' ? test.reason?.message : null
      }));
      
      return {
        success: true,
        data: {
          user: { id: user.id, email: user.email },
          environment: config.environment,
          database_tests: results,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

static async getAnalyticsData(period = '30d'): Promise<ApiResponse<AnalyticsData>> {
  try {
    await this.verifyAdmin();
    

    let startDate: Date;
    const now = new Date();
    
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const growthData: GrowthDataPoint[] = [];
    
    // Generate daily data with ENHANCED reaction tracking
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const queries = await Promise.allSettled([
        // EXISTING queries
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString()),
        supabase.from('comments').select('*', { count: 'exact', head: true })
          .eq('environment', config.environment)
          .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString()),
        supabase.from('newsletter_subscriptions').select('*', { count: 'exact', head: true })
          .eq('environment', config.environment)
          .gte('subscribed_at', date.toISOString()).lt('subscribed_at', nextDate.toISOString()),
        supabase.from('articles').select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString()),
        
        // ADD NEW reaction tracking queries
        supabase.from('article_likes').select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString()),
        supabase.from('article_saves').select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString()),
        supabase.from('comment_likes').select('*', { count: 'exact', head: true })
          .eq('environment', config.environment)
          .gte('created_at', date.toISOString()).lt('created_at', nextDate.toISOString())
      ]);

      const counts = queries.map(result => 
        result.status === 'fulfilled' ? (result.value.count || 0) : 0
      );

      const dataPoint: GrowthDataPoint = {
        date: date.toISOString().split('T')[0],
        users: counts[0],
        comments: counts[1],
        subscribers: counts[2],
        articles: counts[3],
        // ADD enhanced reaction data
        article_likes: counts[4],
        article_saves: counts[5],
        comment_likes: counts[6]
      };

      growthData.push(dataPoint);
    }

    // ENHANCED top performers with reaction data
    const [topUsersResult, topArticlesResult, topCategoriesResult] = await Promise.allSettled([
      supabase.from('profiles').select('id, display_name, total_comments, total_reads, reputation_score')
        .eq('environment', config.environment)
        .order('reputation_score', { ascending: false }).limit(10),
      supabase.from('articles').select('id, title, slug, view_count, like_count, comment_count')
        .eq('is_published', true).order('view_count', { ascending: false }).limit(10),
      supabase.from('categories').select('id, name, slug').limit(10)
    ]);

    return {
      success: true,
      data: {
        period,
        growth: growthData,
        topUsers: topUsersResult.status === 'fulfilled' ? (topUsersResult.value.data || []) : [],
        topArticles: topArticlesResult.status === 'fulfilled' ? (topArticlesResult.value.data || []) : [],
        topCategories: topCategoriesResult.status === 'fulfilled' ? (topCategoriesResult.value.data || []) : [],
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('❌ Enhanced analytics error:', error);
    return { success: false, error: error.message };
  }
}

  // ==========================================
  // **USER MANAGEMENT** 
  // ==========================================
  
// Update this method in your AdminAPI class
static async getUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  membership?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      membership = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Get profiles first
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('environment', config.environment);

    // Apply filters
    if (search && search.trim()) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      switch (status) {
        case 'active':
          query = query.eq('is_blocked', false);
          break;
        case 'blocked':
          query = query.eq('is_blocked', true);
          break;
        case 'admin':
          query = query.eq('is_admin', true);
          break;
      }
    }

    if (membership) {
      query = query.eq('membership_type', membership);
    }

    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }

    // Process users and ensure they have emails
    const processedData = await Promise.all(
      (data || []).map(async (user) => {
        let finalEmail = user.email;
        let needsUpdate = false;

        // If no email in profile, get from auth.users
        if (!finalEmail) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
            if (authUser?.user?.email) {
              finalEmail = authUser.user.email;
              needsUpdate = true;
              
              // Update the profile in background (don't wait)
              supabase
                .from('profiles')
                .update({ 
                  email: finalEmail,
                  updated_at: new Date().toISOString() 
                })
                .eq('id', user.id)
                .then(
                  () => {
                    // Success callback - you can add success logic here if needed
                  },
                  (err) => console.warn(`⚠️ Failed to update email for user ${user.id}:`, err)
                );
            }
          } catch (authError) {
            console.warn(`Could not fetch auth data for user ${user.id}:`, authError);
          }
        }

        return {
          ...user,
          email: finalEmail || null,
          email_source: needsUpdate ? 'auth_updated' : user.email ? 'profile' : 'none'
        };
      })
    );

    return await this.processUsersData(processedData, count, page, limit);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

  // Helper method to process users data
  private static async processUsersData(data: any[], count: number | null, page: number, limit: number) {
    if (!data || data.length === 0) {
      
      return {
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
      };
    }

    

    // Load engagement data for each user
    
    const usersWithEngagement = await Promise.all(
      data.map(async (userProfile) => {
        try {
          const engagementQueries = await Promise.allSettled([
            supabase.from("article_likes").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("article_saves").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("article_follows").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("author_follows").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("user_category_follows").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id),
            supabase.from("newsletter_subscriptions").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id).eq('environment', config.environment),
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id).eq('environment', config.environment),
            supabase.from("comment_likes").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id).eq('environment', config.environment),
            supabase.from("comment_bookmarks").select("*", { count: "exact", head: true }).eq("user_id", userProfile.id).eq('environment', config.environment)
          ]);

          const counts = engagementQueries.map(result => 
            result.status === 'fulfilled' ? (result.value.count || 0) : 0
          );

          return {
            ...userProfile,
            engagement: {
              articleLikes: counts[0],
              articleSaves: counts[1],
              articleFollows: counts[2],
              authorFollows: counts[3],
              categoryFollows: counts[4],
              newsletterSubscriptions: counts[5],
              totalComments: counts[6],
              commentLikes: counts[7],
              commentBookmarks: counts[8]
            }
          };
        } catch (error) {
          console.warn(`⚠️ Failed to load engagement for user ${userProfile.id}:`, error);
          return {
            ...userProfile,
            engagement: {
              articleLikes: 0, articleSaves: 0, articleFollows: 0, authorFollows: 0,
              categoryFollows: 0, newsletterSubscriptions: 0, totalComments: 0,
              commentLikes: 0, commentBookmarks: 0
            }
          };
        }
      })
    );

    return {
      success: true,
      data: usersWithEngagement,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
  }

  static async getUserDetails(userId: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();
      

      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userProfile) {
        return { success: false, error: 'User not found' };
      }

      // Get detailed engagement data
      const engagementQueries = await Promise.allSettled([
        supabase.from("comments").select("*, articles(title, slug)").eq("user_id", userId).eq('environment', config.environment).order("created_at", { ascending: false }).limit(20),
        supabase.from("article_likes").select("*, articles(title, slug)").eq("user_id", userId).limit(20),
        supabase.from("newsletter_subscriptions").select("*").eq("user_id", userId).eq('environment', config.environment),
        supabase.from("user_activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
      ]);

      const [comments, articleLikes, newsletterSubs, activities] = engagementQueries.map(result =>
        result.status === 'fulfilled' ? (result.value.data || []) : []
      );

      return {
        success: true,
        data: {
          ...userProfile,
          engagement: {
            comments,
            articleLikes,
            newsletterSubscriptions: newsletterSubs,
            recentActivities: activities
          },
          stats: {
            totalComments: comments.length,
            totalArticleLikes: articleLikes.length,
            totalNewsletterSubs: newsletterSubs.length
          }
        }
      };
    } catch (error: any) {
      console.error('❌ getUserDetails error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUser(userId: string, updateData: any): Promise<ApiResponse> {
    try {
      const { user } = await this.verifyAdmin();

      const allowedFields = [
        'display_name', 'bio', 'website', 'twitter_handle', 'linkedin_url', 
        'github_username', 'location', 'job_title', 'company', 'is_admin', 
        'is_blocked', 'membership_type'
      ];

      const profileUpdateData: any = {
        updated_at: new Date().toISOString()
      };

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          profileUpdateData[field] = updateData[field];
        }
      });

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'User updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async performUserAction(userId: string, action: string, reason?: string): Promise<ApiResponse> {
    try {
      const { user } = await this.verifyAdmin();

      const validActions = ['block', 'unblock', 'delete', 'suspend', 'activate', 'promote', 'demote'];
      if (!validActions.includes(action)) {
        return { success: false, error: 'Invalid action' };
      }

      let updateData: any = { updated_at: new Date().toISOString() };
      let message = '';

      switch (action) {
        case 'block':
          updateData.is_blocked = true;
          message = 'User blocked successfully';
          break;
        case 'unblock':
          updateData.is_blocked = false;
          message = 'User unblocked successfully';
          break;
        case 'promote':
          updateData.is_admin = true;
          message = 'User promoted to admin';
          break;
        case 'demote':
          updateData.is_admin = false;
          message = 'Admin privileges removed';
          break;
        case 'delete':
          updateData.is_blocked = true;
          updateData.display_name = 'Deleted User';
          message = 'User deleted successfully';
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async bulkUserAction(userIds: string[], action: string, reason?: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const validActions = ['block', 'unblock', 'delete', 'suspend', 'activate'];
      if (!validActions.includes(action)) {
        return { success: false, error: 'Invalid action' };
      }

      let updateData: any = { updated_at: new Date().toISOString() };
      let message = '';

      switch (action) {
        case 'block':
          updateData.is_blocked = true;
          message = `${userIds.length} users blocked successfully`;
          break;
        case 'unblock':
          updateData.is_blocked = false;
          message = `${userIds.length} users unblocked successfully`;
          break;
        case 'delete':
          updateData.is_blocked = true;
          updateData.display_name = 'Deleted User';
          message = `${userIds.length} users deleted successfully`;
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', userIds);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
// **FEEDBACK MANAGEMENT** 
// ==========================================

static async getFeedback(options: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const {
      page = 1,
      limit = 50,
      type = '',
      status = '',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Simple query - no joins, just raw feedback data
    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`message.ilike.%${search}%,type.ilike.%${search}%`);

    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getFeedbackStats(): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Simple direct queries without complex joins
    const queries = await Promise.allSettled([
      supabase.from('feedback').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'dismissed'),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).gte('created_at', last30Days.toISOString()),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).gte('created_at', last7Days.toISOString()),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('type', 'bug'),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('type', 'feature_request'),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('type', 'general'),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('type', 'complaint'),
    ]);

    const counts = queries.map(result => 
      result.status === 'fulfilled' ? (result.value.count || 0) : 0
    );

    const stats = {
      total: counts[0],
      pending: counts[1],
      resolved: counts[2],
      dismissed: counts[3],
      last30Days: counts[4],
      last7Days: counts[5],
      byType: {
        bug: counts[6],
        feature_request: counts[7],
        general: counts[8],
        complaint: counts[9]
      },
      generatedAt: new Date().toISOString()
    };

    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


static async getFeedbackDetails(feedbackId: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        profiles:user_id(
          display_name,
          email,
          avatar_type,
          avatar_preset_id,
          avatar_url,
          is_admin,
          reputation_score,
          created_at
        )
      `)
      .eq('id', feedbackId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Feedback not found' };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateFeedbackStatus(
  feedbackId: string, 
  status: 'pending' | 'resolved' | 'dismissed',
  adminNotes?: string
): Promise<ApiResponse> {
  try {
    const { user } = await this.verifyAdmin();

    const { data, error } = await supabase
      .from('feedback')
      .update({
        status,
        admin_notes: adminNotes || null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        resolved_by: status === 'resolved' ? user.id : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: `Feedback ${status} successfully` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async bulkUpdateFeedback(
  feedbackIds: string[], 
  status: 'pending' | 'resolved' | 'dismissed',
  adminNotes?: string
): Promise<ApiResponse> {
  try {
    const { user } = await this.verifyAdmin();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    }

    const { error } = await supabase
      .from('feedback')
      .update(updateData)
      .in('id', feedbackIds);

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: `${feedbackIds.length} feedback items updated to ${status}` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async deleteFeedback(feedbackId: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Feedback deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async exportFeedback(
  format: 'csv' | 'json' = 'csv',
  filters?: {
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    let query = supabase
      .from('feedback')
      .select(`
        *,
        profiles:user_id(display_name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'No feedback data to export' };
    }

    const exportData = data.map(feedback => ({
      id: feedback.id,
      type: feedback.type,
      message: feedback.message,
      status: feedback.status,
      user_name: feedback.profiles?.display_name || 'Anonymous',
      user_email: feedback.profiles?.email || 'N/A',
      created_at: feedback.created_at,
      resolved_at: feedback.resolved_at,
      admin_notes: feedback.admin_notes || ''
    }));

    if (format === 'json') {
      return {
        success: true,
        data: {
          feedback: exportData,
          exported_at: new Date().toISOString(),
          total_items: exportData.length,
          filters: filters || {}
        }
      };
    }

    // Generate CSV
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = String(row[header] || '').replace(/"/g, '""');
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');

    return { success: true, data: csvContent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Add this to your AdminAPI class in admin-api.ts
static async submitFeedback(feedbackData: {
  type: string;
  message: string;
  user_id?: string | null;
  metadata?: any;
}): Promise<ApiResponse> {
  try {
    // Validate required fields
    if (!feedbackData.type || !feedbackData.message) {
      return { success: false, error: 'Type and message are required' };
    }

    // Validate feedback type
    const validTypes = ['bug', 'feature_request', 'general', 'complaint', 'suggestion'];
    if (!validTypes.includes(feedbackData.type)) {
      return { success: false, error: 'Invalid feedback type' };
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        type: feedbackData.type,
        message: feedbackData.message,
        user_id: null, // Always null for static deployment
        metadata: feedbackData.metadata || {},
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Feedback submission error:', error);
      return { success: false, error: error.message };
    }

    
    return { 
      success: true, 
      data, 
      message: 'Feedback submitted successfully' 
    };
  } catch (error: any) {
    console.error('❌ Feedback submission exception:', error);
    return { success: false, error: error.message || 'Failed to submit feedback' };
  }
}

  // ==========================================
  // **COMMENT MANAGEMENT & MODERATION** 
  // ==========================================
  
static async getComments(options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Get comments without joins first
    let query = supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('environment', config.environment);

    if (status) {
      query = query.eq('moderation_status', status);
    }

    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: comments, error, count } = await query;

    if (error) {
      console.error('Comments query error:', error);
      return { success: false, error: error.message };
    }

    if (!comments || comments.length === 0) {
      return {
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    // Get unique user IDs and article IDs
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    const articleIds = [...new Set(comments.map(c => c.article_id).filter(Boolean))];

    // Fetch user data in batch
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_type, avatar_preset_id, avatar_url, is_admin')
        .in('id', userIds)
        .eq('environment', config.environment);
      
      if (users) {
        users.forEach(user => usersMap.set(user.id, user));
      }
    }

    // Fetch article data in batch
    let articlesMap = new Map();
    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from('articles')
        .select('slug, title')
        .in('slug', articleIds);
      
      if (articles) {
        articles.forEach(article => articlesMap.set(article.slug, article));
      }
    }

    // Enrich comments with user and article data
    const enrichedComments = comments.map(comment => {
      const user = comment.user_id ? usersMap.get(comment.user_id) : null;
      const article = comment.article_id ? articlesMap.get(comment.article_id) : null;
      
      return {
        ...comment,
        profiles: user, // This should match your frontend expectations
        articles: article
      };
    });

    return {
      success: true,
      data: enrichedComments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    console.error('getComments error:', error);
    return { success: false, error: error.message };
  }
}

static async getPendingComments(options: { page?: number; limit?: number } = {}): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { page = 1, limit = 20 } = options;

    // Get pending comments without joins
    let query = supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .eq('environment', config.environment)
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: comments, error, count } = await query;

    if (error) {
      console.error('Pending comments query error:', error);
      return { success: false, error: error.message };
    }

    if (!comments || comments.length === 0) {
      return {
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    // Get unique user IDs and article IDs
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
    const articleIds = [...new Set(comments.map(c => c.article_id).filter(Boolean))];

    // Fetch user data in batch
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_type, avatar_preset_id, avatar_url, is_admin')
        .in('id', userIds);
      
      if (users) {
        users.forEach(user => usersMap.set(user.id, user));
      }
    }

    // Fetch article data in batch
    let articlesMap = new Map();
    if (articleIds.length > 0) {
      const { data: articles } = await supabase
        .from('articles')
        .select('slug, title')
        .in('slug', articleIds);
      
      if (articles) {
        articles.forEach(article => articlesMap.set(article.slug, article));
      }
    }

    // Enrich comments with user and article data
    const enrichedComments = comments.map(comment => ({
      ...comment,
      user: comment.user_id ? usersMap.get(comment.user_id) || null : null,
      article: comment.article_id ? articlesMap.get(comment.article_id) || null : null
    }));

    return {
      success: true,
      data: enrichedComments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    console.error('getPendingComments error:', error);
    return { success: false, error: error.message };
  }
}

  static async moderateComment(commentId: string, action: string, reason?: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'hidden',
        flag: 'flagged',
        hide: 'hidden'
      };

      const newStatus = statusMap[action];
      if (!newStatus) {
        return { success: false, error: 'Invalid action' };
      }

      const { error: updateError } = await supabase
        .from('comments')
        .update({
          moderation_status: newStatus,
          moderation_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('environment', config.environment);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, message: `Comment ${action}ed successfully` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async bulkModerateComments(commentIds: string[], action: string, reason?: string): Promise<ApiResponse> {
    try {
      const { user } = await this.verifyAdmin();
      

      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'hidden',
        flag: 'flagged',
        hide: 'hidden'
      };

      const newStatus = statusMap[action];
      if (!newStatus) {
        return { success: false, error: 'Invalid action' };
      }

      const { error: updateError } = await supabase
        .from('comments')
        .update({
          moderation_status: newStatus,
          moderation_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .in('id', commentIds)
        .eq('environment', config.environment);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, message: `${commentIds.length} comments ${action}ed successfully` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }


// ==========================================
// **ARTICLES MANAGEMENT METHODS**
// ==========================================

static async getArticles(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  author?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      category = '',
      author = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    let query = supabase
      .from('articles')
      .select(`
        *,
        authors:author_id(name, slug),
        categories:category_slug(name, slug, color)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (status === 'published') {
      query = query.eq('is_published', true);
    } else if (status === 'draft') {
      query = query.eq('is_published', false);
    } else if (status === 'featured') {
      query = query.eq('is_featured', true);
    }

    if (category) {
      query = query.eq('category_slug', category);
    }

    if (author) {
      query = query.eq('author_id', author);
    }

    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getArticleEngagementStats(): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    // Get all articles with their engagement stats
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, slug, title, view_count, like_count, comment_count')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    
    // Get actual engagement counts from related tables
    const enrichedArticles = await Promise.all(
      (articles || []).map(async (article) => {
        try {
          // Get actual counts from related tables
          const [viewsResult, likesResult, commentsResult] = await Promise.allSettled([
            supabase.from('article_reads').select('*', { count: 'exact', head: true }).eq('article_id', article.slug),
            supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_id', article.slug),
            supabase.from('comments').select('*', { count: 'exact', head: true }).eq('article_id', article.slug).eq('environment', config.environment).eq('is_deleted', false)
          ]);

          const actualViews = viewsResult.status === 'fulfilled' ? (viewsResult.value.count || 0) : 0;
          const actualLikes = likesResult.status === 'fulfilled' ? (likesResult.value.count || 0) : 0;
          const actualComments = commentsResult.status === 'fulfilled' ? (commentsResult.value.count || 0) : 0;

          // Update the article counts if they're different
          if (actualViews !== article.view_count || actualLikes !== article.like_count || actualComments !== article.comment_count) {
            await supabase
              .from('articles')
              .update({
                view_count: actualViews,
                like_count: actualLikes,
                comment_count: actualComments,
                updated_at: new Date().toISOString()
              })
              .eq('slug', article.slug);
          }

          return {
            ...article,
            actual_views: actualViews,
            actual_likes: actualLikes,
            actual_comments: actualComments,
            engagement_score: actualViews + (actualLikes * 2) + (actualComments * 3)
          };
        } catch (error) {
          console.warn(`Failed to get engagement for article ${article.slug}:`, error);
          return {
            ...article,
            actual_views: article.view_count || 0,
            actual_likes: article.like_count || 0,
            actual_comments: article.comment_count || 0,
            engagement_score: 0
          };
        }
      })
    );

    return { success: true, data: enrichedArticles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getArticleEngagementDetails(articleSlug: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    

    const queries = await Promise.allSettled([
      // Article reads (views)
      supabase
        .from('article_reads')
        .select(`
          id,
          user_id,
          read_percentage,
          time_spent_seconds,
          created_at,
          profiles:user_id(
            display_name,
            avatar_type,
            avatar_preset_id,
            avatar_url,
            is_admin
          )
        `)
        .eq('article_id', articleSlug)
        .order('created_at', { ascending: false })
        .limit(50),

      // Article likes
      supabase
        .from('article_likes')
        .select(`
          id,
          user_id,
          created_at,
          profiles:user_id(
            display_name,
            avatar_type,
            avatar_preset_id,
            avatar_url,
            is_admin
          )
        `)
        .eq('article_id', articleSlug)
        .order('created_at', { ascending: false }),

      // Article saves
      supabase
        .from('article_saves')
        .select(`
          id,
          user_id,
          created_at,
          profiles:user_id(
            display_name,
            avatar_type,
            avatar_preset_id,
            avatar_url,
            is_admin
          )
        `)
        .eq('article_id', articleSlug)
        .order('created_at', { ascending: false }),

      // Comments with user info
      supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          guest_name,
          guest_email,
          like_count,
          created_at,
          moderation_status,
          profiles:user_id(
            display_name,
            avatar_type,
            avatar_preset_id,
            avatar_url,
            is_admin
          )
        `)
        .eq('article_id', articleSlug)
        .eq('environment', config.environment)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false }),

      // Get article basic info
      supabase
        .from('articles')
        .select('id, title, slug, view_count, like_count, comment_count, created_at, published_at')
        .eq('slug', articleSlug)
        .single(),

      // Engagement summary stats
      supabase
        .from('article_reads')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleSlug),

      supabase
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleSlug),

      supabase
        .from('article_saves')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleSlug),

      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleSlug)
        .eq('environment', config.environment)
        .eq('is_deleted', false),
    ]);

    const [
      readsResult,
      likesResult,
      savesResult,
      commentsResult,
      articleResult,
      readsCountResult,
      likesCountResult,
      savesCountResult,
      commentsCountResult
    ] = queries;

    const reads = readsResult.status === 'fulfilled' ? (readsResult.value.data || []) : [];
    const likes = likesResult.status === 'fulfilled' ? (likesResult.value.data || []) : [];
    const saves = savesResult.status === 'fulfilled' ? (savesResult.value.data || []) : [];
    const comments = commentsResult.status === 'fulfilled' ? (commentsResult.value.data || []) : [];
    const article = articleResult.status === 'fulfilled' ? articleResult.value.data : null;

    const counts = {
      reads: readsCountResult.status === 'fulfilled' ? (readsCountResult.value.count || 0) : 0,
      likes: likesCountResult.status === 'fulfilled' ? (likesCountResult.value.count || 0) : 0,
      saves: savesCountResult.status === 'fulfilled' ? (savesCountResult.value.count || 0) : 0,
      comments: commentsCountResult.status === 'fulfilled' ? (commentsCountResult.value.count || 0) : 0,
    };

    // Calculate engagement metrics
    const uniqueReaders = new Set(reads.map(r => r.user_id).filter(Boolean)).size;
    const anonymousReaders = reads.filter(r => !r.user_id).length;
    const averageReadTime = reads.length > 0 
      ? reads.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0) / reads.length 
      : 0;
    const averageReadPercentage = reads.length > 0
      ? reads.reduce((sum, r) => sum + (r.read_percentage || 0), 0) / reads.length
      : 0;

    // Top engaged users
    const userEngagement = new Map();
    
    reads.forEach(read => {
      if (read.user_id) {
        const key = read.user_id;
        if (!userEngagement.has(key)) {
          userEngagement.set(key, {
            user: read.profiles,
            reads: 0,
            likes: 0,
            saves: 0,
            comments: 0,
            totalEngagement: 0
          });
        }
        userEngagement.get(key).reads++;
        userEngagement.get(key).totalEngagement++;
      }
    });

    likes.forEach(like => {
      if (like.user_id) {
        const key = like.user_id;
        if (!userEngagement.has(key)) {
          userEngagement.set(key, {
            user: like.profiles,
            reads: 0,
            likes: 0,
            saves: 0,
            comments: 0,
            totalEngagement: 0
          });
        }
        userEngagement.get(key).likes++;
        userEngagement.get(key).totalEngagement += 2; // Weight likes higher
      }
    });

    saves.forEach(save => {
      if (save.user_id) {
        const key = save.user_id;
        if (!userEngagement.has(key)) {
          userEngagement.set(key, {
            user: save.profiles,
            reads: 0,
            likes: 0,
            saves: 0,
            comments: 0,
            totalEngagement: 0
          });
        }
        userEngagement.get(key).saves++;
        userEngagement.get(key).totalEngagement += 3; // Weight saves even higher
      }
    });

    comments.forEach(comment => {
      if (comment.user_id) {
        const key = comment.user_id;
        if (!userEngagement.has(key)) {
          userEngagement.set(key, {
            user: comment.profiles,
            reads: 0,
            likes: 0,
            saves: 0,
            comments: 0,
            totalEngagement: 0
          });
        }
        userEngagement.get(key).comments++;
        userEngagement.get(key).totalEngagement += 5; // Weight comments highest
      }
    });

    const topEngagedUsers = Array.from(userEngagement.values())
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 10);

    const engagementData = {
      article,
      summary: {
        totalReads: counts.reads,
        uniqueReaders,
        anonymousReaders,
        totalLikes: counts.likes,
        totalSaves: counts.saves,
        totalComments: counts.comments,
        averageReadTime: Math.round(averageReadTime),
        averageReadPercentage: Math.round(averageReadPercentage),
        engagementRate: counts.reads > 0 ? ((counts.likes + counts.saves + counts.comments) / counts.reads * 100) : 0
      },
      recentActivity: {
        reads: reads.slice(0, 20),
        likes: likes.slice(0, 20),
        saves: saves.slice(0, 20),
        comments: comments.slice(0, 20)
      },
      topEngagedUsers,
      generatedAt: new Date().toISOString()
    };

    return { success: true, data: engagementData };
  } catch (error: any) {
    console.error('❌ Article engagement details error:', error);
    return { success: false, error: error.message };
  }
}

static async updateArticleStats(articleSlug: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    // Get actual counts
    const [viewsResult, likesResult, commentsResult] = await Promise.allSettled([
      supabase.from('article_reads').select('*', { count: 'exact', head: true }).eq('article_id', articleSlug),
      supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_id', articleSlug),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('article_id', articleSlug).eq('environment', config.environment).eq('is_deleted', false)
    ]);

    const viewCount = viewsResult.status === 'fulfilled' ? (viewsResult.value.count || 0) : 0;
    const likeCount = likesResult.status === 'fulfilled' ? (likesResult.value.count || 0) : 0;
    const commentCount = commentsResult.status === 'fulfilled' ? (commentsResult.value.count || 0) : 0;

    // Update article stats
    const { data, error } = await supabase
      .from('articles')
      .update({
        view_count: viewCount,
        like_count: likeCount,
        comment_count: commentCount,
        updated_at: new Date().toISOString()
      })
      .eq('slug', articleSlug)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        ...data,
        view_count: viewCount,
        like_count: likeCount,
        comment_count: commentCount
      },
      message: 'Article stats updated successfully' 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getArticle(articleId: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        authors:author_id(name, slug, bio),
        categories:category_slug(name, slug, color)
      `)
      .eq('id', articleId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async createArticle(articleData: any): Promise<ApiResponse> {
  try {
    // Allow any authenticated user (admin or regular user) to create articles
    const { user } = await this.verifyUser();

    const { data, error } = await supabase
      .from('articles')
      .insert({
        ...articleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Article created successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateArticle(articleId: string, updateData: any): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('articles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Article updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateArticleStatus(articleId: string, status: 'publish' | 'unpublish' | 'feature' | 'unfeature'): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    let updateData: any = { updated_at: new Date().toISOString() };
    let message = '';

    switch (status) {
      case 'publish':
        updateData.is_published = true;
        updateData.published_at = new Date().toISOString();
        message = 'Article published successfully';
        break;
      case 'unpublish':
        updateData.is_published = false;
        message = 'Article unpublished successfully';
        break;
      case 'feature':
        updateData.is_featured = true;
        message = 'Article featured successfully';
        break;
      case 'unfeature':
        updateData.is_featured = false;
        message = 'Article unfeatured successfully';
        break;
    }

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async deleteArticle(articleId: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    // Get article details first
    const { data: article } = await supabase
      .from('articles')
      .select('title, slug')
      .eq('id', articleId)
      .single();

    if (!article) {
      return { success: false, error: 'Article not found' };
    }

    

    // Delete related data first
    await Promise.allSettled([
      supabase.from('article_likes').delete().eq('article_id', article.slug),
      supabase.from('article_saves').delete().eq('article_id', article.slug),
      supabase.from('article_follows').delete().eq('article_id', article.slug),
      supabase.from('comments').delete().eq('article_id', article.slug).eq('environment', config.environment)
    ]);

    // Delete the article
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Article deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


  // ==========================================
  // **AUTHORS MANAGEMENT** 
  // ==========================================
  
  static async getAuthors(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const {
        page = 1,
        limit = 50,
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from('authors')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      } else if (status === 'verified') {
        query = query.eq('is_verified', true);
      } else if (status === 'featured') {
        query = query.eq('featured', true);
      }

      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Get article counts for each author
      const authorsWithCounts = await Promise.all(
        (data || []).map(async (author) => {
          const { count: articleCount } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', author.slug);

          return {
            ...author,
            article_count: articleCount || 0
          };
        })
      );

      return {
        success: true,
        data: authorsWithCounts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: page < Math.ceil((count || 0) / limit),
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getAuthor(authorId: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', authorId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async createAuthor(authorData: any): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      if (!authorData.name || !authorData.slug) {
        return { success: false, error: 'Name and slug are required' };
      }

      // Check if slug already exists
      const { data: existing } = await supabase
        .from('authors')
        .select('id')
        .eq('slug', authorData.slug)
        .single();

      if (existing) {
        return { success: false, error: 'Author slug already exists' };
      }

      const { data, error } = await supabase
        .from('authors')
        .insert({
          ...authorData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'Author created successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateAuthor(authorId: string, updateData: any): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const { data, error } = await supabase
        .from('authors')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', authorId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'Author updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteAuthor(authorId: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      // Check if author has articles
      const { count: articleCount } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', authorId);

      if (articleCount && articleCount > 0) {
        return { 
          success: false, 
          error: `Cannot delete author with ${articleCount} articles. Please reassign articles first.` 
        };
      }

      const { error } = await supabase
        .from('authors')
        .delete()
        .eq('id', authorId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Author deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // **CATEGORIES MANAGEMENT** 
  // ==========================================
  
static async getCategories(): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get article counts for each category
    const categoriesWithCounts = await Promise.all(
      (data || []).map(async (category) => {
        const { count } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('category_slug', category.slug)
          .eq('is_published', true);

        return {
          ...category,
          article_count: count || 0
        };
      })
    );

    return { success: true, data: categoriesWithCounts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getCategory(categoryId: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async createCategory(categoryData: any): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    if (!categoryData.name || !categoryData.slug) {
      return { success: false, error: 'Name and slug are required' };
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categoryData.slug)
      .single();

    if (existing) {
      return { success: false, error: 'Category slug already exists' };
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Category created successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateCategory(categoryId: string, updateData: any): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('categories')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Category updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async deleteCategory(categoryId: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    // Check if category has articles
    const { count: articleCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_slug', categoryId);

    if (articleCount && articleCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete category with ${articleCount} articles. Please reassign articles first.` 
      };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Category deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
  // ==========================================
  // **PODCASTS MANAGEMENT** 
  // ==========================================
  
  static async getPodcasts(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const {
        page = 1,
        limit = 50,
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from('podcasts')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (status === 'published') {
        query = query.eq('is_published', true);
      } else if (status === 'draft') {
        query = query.eq('is_published', false);
      } else if (status === 'featured') {
        query = query.eq('featured', true);
      }

      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: page < Math.ceil((count || 0) / limit),
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getPodcast(podcastId: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', podcastId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async createPodcast(podcastData: any): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const { data, error } = await supabase
        .from('podcasts')
        .insert({
          ...podcastData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'Podcast created successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updatePodcast(podcastId: string, updateData: any): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const { data, error } = await supabase
        .from('podcasts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', podcastId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'Podcast updated successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deletePodcast(podcastId: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      const { error } = await supabase
        .from('podcasts')
        .delete()
        .eq('id', podcastId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Podcast deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // **NEWSLETTER MANAGEMENT** 
  // ==========================================
  
static async getNewsletters(): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get subscriber counts for each newsletter
    const newslettersWithCounts = await Promise.all(
      (data || []).map(async (newsletter) => {
        const { count } = await supabase
          .from('newsletter_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('newsletter_type', newsletter.slug)
          .eq('is_active', true)
          .eq('environment', config.environment);

        return {
          ...newsletter,
          subscriber_count: count || 0
        };
      })
    );

    return { success: true, data: newslettersWithCounts };
  } catch (error: any) {
    console.error('❌ Get newsletters error:', error);
    return { success: false, error: error.message };
  }
}


static async getNewsletterSubscribers(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  newsletterType?: string;
} = {}): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    
    
    const { page = 1, limit = 50, search = '', status = '', newsletterType = '' } = options;

    // First get the subscriptions without the problematic join
    let query = supabase
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact' })
      .eq('environment', config.environment)
      .order('subscribed_at', { ascending: false });

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (newsletterType) {
      query = query.eq('newsletter_type', newsletterType);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: subscriptions, error, count } = await query;

    if (error) throw error;

    // Now get profile data separately for users who have accounts
    const subscriptionsWithProfiles = await Promise.all(
      (subscriptions || []).map(async (subscription) => {
        if (subscription.user_id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_type, avatar_preset_id, avatar_url, created_at')
              .eq('id', subscription.user_id)
              .eq('environment', config.environment)
              .single();

            return {
              ...subscription,
              profile: profile || null
            };
          } catch (profileError) {
            // Profile not found or error - subscriber without account
            return {
              ...subscription,
              profile: null
            };
          }
        } else {
          // Guest subscriber
          return {
            ...subscription,
            profile: null
          };
        }
      })
    );

    return {
      success: true,
      data: subscriptionsWithProfiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      }
    };
  } catch (error: any) {
    console.error('❌ Get newsletter subscribers error:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// **EMAIL TEMPLATE MANAGEMENT** 
// ==========================================

static async getEmailTemplates(): Promise<ApiResponse<EmailTemplate[]>> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async createEmailTemplate(templateData: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> {
  try {
    await this.verifyAdmin();

    if (!templateData.name || !templateData.subject || !templateData.content) {
      return { success: false, error: 'Name, subject, and content are required' };
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Email template created successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateEmailTemplate(id: string, templateData: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('email_templates')
      .update({
        ...templateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Email template updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async deleteEmailTemplate(id: string): Promise<ApiResponse<void>> {
  try {
    await this.verifyAdmin();

    // Check if template is being used in any campaigns
    const { count } = await supabase
      .from('email_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', id);

    if (count && count > 0) {
      return { 
        success: false, 
        error: `Cannot delete template used in ${count} email campaigns` 
      };
    }

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Email template deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getEmailAnalytics(campaignId?: string): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    
    let query = supabase.from('email_campaigns').select('*');
    
    if (campaignId) {
      query = query.eq('id', campaignId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) return { success: false, error: error.message };
    
    // Calculate analytics
    const analytics = {
      totalCampaigns: data?.length || 0,
      totalSent: data?.reduce((sum, campaign) => sum + (campaign.recipient_count || 0), 0) || 0,
      totalOpens: data?.reduce((sum, campaign) => sum + (campaign.open_count || 0), 0) || 0,
      totalClicks: data?.reduce((sum, campaign) => sum + (campaign.click_count || 0), 0) || 0,
      campaigns: data || []
    };
    
    return { success: true, data: analytics };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// **NEWSLETTER MANAGEMENT EXTENSIONS** 
// ==========================================

static async createNewsletter(newsletterData: any): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    if (!newsletterData.name || !newsletterData.slug) {
      return { success: false, error: 'Name and slug are required' };
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('newsletters')
      .select('id')
      .eq('slug', newsletterData.slug)
      .single();

    if (existing) {
      return { success: false, error: 'Newsletter slug already exists' };
    }

    const { data, error } = await supabase
      .from('newsletters')
      .insert({
        ...newsletterData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Newsletter created successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateNewsletter(newsletterId: string, updateData: any): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();

    const { data, error } = await supabase
      .from('newsletters')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Newsletter updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async updateNewsletterSubscription(subscriptionId: string, updateData: any): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .eq('environment', config.environment)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data, message: 'Subscription updated successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async getNewsletterSegments(): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    
    
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('newsletter_type, is_active')
      .eq('environment', config.environment);
      
    if (error) return { success: false, error: error.message };
    
    const segments = data?.reduce((acc, sub) => {
      const key = `${sub.newsletter_type}_${sub.is_active ? 'active' : 'inactive'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return { success: true, data: segments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// **EMAIL SENDING (Basic Implementation)** 
// ==========================================

static async sendTestEmail(emailData: { 
  to: string; 
  subject: string; 
  html: string 
}): Promise<ApiResponse<void>> {
  try {
    await this.verifyAdmin();

    // This is a placeholder - you'll need to integrate with your email service
    // For now, we'll just log the attempt
    console.log('📧 Test email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      htmlLength: emailData.html.length
    });

    // TODO: Integrate with Resend, SendGrid, or your chosen email service
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'newsletter@tinkbyte.com',
    //     to: emailData.to,
    //     subject: emailData.subject,
    //     html: emailData.html
    //   })
    // });

    return { 
      success: true, 
      message: 'Test email sent successfully (placeholder implementation)' 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async scheduleNewsletter(
  newsletterId: string,
  templateId: string,
  scheduledAt: string,
  subscribers: string[]
): Promise<ApiResponse> {
  try {
    await this.verifyAdmin();
    
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        newsletter_id: newsletterId,
        template_id: templateId,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        recipient_count: subscribers.length,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) return { success: false, error: error.message };
    
    return { success: true, data, message: 'Newsletter scheduled successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

static async sendNewsletter(
  newsletterId: string, 
  templateId: string, 
  subscribers: string[]
): Promise<ApiResponse<void>> {
  try {
    await this.verifyAdmin();

    // Get newsletter and template data
    const [newsletterResult, templateResult] = await Promise.all([
      supabase.from('newsletters').select('*').eq('id', newsletterId).single(),
      supabase.from('email_templates').select('*').eq('id', templateId).single()
    ]);

    if (newsletterResult.error || templateResult.error) {
      return { success: false, error: 'Newsletter or template not found' };
    }

    // Create email campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        newsletter_id: newsletterId,
        template_id: templateId,
        subject: templateResult.data.subject,
        content: templateResult.data.content,
        status: 'sending',
        recipient_count: subscribers.length,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (campaignError) {
      return { success: false, error: campaignError.message };
    }

    // TODO: Implement actual email sending logic
    console.log('📧 Newsletter would be sent to:', {
      subscribers: subscribers.length,
      newsletter: newsletterResult.data.name,
      template: templateResult.data.name
    });

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

    return { 
      success: true, 
      message: `Newsletter sent to ${subscribers.length} subscribers` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
  // ==========================================
  // **SETTINGS MANAGEMENT** 
  // ==========================================
  
  static async getSettings(section?: string): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();

      let query = supabase
        .from('admin_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async saveSettings(section: string, settings: any): Promise<ApiResponse> {
    try {
      const { user } = await this.verifyAdmin();

      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          section,
          settings,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Settings saved successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // **EXPORT & UTILITY FUNCTIONS** 
  // ==========================================
  
  static async exportUsers(format: 'csv' | 'json' = 'csv'): Promise<ApiResponse> {
    try {
      const usersResult = await this.getUsers({ limit: 1000 });
      if (!usersResult.success) {
        return { success: false, error: usersResult.error };
      }

      const users = usersResult.data || [];
      
      if (users.length === 0) {
        return { success: false, error: 'No users to export' };
      }

      const exportData = users.map(user => ({
        id: user.id,
        display_name: user.display_name || '',
        email: user.email || '',
        membership_type: user.membership_type || 'free',
        is_admin: user.is_admin || false,
        is_blocked: user.is_blocked || false,
        reputation_score: user.reputation_score || 0,
        total_comments: user.total_comments || 0,
        created_at: user.created_at
      }));

      if (format === 'json') {
        return {
          success: true,
          data: {
            users: exportData,
            exported_at: new Date().toISOString(),
            total_users: exportData.length
          }
        };
      }

      // Generate CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      return { success: true, data: csvContent };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async searchContent(query: string, type: 'all' | 'articles' | 'users' | 'comments' = 'all'): Promise<ApiResponse> {
    try {
      await this.verifyAdmin();
      

      if (!query || query.length < 2) {
        return { success: false, error: 'Search query must be at least 2 characters' };
      }

      const results: any = {};

      if (type === 'users' || type === 'all') {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_type, avatar_preset_id, avatar_url, is_admin, reputation_score')
          .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10);

        results.users = users || [];
      }

      if (type === 'articles' || type === 'all') {
        const { data: articles } = await supabase
          .from('articles')
          .select('id, title, slug, excerpt, is_published, created_at')
          .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
          .limit(10);

        results.articles = articles || [];
      }

      if (type === 'comments' || type === 'all') {
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            id, content, created_at, moderation_status,
            profiles:user_id(display_name),
            articles:article_id(title, slug)
          `)
          .eq('environment', config.environment)
          .ilike('content', `%${query}%`)
          .limit(10);

        results.comments = comments || [];
      }

      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ==========================================
// **HELPER FUNCTIONS** 
// ==========================================

export function downloadData(data: string, filename: string, type = 'text/csv') {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const adminAPIManager = AdminAPIManager.getInstance();

// Export classes
export { AdminAPI };

// Default export
export default AdminAPI;