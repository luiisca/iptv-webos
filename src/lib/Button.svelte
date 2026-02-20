<!-- migrated from @enact/sandstone/Button -->
<script lang="ts">
  import Icon from './Icon.svelte';
  import Marquee from './Marquee.svelte';
  import { appState } from './appState.svelte';
  
  let {
    size = 'large',
    backgroundOpacity,
    color,
    icon,
    iconPosition = 'before',
    selected = false,
    disabled = false,
    minWidth,
    roundBorder = false,
    children,
    class: className = '',
    onclick,
    ...rest
  } = $props();

  let isIconOnly = $derived(!children);
  let hasIcon = $derived(!!icon);
  let effectiveMinHeight = $derived(minWidth ?? !isIconOnly);
  let effectiveOpacity = $derived(backgroundOpacity || (isIconOnly ? 'transparent' : 'opaque'));

  let isFocused = $state(false);
  let isHovered = $state(false);
  let shouldMarquee = $derived(isFocused || isHovered);

  function handleFocus() { isFocused = true; }
  function handleBlur() { isFocused = false; }
  function handleMouseEnter() { isHovered = true; }
  function handleMouseLeave() { isHovered = false; }
</script>

<button
  class="button {appState.skin} {size} {effectiveOpacity} {color || ''} {selected ? 'selected' : ''} {hasIcon ? 'hasIcon' : ''} {isIconOnly ? 'iconOnly' : ''} {iconPosition === 'after' ? 'iconAfter' : 'iconBefore'} {effectiveMinHeight ? 'minWidth' : ''} {roundBorder ? 'roundBorder' : ''} {className}"
  {disabled}
  {onclick}
  onfocus={handleFocus}
  onblur={handleBlur}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  {...rest}
>
  <div class="bg"></div>
  <div class="client">
    {#if hasIcon && iconPosition === 'before'}
      <Icon class="icon" size={size === 'small' ? 'small' : 'large'} {icon} />
    {/if}
    
    {#if children}
      <Marquee class="marquee" forceStart={shouldMarquee} alignment="center">
        {@render children()}
      </Marquee>
    {/if}

    {#if hasIcon && iconPosition === 'after'}
      <Icon class="icon" size={size === 'small' ? 'small' : 'large'} {icon} />
    {/if}
  </div>
</button>

<style lang="less">
  @import "@sandstone/Button/Button.module.less";

  .button {
    /* Ensure the button element behaves like Enact's kind which is usually a div or button with inline-block */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: none;
    background: none;
    outline: none;
    padding: 0;
    cursor: pointer;
    box-sizing: border-box;
    text-decoration: none;
    user-select: none;

    .bg {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        pointer-events: none;
        box-sizing: border-box;
    }

    .client {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
        box-sizing: border-box;
    }

    .marquee {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
  }
</style>
