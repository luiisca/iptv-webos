<!-- migrated from @enact/sandstone/Alert -->
<script lang="ts">
  import { fly } from "svelte/transition";
  import { appState } from "./appState.svelte";
  import BodyText from "./BodyText.svelte";
  import Icon from "./Icon.svelte";
</script>

<div class="alert-container">
  {#each appState.alerts as alert (alert.id)}
    <div
      class="alert-toast {appState.skin} {alert.type || 'info'}"
      transition:fly={{ y: 50, duration: 300 }}
    >
      <div class="alert-content">
        {#if alert.type === "error"}
          <Icon class="alert-icon error" icon="warning" />
        {:else}
          <Icon class="alert-icon info" icon="info" />
        {/if}
        <BodyText class="alert-text">{alert.message}</BodyText>
      </div>
    </div>
  {/each}
</div>

<style lang="less">
  @import "@sandstone/styles/variables.less";
  @import "@sandstone/styles/colors.less";

  .alert-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    z-index: 9999;
    padding-bottom: 60px;
    gap: 16px;
  }

  :global(.alert-toast) {
    pointer-events: auto;
    background-color: #ffffff !important;
    color: #000000 !important;
    padding: 16px 32px !important;
    border-radius: @sand-item-border-radius !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    max-width: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;

    &.error {
      border-left: 8px solid #ff4444 !important;
    }

    :global(.alert-content) {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }

    :global(.alert-text) {
      font-size: @sand-heading-tiny-font-size !important;
      font-weight: 600 !important;
      color: #000000 !important;
      margin: 0 !important;
      line-height: 1.2 !important;
      // Allow wrapping if the message is too long, rather than overflowing
      word-wrap: break-word;
      overflow: hidden;
    }

    :global(.alert-icon) {
      --icon-size: 40px !important;
      flex-shrink: 0;
      
      &.info {
        color: #3399ff !important;
      }
      
      &.error {
        color: #ff4444 !important;
      }
    }
  }
</style>