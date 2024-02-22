<script>
  import { onMount } from "svelte";

  export let toggleLabel;
  let isSupported;
  let wakeLock;

  onMount(async () => {
    isSupported = "wakeLock" in navigator;
  })

  const handleToggleClick = async (event) => {
    const checked = event.target.checked;

    if (checked) {
      wakeLock = await navigator.wakeLock.request("screen");
    } else {
      await wakeLock.release();
      wakeLock = null;
    }
  }
</script>

<div class="my-4 flex flex-row items-center">
  <label class="font-bold" for="toggle" >{toggleLabel}</label>
  <input class="ml-2 aspect-square w-[20px] shrink-0" type="checkbox" id="toggle" on:change={handleToggleClick}/>
</div>