import { redirect } from "next/navigation";
import { list } from "@vercel/blob";
import { verifySession } from "@/lib/auth";

// TEMPORARY recovery tool for the 2026-09-24 data-loss incident — lists raw
// Blob objects so lost image URLs can be matched back to their original
// filenames (preserved in the blob pathname) and reused when rebuilding
// content. Delete this route once recovery is done.
export const dynamic = "force-dynamic";

export default async function DebugBlobsPage() {
  if (!(await verifySession())) redirect("/admin/login");

  const [modelos, content] = await Promise.all([
    list({ prefix: "modelos/", limit: 1000 }),
    list({ prefix: "content/", limit: 1000 }),
  ]);

  const all = [...modelos.blobs, ...content.blobs].sort(
    (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 font-mono text-xs">
      <h1 className="font-sans text-2xl">Blobs ({all.length})</h1>
      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1 pr-4">uploadedAt</th>
            <th className="py-1 pr-4">pathname</th>
            <th className="py-1 pr-4">size</th>
            <th className="py-1">url</th>
          </tr>
        </thead>
        <tbody>
          {all.map((b) => (
            <tr key={b.pathname} className="border-b border-black/20">
              <td className="py-1 pr-4 whitespace-nowrap">{b.uploadedAt.toISOString()}</td>
              <td className="py-1 pr-4">{b.pathname}</td>
              <td className="py-1 pr-4">{b.size}</td>
              <td className="py-1">
                <a href={b.url} target="_blank" rel="noreferrer" className="underline">
                  {b.url}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
