import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DownloadCloud, X, Plus } from "lucide-react";

// context types
type Loan = any;
type Ctx = { loan: Loan | null; refresh?: () => Promise<void> };

type LoanDoc = {
  id?: number | string;
  name: string;
  description?: string;
  fileName: string;
  blobUrl?: string; 
};

const LoansDocumentsTab = () => {
  const { loan, refresh } = useOutletContext<Ctx>() || {};

  // state
  const [docs, setDocs] = useState<LoanDoc[]>([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // load docs from loan object
  useEffect(() => {
    const fromLoan = Array.isArray(loan?.documents)
      ? loan!.documents.map((d: any) => ({
          id: d.id,
          name: d.name ?? d.fileName ?? "—",
          description: d.description ?? "",
          fileName: d.fileName ?? "—",
        }))
      : [];
    setDocs(fromLoan);
  }, [loan]);

  // reset form fields
  const resetForm = () => {
    setName("");
    setDesc("");
    setFile(null);
  };

  // add new document
  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    setSubmitting(true);
    try {
      const blobUrl = URL.createObjectURL(file);
      setDocs((prev) => [
        ...prev,
        { id: `${Date.now()}`, name, description: desc, fileName: file.name, blobUrl },
      ]);
      if (refresh) await refresh();
      setShow(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (d: LoanDoc) => {
    const url = d.blobUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = d.fileName || d.name || "document";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (d: LoanDoc) => {
    setDocs((prev) => prev.filter((x) => x !== d));
    if (refresh) await refresh();
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black dark:text-white">Documents</h3>
        <Button
          onClick={() => setShow(true)}
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* documents table */}
      <div className="rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Name</TableHead>
              <TableHead className="w-1/3">Description</TableHead>
              <TableHead className="w-1/3">File Name</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-zinc-500">
                  No documents
                </TableCell>
              </TableRow>
            )}
            {docs.map((d, i) => (
              <TableRow key={`${d.id ?? i}`}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.description || "—"}</TableCell>
                <TableCell>{d.fileName}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      className="bg-[#0e77b7] hover:bg-[#0662a3] text-white border-0"
                      onClick={() => handleDownload(d)}
                      disabled={!d.blobUrl && !d.id}
                      title="Download"
                    >
                      <DownloadCloud className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#e53935] hover:bg-[#cf2a27] text-white border-0"
                      onClick={() => handleDelete(d)}
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* upload modal */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[560px] max-w-[92vw] bg-white dark:bg-zinc-800 rounded-lg p-5">
            <h4 className="text-lg font-semibold mb-4">Upload Documents</h4>

            <div className="space-y-4">
              {/* name */}
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-300 mb-1">
                  File Name<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border-b border-zinc-300 dark:border-zinc-600 bg-transparent outline-none py-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>

              {/* description */}
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <input
                  className="w-full border-b border-zinc-300 dark:border-zinc-600 bg-transparent outline-none py-1"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional description"
                />
              </div>

              {/* file picker */}
              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="col-span-1">
                  <div className="text-zinc-500 text-sm">No file selected</div>
                </div>
                <div className="col-span-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h3l2 2h7a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span>Browse</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {file && <div className="mt-1 text-sm text-zinc-600">{file.name}</div>}
                </div>
              </div>
            </div>

            {/* modal actions */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                className="border-0 bg-zinc-200 hover:bg-zinc-300 text-black dark:bg-zinc-700 dark:text-white"
                onClick={() => { setShow(false); resetForm(); }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#0e77b7] hover:bg-[#0662a3] text-white border-0"
                disabled={!name.trim() || !file || submitting}
                onClick={handleUpload}
              >
                {submitting ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansDocumentsTab;
