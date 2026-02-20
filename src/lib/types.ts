// migrated from src/types/iptv.ts
export interface Channel {
  nanoid: string;
  name: string;
  iptv_urls: string[];
  youtube_urls: string[];
  language: string; // ISO 639-2/3 code (e.g., 'spa', 'eng')
  country: string;  // ISO 3166-1 alpha-2 code (e.g., 'PE', 'US')
  isGeoBlocked: boolean;
  isBroadcast?: boolean;
}

export interface CountryMeta {
  country: string; // Full country name (e.g., 'Peru')
  capital: string;
  timeZone: string;
  hasChannels: boolean;
}

export interface UserMeta {
  countryCode: string; // ISO 3166-1 alpha-2 code
  langCode: string;    // ISO 639-2/3 code
}

export interface ChannelGroup {
  id: string;
  displayName: string;
  channels: Channel[];
}

export interface AppState {
  playlist: Channel[]; // The channels of the currently active group (for Up/Down)
  groups: ChannelGroup[]; // Dynamic list of groups (favorites, countries, categories)
  activeGroupId: string;
  currentIndex: number;  // Current index within the active group
  favorites: Channel[];
  userMeta: UserMeta | null;
  fetchedGroupsCount: number; // Tracks how many non-favorites groups were fetched
  isFetching: boolean | null;
  error: string | null;
  isOverlayOpen: boolean;
}
