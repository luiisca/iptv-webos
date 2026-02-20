<!-- migrated from @enact/sandstone/Scroller -->
<script lang="ts">
  import { appState } from "./appState.svelte";

  let {
    children,
    direction = "vertical",
    fadeOut = false,
    verticalScrollbar = "auto",
    horizontalScrollbar = "auto",
    class: className = "",
    isFetching = false,
    ...rest
  } = $props();

  let scrollerRef = $state<HTMLDivElement>();

  const fadeClass = $derived.by(() => {
    if (!fadeOut) return "";
    if (direction === "vertical") return "verticalFadeout";
    if (direction === "horizontal") return "horizontalFadeout";
    return "";
  });

  const verticalScrollbarClass = $derived(
    verticalScrollbar === "hidden" ? "hidden-vertical-scrollbar" : "",
  );
  const horizontalScrollbarClass = $derived(
    horizontalScrollbar === "hidden" ? "hidden-horizontal-scrollbar" : "",
  );

  function handleFocusIn(ev: FocusEvent) {
    const target = ev.target as HTMLElement;
    if (scrollerRef && scrollerRef.contains(target)) {
      target.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  }

  function handleKeyDown(ev: KeyboardEvent) {
    const { keyCode } = ev;

    const isVertical = direction === "vertical" || direction === "both";
    const isHorizontal = direction === "horizontal" || direction === "both";

    let direction_key = 0; // -1 for up/left, 1 for down/right

    if (isVertical) {
      if (keyCode === 38) direction_key = -1; // UP
      if (keyCode === 40) direction_key = 1; // DOWN
    }

    if (isHorizontal && direction_key === 0) {
      if (keyCode === 37) direction_key = -1; // LEFT
      if (keyCode === 39) direction_key = 1; // RIGHT
    }

    if (direction_key !== 0) {
      const current = document.activeElement as HTMLElement;
      if (scrollerRef && scrollerRef.contains(current)) {
        const focusables = Array.from(
          scrollerRef.querySelectorAll('[tabindex="0"]'),
        ) as HTMLElement[];
        const index = focusables.indexOf(current);
        const nextIndex = index + direction_key;

        if (nextIndex >= 0) {
          ev.preventDefault();
          if (nextIndex < focusables.length) {
            const nextElement = focusables[nextIndex];
            nextElement.focus();
          } else {
            if (!isFetching) {
              focusables[0].focus();
            }
          }
        }
      }
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={scrollerRef}
  class="scroller {appState.skin} {verticalScrollbarClass} {horizontalScrollbarClass} {className}"
  style:overflow-x={direction === "horizontal" || direction === "both"
    ? horizontalScrollbar === "visible"
      ? "scroll"
      : "auto"
    : "hidden"}
  style:overflow-y={direction === "vertical" || direction === "both"
    ? verticalScrollbar === "visible"
      ? "scroll"
      : "auto"
    : "hidden"}
  onkeydown={handleKeyDown}
  onfocusin={handleFocusIn}
  {...rest}
>
  <div class="focusableBody {fadeClass}">
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style lang="less">
  @import "@sandstone/Scroller/Scroller.module.less";
  @import "@sandstone/styles/variables.less";
  @import "@sandstone/styles/colors.less";

  .scroller {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    outline: none;

    /* Default Sandstone-like scrollbar styling using webkit */
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(230, 230, 230, 0.2);
      border: 2px solid transparent;
      background-clip: padding-box;
      border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: rgba(230, 230, 230, 0.4);
      background-clip: padding-box;
    }

    &.hidden-vertical-scrollbar {
      &::-webkit-scrollbar:vertical {
        display: none;
      }
    }

    &.hidden-horizontal-scrollbar {
      &::-webkit-scrollbar:horizontal {
        display: none;
      }
    }
  }

  .focusableBody {
    display: flex;
    flex-direction: column;
    min-width: 100%;
    min-height: min-content;
  }
</style>
