import type { DeploymentConfig } from "./deploymentConfig";

export type BrandConfig = {
  displayName: string;
  logoUrl: string;
  faviconUrl: string;
  theme: { primary: string; secondary: string };
  supportEmail: string;
  termsUrl: string;
  privacyUrl: string;
  mark: string;
};

// 브랜드 레지스트리는 화면 표현 정보만 담는다. API/시장/기능 정책은 여기서 결정하지 않는다.
export const brandRegistry = {
  everex: {
    displayName: "EverEx Rehab RTM",
    logoUrl: "/brands/everex/logo.svg",
    faviconUrl: "/brands/everex/favicon.svg",
    theme: { primary: "#087d73", secondary: "#e7f5f1" },
    supportEmail: "support@everex.com",
    termsUrl: "https://everex.com/terms",
    privacyUrl: "https://everex.com/privacy",
    mark: "e",
  },
  xenco: {
    displayName: "Xenco Care",
    logoUrl: "/brands/xenco/logo.svg",
    faviconUrl: "/brands/xenco/favicon.svg",
    theme: { primary: "#16324f", secondary: "#edf3f7" },
    supportEmail: "support@xenco.com",
    termsUrl: "https://xenco.com/terms",
    privacyUrl: "https://xenco.com/privacy",
    mark: "X",
  },
} satisfies Record<DeploymentConfig["brandId"], BrandConfig>;
