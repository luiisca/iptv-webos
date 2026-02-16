// src/types/iptv.ts

export interface Channel {
  nanoid: string;
  name: string;
  iptv_urls: string[];
  youtube_urls: string[];
  language: string; // ISO 639-2/3 code (e.g., 'spa', 'eng')
  country: string;  // ISO 3166-1 alpha-2 code (e.g., 'PE', 'US')
  isGeoBlocked: boolean;
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

// For Context API
export interface AppContextType extends AppState {
  setGroups: (groups: ChannelGroup[]) => void;
  addGroup: (group: ChannelGroup) => void;
  updateGroupChannels: (groupId: string, channels: Channel[]) => void;
  setActiveGroupId: (id: string) => void;
  setFavorites: (favorites: Channel[]) => void;
  toggleFavorite: (channel: Channel) => void;
  setCurrentIndex: (index: number) => void;
  setUserMeta: (meta: UserMeta) => void;
  setIsFetching: (fetching: boolean) => void;
  setError: (error: string | null) => void;
  setIsOverlayOpen: (open: boolean) => void;
  // Function to navigate to a channel by index, potentially jumping between groups
  navigateToChannel: (index: number) => void;
  // Function to play a specific channel and switch its group to active
  playChannel: (channel: Channel, groupId?: string) => void;
  // Function to fetch and add more groups to the app state
  loadMoreGroups: () => Promise<boolean>;
  setAnnounceState: React.Dispatch<React.SetStateAction<{
    open: boolean;
    title: string;
  }>>
}
