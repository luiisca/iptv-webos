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
    fetchChannelsByCountry,
    fetchCountryMetadata,
  } from "./api";
  import type { Channel, CountryMeta } from "./types";
  import { t } from "./i18n";

  const MenuState = {
    MAIN: "main",
    FAVORITES: "favorites",
    ALL_CHANNELS: "allChannels",
    CATEGORIES: "categories",
    CATEGORY_DETAIL: "categoryDetail",
    COUNTRIES: "countries",
    COUNTRY_DETAIL: "countryDetail",
  } as const;

  type MenuStateValue = (typeof MenuState)[keyof typeof MenuState];

  let menuState = $state<MenuStateValue>(MenuState.MAIN);
  let allCountryMetadata = $state<Record<string, CountryMeta> | null>(null);

  let selectedCategory = $state<string | null>(null);
  let categoryChannels = $state<Channel[]>([]);
  let selectedCountry = $state<string | null>(null);
  let countryChannels = $state<Channel[]>([]);
  let isFetching = $state(false);

  const allChannels = $derived.by(() => {
    return appState.groups.flatMap((g) =>
      g.channels.map((c) => ({
        ...c,
        groupId: g.id,
        groupDisplayName: g.displayName,
      })),
    );
  });

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

  function handleChannelSelect(channel: any, groupId?: string) {
    // If it's a category/country channel not in appState.groups, we might need to add it
    // But for simplicity let's just use playChannel and rely on it finding the group if it exists
    // or maybe add a generic way to play an arbitrary channel.
    // Actually, appState.playChannel finds the index in the group.

    const targetGroupId = groupId || "generic";
    if (groupId) {
      const groupExists = appState.groups.some((g) => g.id === groupId);
      if (!groupExists && (categoryChannels.length || countryChannels.length)) {
        appState.addGroup({
          id: groupId,
          displayName:
            menuState === MenuState.CATEGORY_DETAIL
              ? selectedCategory || groupId
              : selectedCountry || groupId,
          channels:
            menuState === MenuState.CATEGORY_DETAIL
              ? categoryChannels
              : countryChannels,
        });
      }
    }

    appState.playChannel(channel, targetGroupId);
    appState.isOverlayOpen = false;
  }

  async function handleFocus(idx: number) {
    if (menuState === MenuState.ALL_CHANNELS && idx + 20 >= allChannels.length) {
      if (!isFetching && !appState.isAllFetched) {
        isFetching = true;
        await appState.loadMoreGroups();
        isFetching = false;
      }
    }
  }

  async function selectCategory(category: string) {
    isFetching = true;
    selectedCategory = category;
    categoryChannels = await fetchChannelsByCategory(category);
    menuState = MenuState.CATEGORY_DETAIL;
    isFetching = false;
  }

  async function selectCountry(code: string, countryName: string) {
    isFetching = true;
    selectedCountry = countryName;
    countryChannels = await fetchChannelsByCountry(code);
    menuState = MenuState.COUNTRY_DETAIL;
    isFetching = false;
  }

  function goBack() {
    switch (menuState) {
      case MenuState.CATEGORY_DETAIL:
        menuState = MenuState.CATEGORIES;
        break;
      case MenuState.COUNTRY_DETAIL:
        menuState = MenuState.COUNTRIES;
        break;
      default:
        menuState = MenuState.MAIN;
        break;
    }
  }

  function close() {
    appState.isOverlayOpen = false;
    menuState = MenuState.MAIN;
  }

  const title = $derived.by(() => {
    switch (menuState) {
      case MenuState.MAIN:
        return $t("Menu");
      case MenuState.FAVORITES:
        return $t("Favorites");
      case MenuState.ALL_CHANNELS:
        return $t("All Channels");
      case MenuState.CATEGORIES:
        return $t("Categories");
      case MenuState.CATEGORY_DETAIL:
        return selectedCategory || $t("Category");
      case MenuState.COUNTRIES:
        return $t("Countries");
      case MenuState.COUNTRY_DETAIL:
        return selectedCountry || $t("Country");
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
          <Button size="small" icon="arrowlargeleft" onclick={goBack} />
        {/if}
      {/snippet}
    </Header>

    <div class="content">
      <Scroller direction="vertical" {isFetching}>
        {#if menuState === MenuState.MAIN}
          <Item onclick={() => (menuState = MenuState.FAVORITES)}
            >{$t("Favorites")}</Item
          >
          <Item onclick={() => (menuState = MenuState.ALL_CHANNELS)}
            >{$t("All Channels")}</Item
          >
          <Item onclick={() => (menuState = MenuState.CATEGORIES)}
            >{$t("Categories")}</Item
          >
          <Item onclick={() => (menuState = MenuState.COUNTRIES)}
            >{$t("Countries")}</Item
          >
          <Item onclick={close}>{$t("Back")}</Item>
        {:else if menuState === MenuState.FAVORITES}
          {#if Object.keys(appState.favorites).length > 0}
            {#each appState.favoriteChannels as channel}
              <Item onclick={() => handleChannelSelect(channel, "favorites")}>
                {channel.name}
                {#snippet label()}
                  <span class="channel-label">{channel.country}</span>
                {/snippet}
              </Item>
            {/each}
          {:else}
            <div class="empty-state">{$t("No favorites yet.")}</div>
          {/if}
        {:else if menuState === MenuState.ALL_CHANNELS}
          {#each allChannels as channel, idx}
            <Item
              onfocus={() => handleFocus(idx)}
              onclick={() => handleChannelSelect(channel, channel.groupId)}
            >
              {channel.name}
              {#snippet label()}
                <span class="channel-label"
                  >{channel.country} | {channel.groupDisplayName}</span
                >
              {/snippet}
            </Item>
          {/each}
          {#if isFetching}
            <div class="loading-container">
              <Spinner size="small" />
            </div>
          {/if}
        {:else if menuState === MenuState.CATEGORIES}
          {#each hardcodedCategories as category}
            <Item onclick={() => selectCategory(category)}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Item>
          {/each}
        {:else if menuState === MenuState.CATEGORY_DETAIL}
          {#if isFetching}
            <div class="loading-container">
              <Spinner size="small" />
            </div>
          {:else if categoryChannels.length > 0}
            {#each categoryChannels as channel}
              <Item
                onclick={() =>
                  handleChannelSelect(channel, `category_${selectedCategory}`)}
              >
                {channel.name}
                {#snippet label()}
                  <span class="channel-label">{channel.country}</span>
                {/snippet}
              </Item>
            {/each}
          {:else}
            <div class="empty-state">{$t("No channels found.")}</div>
          {/if}
        {:else if menuState === MenuState.COUNTRIES}
          {#if allCountryMetadata}
            {#each Object.entries(allCountryMetadata) as [code, meta]}
              {#if meta.hasChannels}
                <Item onclick={() => selectCountry(code, meta.country)}>
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
        {:else if menuState === MenuState.COUNTRY_DETAIL}
          {#if isFetching}
            <div class="loading-container">
              <Spinner size="small" />
            </div>
          {:else if countryChannels.length > 0}
            {#each countryChannels as channel}
              <Item
                onclick={() =>
                  handleChannelSelect(channel, `country_${selectedCountry}`)}
              >
                {channel.name}
                {#snippet label()}
                  <span class="channel-label">{channel.language}</span>
                {/snippet}
              </Item>
            {/each}
          {:else}
            <div class="empty-state">{$t("No channels found.")}</div>
          {/if}
        {/if}
      </Scroller>
    </div>
  </div>
</Popup>

<style lang="less">
  @import "@sandstone/styles/variables.less";

  :global(.channel-menu-popup) {
    width: 30vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }

  .menu-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    color: white;
    background-color: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(20px);
  }

  :global(.overlay-header) {
    padding: 40px 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .content {
    flex: 1;
    overflow: hidden;
  }

  .channel-label {
    font-size: 0.8rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  .loading-container {
    padding: 40px;
    display: flex;
    justify-content: center;
  }

  .empty-state {
    padding: 40px;
    text-align: center;
    opacity: 0.6;
    font-size: 1.2rem;
  }
</style>