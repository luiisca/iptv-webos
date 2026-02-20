<!-- migrated from @enact/sandstone/Header -->
<script lang="ts">
  import { appState } from './appState.svelte';
  import Marquee from './Marquee.svelte';
  import Heading from './Heading.svelte';
  
  let {
    title,
    subtitle,
    type = 'standard',
    centered = false,
    slotAbove,
    slotAfter,
    slotBefore,
    slotBelow,
    class: className = '',
    ...rest
  } = $props();

  let noSubtitle = $derived(!subtitle);
</script>

<header 
  class="header {appState.skin} {type} {centered ? 'centered' : ''} {noSubtitle ? 'noSubtitle' : ''} {className}"
  {...rest}
>
  {#if slotAbove}
    <div class="slotAbove">
      {@render slotAbove()}
    </div>
  {/if}

  <div class="titlesRow">
    {#if slotBefore}
      <div class="slotBefore">
        {@render slotBefore()}
      </div>
    {/if}

    <div class="titleCell">
      <div class="titleContainer">
        <Heading size="title" spacing="none" class="title">
          <Marquee marqueeOn="render">{title}</Marquee>
        </Heading>
      </div>
      {#if subtitle}
        <Heading size="subtitle" spacing="none" class="subtitle">
          <Marquee marqueeOn="render">{subtitle}</Marquee>
        </Heading>
      {/if}
    </div>

    {#if slotAfter}
      <div class="slotAfter">
        {@render slotAfter()}
      </div>
    {/if}
  </div>

  {#if slotBelow}
    <div class="slotBelow">
      {@render slotBelow()}
    </div>
  {/if}
</header>

<style lang="less">
  @import "@sandstone/Panels/Header.module.less";

  .header {
    display: flex;
    flex-direction: column;
  }

  .titlesRow {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .titleCell {
    flex: 1;
    min-width: 0;
    position: relative;
  }
</style>
