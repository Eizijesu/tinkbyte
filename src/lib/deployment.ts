// src/lib/deployment.ts - NEW FILE
export class DeploymentManager {
  private static instance: DeploymentManager;
  private isStatic: boolean;
  private environment: string;

  private constructor() {
    this.environment = import.meta.env.MODE || 'production';
    this.isStatic = this.detectStaticDeployment();
  }

  static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  private detectStaticDeployment(): boolean {
    // Check for static deployment indicators
    if (typeof window === 'undefined') return false;
    
    // Cloudflare Pages, Netlify, Vercel static indicators
    const staticIndicators = [
      'file:' === window.location.protocol,
      window.location.hostname.includes('.pages.dev'),
      window.location.hostname.includes('.netlify.app'),
      window.location.hostname.includes('.vercel.app'),
      !import.meta.env.SSR
    ];

    return staticIndicators.some(indicator => indicator);
  }

  isStaticDeployment(): boolean {
    return this.isStatic;
  }

  getEnvironment(): string {
    return this.environment;
  }

  // Optimized for static deployment
  shouldUseClientSideOnly(): boolean {
    return this.isStatic;
  }

  // Log deployment info
  logDeploymentInfo(): void {
    console.log('🚀 Deployment Info:', {
      isStatic: this.isStatic,
      environment: this.environment,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown'
    });
  }
}

export const deploymentManager = DeploymentManager.getInstance();