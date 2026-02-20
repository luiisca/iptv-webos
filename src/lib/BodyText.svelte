<!-- migrated from @enact/sandstone/BodyText -->
<script lang="ts">
  import { appState } from './appState.svelte';
  
  let {
    children,
    size = 'large',
    noWrap = false,
    centered = false,
    class: className = '',
    ...rest
  } = $props();
</script>

<div 
  class="bodyText {appState.skin} {size} {noWrap ? 'noWrap' : ''} {centered ? 'centered' : ''} {className}"
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</div>

<style lang="less">
  @import "@sandstone/BodyText/BodyText.module.less";

  .bodyText {
    display: block;
    box-sizing: border-box;
  }
</style>
