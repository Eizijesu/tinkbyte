// src/lib/deployment.ts - ENHANCED WITH ERROR HANDLING
export class DeploymentManager {
  private static instance: DeploymentManager;
  private isStatic: boolean;
  private environment: string;
  private detectionError: string | null = null;

  private constructor() {
    try {
      this.environment = this.detectEnvironment();
      this.isStatic = this.detectStaticDeployment();
    } catch (error) {
      this.detectionError = error instanceof Error ? error.message : 'Unknown detection error';
      this.environment = 'production'; // Safe fallback
      this.isStatic = true; // Assume static for safety
    }
  }

  static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  private detectEnvironment(): string {
    // Server-side detection
    if (typeof window === 'undefined') {
      return import.meta.env.PROD ? 'production' : 'development';
    }

    // Client-side detection
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('192.168.')) {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('preview') || hostname.includes('dev.')) {
      return 'staging';
    }
    
    return 'production';
  }

  private detectStaticDeployment(): boolean {
    // Server-side is never static
    if (typeof window === 'undefined') return false;
    
    try {
      const staticIndicators = [
        // Protocol checks
        window.location.protocol === 'file:',
        
        // Platform checks
        window.location.hostname.includes('.pages.dev'), // Cloudflare Pages
        window.location.hostname.includes('.netlify.app'), // Netlify
        window.location.hostname.includes('.vercel.app'), // Vercel
        window.location.hostname.includes('.surge.sh'), // Surge
        window.location.hostname.includes('.github.io'), // GitHub Pages
        
        // Build-time detection
        !import.meta.env.SSR,
        
        // Check for static build artifacts
        document.querySelector('meta[name="astro-view-transitions"]') !== null
      ];

      return staticIndicators.some(indicator => indicator === true);
    } catch (error) {
      console.warn('Static deployment detection failed:', error);
      return true; // Assume static for safety
    }
  }

  isStaticDeployment(): boolean {
    return this.isStatic;
  }

  getEnvironment(): string {
    return this.environment;
  }

  shouldUseClientSideOnly(): boolean {
    return this.isStatic;
  }

  hasDetectionError(): boolean {
    return this.detectionError !== null;
  }

  getDetectionError(): string | null {
    return this.detectionError;
  }

  // Enhanced logging with conditional output
  logDeploymentInfo(): void {
    const info = {
      isStatic: this.isStatic,
      environment: this.environment,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      ...(this.detectionError && { detectionError: this.detectionError })
    };

    // Always log deployment info as it's crucial for debugging
    console.log('🚀 Deployment Info:', info);
  }

  // Get deployment summary for debugging
  getDeploymentSummary() {
    return {
      isStatic: this.isStatic,
      environment: this.environment,
      shouldUseClientSideOnly: this.shouldUseClientSideOnly(),
      hasError: this.hasDetectionError(),
      error: this.detectionError
    };
  }
}

export const deploymentManager = DeploymentManager.getInstance();