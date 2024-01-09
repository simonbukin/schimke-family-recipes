import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  // process form data into a markdown
  // make new branch
  // add markdown to commit
  // commit to branch
  // push to branch
  // create pull request

  return new Response(JSON.stringify({ message: "yeah" }), {
    status: 200,
  });
};
