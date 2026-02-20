<!-- migrated from @enact/sandstone/ThemeDecorator -->
<script lang="ts">
  import { appState } from "./appState.svelte";
  let { children } = $props();
</script>

<div class="root bg {appState.skin} enact-unselectable spotlight-input-key">
  {#if children}
    {@render children()}
  {/if}
</div>

<style lang="less">
  @import "@sandstone/ThemeDecorator/ThemeDecorator.module.less";

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: black;
    -webkit-font-smoothing: antialiased;
  }

  .root {
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    padding: 0px !important;
    /* ThemeDecorator.module.less handles the rest */
  }

  /* Global utility classes for spotlight/focus if needed */
  :global(.enact-unselectable) {
    user-select: none;
    -webkit-user-select: none;
  }
</style>
