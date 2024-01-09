<script lang="ts">
  let cleared = false;
  async function submitHandler(e: Event) {
    const formData = new FormData(e.target as HTMLFormElement);
    const response = await fetch("/api/validateUser", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      cleared = true;
    } else {
      alert("Nice try stinky")
    }
  }
</script>

<form class:visible={cleared} on:submit|preventDefault={submitHandler}>
  <label>
    Password
    <input name="password" type="password" />
  </label>
  <input class="p-2 border-2 border-orange-400 bg-orange-200"  type="submit" />
</form>

{#if cleared}
  <slot />
{/if}

<style>
  .visible {
    display: none;
  }
</style>
