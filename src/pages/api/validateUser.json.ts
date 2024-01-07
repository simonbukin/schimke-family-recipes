import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const password = data.get("password");
  const correctPassword = password === process.env.SUBMIT_RECIPE_KEY;
  return new Response(JSON.stringify({ message: correctPassword }), {
    status: correctPassword ? 200 : 400,
  });
};
