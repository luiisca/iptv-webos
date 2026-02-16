// src/views/MainPanel.tsx
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Spinner from '@enact/sandstone/Spinner';
import $L from '@enact/i18n/$L';
import { AppContext } from '../App/App';
import { AppContextType } from '../types/iptv';

import ChannelMenu from '../components/ChannelMenu/ChannelMenu';
import ChannelInfoOverlay from '../components/ChannelInfoOverlay/ChannelInfoOverlay';
import QuickSelectOverlay from '../components/QuickSelectOverlay/QuickSelectOverlay';

const MainPanel = ({ ...props }: Record<string, any>) => {
  const appContext = useContext(AppContext);

  if (!appContext) {
    throw new Error('MainPanel must be used within an AppContext.Provider');
  }

  const {
    playlist,
    currentIndex,
    isFetching,
    isOverlayOpen,
    setIsOverlayOpen,
    navigateToChannel,
    toggleFavorite,
    setError,
  }: AppContextType = appContext;

  const currentChannel = playlist[currentIndex]
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // State
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isInfoOverlayVisible, setInfoOverlayVisible] = useState(false);
  const infoOverlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showInfoOverlay = useCallback(() => {
    if (infoOverlayTimeout.current) {
      clearTimeout(infoOverlayTimeout.current);
    }

    if (!isInfoOverlayVisible) setInfoOverlayVisible(true);
    infoOverlayTimeout.current = setTimeout(() => {
      setInfoOverlayVisible(false);
    }, 4000); // Hide after 4 seconds
  }, []);

  // HLS.js setup and teardown
  useEffect(() => {
    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error...', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable error', data);
              setError($L('Video playback error.'));
              hls.destroy();
              break;
          }
        }
      });

      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
  }, [setError]);

  // Load HLS source
  useEffect(() => {
    if (currentChannel && videoRef.current) {
      // TODO: should try to play currentChannel.youtube_urls[0] as a fallback before throwing an error
      const streamUrl = currentChannel.iptv_urls[0];
      const video = videoRef.current;

      if (hlsRef.current) {
        hlsRef.current.loadSource(streamUrl);
        hlsRef.current.once(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.error('Autoplay was prevented.', e));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(e => console.error('Autoplay was prevented.', e));
      }
    }
  }, [currentChannel]);

  // Video state handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => setIsLoadingVideo(true);
    const handlePlaying = () => setIsLoadingVideo(false);

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // Main keydown handler
  const handleKeyDown = (ev: KeyboardEvent) => {
    const { keyCode, key } = ev;

    if (isOverlayOpen) {
      if (keyCode === 406) { // BLUE
        ev.preventDefault();
        setIsOverlayOpen(false);
      }
      return;
    }

    switch (keyCode) {
      case 13: // ENTER
        ev.preventDefault();
        showInfoOverlay();
        break;
      case 33: // CHANNELUP
        ev.preventDefault();
        navigateToChannel(currentIndex + 1);
        break;
      case 34: // CHANNELDOWN
        ev.preventDefault();
        navigateToChannel(currentIndex - 1);
        break;
      case 406: // BLUE
        ev.preventDefault();
        setIsOverlayOpen(true);
        break;
      case 108: // RED
        ev.preventDefault();
        if (currentChannel) {
          toggleFavorite(currentChannel);
        }
        break;
      default:
        break;
    }
  }


  useEffect(() => {
    if (!isInfoOverlayVisible) setInfoOverlayVisible(true)
    infoOverlayTimeout.current = setTimeout(() => {
      setInfoOverlayVisible(false);
    }, 4000);

    return () => {
      if (infoOverlayTimeout.current) clearTimeout(infoOverlayTimeout.current)
    }
  }, [currentIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div {...props} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'black' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        autoPlay
      />

      <ChannelInfoOverlay
        channel={currentChannel}
        channelNumber={currentIndex + 1}
        visible={isInfoOverlayVisible}
      />

      <QuickSelectOverlay />

      {(isLoadingVideo || isFetching) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
        }}>
          <Spinner component="div" />
        </div>
      )}

      <ChannelMenu open={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} />
    </div>
  );
};

MainPanel.displayName = 'MainPanel';

export default MainPanel;
