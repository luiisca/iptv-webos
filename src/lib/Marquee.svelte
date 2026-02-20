<!-- migrated from @enact/sandstone/Marquee -->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  
  let {
    children,
    marqueeOn = 'focus',
    marqueeDelay = 1000,
    marqueeResetDelay = 1000,
    marqueeSpeed = 60,
    marqueeDisabled = false,
    alignment = 'left',
    forceStart = false, // Allow parent to force start (e.g. Item focus)
    class: className = '',
    ...rest
  } = $props();

  let containerRef = $state<HTMLDivElement>();
  let textRef = $state<HTMLDivElement>();
  
  let animating = $state(false);
  let willAnimate = $state(false);
  let distance = $state(0);
  let duration = $state(0);
  let contentFits = $state(true);
  let rtl = $state(false);

  function calculateMetrics() {
    if (!containerRef || !textRef) return false;
    
    const containerWidth = containerRef.offsetWidth;
    const scrollWidth = textRef.scrollWidth;
    
    if (scrollWidth > containerWidth) {
      contentFits = false;
      distance = scrollWidth;
      duration = scrollWidth / marqueeSpeed;
      return true;
    } else {
      contentFits = true;
      distance = 0;
      return false;
    }
  }

  let startTimer: ReturnType<typeof setTimeout> | null = null;

  function start() {
    if (marqueeDisabled || animating) return;
    
    const needsMarquee = calculateMetrics();
    if (!needsMarquee) return;

    willAnimate = true;
    if (startTimer) clearTimeout(startTimer);
    startTimer = setTimeout(() => {
      if (willAnimate) {
        animating = true;
      }
    }, marqueeDelay);
  }

  function stop() {
    if (startTimer) clearTimeout(startTimer);
    animating = false;
    willAnimate = false;
  }

  function handleTransitionEnd(ev: TransitionEvent) {
    if (ev.propertyName === 'transform' && animating) {
      animating = false;
      setTimeout(() => {
        if (willAnimate) {
          start();
        }
      }, marqueeResetDelay);
    }
  }

  $effect(() => {
    if (forceStart || marqueeOn === 'render') {
      start();
    } else {
      stop();
    }
  });

  onMount(() => {
    // Check initial metrics
    calculateMetrics();
    
    return () => {
      if (startTimer) clearTimeout(startTimer);
    };
  });
</script>

<div 
  bind:this={containerRef}
  class="marquee {className}"
  {...rest}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    bind:this={textRef}
    class="text"
    class:willAnimate
    class:animate={animating}
    style:text-align={alignment}
    style:transform={animating ? `translateX(${rtl ? '' : '-'}${distance}px)` : 'translateX(0)'}
    style:transition-duration={animating ? `${duration}s` : '0s'}
    ontransitionend={handleTransitionEnd}
  >
    {#if children}
      {@render children()}
    {/if}
    
    {#if !contentFits && (willAnimate || animating)}
      <div class="spacing" style="--ui-marquee-spacing: 80px;"></div>
      <span dir={rtl ? "rtl" : "ltr"}>
        {#if children}
          {@render children()}
        {/if}
      </span>
    {/if}
  </div>
</div>

<style lang="less">
  /* Import the CSS as LESS since it uses variables and nested rules sometimes if it was module.less previously */
  /* In this case it's .module.css but we can treat it as less if we want or just css */
  @import "@sandstone/Marquee/Marquee.module.css";

  .marquee {
    display: block;
    width: 100%;
    /* Override width: auto from css to ensure it takes parent width for measurement */
  }

  .text {
    display: inline-block;
    width: auto !important; /* Allow it to grow beyond container for scrollWidth */
    min-width: 100%;
  }
</style>
