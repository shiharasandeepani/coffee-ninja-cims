"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function NewInquiryPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSaving(true);
    try {
      await api("/api/inquiries", {
        method: "POST",
        body: { customer_name: customerName, contact, subject, description },
      });
      router.push("/inquiries");
    } catch (err) {
      setSaving(false);
      if (!(err instanceof ApiError)) {
        setFormError("Something went wrong.");
        return;
      }
      if (err.status === 401) {
        router.push("/login");
        return;
      }
      setFormError(err.message);
      setFieldErrors(err.fields || {});
    }
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New inquiry</h1>
        <Link href="/inquiries" className="text-sm underline">
          Back to list
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border rounded p-4 space-y-4">
        {formError && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium">Customer name</label>
          <input
            id="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full border rounded p-2 text-sm"
          />
          {fieldErrors.customer_name && <p className="mt-1 text-sm text-red-700">{fieldErrors.customer_name}</p>}
        </div>

        <div>
          <label htmlFor="contact" className="block text-sm font-medium">Contact (phone or email)</label>
          <input
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full border rounded p-2 text-sm"
          />
          {fieldErrors.contact && <p className="mt-1 text-sm text-red-700">{fieldErrors.contact}</p>}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium">Subject</label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full border rounded p-2 text-sm"
          />
          {fieldErrors.subject && <p className="mt-1 text-sm text-red-700">{fieldErrors.subject}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full border rounded p-2 text-sm"
          />
          {fieldErrors.description && <p className="mt-1 text-sm text-red-700">{fieldErrors.description}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-stone-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save inquiry"}
        </button>
      </form>
    </main>
  );
}