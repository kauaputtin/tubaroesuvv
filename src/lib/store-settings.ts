import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type StoreChromeSettings = {
  identity: Record<string, string>;
  contact: Record<string, string>;
};

const defaultSettings: StoreChromeSettings = {
  identity: { primary: "#00162f", accent: "#0a87f5" },
  contact: {
    whatsapp: "5527999999999",
    email: "contato@tubaroesuvv.com.br",
    instagram: "tubaroesuvv",
  },
};

export const getStoreChromeSettings = unstable_cache(async (): Promise<StoreChromeSettings> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return defaultSettings;

  const { data, error } = await supabase
    .from("store_settings")
    .select("key,value")
    .in("key", ["identity", "contact"]);

  if (error) return defaultSettings;

  const settings: StoreChromeSettings = {
    identity: { ...defaultSettings.identity },
    contact: { ...defaultSettings.contact },
  };

  for (const row of data ?? []) {
    if (row.key === "identity") settings.identity = { ...settings.identity, ...(row.value as Record<string, string>) };
    if (row.key === "contact") settings.contact = { ...settings.contact, ...(row.value as Record<string, string>) };
  }

  return settings;
}, ["store-chrome-settings-v1"], { revalidate: 60, tags: ["store-settings"] });
