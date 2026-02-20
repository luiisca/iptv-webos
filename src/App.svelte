<!-- migrated from src/App/App.tsx -->
<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "./lib/appState.svelte";
  import {
    getUserMeta,
    fetchCountryMetadata,
    fetchChannelsByCountry,
  } from "./lib/api";
  import MainPanel from "./lib/MainPanel.svelte";
  import Spinner from "./lib/Spinner.svelte";
  import ThemeDecorator from "./lib/ThemeDecorator.svelte";

  import { t, locale } from "./lib/i18n";

  onMount(async () => {
    appState.isFetching = true;
    appState.error = null;

    try {
      appState.userMeta = await getUserMeta();
      locale.set(appState.userMeta.langCode === "spa" ? "es" : "en");

      const savedFavorites = localStorage.getItem("favorites");
      if (savedFavorites) {
        try {
          appState.favorites = JSON.parse(savedFavorites);
        } catch (e) {}
      }

      appState.groups = [
        {
          id: "favorites",
          displayName: $t("Favorites"),
          channels: appState.favorites,
        },
      ];

      appState.allCountryMetadata = await fetchCountryMetadata();

      const userCountryChannels = await fetchChannelsByCountry(
        appState.userMeta.countryCode,
      );
      if (userCountryChannels.length > 0) {
        appState.addGroup({
          id: appState.userMeta.countryCode.toLowerCase(),
          displayName:
            appState.allCountryMetadata[
              appState.userMeta.countryCode.toUpperCase()
            ]?.country || appState.userMeta.countryCode,
          channels: userCountryChannels,
        });
      }

      const startGroupId =
        appState.favorites.length > 0
          ? "favorites"
          : appState.groups[1]?.id || "favorites";
      appState.setActiveGroupId(startGroupId);

      appState.isFetching = false;

      // Background fetch
      (async () => {
        for (let i = 0; i < 4; i++) {
          await appState.loadMoreGroups();
        }
      })();
    } catch (e: any) {
      console.error("Initialization error:", e);
      appState.error = e.message || $t("Failed to initialize application.");
      appState.isFetching = false;
    }
  });
</script>

<ThemeDecorator>
  {#if appState.isFetching && appState.groups.length <= 1 && appState.favorites.length === 0}
    <Spinner centered />
  {:else if appState.error && appState.groups.length <= 1}
    <div class="error">{appState.error}</div>
  {:else if appState.groups.length > 0}
    <MainPanel />
  {/if}
</ThemeDecorator>

<style>
  .error {
    color: red;
    font-size: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    padding: 20px;
  }
</style>
