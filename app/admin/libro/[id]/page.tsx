import { notFound } from "next/navigation";
import { getBookById } from "@/lib/db";
import { BookForm } from "@/components/BookForm";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const book = await getBookById(Number((await params).id));
  if (!book) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Editar: {book.title}</h1>
      <BookForm book={book} />
    </div>
  );
}
