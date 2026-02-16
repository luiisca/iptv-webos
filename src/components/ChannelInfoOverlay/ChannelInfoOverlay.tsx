// src/components/ChannelInfoOverlay/ChannelInfoOverlay.tsx
import React, { useContext } from 'react';
import Popup from '@enact/sandstone/Popup';
import Heading from '@enact/sandstone/Heading';
import BodyText from '@enact/sandstone/BodyText';
import Icon from '@enact/sandstone/Icon';
import Marquee from '@enact/sandstone/Marquee';
import $L from '@enact/i18n/$L';
import { AppContext } from '../../App/App';
import { Channel } from '../../types/iptv';
import css from './ChannelInfoOverlay.module.less';

interface ChannelInfoOverlayProps {
  channel: Channel | null;
  channelNumber: number;
  visible: boolean;
}

const ChannelInfoOverlay = ({ channel, channelNumber, visible }: ChannelInfoOverlayProps) => {
  const appContext = useContext(AppContext);
  if (!channel || !appContext) {
    return null;
  }

  const { favorites, groups, activeGroupId } = appContext;
  const isFavorite = favorites.some(f => f.nanoid === channel.nanoid);
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const groupName = activeGroup ? activeGroup.displayName : '';
  const locale = [channel.language, channel.country].filter(Boolean).join('-');

  return (
    <Popup
      open={visible}
      position="left"
      noAnimation
      className={css.popup}
      scrimType="none"
      data-testid="channel-info-overlay"
      aria-label={$L('Channel Information Overlay')}
    >
      <div className={css.container}>
        <div className={css.headerSection}>
          <Heading className={css.channelNumber} data-testid="channel-number">
            {channelNumber}
          </Heading>
        </div>

        <div className={css.contentSection}>
          <div className={css.topRow}>
            <Marquee className={css.channelName} data-testid="channel-name">{channel.name}</Marquee>
            <div className={css.badges}>
              {isFavorite && <Icon size="small" className={css.favoriteIcon} data-testid="favorite-icon" aria-label={$L('Favorite')}>star</Icon>}
              {channel.isGeoBlocked && <Icon size="small" className={css.lockedIcon} data-testid="locked-icon" aria-label={$L('Geo-blocked')}>lock</Icon>}
            </div>
          </div>

          <div className={css.bottomRow}>
            <BodyText className={css.groupName} data-testid="group-name">{groupName}</BodyText>
            {locale && (
              <>
                <span className={css.separator}>|</span>
                <BodyText className={css.channelLocale} data-testid="channel-locale">{locale}</BodyText>
              </>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default ChannelInfoOverlay;
