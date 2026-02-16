// src/App/App.tsx
import Alert from '@enact/sandstone/Alert';
import ThemeDecorator from '@enact/sandstone/ThemeDecorator';
import { I18nContextDecorator } from '@enact/i18n/I18nDecorator';
import $L from '@enact/i18n/$L';
import Spinner from '@enact/sandstone/Spinner';

import React, { createContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import MainPanel from '../views/MainPanel';
import {
  Channel,
  UserMeta,
  AppState,
  AppContextType,
  CountryMeta,
  ChannelGroup
} from '../types/iptv';
import {
  fetchChannelsByCountry,
  fetchCountryMetadata,
  getCountriesByLang,
  hardcodedCategories,
  fetchChannelsByCategory,
  getUserMeta
} from '../utils/api';

// Initial state for the reducer
const initialAppState: AppState = {
  groups: [],
  activeGroupId: 'favorites',
  currentIndex: 0,
  playlist: [],
  favorites: [],
  userMeta: null,
  fetchedGroupsCount: 0,
  isFetching: null,
  error: null,
  isOverlayOpen: false
};

// Reducer for state management
type Action =
  | { type: 'SET_GROUPS'; groups: ChannelGroup[] }
  | { type: 'ADD_GROUP'; group: ChannelGroup }
  | { type: 'UPDATE_GROUP_CHANNELS'; groupId: string; channels: Channel[] }
  | { type: 'SET_ACTIVE_GROUP_ID'; id: string }
  | { type: 'SET_FAVORITES'; favorites: Channel[] }
  | { type: 'SET_CURRENT_INDEX'; index: number }
  | { type: 'SET_USER_META'; userMeta: UserMeta }
  | { type: 'SET_FETCHED_GROUPS_COUNT'; count: number }
  | { type: 'SET_IS_FETCHING'; isFetching: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_IS_OVERLAY_OPEN'; isOpen: boolean };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_GROUPS': {
      const activeGroup = action.groups.find(g => g.id === state.activeGroupId) || action.groups[0];
      return {
        ...state,
        groups: action.groups,
        playlist: activeGroup ? activeGroup.channels : []
      };
    }
    case 'ADD_GROUP': {
      if (state.groups.some(g => g.id === action.group.id)) return state;
      const newGroups = [...state.groups, action.group];
      return {
        ...state,
        groups: newGroups,
      };
    }
    case 'UPDATE_GROUP_CHANNELS': {
      const newGroups = state.groups.map(g => g.id === action.groupId ? { ...g, channels: action.channels } : g);
      const activeGroup = newGroups.find(g => g.id === state.activeGroupId);
      return {
        ...state,
        groups: newGroups,
        playlist: activeGroup ? activeGroup.channels : state.playlist
      };
    }
    case 'SET_ACTIVE_GROUP_ID': {
      const activeGroup = state.groups.find(g => g.id === action.id);
      return {
        ...state,
        activeGroupId: action.id,
        playlist: activeGroup ? activeGroup.channels : state.playlist,
        currentIndex: 0
      };
    }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.favorites };
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.index };
    case 'SET_USER_META':
      return { ...state, userMeta: action.userMeta };
    case 'SET_FETCHED_GROUPS_COUNT':
      return { ...state, fetchedGroupsCount: action.count };
    case 'SET_IS_FETCHING':
      return { ...state, isFetching: action.isFetching };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_IS_OVERLAY_OPEN':
      return { ...state, isOverlayOpen: action.isOpen };
    default:
      return state;
  }
};

