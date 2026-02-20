<!-- migrated from @enact/sandstone/Heading -->
<script lang="ts">
  import { appState } from "./appState.svelte";

  let {
    children,
    size = "large",
    spacing = "medium",
    showLine = false,
    class: className = "",
    ...rest
  } = $props();

  let sizeClass = $derived(size);
  let spacingClass = $derived(`${spacing}Spacing`);
</script>

<h4
  class="heading {appState.skin} {sizeClass} {spacingClass} {showLine
    ? 'showLine'
    : ''} {className}"
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</h4>

<style lang="less">
  @import "@sandstone/Heading/Heading.module.less";

  .heading {
    display: block;
    box-sizing: border-box;
  }
</style>
