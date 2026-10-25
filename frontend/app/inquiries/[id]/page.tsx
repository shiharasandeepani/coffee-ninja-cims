"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

const NEXT_STATUSES: Record<string, string[]> = {
  "New": ["In Progress"],
  "In Progress": ["New", "Resolved"],
  "Resolved": ["In Progress"],
};

export default function InquiryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api(`/api/inquiries/${params.id}`)
      .then((data) => setInquiry(data.inquiry))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function changeStatus(status: string) {
    setNotice("");
    try {
      const data = await api(`/api/inquiries/${inquiry.id}/status`, {
        method: "PATCH",
        body: { status, expectedUpdatedAt: inquiry.updated_at },
      });
      setInquiry(data.inquiry);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "STALE_DATA" && err.data?.inquiry) setInquiry(err.data.inquiry);
        setNotice(err.message);
      } else {
        setNotice("Something went wrong.");
      }
    }
  }

  if (loading) return <main className="p-4 text-sm">Loading...</main>;

  if (error || !inquiry) {
    return (
      <main className="max-w-xl mx-auto p-4 space-y-2">
        <p role="alert" className="text-sm text-red-700">{error || "Inquiry not found."}</p>
        <Link href="/inquiries" className="text-sm underline">Back to list</Link>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <Link href="/inquiries" className="text-sm underline">Back to list</Link>

      <div className="bg-white border rounded p-4 space-y-2">
        <h1 className="text-xl font-semibold">{inquiry.subject}</h1>
        <p className="text-sm">Status: <strong>{inquiry.status}</strong></p>
        <p className="text-sm">{inquiry.customer_name} · {inquiry.contact}</p>
        <p className="text-sm whitespace-pre-wrap">{inquiry.description}</p>
      </div>

      {notice && (
        <p role="alert" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          {notice}
        </p>
      )}

      <div className="flex gap-2">
        {NEXT_STATUSES[inquiry.status].map((s) => (
          <button key={s} onClick={() => changeStatus(s)} className="border rounded px-3 py-2 text-sm">
            Mark as {s}
          </button>
        ))}
      </div>
    </main>
  );
}