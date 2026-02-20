<!-- migrated from src/components/ChannelMenu/ChannelMenu.tsx -->
<script lang="ts">
  import Popup from "./Popup.svelte";
  import Button from "./Button.svelte";
  import Item from "./Item.svelte";
  import Scroller from "./Scroller.svelte";
  import Spinner from "./Spinner.svelte";
  import Header from "./Header.svelte";
  import { appState } from "./appState.svelte";
  import {
    hardcodedCategories,
    fetchChannelsByCategory,
    fetchCountryMetadata,
  } from "./api";
  import type { CountryMeta } from "./types";
  import { t } from "./i18n";

  const MenuState = {
    MAIN: "main",
    ALL_CHANNELS: "allChannels",
    CATEGORIES: "categories",
    COUNTRIES: "countries",
  } as const;

  type MenuStateValue = (typeof MenuState)[keyof typeof MenuState];

  let menuState = $state<MenuStateValue>(MenuState.MAIN);
  let allCountryMetadata = $state<Record<string, CountryMeta> | null>(null);

  async function loadCountries() {
    if (allCountryMetadata) return;
    try {
      allCountryMetadata = await fetchCountryMetadata();
    } catch (e) {
      console.error(e);
    }
  }

  $effect(() => {
    if (menuState === MenuState.COUNTRIES) loadCountries();
  });

  function handleChannelSelect(channel: any, index: number) {
    appState.playChannel(channel);
    appState.isOverlayOpen = false;
  }

  function close() {
    appState.isOverlayOpen = false;
    menuState = MenuState.MAIN;
  }

  const title = $derived.by(() => {
    switch (menuState) {
      case MenuState.MAIN:
        return $t("Menu");
      case MenuState.ALL_CHANNELS:
        return $t("All Channels");
      case MenuState.CATEGORIES:
        return $t("Categories");
      case MenuState.COUNTRIES:
        return $t("Countries");
      default:
        return $t("Menu");
    }
  });
</script>

<Popup open={appState.isOverlayOpen} onClose={close} class="channel-menu-popup">
  <div class="menu-container">
    <Header type="mini" {title} class="overlay-header">
      {#snippet slotBefore()}
        {#if menuState !== MenuState.MAIN}
          <Button
            size="small"
            icon="arrowlargeleft"
            onclick={() => (menuState = MenuState.MAIN)}
          />
        {/if}
      {/snippet}
    </Header>

    <div class="content">
      <Scroller direction="vertical">
        {#if menuState === MenuState.MAIN}
          <Item onclick={() => (menuState = MenuState.ALL_CHANNELS)}
            >{$t("All Channels")}</Item
          >
          <Item onclick={() => (menuState = MenuState.CATEGORIES)}
            >{$t("Categories")}</Item
          >
          <Item onclick={() => (menuState = MenuState.COUNTRIES)}
            >{$t("Countries")}</Item
          >
          <Item onclick={close}>{$t("Close")}</Item>
        {:else if menuState === MenuState.ALL_CHANNELS}
          {#each appState.playlist as channel, idx}
            <Item onclick={() => handleChannelSelect(channel, idx)}>
              {channel.name}
              {#snippet label()}
                <span class="channel-label">{channel.country}</span>
              {/snippet}
            </Item>
          {/each}
        {:else if menuState === MenuState.CATEGORIES}
          {#each hardcodedCategories as category}
            <Item
              onclick={async () => {
                const channels = await fetchChannelsByCategory(category);
                if (channels.length > 0) handleChannelSelect(channels[0], 0);
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Item>
          {/each}
        {:else if menuState === MenuState.COUNTRIES}
          {#if allCountryMetadata}
            {#each Object.entries(allCountryMetadata) as [code, meta]}
              {#if meta.hasChannels}
                <Item
                  onclick={() => {
                    appState.isOverlayOpen = false;
                  }}
                >
                  {meta.country}
                  {#snippet label()}
                    <span class="channel-label">{code}</span>
                  {/snippet}
                </Item>
              {/if}
            {/each}
          {:else}
            <div class="loading-container">
              <Spinner size="small" />
            </div>
          {/if}
        {/if}
      </Scroller>
    </div>
  </div>
</Popup>

<style lang="less">
  @import "@sandstone/styles/variables.less";

  :global(.channel-menu-popup) {
    width: 80vw !important;
    height: 80vw !important;
  }
  .menu-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    color: white;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
  }

  :global(.overlay-header) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .content {
    flex: 1;
    overflow: hidden;
  }

  .channel-label {
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .loading-container {
    padding: 40px;
    display: flex;
    justify-content: center;
  }
</style>
