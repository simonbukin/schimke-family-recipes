<script>
  import { onMount, onDestroy } from "svelte";

  export let toggleLabel;
  let isSupported;
  let wakeLock;
  let timer = 0;
  let interval;

  onMount(async () => {
    isSupported = "wakeLock" in navigator;
    return async () => {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    }
  })
   
  onDestroy(() => {
    stopTimer()
  })

  const handleToggleClick = async (event) => {
    const checked = event.target.checked;

    if (checked) {
      startTimer()
      wakeLock = await navigator.wakeLock.request("screen");
    } else {
      stopTimer()
      await wakeLock.release();
      wakeLock = null;
    }
  }
  
  const startTimer = () => {
    interval = setInterval(() => {
      timer++
    }, 1000)
  }

  const stopTimer = () => {
    clearInterval(interval)
    interval = null
  }
</script>

<div class="my-4 flex flex-row items-center">
  <label class="font-bold" for="toggle" >{toggleLabel}</label>
  <input class="ml-2 aspect-square w-[20px] shrink-0" type="checkbox" id="toggle" on:change={handleToggleClick}/>
  {#if interval}
    <p class="mx-2">cookin' for {timer} second{timer !== 1 ? 's' : ''} 👨‍🍳
    </p> 
  {/if}
</div>