"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type Inquiry = {
  id: number;
  customer_name: string;
  contact: string;
  subject: string;
  status: "New" | "In Progress" | "Resolved";
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  "New": "bg-blue-100 text-blue-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Resolved": "bg-green-100 text-green-800",
};

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // search text after a short pause
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // wait 300ms after typing before searching
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query.trim()) params.set("q", query.trim());

    api("/api/inquiries?" + params.toString())
      .then((data) => {
        if (!ignore) setInquiries(data.inquiries);
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [status, query, reloadKey, router]);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  const filtering = status !== "" || query.trim() !== "";

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inquiries</h1>
        <div className="flex gap-2">
          <Link href="/inquiries/new" className="bg-stone-900 text-white rounded px-3 py-2 text-sm">
            New inquiry
          </Link>
          <button onClick={signOut} className="border rounded px-3 py-2 text-sm">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search name, contact or subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded p-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded p-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {loading && <p className="text-sm text-stone-500">Loading inquiries...</p>}

      {!loading && error && (
        <div role="alert" className="border border-red-200 bg-red-50 text-red-700 rounded p-4 text-sm">
          <p>{error}</p>
          <button onClick={() => setReloadKey((k) => k + 1)} className="mt-2 underline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && inquiries.length === 0 && (
        <div className="border border-dashed rounded p-8 text-center text-sm text-stone-600">
          {filtering ? (
            <p>No inquiries match your search.</p>
          ) : (
            <>
              <p>No inquiries yet.</p>
              <Link href="/inquiries/new" className="underline">
                Record your first inquiry
              </Link>
            </>
          )}
        </div>
      )}

      {!loading && !error && inquiries.length > 0 && (
        <ul className="divide-y border rounded bg-white">
          {inquiries.map((i) => (
            <li key={i.id}>
              <Link href={`/inquiries/${i.id}`} className="flex items-center justify-between gap-4 p-3 hover:bg-stone-50">
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.subject}</p>
                  <p className="text-sm text-stone-600 truncate">
                    {i.customer_name} · {i.contact}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${STATUS_STYLES[i.status]}`}>
                  {i.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
