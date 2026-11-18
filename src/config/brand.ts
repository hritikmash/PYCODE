export interface BrandConfig {
  appName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  companyName: string;
  costPerMillionTokensUsd: number;
}

export const BRAND_CONFIG: BrandConfig = {
  appName: 'PyFix AI',
  tagline: 'Interactive Python Debugging & Code Intelligence',
  logoUrl: '', // Set a custom logo image URL here for white-label deployments; defaults to the built-in geometric emblem.
  primaryColor: '#06B6D4',
  secondaryColor: '#38BDF8',
  supportEmail: 'support@pyfix.ai',
  companyName: 'PyFix Labs',
  costPerMillionTokensUsd: 0.30,
};
