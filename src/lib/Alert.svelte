<!-- migrated from @enact/sandstone/Alert -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { appState } from './appState.svelte';
</script>

<div class="alert-container">
  {#each appState.alerts as alert (alert.id)}
    <div 
      class="popup overlay {appState.skin}" 
      transition:fly={{ y: 50, duration: 300 }}
    >
      <div class="alert overlay noImage">
        <div class="content full">
          {alert.message}
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="less">
  @import "@sandstone/Alert/Alert.module.less";

  .alert-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    z-index: 2000;
    padding-bottom: 40px;
    gap: 20px;
  }

  .popup.overlay {
    position: relative;
    pointer-events: auto;
    /* Alert.module.less handles most of the overlay styling */
  }
</style>
