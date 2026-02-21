<!-- migrated from @enact/sandstone/Item -->
<script lang="ts">
  import { appState } from "./appState.svelte";
  import Marquee from "./Marquee.svelte";

  let {
    children,
    label,
    labelPosition = "below",
    slotBefore,
    slotAfter,
    centered = false,
    inline = false,
    size = "large",
    selected = false,
    disabled = false,
    class: className = "",
    onclick,
    onfocus,
    ...rest
  } = $props();

  let hasLabel = $derived(!!label);
  let isFocused = $state(false);
  let isHovered = $state(false);
  let shouldMarquee = $derived(isFocused || isHovered);

  const labelPositionClass = $derived.by(() => {
    switch (labelPosition) {
      case "above":
        return "labelAbove";
      case "after":
        return "labelAfter";
      case "before":
        return "labelBefore";
      case "below":
        return "labelBelow";
      default:
        return "labelBelow";
    }
  });

  function handleFocus(ev: FocusEvent) {
    isFocused = true;
    onfocus?.(ev);
  }
  function handleBlur() {
    isFocused = false;
  }
  function handleMouseEnter() {
    isHovered = true;
  }
  function handleMouseLeave() {
    isHovered = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="item {appState.skin} {size} {centered ? 'centered' : ''} {selected
    ? 'selected'
    : ''} {hasLabel ? 'hasLabel' : ''} {inline ? 'inline' : ''} {className}"
  role="button"
  tabindex={disabled ? -1 : 0}
  onclick={!disabled ? onclick : undefined}
  onfocus={handleFocus}
  onblur={handleBlur}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  {...rest}
>
  {#if slotBefore}
    <div class="slotBefore">
      {@render slotBefore()}
    </div>
  {/if}

  <div class="itemContent {labelPositionClass}">
    <div class="content">
      <Marquee forceStart={shouldMarquee}>
        {#if children}
          {@render children()}
        {/if}
      </Marquee>
    </div>
    {#if label}
      <div class="label">
        <Marquee forceStart={shouldMarquee}>
          {@render label()}
        </Marquee>
      </div>
    {/if}
  </div>

  {#if slotAfter}
    <div class="slotAfter">
      {@render slotAfter()}
    </div>
  {/if}
</div>

<style lang="less">
  @import "@sandstone/Item/Item.module.less";

  .item {
    align-items: center;
    box-sizing: border-box;
    text-decoration: none;
    user-select: none;
    cursor: pointer;
    overflow: hidden;
    outline: none;

    .itemContent {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      justify-content: center;
      min-width: 0;
      position: relative;
      z-index: 1;
    }

    &:focus {
      border-radius: 8px;
      background-color: #e6e6e6;
      opacity: 1;
      .itemContent {
        color: #000 !important;
      }
    }

    &.selected:not(:focus) {
      .bg {
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
    }

    .slotBefore {
      z-index: 1;
    }
  }
</style>
