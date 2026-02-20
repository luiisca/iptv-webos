<!-- migrated from src/components/QuickSelectOverlay/QuickSelectOverlay.tsx -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { on } from "svelte/events";
  import Popup from "./Popup.svelte";
  import Spinner from "./Spinner.svelte";
  import Scroller from "./Scroller.svelte";
  import Item from "./Item.svelte";
  import { appState } from "./appState.svelte";
  import Heading from "./Heading.svelte";

  let numericInput = $state("");
  let selectedMatchIndex = $state(0);
  let isFetching = $state(false);
  let timeout: ReturnType<typeof setTimeout> | null = null;

  let matches = $derived.by(() => {
    if (!numericInput) return [];
    const channelIndex = parseInt(numericInput, 10) - 1;
    return appState.groups
      .map((group, gIdx) => {
        const channel = group.channels[channelIndex];
        if (!channel) return null;
        return { group, channel, groupIndex: gIdx + 1 };
      })
      .filter((m): m is any => m !== null);
  });

  function handleQuickSelect(idx: number) {
    const match = matches[idx];
    if (match) {
      appState.playChannel(match.channel, match.group.id);
    }
    numericInput = "";
    selectedMatchIndex = 0;
  }

  async function refreshQuickSelect() {
    if (!numericInput) return;
    const channelIndex = parseInt(numericInput, 10) - 1;
    const currentMatchesCount = appState.groups.filter(
      (g) => g.channels[channelIndex],
    ).length;

    if (selectedMatchIndex + 5 >= currentMatchesCount - 1) {
      isFetching = true;
      await appState.loadMoreGroups();
      for (let i = 0; i < 5; i++) {
        const hasMore = await appState.loadMoreGroups();
        if (!hasMore) break;
      }
      isFetching = false;
    }
  }

  function handleKeyDown(ev: KeyboardEvent) {
    const { keyCode, key } = ev;

    if (numericInput.length === 0 && !isFetching) {
      if (key >= "0" && key <= "9") {
        ev.preventDefault();
        numericInput = key;
        selectedMatchIndex = 0;
      }
      return;
    }

    switch (keyCode) {
      case 13: // ENTER
        ev.preventDefault();
        if (matches.length > 0) handleQuickSelect(selectedMatchIndex);
        break;
      case 38: // UP
        ev.preventDefault();
        selectedMatchIndex = Math.max(0, selectedMatchIndex - 1);
        break;
      case 40: // DOWN
        ev.preventDefault();
        const next = selectedMatchIndex + 1;
        selectedMatchIndex =
          next >= matches.length && !isFetching
            ? 0
            : Math.min(matches.length - 1, next);
        break;
      case 461: // BACK
      case 27: // ESC
        ev.preventDefault();
        if (numericInput.length > 0) {
          numericInput = numericInput.slice(0, -1);
        } else {
          numericInput = "";
        }
        break;
      default:
        if (key >= "0" && key <= "9") {
          ev.preventDefault();
          numericInput += key;
          selectedMatchIndex = 0;
        }
        break;
    }
  }

  $effect(() => {
    if (numericInput.length > 0) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleQuickSelect(selectedMatchIndex);
      }, 3000);
      refreshQuickSelect();
    }
  });

  $effect(() => {
    if (numericInput.length > 0) {
      tick().then(() => {
        const selectedItem = document.querySelector(".quickItem.selected");
        if (selectedItem) {
          selectedItem.scrollIntoView({ block: "center" });
        }
      });
    }
  });

  onMount(() => {
    return on(window, "keydown", handleKeyDown);
  });
</script>

<Popup
  open={numericInput.length > 0 || isFetching}
  position="left"
  class="quickPopup"
>
  <div class="container">
    <div class="inputSection">
      <Heading class="numericInput" size="title" spacing="none">
        {numericInput}
      </Heading>
    </div>
    <div class="listSection">
      <Scroller
        class="scroller"
        direction="vertical"
        verticalScrollbar="auto"
        {isFetching}
      >
        {#each matches as match, idx}
          <Item
            class="quickItem {idx === selectedMatchIndex ? 'selected' : ''}"
            onclick={() => handleQuickSelect(idx)}
            selected={idx === selectedMatchIndex}
          >
            {#snippet slotBefore()}
              <span class="channelNumber"
                >{numericInput}-{match.groupIndex}</span
              >
            {/snippet}

            <div class="name">{match.channel.name}</div>
            {#snippet label()}
              <span class="groupName">{match.group.displayName}</span>
            {/snippet}
          </Item>
        {/each}
        {#if isFetching}
          <div class="spinnerContainer">
            <Spinner size="small" />
          </div>
        {/if}
      </Scroller>
    </div>
  </div>
</Popup>

<style lang="less">
  @import "@sandstone/styles/variables.less";
  @import "@sandstone/styles/colors.less";

  :global(.quickPopup) {
    width: 900px !important;
    max-height: calc(100vh - 560px) !important;
    border-radius: 12px !important;
    margin-top: 500px !important;
    margin-left: @sand-app-keepout !important;

    :global(.inputSection) {
      margin: 15px 18px !important;
      background-color: transparent;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);

      :global(.numericInput) {
        color: #ffffff !important;
        font-size: @sand-input-fullscreen-title-font-size !important;
        font-weight: 900 !important;
        line-height: 1 !important;
        margin: 0 18px 15px !important;
        padding: 0 !important;
      }
    }

    // Target the internal container inside the Popup
    :global(.body) {
      padding: 0 !important;
      margin: 0 !important;
      height: 100% !important;
      width: 900px !important;
      background-color: transparent !important;
    }

    :global(.quickItem) {
      margin: 0 18px 15px !important;
      padding: 3px 24px !important;

      :global(.channelNumber) {
        color: #aaa !important;
        font-weight: 800;
        font-size: @sand-heading-small-font-size !important;
      }

      :global(.text) {
        line-height: 0;
        :global(.name) {
          font-size: 48px !important;
          color: #eeeeee !important;
          font-weight: bold;
          line-height: normal;
        }
        :global(.groupName) {
          font-size: 36px !important;
          color: #aaa !important;
          position: top;
          line-height: normal;
          text-transform: uppercase !important;
          font-weight: 600 !important;
        }
      }
    }
    :global(.quickItem:focus) {
      :global(.bg) {
        border-radius: 8px;
      }
      :global(.name) {
        color: #000000 !important;
      }

      :global(.groupName) {
        color: #444444 !important;
      }

      :global(.channelNumber) {
        color: #000000 !important;
      }
    }

    :global(.spinnerContainer) {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
  }
</style>
