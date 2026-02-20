// migrated from src/utils/api.ts
import type { Channel, CountryMeta, UserMeta } from './types';

const IPTV_MIRROR_BASE_URL = 'https://iptv-mirror.pages.dev';

// A simplified mapping from ISO 639-1 to ISO 639-2/3 for iptv-mirror.
const langCodeMap = {
  aa: "aar",
  ab: "abk",
  af: "afr",
  ak: "aka",
  sq: "alb",
  am: "amh",
  ar: "ara",
  an: "arg",
  hy: "arm",
  as: "asm",
  av: "ava",
  ae: "ave",
  ay: "aym",
  az: "aze",
  ba: "bak",
  bm: "bam",
  be: "bel",
  bn: "ben",
  bh: "bih",
  bi: "bis",
  bo: "tib",
  bs: "bos",
  br: "bre",
  bg: "bul",
  ca: "cat",
  cs: "cze",
  ch: "cha",
  ce: "che",
  zh: "chi",
  cu: "chu",
  cv: "chv",
  kw: "cor",
  co: "cos",
  cr: "cre",
  cy: "wel",
  da: "dan",
  de: "ger",
  dv: "div",
  nl: "dut",
  dz: "dzo",
  el: "gre",
  en: "eng",
  eo: "epo",
  et: "est",
  eu: "baq",
  ee: "ewe",
  fo: "fao",
  fa: "per",
  fj: "fij",
  fi: "fin",
  fr: "fre",
  fy: "fry",
  ff: "ful",
  ka: "geo",
  gd: "gla",
  ga: "gle",
  gl: "glg",
  gv: "glv",
  gn: "grn",
  gu: "guj",
  ht: "hat",
  ha: "hau",
  he: "heb",
  hz: "her",
  hi: "hin",
  ho: "hmo",
  hr: "hrv",
  hu: "hun",
  ig: "ibo",
  is: "ice",
  io: "ido",
  ii: "iii",
  iu: "iku",
  ie: "ile",
  ia: "ina",
  id: "ind",
  ik: "ipk",
  it: "ita",
  jv: "jav",
  ja: "jpn",
  kl: "kal",
  kn: "kan",
  ks: "kas",
  kr: "kau",
  kk: "kaz",
  km: "khm",
  ki: "kik",
  rw: "kin",
  ky: "kir",
  kv: "kom",
  kg: "kon",
  ko: "kor",
  kj: "kua",
  ku: "kur",
  lo: "lao",
  la: "lat",
  lv: "lav",
  li: "lim",
  ln: "lin",
  lt: "lit",
  lb: "ltz",
  lu: "lub",
  lg: "lug",
  mk: "mac",
  mh: "mah",
  ml: "mal",
  mi: "mao",
  mr: "mar",
  ms: "may",
  mg: "mlg",
  mt: "mlt",
  mn: "mon",
  my: "bur",
  na: "nau",
  nv: "nav",
  nr: "nbl",
  nd: "nde",
  ng: "ndo",
  ne: "nep",
  nn: "nno",
  nb: "nob",
  no: "nor",
  ny: "nya",
  oc: "oci",
  oj: "oji",
  or: "ori",
  om: "orm",
  os: "oss",
  pa: "pan",
  pi: "pli",
  pl: "pol",
  pt: "por",
  ps: "pus",
  qu: "que",
  rm: "roh",
  ro: "rum",
  rn: "run",
  ru: "rus",
  sg: "sag",
  sa: "san",
  si: "sin",
  sk: "slo",
  sl: "slv",
  se: "sme",
  sm: "smo",
  sn: "sna",
  sd: "snd",
  so: "som",
  st: "sot",
  es: "spa",
  sc: "srd",
  sr: "srp",
  ss: "ssw",
  su: "sun",
  sw: "swa",
  sv: "swe",
  ty: "tah",
  ta: "tam",
  tt: "tat",
  te: "tel",
  tg: "tgk",
  tl: "tgl",
  th: "tha",
  ti: "tir",
  to: "ton",
  tn: "tsn",
  ts: "tso",
  tk: "tuk",
  tr: "tur",
  tw: "twi",
  ug: "uig",
  uk: "ukr",
  ur: "urd",
  uz: "uzb",
  ve: "ven",
  vi: "vie",
  vo: "vol",
  wa: "wln",
  wo: "wol",
  xh: "xho",
  yi: "yid",
  yo: "yor",
  za: "zha",
  zu: "zul",
};

export const normalizeLangCode = (iso6391: string): string => {
  return (langCodeMap as Record<string, string>)[iso6391.toLowerCase()] || iso6391.toLowerCase(); // Fallback to original if not found
};

