<!-- migrated from src/components/ChannelMenu/ChannelMenu.tsx -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { on } from "svelte/events";
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
  let selectedIndex = $state(0);

  const allChannels = $derived.by(() => {
    return appState.groups.flatMap((g) =>
      g.channels.map((c) => ({
        ...c,
        groupId: g.id,
        groupDisplayName: g.displayName,
      })),
    );
  });

  interface MenuItem {
    label: any;
    sublabel?: string;
    action: () => void;
    onfocus?: () => void;
  }

  const currentItems = $derived.by<MenuItem[]>(() => {
    switch (menuState) {
      case MenuState.MAIN:
        return [
          {
            label: $t("Favorites"),
            action: () => (menuState = MenuState.FAVORITES),
          },
          {
            label: $t("All Channels"),
            action: () => (menuState = MenuState.ALL_CHANNELS),
          },
          {
            label: $t("Categories"),
            action: () => (menuState = MenuState.CATEGORIES),
          },
          {
            label: $t("Countries"),
            action: () => (menuState = MenuState.COUNTRIES),
          },
          { label: $t("Back"), action: close },
        ];
      case MenuState.FAVORITES:
        return appState.favoriteChannels.map((c) => ({
          label: c.name,
          sublabel: c.country,
          action: () => handleChannelSelect(c, "favorites"),
        }));
      case MenuState.ALL_CHANNELS:
        return allChannels.map((c, idx) => ({
          label: c.name,
          sublabel: `${c.country} | ${c.groupDisplayName}`,
          action: () => handleChannelSelect(c, c.groupId),
          onfocus: () => handleFocus(idx),
        }));
      case MenuState.CATEGORIES:
        return hardcodedCategories.map((cat) => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          action: () => selectCategory(cat),
        }));
      case MenuState.CATEGORY_DETAIL:
        return categoryChannels.map((c) => ({
          label: c.name,
          sublabel: c.country,
          action: () => handleChannelSelect(c, `category_${selectedCategory}`),
        }));
      case MenuState.COUNTRIES:
        if (!allCountryMetadata) return [];
        return Object.entries(allCountryMetadata)
          .filter(([_, meta]) => meta.hasChannels)
          .map(([code, meta]) => ({
            label: meta.country,
            sublabel: code,
            action: () => selectCountry(code, meta.country),
          }));
      case MenuState.COUNTRY_DETAIL:
        return countryChannels.map((c) => ({
          label: c.name,
          sublabel: c.language,
          action: () => handleChannelSelect(c, `country_${selectedCountry}`),
        }));
      default:
        return [];
    }
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
    if (
      menuState === MenuState.ALL_CHANNELS &&
      idx + 20 >= allChannels.length
    ) {
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

  function handleKeyDown(ev: KeyboardEvent) {
    if (!appState.isOverlayOpen || currentItems.length === 0) return;

    const { keyCode } = ev;

    switch (keyCode) {
      case 13: // ENTER
        ev.preventDefault();
        if (currentItems[selectedIndex]) {
          currentItems[selectedIndex].action();
        }
        break;
      case 38: // UP
        ev.preventDefault();
        selectedIndex =
          (selectedIndex - 1 + currentItems.length) % currentItems.length;
        break;
      case 40: // DOWN
        ev.preventDefault();
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        break;
      case 27: // ESC
        ev.preventDefault();
        close();
        break;
      case 461: // BACK
      case 8: // BACKSPACE
        ev.preventDefault();
        if (menuState === MenuState.MAIN) {
          close();
        } else {
          goBack();
        }
        break;
    }
  }

  $effect(() => {
    menuState; // trigger on state change
    selectedIndex = 0;
  });

  $effect(() => {
    if (
      menuState === MenuState.ALL_CHANNELS &&
      currentItems[selectedIndex]?.onfocus
    ) {
      currentItems[selectedIndex].onfocus!();
    }
  });

  $effect(() => {
    if (appState.isOverlayOpen) {
      // Access reactive properties to track them
      selectedIndex;
      currentItems;

      tick().then(() => {
        const selectedItem = document.querySelector(".menu-item.selected");
        if (selectedItem) {
          selectedItem.scrollIntoView({
            block: "center",
            behavior: "auto",
          });
        }
      });
    }
  });

  onMount(() => {
    return on(window, "keydown", handleKeyDown);
  });

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

<Popup
  open={appState.isOverlayOpen}
  onClose={close}
  position="center"
  class="channel-menu-popup"
>
  <div class="menu-container">
    <Header type="mini" {title} subtitle="" class="overlay-header">
      {#snippet slotBefore()}
        {#if menuState !== MenuState.MAIN}
          <Button size="small" icon="arrowlargeleft" onclick={goBack} />
        {/if}
      {/snippet}
    </Header>

    <div class="content">
      <Scroller direction="vertical" {isFetching}>
        {#each currentItems as item, idx}
          <Item
            class="menu-item {idx === selectedIndex ? 'selected' : ''}"
            onclick={item.action}
            selected={idx === selectedIndex}
          >
            {item.label}
            {#if item.sublabel}
              {#snippet label()}
                <span class="channel-label">{item.sublabel}</span>
              {/snippet}
            {/if}
          </Item>
        {/each}

        {#if isFetching && currentItems.length === 0}
          <div class="loading-container">
            <Spinner size="small" />
          </div>
        {:else if !isFetching && currentItems.length === 0}
          <div class="empty-state">
            {#if menuState === MenuState.FAVORITES}
              {$t("No favorites yet.")}
            {:else}
              {$t("No channels found.")}
            {/if}
          </div>
        {/if}
      </Scroller>
    </div>
  </div>
</Popup>

<style lang="less">
  @import "@sandstone/styles/variables.less";

  :global(.channel-menu-popup) {
    width: 80vw !important;
    height: 80vh !important;
    max-height: 80vh !important;
    background-color: transparent !important;
    box-shadow: none !important;

    :global(.body) {
      height: 100% !important;
      background-color: transparent !important;
      padding: 0 !important;
    }
  }

  .menu-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    color: white;
    background-color: transparent;
  }

  :global(.overlay-header) {
    padding: 20px;
    background-color: transparent;
  }

  .content {
    flex: 1;
    overflow: hidden;
    background-color: transparent;
  }

  :global(.menu-item) {
    margin: 5px 10px !important;
    border-radius: 10px !important;
    transition: background-color 0.2s;
  }

  :global(.menu-item.selected) {
    background-color: #e6e6e6 !important;
    color: #000000 !important;

    :global(.channel-label) {
      color: #333333 !important;
    }

    :global(.marquee) {
      color: #000000 !important;
    }
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
