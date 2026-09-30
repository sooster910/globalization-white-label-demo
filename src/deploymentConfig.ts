import { z } from "zod";

const DeploymentConfigSchema = z.object({
  brandId: z.enum(["everex", "xenco"]),
  apiBaseUrl: z.url().startsWith("https://"),
  market: z.object({ countryCode: z.enum(["US", "SG"]) }),
  defaults: z.object({ locale: z.enum(["en-US", "en-SG"]) }),
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

// 배포 환경변수는 여기에서만 읽고 검증한다.
export const deploymentConfig = DeploymentConfigSchema.parse({
  brandId: import.meta.env.VITE_BRAND_ID,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  market: { countryCode: import.meta.env.VITE_MARKET_COUNTRY_CODE },
  defaults: { locale: import.meta.env.VITE_DEFAULT_LOCALE },
});
