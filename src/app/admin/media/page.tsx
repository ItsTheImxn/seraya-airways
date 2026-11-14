
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MediaFile = {
  name: string;
  path: string;
  url: string;
  created_at?: string | null;
  content_type: string;
  size: number;
};

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/media", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load media.");
      }

      setFiles(data.files || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load media."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function uploadFiles(selectedFiles: FileList | File[]) {
    const images = Array.from(selectedFiles);

    if (!images.length) return;

    setError("");
    setSuccess("");
    setUploading(true);

    let uploaded = 0;
    const failures: string[] = [];

    try {
      for (const file of images) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/admin/media", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
          }

          uploaded++;
        } catch (err) {
          failures.push(
            `${file.name}: ${
              err instanceof Error ? err.message : "Upload failed"
            }`
          );
        }
      }

      if (uploaded > 0) {
        setSuccess(
          `${uploaded} image${uploaded === 1 ? "" : "s"} uploaded successfully.`
        );
      }

      if (failures.length > 0) {
        setError(failures.join("\n"));
      }

      await loadFiles();
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function deleteFile(file: MediaFile) {
    const confirmed = window.confirm(
      `Permanently delete ${file.name}? Any website pages using this image may stop displaying it.`
    );

    if (!confirmed) return;

    setDeleting(file.path);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: file.path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete file.");
      }

      setSuccess(`${file.name} deleted successfully.`);
      await loadFiles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete file."
      );
    } finally {
      setDeleting(null);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess("Image URL copied to clipboard.");
      setError("");
    } catch {
      setError("Could not copy the image URL.");
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#33291f]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <a
          href="/admin"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#8b7555] transition hover:text-[#493a2b]"
        >
          ← Back to dashboard
        </a>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a98752]">
              SERAYA AIRWAYS · WEBSITE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Media library
            </h1>

            <p className="mt-2 text-sm text-[#83786b]">
              Upload and manage your airline's images and brand assets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl bg-[#493a2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#65513b] disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "+ Upload images"}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) uploadFiles(event.target.files);
          }}
        />

        {error && (
          <div className="mb-5 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <section
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            uploadFiles(event.dataTransfer.files);
          }}
          onClick={() => {
            if (!uploading) inputRef.current?.click();
          }}
          className={`mb-7 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
            dragging
              ? "border-[#a98752] bg-[#f2eadc]"
              : "border-[#ded4c5] bg-white hover:border-[#b79a70]"
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5efe5] text-2xl text-[#98703e]">
            ↑
          </div>

          <h2 className="text-lg font-semibold">
            {dragging ? "Drop your images here" : "Upload your Seraya assets"}
          </h2>

          <p className="mt-2 text-sm text-[#83786b]">
            Drag and drop images here, or click to browse your files.
          </p>

          <p className="mt-3 text-xs text-[#a39787]">
            PNG, JPG, WEBP and GIF · Maximum 8 MB per image
          </p>
        </section>

        <section className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
            <p className="text-xs text-[#83786b]">Total assets</p>
            <p className="mt-2 text-2xl font-semibold">{files.length}</p>
          </div>

          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
            <p className="text-xs text-[#83786b]">Storage used by listed files</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatSize(totalSize)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
            <p className="text-xs text-[#83786b]">Storage bucket</p>
            <p className="mt-2 text-lg font-semibold">seraya-media</p>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">All assets</h2>
            <p className="mt-1 text-sm text-[#83786b]">
              Your uploaded images appear here.
            </p>
          </div>

          <button
            type="button"
            onClick={loadFiles}
            disabled={loading}
            className="rounded-lg border border-[#e7dfd2] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f5efe5] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-12 text-center text-sm text-[#83786b]">
            Loading your media library...
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-12 text-center">
            <p className="text-lg font-semibold">No assets uploaded yet</p>
            <p className="mt-2 text-sm text-[#83786b]">
              Upload your first Seraya logo or image to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <article
                key={file.path}
                className="overflow-hidden rounded-2xl border border-[#e8e0d4] bg-white shadow-sm"
              >
                <div className="flex h-48 items-center justify-center bg-[#f1eee8] p-4">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <p
                    className="truncate text-sm font-semibold"
                    title={file.name}
                  >
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-[#83786b]">
                    {file.content_type} · {formatSize(file.size)}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyUrl(file.url)}
                      className="flex-1 rounded-lg border border-[#e7dfd2] px-3 py-2 text-xs font-semibold hover:bg-[#f7f5f0]"
                    >
                      Copy URL
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteFile(file)}
                      disabled={deleting === file.path}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === file.path ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[#a39787]">
          Seraya Airways · Media management
        </p>
      </div>
    </main>
  );
}
