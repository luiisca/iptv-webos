// migrated from src/App/App.tsx (state management part)
import { tick, untrack } from 'svelte';
import { get } from 'svelte/store';
import { t } from './i18n';
import {
  fetchChannelsByCountry,
  fetchChannelsByCategory,
  getCountriesByLang,
  hardcodedCategories
} from './api';
import type { Channel, ChannelGroup, UserMeta, CountryMeta } from './types';

export interface Alert {
  id: string;
  message: string;
  type?: 'info' | 'error';
}

class AppState {
  groups = $state<ChannelGroup[]>([]);
  activeGroupId = $state<string>('favorites');
  currentIndex = $state<number>(0);
  favorites = $state<Channel[]>([]);
  userMeta = $state<UserMeta | null>(null);
  fetchedGroupsCount = $state<number>(0);
  isFetching = $state<boolean | null>(null);
  isAllFetched = $state<boolean>(false)
  error = $state<string | null>(null);
  isOverlayOpen = $state<boolean>(false);
  allCountryMetadata = $state<Record<string, CountryMeta> | null>(null);
  skin = $state<string>('neutral');
  alerts = $state<Alert[]>([]);

  playlist = $derived.by(() => {
    // untrack groups to ensure currently playing playlist is not replaced when a new favorite is added
    const activeGroup = untrack(() => this.groups).find(g => g.id === this.activeGroupId);
    return activeGroup ? activeGroup.channels : [];
  });

  currentChannel = $derived(this.playlist[this.currentIndex] || null);

  setGroups(groups: ChannelGroup[]) {
    this.groups = groups;
  }

  addGroup(group: ChannelGroup) {
    if (this.groups.some(g => g.id === group.id)) return;
    this.groups.push(group);
  }

  updateGroupChannels(groupId: string, channels: Channel[]) {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      group.channels = channels;
    }
  }

  setActiveGroupId(id: string) {
    this.activeGroupId = id;
    this.currentIndex = 0;
  }

  setFavorites(favorites: Channel[]) {
    this.favorites = favorites;
    localStorage.setItem('favorites', JSON.stringify(favorites));
    this.updateGroupChannels('favorites', favorites);
  }

  toggleFavorite(channel: Channel) {
    const isFavorite = this.favorites.some(f => f.nanoid === channel.nanoid);
    const _t = get(t);
    if (isFavorite) {
      this.favorites = this.favorites.filter(f => f.nanoid !== channel.nanoid);
      this.showAlert(_t('Removed {{name}} from favorites', { name: channel.name }));
    } else {
      this.favorites = [...this.favorites, channel];
      this.showAlert(_t('Added {{name}} to favorites', { name: channel.name }));
    }
    this.setFavorites(this.favorites);
  }

  setCurrentIndex(index: number) {
    this.currentIndex = index;
  }

  async loadMoreGroups() {
    if (!this.userMeta || !this.allCountryMetadata) return false;

    const userLang = this.userMeta.langCode;
    const userCountry = this.userMeta.countryCode.toUpperCase();
    const neighbors = getCountriesByLang(userLang).filter(c => c.toUpperCase() !== userCountry);
    const otherCountries = Object.keys(this.allCountryMetadata).filter(c =>
      c.toUpperCase() !== userCountry && !neighbors.includes(c.toUpperCase())
    );

    const cursor = this.fetchedGroupsCount;

    try {
      const _t = get(t);
      if (cursor < neighbors.length) {
        const code = neighbors[cursor];
        const channels = await fetchChannelsByCountry(code);
        if (channels.length > 0) {
          this.addGroup({
            id: code.toLowerCase(),
            displayName: this.allCountryMetadata[code.toUpperCase()]?.country || code,
            channels
          });
        }
      } else if (cursor < neighbors.length + hardcodedCategories.length) {
        const catIdx = cursor - neighbors.length;
        const cat = hardcodedCategories[catIdx];
        const channels = await fetchChannelsByCategory(cat);
        const filtered = channels.filter(c => c.language === userLang);
        if (filtered.length > 0) {
          const catName = _t(cat);
          this.addGroup({
            id: `${cat}_${userLang}`,
            displayName: `${catName} (${userLang.toUpperCase()})`,
            channels: filtered
          });
        }
      } else if (cursor < neighbors.length + hardcodedCategories.length + otherCountries.length) {
        const otherIdx = cursor - neighbors.length - hardcodedCategories.length;
        const code = otherCountries[otherIdx];
        const channels = await fetchChannelsByCountry(code);
        if (channels.length > 0) {
          this.addGroup({
            id: code.toLowerCase(),
            displayName: this.allCountryMetadata[code.toUpperCase()]?.country || code,
            channels
          });
        }
      } else if (cursor < neighbors.length + 2 * hardcodedCategories.length + otherCountries.length) {
        const catIdx = cursor - neighbors.length - hardcodedCategories.length - otherCountries.length;
        const cat = hardcodedCategories[catIdx];
        const channels = await fetchChannelsByCategory(cat);
        const filtered = channels.filter(c => c.language !== userLang)
        if (filtered.length > 0) {
          const catName = _t(cat);
          this.addGroup({
            id: `${cat}_full`,
            displayName: catName,
            channels: filtered
          });
        }
      } else {
        return false;
      }
      this.fetchedGroupsCount += 1;
      return true;
    } catch (e) {
      console.error('Failed to load more groups', e);
      return false;
    }
  }

  async navigateToChannel(index: number) {
    const channels = this.playlist;
    const groupIndex = this.groups.findIndex(g => g.id === this.activeGroupId);

    if (index >= 0 && index < channels.length) {
      this.currentIndex = index;
    } else if (index >= channels.length) {
      if (groupIndex === this.groups.length - 1) {
        this.isFetching = true;
        const hasMore = await this.loadMoreGroups();
        // Background fetch
        (async () => {
          for (let i = 0; i < 4; i++) {
            await this.loadMoreGroups();
          }
        })();
        this.isFetching = false;
        if (hasMore) {
          this.setActiveGroupId(this.groups[groupIndex + 1].id);
        } else {
          this.isAllFetched = true;
          this.setActiveGroupId(this.groups[0].id);
        }
      } else {
        const nextGroupIdx = (groupIndex + 1) % this.groups.length;
        this.setActiveGroupId(this.groups[nextGroupIdx].id);
      }
    } else if (index < 0) {
      if (groupIndex === 0 && !this.isAllFetched) return;

      const prevGroupIdx = (groupIndex - 1 + this.groups.length) % this.groups.length;
      const prevGroup = this.groups[prevGroupIdx];
      this.activeGroupId = prevGroup.id;
      this.currentIndex = prevGroup.channels.length - 1;
    }
  }

  playChannel(channel: Channel, groupId?: string) {
    const targetGroupId = groupId || this.activeGroupId;
    const group = this.groups.find(g => g.id === targetGroupId);

    if (group) {
      const index = group.channels.findIndex(c => c.nanoid === channel.nanoid);
      if (index > -1) {
        if (targetGroupId !== this.activeGroupId) {
          this.activeGroupId = targetGroupId;
        }
        this.currentIndex = index;
      }
    }
    this.isOverlayOpen = false;
  }

  showAlert(message: string, type: 'info' | 'error' = 'info') {
    const id = Math.random().toString(36).substring(7);
    this.alerts.push({ id, message, type });
    setTimeout(() => {
      this.alerts = this.alerts.filter(a => a.id !== id);
    }, 3000);
  }
}

export const appState = new AppState();
