<!-- migrated from src/components/ChannelInfoOverlay/ChannelInfoOverlay.tsx -->
<script lang="ts">
  import BodyText from "./BodyText.svelte";
  import Heading from "./Heading.svelte";
  import Icon from "./Icon.svelte";
  import Marquee from "./Marquee.svelte";
  import Popup from "./Popup.svelte";
  import { appState } from "./appState.svelte";

  let { visible } = $props();

  let channel = $derived(appState.currentChannel);
  let channelNumber = $derived(
    appState.activeGroupId === "favorites"
      ? appState.currentChannel.channelNumber
      : appState.currentIndex + 1,
  );
  let isFavorite = $derived(
    channel
      ? appState.favoriteChannels.some((f) => f.nanoid === channel.nanoid)
      : false,
  );
  let activeGroup = $derived(
    appState.groups.find((g) => g.id === appState.activeGroupId),
  );
  let groupName = $derived(activeGroup ? activeGroup.displayName : "");
  let locale = $derived(
    channel
      ? [channel.language, channel.country].filter(Boolean).join("-")
      : "",
  );
</script>

<Popup open={visible} position="left" class="info-popup">
  {#if channel}
    <div class="container">
      <div class="headerSection">
        <Heading size="title" spacing="none" class="channelNumber">
          {channelNumber}
        </Heading>
      </div>

      <div class="contentSection">
        <div class="topRow">
          <Marquee class="channelName">{channel.name}</Marquee>
          <div class="badges">
            {#if isFavorite}
              <Icon class="icon favoriteIcon" icon="star" />
            {/if}
            {#if channel.isGeoBlocked}
              <Icon class="icon lockedIcon" icon="lock" />
            {/if}
          </div>
        </div>

        <div class="bottomRow">
          <BodyText class="groupName">{groupName}</BodyText>
          {#if locale}
            <span class="separator">|</span>
            <BodyText class="channelLocale">{locale}</BodyText>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</Popup>

<style lang="less">
  @import "@sandstone/styles/variables.less";
  @import "@sandstone/styles/colors.less";

  :global(.info-popup) {
    margin-top: @sand-app-keepout !important;
    margin-left: @sand-app-keepout !important;
    height: auto !important;
    // background-color: rgba(0, 0, 0, 0.75) !important;
    border-radius: @sand-item-border-radius !important;

    // Target the internal container inside the Popup
    :global(.body) {
      padding: 0 !important;
      margin: 0 !important;
      height: 100% !important;
      background-color: transparent !important;
    }
  }

  .container {
    background-color: transparent;
    color: #ffffff;
    // width: 800px;
    display: flex;
    flex-direction: row-reverse;
  }

  .headerSection {
    padding: 10px 40px;
    background-color: transparent;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  :global(.channelNumber) {
    font-size: @sand-input-fullscreen-title-font-size !important;
    color: #ffffff;
    margin: 0 !important;
    padding: 0 !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }

  .contentSection {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: 20px 40px;
  }

  .topRow {
    display: flex;
    align-items: center;
    line-height: initial;
    margin-bottom: 8px;
  }

  :global(.channelName) {
    font-size: @sand-heading-title-font-size important;
    font-weight: bold !important;
    color: #ffffff;
  }

  :global(.badges .icon) {
    --icon-size: 52px !important;
  }
  :global(.favoriteIcon) {
    color: #ffcc00 !important;
  }

  :global(.lockedIcon) {
    color: #ff4444 !important;
  }

  .bottomRow {
    display: flex;
    align-items: center;
  }

  :global(.groupName) {
    font-size: @sand-heading-tiny-font-size !important;
    color: #eeeeee !important;
    text-transform: uppercase !important;
    font-weight: 600 !important;
    margin: 0 !important;
  }

  .separator {
    color: #999999;
    padding: 0 10px;
  }

  :global(.channelLocale) {
    font-size: @sand-iconitem-label-font-size !important;
    color: #cccccc !important;
    margin: 0 !important;
  }
</style>