// Create the Context
export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppBase = ({ locale, ...props }: Record<string, any> & { locale?: string }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [announceState, setAnnounceState] = useState({ open: false, title: '' })
  const allCountryMetadataRef = useRef<{ [key: string]: CountryMeta } | null>(null);

  // Ref to track fetching count to avoid stale closures in background loops
  const fetchedGroupsCountRef = useRef(0);

  const setGroups = useCallback((groups: ChannelGroup[]) => dispatch({ type: 'SET_GROUPS', groups }), []);
  const addGroup = useCallback((group: ChannelGroup) => dispatch({ type: 'ADD_GROUP', group }), []);
  const updateGroupChannels = useCallback((groupId: string, channels: Channel[]) =>
    dispatch({ type: 'UPDATE_GROUP_CHANNELS', groupId, channels }), []);

  const setActiveGroupId = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_GROUP_ID', id });
  }, [state.groups]);

  const setFavorites = useCallback((favorites: Channel[]) => {
    dispatch({ type: 'SET_FAVORITES', favorites });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateGroupChannels('favorites', favorites);
  }, [updateGroupChannels]);

  const toggleFavorite = useCallback((channel: Channel) => {
    const isFavorite = state.favorites.some(f => f.nanoid === channel.nanoid);
    const newFavorites = isFavorite
      ? state.favorites.filter(f => f.nanoid !== channel.nanoid)
      : [channel, ...state.favorites];

    setFavorites(newFavorites);
    setAnnounceState({ open: true, title: isFavorite ? $L('Removed from favorites') : $L('Added to favorites') })
  }, [state.favorites, setFavorites]);

  const setCurrentIndex = useCallback((index: number) => dispatch({ type: 'SET_CURRENT_INDEX', index }), []);
  const setUserMeta = useCallback((userMeta: UserMeta) => dispatch({ type: 'SET_USER_META', userMeta }), []);
  const setIsFetching = useCallback((isFetching: boolean) => dispatch({ type: 'SET_IS_FETCHING', isFetching }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', error }), []);
  const setIsOverlayOpen = useCallback((isOpen: boolean) => dispatch({ type: 'SET_IS_OVERLAY_OPEN', isOpen }), []);

  const loadMoreGroups = useCallback(async () => {
    if (!state.userMeta || !allCountryMetadataRef.current) return false;

    const userLang = state.userMeta.langCode;
    const userCountry = state.userMeta.countryCode.toUpperCase();
    const neighbors = getCountriesByLang(userLang).filter(c => c.toUpperCase() !== userCountry);
    const otherCountries = Object.keys(allCountryMetadataRef.current).filter(c =>
      c.toUpperCase() !== userCountry && !neighbors.includes(c.toUpperCase())
    );

    const cursor = fetchedGroupsCountRef.current;

    try {
      if (cursor < neighbors.length) {
        const code = neighbors[cursor];
        const channels = await fetchChannelsByCountry(code);
        if (channels.length > 0) {
          dispatch({
            type: 'ADD_GROUP',
            group: {
              id: code.toLowerCase(),
              displayName: allCountryMetadataRef.current[code.toUpperCase()]?.country || code,
              channels
            }
          });
        }
      } else if (cursor < neighbors.length + hardcodedCategories.length) {
        const catIdx = cursor - neighbors.length;
        const cat = hardcodedCategories[catIdx];
        const channels = await fetchChannelsByCategory(cat);
        const filtered = channels.filter(c => c.language === userLang);
        if (filtered.length > 0) {
          dispatch({
            type: 'ADD_GROUP',
            group: {
              id: `${cat}_${userLang}`,
              displayName: `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${userLang.toUpperCase()})`,
              channels: filtered
            }
          });
        }
      } else if (cursor < neighbors.length + hardcodedCategories.length + otherCountries.length) {
        const otherIdx = cursor - neighbors.length - hardcodedCategories.length;
        const code = otherCountries[otherIdx];
        const channels = await fetchChannelsByCountry(code);
        if (channels.length > 0) {
          dispatch({
            type: 'ADD_GROUP',
            group: {
              id: code.toLowerCase(),
              displayName: allCountryMetadataRef.current[code.toUpperCase()]?.country || code,
              channels
            }
          });
        }
      } else if (cursor < neighbors.length + 2 * hardcodedCategories.length + otherCountries.length) {
        const catIdx = cursor - neighbors.length - hardcodedCategories.length - otherCountries.length;
        const cat = hardcodedCategories[catIdx];
        const channels = await fetchChannelsByCategory(cat);
        const filtered = channels.filter(c => c.language !== userLang)
        if (filtered.length > 0) {
          dispatch({
            type: 'ADD_GROUP',
            group: {
              id: `${cat}_full`,
              displayName: cat.charAt(0).toUpperCase() + cat.slice(1),
              channels: filtered
            }
          });
        }
      } else {
        return false;
      }
      fetchedGroupsCountRef.current += 1;
      dispatch({ type: 'SET_FETCHED_GROUPS_COUNT', count: fetchedGroupsCountRef.current });
      return true;
    } catch (e) {
      console.error('Failed to load more groups', e);
      return false;
    }
  }, [state.userMeta]);

  const navigateToChannel = useCallback(async (index: number) => {
    const channels = state.playlist;
    const groupIndex = state.groups.findIndex(g => g.id === state.activeGroupId);

    if (index >= 0 && index < channels.length) {
      setCurrentIndex(index);
    } else if (index >= channels.length) {
      if (groupIndex === state.groups.length - 1) {
        setIsFetching(true);
        const hasMore = await loadMoreGroups();

        // Start background fetch loop
        (async () => {
          for (let i = 0; i < 4; i++) {
            await loadMoreGroups();
          }
        })();
        setIsFetching(false);
        if (hasMore) {
          dispatch({ type: 'SET_ACTIVE_GROUP_ID', id: state.groups[groupIndex + 1].id });
          setCurrentIndex(0);
        } else {
          dispatch({ type: 'SET_ACTIVE_GROUP_ID', id: state.groups[0].id });
          setCurrentIndex(0);
          return;
        }
      }
      const nextGroupIdx = (groupIndex + 1) % state.groups.length;
      dispatch({ type: 'SET_ACTIVE_GROUP_ID', id: state.groups[nextGroupIdx].id });
      setCurrentIndex(0);
    } else if (index < 0) {
      const prevGroupIdx = (groupIndex - 1 + state.groups.length) % state.groups.length;
      dispatch({ type: 'SET_ACTIVE_GROUP_ID', id: state.groups[prevGroupIdx].id });
      setCurrentIndex(state.groups[prevGroupIdx].channels.length - 1);
    }
  }, [state.playlist, state.groups, state.activeGroupId, setCurrentIndex, loadMoreGroups, setIsFetching]);

  const playChannel = useCallback((channel: Channel, groupId?: string) => {
    const targetGroupId = groupId || state.activeGroupId;
    const group = state.groups.find(g => g.id === targetGroupId);

    if (group) {
      const index = group.channels.findIndex(c => c.nanoid === channel.nanoid);
      if (index > -1) {
        if (targetGroupId !== state.activeGroupId) dispatch({ type: 'SET_ACTIVE_GROUP_ID', id: targetGroupId });
        setCurrentIndex(index);
      } else {
        updateGroupChannels('favorites', [channel, ...state.favorites]);
        dispatch({ type: 'SET_ACTIVE_GROUP_ID', id: 'favorites' });
        setCurrentIndex(0);
      }
    }
    setIsOverlayOpen(false);
  }, [state.groups, state.activeGroupId, state.favorites, updateGroupChannels, setIsOverlayOpen, setCurrentIndex]);

  useEffect(() => {
    const initialize = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const initialGroups: ChannelGroup[] = [];

        const savedFavorites = localStorage.getItem('favorites');
        let initialFavorites: Channel[] = [];
        if (savedFavorites) {
          try { initialFavorites = JSON.parse(savedFavorites); } catch (e) { }
        }
        dispatch({ type: 'SET_FAVORITES', favorites: initialFavorites });
        initialGroups.push({ id: 'favorites', displayName: $L('Favorites'), channels: initialFavorites });

        const currentUserMeta = await getUserMeta(locale)
        setUserMeta(currentUserMeta);

        allCountryMetadataRef.current = await fetchCountryMetadata();

        const userCountryChannels = await fetchChannelsByCountry(currentUserMeta.countryCode);

        if (userCountryChannels.length > 0) {
          initialGroups.push({
            id: currentUserMeta.countryCode.toLowerCase(),
            displayName: allCountryMetadataRef.current[currentUserMeta.countryCode.toUpperCase()]?.country || currentUserMeta.countryCode,
            channels: userCountryChannels
          });
        }

        setGroups(initialGroups);
        const startGroupId = initialFavorites.length > 0 ? 'favorites' : initialGroups[1]?.id || 'favorites';
        setActiveGroupId(startGroupId);

        setIsFetching(false);

        // Start background fetch loop
        (async () => {
          for (let i = 0; i < 4; i++) {
            await loadMoreGroups();
          }
        })();

      } catch (e: any) {
        console.error('Initialization error:', e);
        setError(e.message || $L('Failed to initialize application.'));
        setIsFetching(false);
      }
    };

    initialize();

    document.addEventListener("keydown", function(inEvent) {
      console.log(inEvent.keyCode)
    });
  }, []);

  const appContextValue: AppContextType = {
    ...state,
    setFavorites,
    setGroups,
    addGroup,
    updateGroupChannels,
    toggleFavorite,
    setActiveGroupId,
    setCurrentIndex,
    setUserMeta,
    setIsFetching,
    setError,
    setIsOverlayOpen,
    navigateToChannel,
    playChannel,
    loadMoreGroups,
    setAnnounceState,
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div {...props} style={{ height: '100vh', width: '100vw', padding: '0px' }}>
        {state.isFetching && state.groups.length === 0 ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}><Spinner component="div" /></div>
        ) : state.error && state.groups.length === 0 ? (
          <div style={{ color: 'red', fontSize: '2em', textAlign: 'center', marginTop: '20%' }}>{$L('Error: {error}').replace('{error}', state.error || '')}</div>
        ) : state.groups.length > 0 ? (
          <>
            {/* <div id="results"></div> */}
            <MainPanel />
          </>
        ) : null}
      </div>
      {/* <Alert open={announceState.open} title={announceState.title} onClose={() => setAnnounceState((s) => ({ ...s, open: false }))} /> */}
    </AppContext.Provider>
  );
};

const App = ThemeDecorator(I18nContextDecorator({ localeProp: 'locale' }, AppBase));

export default App;
