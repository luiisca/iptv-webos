<!-- migrated from @enact/sandstone/ActionGuide -->
<script lang="ts">
  import Button from './Button.svelte';
  import Marquee from './Marquee.svelte';
  import { appState } from './appState.svelte';

  let { 
    children, 
    icon = 'arrowsmalldown', 
    disabled = false, 
    onclick,
    class: className = '',
    ...rest 
  } = $props();
</script>

<div class="actionGuide {appState.skin} {className}" {...rest}>
  <Button 
    class="icon" 
    {disabled} 
    {icon} 
    minWidth={false} 
    {onclick} 
    size="small" 
  />
  <div class="label">
    <Marquee marqueeOn="render" alignment="center">
      {children}
    </Marquee>
  </div>
</div>

<style lang="less">
  @import "@sandstone/ActionGuide/ActionGuide.module.less";

  .actionGuide {
    display: inline-block;
    vertical-align: middle;
  }
</style>
