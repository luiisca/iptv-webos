<!-- migrated from src/views/MainPanel.tsx -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Hls from "hls.js";
  import Spinner from "./Spinner.svelte";
  import ChannelInfoOverlay from "./ChannelInfoOverlay.svelte";
  import QuickSelectOverlay from "./QuickSelectOverlay.svelte";
  import ChannelMenu from "./ChannelMenu.svelte";
  import Alert from "./Alert.svelte";
  import { appState } from "./appState.svelte";
  import { on } from "svelte/events";
  import { t } from "./i18n";

  let videoRef: HTMLVideoElement;
  let cleanKeydown: () => void;
  let hls: Hls | null = null;
  let isLoadingVideo = $state(true);
  let isInfoOverlayVisible = $state(false);
  let infoOverlayTimeout: ReturnType<typeof setTimeout> | null = null;

  function showInfoOverlay() {
    if (infoOverlayTimeout) clearTimeout(infoOverlayTimeout);
    isInfoOverlayVisible = true;
    infoOverlayTimeout = setTimeout(() => {
      isInfoOverlayVisible = false;
    }, 4000);
  }

  function handleKeyDown(ev: KeyboardEvent) {
    const { keyCode } = ev;

    if (appState.isOverlayOpen) {
      if (keyCode === 406 || keyCode === 461 || keyCode === 27) {
        // BLUE or BACK or ESC
        ev.preventDefault();
        appState.isOverlayOpen = false;
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
        appState.navigateToChannel(appState.currentIndex + 1);
        break;
      case 34: // CHANNELDOWN
        ev.preventDefault();
        appState.navigateToChannel(appState.currentIndex - 1);
        break;
      case 406: // BLUE
        ev.preventDefault();
        appState.isOverlayOpen = true;
        break;
      case 461: // BACK
      case 27: // ESC
        ev.preventDefault();
        if (!document.querySelector(".quickPopup")) {
          appState.isOverlayOpen = true;
        }
        break;
      case 403: // RED
        ev.preventDefault();
        if (appState.currentChannel) {
          appState.toggleFavorite(appState.currentChannel);
        }
        break;
    }
  }

  onMount(() => {
    if (Hls.isSupported() && videoRef) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error...", data);
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error...", data);
              hls?.recoverMediaError();
              break;
            default:
              console.error("Unrecoverable error", data);
              appState.error = $t("Video playback error.");
              hls?.destroy();
              break;
          }
        }
      });
      hls.attachMedia(videoRef);
    }

    cleanKeydown = on(window, "keydown", handleKeyDown);

    videoRef.onwaiting = () => (isLoadingVideo = true);
    videoRef.onplaying = () => (isLoadingVideo = false);
  });

  $effect(() => {
    const channel = appState.currentChannel;
    if (channel && videoRef) {
      // TODO: should try to play currentChannel.youtube_urls[0] as a fallback before throwing an error
      const streamUrl = channel.iptv_urls[0];
      if (hls) {
        hls.loadSource(streamUrl);
        hls.once(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.play().catch((e) => console.error("Autoplay prevented", e));
        });
      } else if (videoRef.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.src = streamUrl;
        videoRef.play().catch((e) => console.error("Autoplay prevented", e));
      }
      showInfoOverlay();
    }
  });

  onDestroy(() => {
    if (hls) hls.destroy();

    cleanKeydown();
  });
</script>

<div class="main-panel">
  <!-- svelte-ignore a11y_media_has_caption -->
  <video
    bind:this={videoRef}
    autoplay={false}
    style="width: 100vw !important; height: 100vh !important;"
  ></video>

  <ChannelInfoOverlay visible={isInfoOverlayVisible} />

  <QuickSelectOverlay />

  <ChannelMenu />

  <Alert />

  {#if isLoadingVideo || appState.isFetching}
    <Spinner centered />
  {/if}
</div>

<style lang="less">
  .main-panel {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background-color: black;

    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
</style>
