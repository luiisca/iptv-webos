// src/components/QuickSelectOverlay/QuickSelectOverlay.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Popup from '@enact/sandstone/Popup';
import Item from '@enact/sandstone/Item';
import Heading from '@enact/sandstone/Heading';
import Scroller from '@enact/sandstone/Scroller';
import Spinner from '@enact/sandstone/Spinner';
import $L from '@enact/i18n/$L';
import { AppContextType, Channel, ChannelGroup } from '../../types/iptv';
import css from './QuickSelectOverlay.module.less';
import { AppContext } from '../../App/App';

interface QuickSelectMatch {
  group: ChannelGroup;
  channel: Channel;
  groupIndex: number;
}

interface QuickSelectOverlayProps {
  onClose?: () => void;
  onSelect?: () => void;
}

const QuickSelectOverlay = ({ onClose, onSelect }: QuickSelectOverlayProps) => {
  const appContext = useContext(AppContext);

  if (!appContext) {
    throw new Error('MainPanel must be used within an AppContext.Provider');
  }

  const {
    playlist,
    currentIndex,
    groups,
    playChannel,
    loadMoreGroups
  }: AppContextType = appContext

  const currentChannel = playlist[currentIndex]

  const [numericInput, setNumericInput] = useState<string>('');
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [isFetching, setIsQuickSelectingAndFetching] = useState(false);
  const numericInputTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    if (!numericInput) return [];
    const channelIndex = parseInt(numericInput, 10) - 1;
    return groups.map((group, gIdx) => {
      const channel = group.channels[channelIndex];
      if (!channel) return null;
      return { group, channel, groupIndex: gIdx + 1 };
    }).filter((m): m is any => m !== null);
  }, [numericInput, groups]);

  const handleQuickSelect = (matchIdx: number) => {
    const match = matches[matchIdx];
    if (match) {
      playChannel(match.channel, match.group.id);
    }
    setNumericInput('');
    setSelectedMatchIndex(0);
  }

  // should only be run from within useEffect, as it requires the most up to date values to function as expected
  const refreshQuickSelect = async () => {
    const channelIndex = parseInt(numericInput, 10) - 1;
    const currentMatchesCount = groups.filter(g => g.channels[channelIndex]).length;

    if (selectedMatchIndex + 5 >= currentMatchesCount - 1) {
      setIsQuickSelectingAndFetching(true);
      await loadMoreGroups();
      for (let i = 0; i < 5; i++) {
        const hasMore = await loadMoreGroups();
        if (!hasMore) break;
      }
      setIsQuickSelectingAndFetching(false);
    }
  }

  const handleKeyDown = (ev: KeyboardEvent) => {
    const { keyCode, key } = ev;

    switch (keyCode) {
      case 13: // ENTER
        ev.preventDefault();

        if (numericInput.length > 0 && matches.length > 0) {
          handleQuickSelect(selectedMatchIndex);
        }
        break;
      case 38: // UP
        ev.preventDefault();

        if (numericInput.length > 0 && matches.length > 0) {
          setSelectedMatchIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case 40: // DOWN 
        ev.preventDefault();

        if (numericInput.length > 0 && matches.length > 0) {
          setSelectedMatchIndex(prev => (prev < matches.length - 1 ? prev + 1 : matches.length - 1));
        }
        break;
      case 406: // BLUE
        ev.preventDefault();
        setNumericInput('')
        break;
      case 108: // RED
        ev.preventDefault();
        if (currentChannel) {
          setNumericInput('')
        }
        break;
      case 412: // BACK
        if (numericInput.length > 0) {
          ev.preventDefault();
          const next = numericInput.slice(0, -1);
          setNumericInput(next);
          if (next === '') {
            setSelectedMatchIndex(0);
          }
        }
        break;
      default:
        if (key >= '0' && key <= '9') {
          ev.preventDefault();

          const next = numericInput + key;
          setNumericInput(next);
          setSelectedMatchIndex(0); // Reset selection to top (Favorites) when number changes
        }
        break;
    }
  }


  useEffect(() => {
    if (numericInput.length > 0 && !isFetching) {
      // add timeout to select a channel automatically
      numericInputTimeout.current = setTimeout(() => {
        handleQuickSelect(selectedMatchIndex);
      }, 3000);

      // refresh matches
      refreshQuickSelect();
    }

    return () => {
      if (numericInputTimeout.current) clearTimeout(numericInputTimeout.current)
    }
  }, [numericInput, selectedMatchIndex, isFetching])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (numericInput.length === 0 && !isFetching) {
    return null
  } else {
    return (
      <Popup
        open={numericInput.length > 0}
        onClose={onClose}
        position="left"
        noAnimation
        className={css.popup}
        scrimType="transparent"
        data-testid="quick-select-overlay"
        aria-label={$L('Quick Select Overlay')}
      >
        <div className={css.container} data-testid='container'>
          <div className={css.inputSection} data-testid='inputSection'>
            <Heading className={css.numericInput} data-testid="numeric-input">
              {numericInput}
            </Heading>
          </div>
          <div className={css.listSection} data-testid='listSection'>
            <Scroller className={css.scroller} direction="vertical" verticalScrollbar="auto" data-testid="quick-select-scroller">
              {matches.map((match, idx) => (
                <Item
                  key={`${match.group.id}-${match.channel.nanoid}`}
                  onClick={() => handleQuickSelect(idx)}
                  className={`${css.item} ${idx === selectedMatchIndex ? css.selected : ''}`}
                  label={match.group.displayName}
                  data-testid={`quick-select-item-${idx}`}
                  aria-selected={idx === selectedMatchIndex}
                  slotBefore={
                    <span className={css.channelNumber} data-testid={`channel-number-${idx}`}>{numericInput}-{match.groupIndex}</span>
                  }
                >
                  {match.channel.name}
                </Item>
              ))}
              {isFetching && (
                <div className={css.spinnerContainer} data-testid="fetching-spinner">
                  <Spinner component="div" size="small" />
                </div>
              )}
            </Scroller>
          </div>
        </div>
      </Popup>
    );
  }
};

export default QuickSelectOverlay;