export const fetchChannelsByCountry = async (countryCode: string): Promise<Channel[]> => {
  try {
    const response = await fetch(`${IPTV_MIRROR_BASE_URL}/countries/${countryCode.toLowerCase()}.json`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No channels found for country: ${countryCode.toLowerCase()}`);
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Channel[] = await response.json();
    return data.filter(channel => channel.iptv_urls && channel.iptv_urls.length > 0);
  } catch (error) {
    console.error(`Error fetching channels for ${countryCode}:`, error);
    return [];
  }
};

export const fetchCountryMetadata = async (): Promise<{ [key: string]: CountryMeta }> => {
  try {
    const response = await fetch(`${IPTV_MIRROR_BASE_URL}/countries_metadata.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: { [key: string]: CountryMeta } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching country metadata:', error);
    throw error;
  }
};

export const fetchChannelsByCategory = async (categorySlug: string): Promise<Channel[]> => {
  try {
    const response = await fetch(`${IPTV_MIRROR_BASE_URL}/categories/${categorySlug}.json`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No channels found for category: ${categorySlug}`);
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Channel[] = await response.json();
    // TODO: should allow channels with youtube_urls too, for that we need to make sure hls supports youtube_urls first
    return data.filter(channel => channel.iptv_urls && channel.iptv_urls.length > 0);
  } catch (error) {
    console.error(`Error fetching channels for category ${categorySlug}:`, error);
    return [];
  }
};

// Hardcoded categories as per requirements
export const hardcodedCategories = [
  "animation",
  "auto",
  "business",
  "classic",
  "comedy",
  "cooking",
  "culture",
  "documentary",
  "education",
  "entertainment",
  "family",
  "general",
  "kids",
  "legislative",
  "lifestyle",
  "movies",
  "music",
  "news",
  "outdoor",
  "public",
  "relax",
  "religious",
  "science",
  "series",
  "shop",
  "show",
  "sports",
  "top-news",
  "travel",
  "weather"
];

// Hardcoded neighbor countries based on language.
export const getCountriesByLang = (langCode: string): string[] => {
  switch (langCode) {
    case 'spa': // Spanish
      return ["MX", "CO", "ES", "AR", "PE", "VE", "CL", "GT", "EC", "BO", "CU", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "GQ", "PR"];
    case 'eng': // English
      return ["AU", "CA", "IE", "NZ", "UK", "US"];
    // TODO: dummy AI gen data below, complete with accurate lists
    case 'fra': // French
      return ['BE', 'CA', 'FR', 'CH'];
    case 'ger': // German
      return ['AT', 'DE', 'CH'];
    case 'por': // Portuguese
      return ['AO', 'BR', 'CV', 'GW', 'MZ', 'PT', 'ST', 'TL'];
    case 'kor': // Korean
      return ['KR'];
    case 'jpn': // Japanese
      return ['JP'];
    case 'ara': // Arabic
      return ['DZ', 'BH', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'OM', 'PS', 'QA', 'SA', 'SD', 'SY', 'TN', 'AE', 'YE'];
    case 'zho': // Chinese
      return ['CN', 'HK', 'MO', 'SG', 'TW'];
    default:
      return [];
  }
};

export const getUserMeta = async (fallbackLocale?: string): Promise<UserMeta> => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.webOS && window.webOS.service) {
    const fetchSettings = (params: any) => new Promise((resolve, reject) => {
      // @ts-ignore
      window.webOS.service.request('luna://com.webos.settingsservice', {
        method: 'getSystemSettings',
        parameters: params,
        onSuccess: resolve,
        onFailure: reject
      });
    });

    try {
      const [localeRes, countryRes]: any = await Promise.allSettled([
        fetchSettings({ keys: ['localeInfo'] }),
        fetchSettings({ category: 'option', keys: ['smartServiceCountryCode2'] })
      ]);

      let countryCode = countryRes.status === 'fulfilled' ? countryRes.value.settings?.smartServiceCountryCode2 : '';
      let uiLocale = localeRes.status === 'fulfilled' ? localeRes.value.settings?.localeInfo?.locales?.UI : '';

      const parts = (uiLocale || fallbackLocale || 'en-US').split(/[_-]/);
      return {
        countryCode: countryCode || parts[1] || 'US',
        langCode: normalizeLangCode(parts[0])
      };
    } catch (e) {
      console.error('Error fetching webOS settings:', e);
    }
  }

  // Fallback for non-webOS environments
  const parts = (fallbackLocale || 'spa-PE').split(/[_-]/);
  return {
    countryCode: parts[1] || 'PE',
    langCode: normalizeLangCode(parts[0])
  };
}
