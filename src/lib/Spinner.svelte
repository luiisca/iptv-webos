<!-- migrated from @enact/sandstone/Spinner -->
<script lang="ts">
  import { appState } from "./appState.svelte";
  let {
    size = "medium",
    transparent = false,
    centered = false,
    class: className = "",
  } = $props();
</script>

<div
  class="spinner {appState.skin} {size} {transparent
    ? 'transparent'
    : ''} running {centered ? 'centered' : ''} {className}"
>
  <div class="bg">
    <div class="decorator">
      <div class="fan1"></div>
      <div class="fan2"></div>
      <div class="fan3"></div>
      <div class="fan4"></div>
      <div class="cap"></div>
    </div>
  </div>
  <!-- {#if children} -->
  <!--   <div class="client"> -->
  <!--     {@render children()} -->
  <!--   </div> -->
  <!-- {/if} -->
</div>

<style lang="less">
  @import "@sandstone/Spinner/Spinner.module.less";

  .spinner.centered {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
  }
</style>
