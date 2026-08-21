"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const CATEGORIES = [
  "PLUMBING", "ELECTRICAL", "CLEANING", "SECURITY",
  "LIFT", "PARKING", "INTERNET", "OTHER"
];

export default function NewComplaintPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => setPhotoPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          description,
          photoBase64: photoPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      router.push(`/complaints/${data.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  if (isLoading || !user) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-header">
        <Link href="/complaints" className="btn btn-ghost mb-md" style={{ paddingLeft: 0 }}>
          ← Back to complaints
        </Link>
        <h1>Raise Complaint</h1>
        <p className="page-subtitle">Describe the issue and our team will look into it.</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error mb-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue..."
              required
            />
          </div>

          <div className="form-group">
            <label>Attach Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: "absolute", top: 10, right: 10 }}
                  onClick={() => {
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" strokeLinejoin="miter" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                <div className="upload-text font-semibold text-primary">Click to upload photo</div>
                <div className="upload-hint">PNG, JPG up to 5MB</div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ padding: "12px" }}
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}
