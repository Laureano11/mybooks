"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLogin, logout } from "@/lib/auth";
import { createBook, updateBook, deleteBook, getBookById } from "@/lib/db";
import { validateBook, type BookInput } from "@/lib/validation";

/** Al fallar la validación se devuelven los valores enviados para no perder lo escrito. */
export type FormState = {
  errors: Record<string, string>;
  values: BookInput;
} | null;

function readForm(formData: FormData): BookInput {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    title: get("title"),
    author: get("author"),
    isbn: get("isbn"),
    rating: get("rating"),
    review: get("review"),
    status: get("status"),
    finishedYear: get("finishedYear"),
    gem: get("gem"),
  };
}

/** Revalida las rutas que muestran libros. */
function revalidateAll(slug?: string) {
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/libro/${slug}`);
}

export async function saveBook(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireLogin(); // las Server Actions son endpoints: se revalida acá también

  const input = readForm(formData);
  const result = validateBook(input);
  if (!result.ok) return { errors: result.errors, values: input };

  const rawId = formData.get("id");
  let slug: string;

  if (rawId) {
    const id = Number(rawId);
    const existing = await getBookById(id);
    if (!existing)
      return { errors: { title: "El libro ya no existe." }, values: input };
    slug = (await updateBook(id, result.value)).slug;
  } else {
    slug = (await createBook(result.value)).slug;
  }

  revalidateAll(slug);
  redirect(`/libro/${slug}`);
}

export async function removeBook(formData: FormData): Promise<void> {
  await requireLogin();

  const id = Number(formData.get("id"));
  const book = await getBookById(id);
  if (book) {
    await deleteBook(id);
    revalidateAll(book.slug);
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/");
}
