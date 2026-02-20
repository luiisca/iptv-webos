<!-- migrated from @enact/sandstone/Popup -->
<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import { tick } from "svelte";
  import { appState } from "./appState.svelte";

  let {
    open = false,
    position = "center",
    children,
    onClose,
    noAnimation = false,
    parentClassName = "",
    class: className = "",
    ...rest
  } = $props();

  let popupRef = $state<HTMLDivElement>();

  function handleScrimClick() {
    if (onClose) onClose();
  }

  const transitionParams = $derived.by(() => {
    switch (position) {
      case "top":
        return { y: -100, duration: 300 };
      case "bottom":
        return { y: 100, duration: 300 };
      case "left":
        return { x: -100, duration: 300 };
      case "right":
        return { x: 100, duration: 300 };
      case "center":
        return { y: 50, duration: 300 };
      default:
        return { duration: 300 };
    }
  });

  $effect(() => {
    if (open) {
      tick().then(() => {
        if (popupRef) {
          const focusable = popupRef.querySelector(
            'button, [tabindex="0"], a, input, select, textarea',
          ) as HTMLElement;
          if (focusable) {
            focusable.focus();
          }
        }
      });
    }
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="scrim"
    onclick={handleScrimClick}
    transition:fade={{ duration: 200 }}
  ></div>

  <div
    class="popupTransitionContainer {position} {parentClassName}"
    transition:fly={noAnimation ? { duration: 0 } : transitionParams}
  >
    <div
      bind:this={popupRef}
      class="popup {appState.skin} {position} {className}"
      {...rest}
    >
      <div class="body">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="less">
  @import "@sandstone/styles/variables.less";
  @import "@sandstone/styles/colors.less";
  @import "@sandstone/Popup/Popup.module.less";

  .scrim {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: @sand-scrim-color;
    z-index: 900;
  }

  .popupTransitionContainer {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    display: flex;

    &.center {
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      align-items: center;
      justify-content: center;
    }

    &.top {
      top: 0;
      left: 0;
      width: 100vw;
    }
    &.bottom {
      bottom: 0;
      left: 0;
      width: 100vw;
    }
    &.left {
      top: 0;
      left: 0;
      height: auto;
    }
    &.right {
      top: 0;
      right: 0;
      height: 100vh;
    }
  }

  .popup {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: @sand-fixedpopuppanels-shadow;

    &.center {
      position: relative;
      top: auto;
      left: auto;
      transform: none;
    }
  }
</style>

