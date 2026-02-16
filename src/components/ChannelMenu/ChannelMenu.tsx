// src/components/ChannelMenu/ChannelMenu.tsx
import React, { useContext, useState, useCallback, useEffect } from 'react';
import { Panel, Header } from '@enact/sandstone/Panels';
import Item from '@enact/sandstone/Item';
import Button from '@enact/sandstone/Button';
import Scroller from '@enact/sandstone/Scroller';
import Popup from '@enact/sandstone/Popup'; // Use popup for the menu
import $L from '@enact/i18n/$L';
import { AppContext } from '../../App/App';
import { Channel, AppContextType, CountryMeta } from '../../types/iptv';
import { hardcodedCategories, fetchChannelsByCategory, fetchCountryMetadata } from '../../utils/api';

import css from './ChannelMenu.module.less';

enum MenuState {
  MAIN = 'main',
  ALL_CHANNELS = 'allChannels',
  CATEGORIES = 'categories',
  COUNTRIES = 'countries',
}

interface ChannelMenuProps {
  open?: boolean;
  onClose?: () => void;
  [key: string]: any;
}

const ChannelMenu = (props: ChannelMenuProps) => {
    const {open, onClose, ...rest} = props;
    const appContext = useContext(AppContext);

    if (!appContext) {
      throw new Error('ChannelMenu must be used within an AppContext.Provider');
    }

    const {
      playlist,
      playChannel,
      setIsOverlayOpen,
      setError,
    }: AppContextType = appContext;

    const [menuState, setMenuState] = useState<MenuState>(MenuState.MAIN);
    const [allCountryMetadata, setAllCountryMetadata] = useState<{ [key: string]: CountryMeta } | null>(null);

    useEffect(() => {
        const loadCountryMetadata = async () => {
            try {
                const metadata = await fetchCountryMetadata();
                setAllCountryMetadata(metadata);
            } catch (e: any) {
                console.error('Error loading country metadata for menu:', e);
                setError(e.message || $L('Failed to load country list.'));
            }
        };
        if (menuState === MenuState.COUNTRIES && !allCountryMetadata) {
            loadCountryMetadata();
        }
    }, [menuState, allCountryMetadata, setError]);


    const handleChannelSelect = useCallback((channel: Channel) => {
      playChannel(channel);
      setIsOverlayOpen(false);
    }, [playChannel, setIsOverlayOpen]);

    const renderMainPanel = () => (
      <Panel className={css.panel}>
        <Header title={$L('Menu')} />
        <div className={css.menuBody}>
          <Button onClick={() => setMenuState(MenuState.ALL_CHANNELS)} className={css.menuButton}>{$L('All Channels')}</Button>
          <Button onClick={() => setMenuState(MenuState.CATEGORIES)} className={css.menuButton}>{$L('Categories')}</Button>
          <Button onClick={() => setMenuState(MenuState.COUNTRIES)} className={css.menuButton}>{$L('Countries')}</Button>
          <Button onClick={() => setIsOverlayOpen(false)} className={css.menuButton}>{$L('Close')}</Button>
        </div>
      </Panel>
    );

    const renderAllChannelsPanel = () => (
      <Panel className={css.panel}>
        <Header title={$L('All Channels')} onBack={() => setMenuState(MenuState.MAIN)} />
        <Scroller className={css.scroller}>
          {playlist.map((channel, index) => (
            <Item key={channel.nanoid + index} onClick={() => handleChannelSelect(channel)} className={css.item}>
              {channel.name} ({channel.country})
            </Item>
          ))}
        </Scroller>
      </Panel>
    );

    const renderCategoriesPanel = () => (
      <Panel className={css.panel}>
        <Header title={$L('Categories')} onBack={() => setMenuState(MenuState.MAIN)} />
        <Scroller className={css.scroller}>
          {hardcodedCategories.map(category => (
            <Button key={category} className={css.menuButton} onClick={async () => {
              // In a real app, this would show subcategories or fetch channels directly
              // For now, let's just fetch and play the first channel of the category
              const categoryChannels = await fetchChannelsByCategory(category);
              if (categoryChannels.length > 0) {
                handleChannelSelect(categoryChannels[0]);
              } else {
                setError($L('No channels found for {category}.').replace('{category}', category));
              }
            }}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </Scroller>
      </Panel>
    );

    const renderCountriesPanel = () => (
        <Panel className={css.panel}>
            <Header title={$L('Countries')} onBack={() => setMenuState(MenuState.MAIN)} />
            <Scroller className={css.scroller}>
                {allCountryMetadata ? Object.entries(allCountryMetadata)
                    .filter(([, meta]) => meta.hasChannels)
                    .map(([code, meta]) => (
                        <Button key={code} className={css.menuButton} onClick={async () => {
                            // In a real app, this would fetch channels for the selected country
                            // For now, this is a placeholder. MainPanel already handles country fetching.
                            setError($L('Fetching channels for {country} is not yet implemented from menu.').replace('{country}', meta.country));
                            setIsOverlayOpen(false); // Close the menu
                        }}>
                            {meta.country} ({code})
                        </Button>
                    )) : $L('Loading countries...')}
            </Scroller>
        </Panel>
    );

    let currentPanel;
    switch (menuState) {
      case MenuState.ALL_CHANNELS:
        currentPanel = renderAllChannelsPanel();
        break;
      case MenuState.CATEGORIES:
        currentPanel = renderCategoriesPanel();
        break;
      case MenuState.COUNTRIES:
        currentPanel = renderCountriesPanel();
        break;
      case MenuState.MAIN:
      default:
        currentPanel = renderMainPanel();
        break;
    }

    return (
      <Popup
        {...rest}
        open={open !== undefined ? open : appContext.isOverlayOpen}
        onClose={onClose || (() => setIsOverlayOpen(false))}
        noAnimation
        className={css.channelMenuPopup}
      >
        <div className={css.channelMenu}>
            {currentPanel}
        </div>
      </Popup>
    );
};

export default ChannelMenu;
