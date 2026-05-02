import Link from "next/link";
import CartClient from "./components/CartClient";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                POS Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage orders and products from one place.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Manage Products
              </Link>
              <Link
                href="/orders"
                className="rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Manage Orders
              </Link>
            </div>
          </div>
        </header>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <CartClient />
        </div>
      </div>
    </div>
  );
}
