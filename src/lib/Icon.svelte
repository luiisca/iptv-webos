<!-- migrated from @enact/sandstone/Icon -->
<script lang="ts">
  import { iconList } from "./icons";

  let {
    children,
    icon,
    size = "small",
    class: className = "",
    ...rest
  } = $props();

  let iconName = $derived.by(() => {
    if (icon) return icon;

    // In Svelte 5, if children is passed as a string/text inside the tag,
    // it's often still a snippet. But if we want to support <Icon>star</Icon>,
    // we might need to handle it. However, snippets are functions.
    return "";
  });

  let glyph = $derived(iconName && iconList[iconName] ? String.fromCodePoint(iconList[iconName]) : "");
</script>

<span class="icon {size} {className}" {...rest}>
  {#if glyph}
    {glyph}
  {:else if children}
    {@render children()}
  {/if}
</span>

<style lang="less">
  @import "@sandstone/Icon/Icon.module.less";
</style>
