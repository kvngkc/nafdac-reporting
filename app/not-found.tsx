import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <Link href="/" className="btn-primary mt-4">
          Go home
        </Link>
      </div>
    </div>
  );
}
