import Link from "next/link";
import CartClient from "./components/CartClient";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 p-1">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <CartClient />
        </div>
      </div>
    </div>
  );
}
