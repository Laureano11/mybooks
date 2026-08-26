import { BookForm } from "@/components/BookForm";

export const metadata = { title: "Nuevo libro — mybooks" };

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Nuevo libro</h1>
      <BookForm />
    </div>
  );
}
