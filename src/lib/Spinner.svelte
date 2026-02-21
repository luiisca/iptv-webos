<!-- migrated from @enact/sandstone/Spinner -->
<script lang="ts">
  import { appState } from "./appState.svelte";
  import type { Snippet } from "svelte";

  let {
    size = "medium",
    transparent = false,
    centered = false,
    class: className = "",
    children,
  }: {
    size?: "medium" | "small";
    transparent?: boolean;
    centered?: boolean;
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<div
  class={{
    spinner: true,
    [appState.skin]: true,
    [size]: true,
    transparent,
    centered,
    running: true,
    [className]: className,
  }}
>
  <div class="bg">
    <div class="decorator">
      <div class="fan" style="--rotation: 0.125turn"></div>
      <div class="fan" style="--rotation: 0.25turn"></div>
      <div class="fan" style="--rotation: 0.375turn"></div>
      <div class="fan" style="--rotation: 0.5turn"></div>
      <div class="cap" style="--rotation: 0.5turn"></div>
    </div>
  </div>
  {#if children}
    <div class="client">
      {@render children()}
    </div>
  {/if}
</div>

<style lang="less">
  @import "@sandstone/styles/variables.less";
  @import "@sandstone/styles/colors.less";

  @turn-offset: (2 / 8);

  @keyframes spin {
    0% {
      transform: rotate(0turn + @turn-offset);
    }
    33% {
      transform: rotate(0.25turn + @turn-offset);
    }
    80% {
      transform: rotate(0.7turn + @turn-offset);
    }
    85% {
      transform: rotate(0.75turn + @turn-offset);
    }
    100% {
      transform: rotate(1turn + @turn-offset);
    }
  }

  @keyframes fan-rotate {
    0%,
    100% {
      transform: rotate(0turn);
    }
    33% {
      transform: rotate(var(--rotation));
    }
  }

  :global(.spinner) {
    display: inline-block;
    line-height: @sand-body-line-height;
    vertical-align: middle;
    text-align: center;

    &.centered {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
    }

    :global(.bg) {
      position: relative;
      border-radius: 50%;
      width: @sand-spinner-size;
      height: @sand-spinner-size;
      padding: @sand-spinner-line-margin;
      margin: 0 auto;
      background-color: @sand-spinner-bg-color;
    }

    &.transparent :global(.bg) {
      background-color: transparent !important;
    }

    :global(.decorator) {
      width: 100%;
      height: 100%;
      position: relative;
      border-radius: 50%;
      overflow: hidden;

      // Create the ring shape
      -webkit-mask-image: radial-gradient(
        circle,
        transparent (@sand-spinner-size / 2 - @sand-spinner-line-width - 1px),
        black (@sand-spinner-size / 2 - @sand-spinner-line-width)
      );
      mask-image: radial-gradient(
        circle,
        transparent (@sand-spinner-size / 2 - @sand-spinner-line-width - 1px),
        black (@sand-spinner-size / 2 - @sand-spinner-line-width)
      );

      // Gradient background for the "track"
      background: radial-gradient(
          circle at 0% 0%,
          @sand-spinner-color 20%,
          @sand-spinner-empty-color 40%
        ),
        radial-gradient(
          circle at 35% 8%,
          @sand-spinner-color 15%,
          transparent 15%
        );

      animation: spin @sand-spinner-time linear infinite;
    }

    :global(.fan),
    :global(.cap) {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 50%;
      right: 50%;
      transform-origin: bottom right;
      background-color: @sand-spinner-color;
      animation: fan-rotate @sand-spinner-time linear infinite;
    }

    :global(.fan) {
      clip-path: polygon(100% 0, 0 3%, 100% 100%);
    }

    :global(.cap) {
      right: 0;
      clip-path: circle(
        (@sand-spinner-line-width / 2) at 50% (@sand-spinner-line-width / 2)
      );
      transform-origin: bottom center;
      background-color: @sand-spinner-head-color;
    }

    :global(.client) {
      margin-top: @sand-spotlight-outset;
      font-size: @sand-body-font-size;
      font-weight: @sand-spinner-font-weight;
      color: @sand-spinner-text-color;
      text-shadow: 0 1px 1px @sand-spinner-text-shadow-color;
    }

    &.small {
      :global(.bg) {
        width: @sand-spinner-small-size;
        height: @sand-spinner-small-size;
        padding: @sand-spinner-small-line-margin;
      }

      :global(.decorator) {
        -webkit-mask-image: radial-gradient(
          circle,
          transparent
            (
              @sand-spinner-small-size / 2 - @sand-spinner-small-line-width -
                1px
            ),
          black (@sand-spinner-small-size / 2 - @sand-spinner-small-line-width)
        );
        mask-image: radial-gradient(
          circle,
          transparent
            (
              @sand-spinner-small-size / 2 - @sand-spinner-small-line-width -
                1px
            ),
          black (@sand-spinner-small-size / 2 - @sand-spinner-small-line-width)
        );

        :global(.cap) {
          clip-path: circle(
            (@sand-spinner-small-line-width / 2) at 50%
              (@sand-spinner-small-line-width / 2)
          );
        }
      }
    }
  }
</style>

