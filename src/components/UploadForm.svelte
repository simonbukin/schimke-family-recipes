<script lang="ts">
  async function handleSubmit(e: Event) {
    const formData = new FormData(e.target as HTMLFormElement);;
    const response = await fetch('/api/uploadRecipe', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
  }
</script>

<form class="flex flex-col gap-4" on:submit|preventDefault={handleSubmit} method="POST">
  <label class="flex flex-col">
    Name
    <input type="text" name="name" placeholder="Name" />
  </label>
  <label class="flex flex-col">
    Type
    <input
      type="text"
      name="type"
      placeholder="Type (breakfast, lunch, seasoning, etc)"
    />
  </label>
  <label class="flex flex-col">
    Author
    <input type="text" name="author" placeholder="Author" />
  </label>
  <label class="flex flex-col">
    Time
    <input type="text" name="time" placeholder="Time" />
  </label>
  <label class="flex flex-col">
    Servings
    <input type="text" name="servings" placeholder="Servings" />
  </label>
  <label class="flex flex-col">
    Ingredients
    <textarea
      name="ingredients"
      placeholder="Ingredients, in the following format per line: <name>, <amount> <unit>"
      rows="5"></textarea>
  </label>
  <label class="flex flex-col">
    Cookware
    <textarea
      name="cookware"
      placeholder="Cookware, in the following format per line: <name>, <amount>"
      rows="5"></textarea>
  </label>
  <label class="flex flex-col">
    Steps
    <textarea
      name="steps"
      placeholder="Steps, with one step per line."
      rows="5"></textarea>
  </label>
  <button
      class="w-full bg-orange-200 border-orange-400 border-4 mt-2 mb-6 text-lg rounded-md"
      type="submit">Submit</button
    >
</form>

<style>
  input,
  textarea {
    margin-top: 0.5rem;
    border: 4px solid var(--orange-400);
    border-radius: 0.5rem;
    padding: 0.5rem;
    font-size: 1.25rem;
  }
  label {
    font-weight: bold;
  }
</style>