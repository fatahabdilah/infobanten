"use client";

import { useState } from "react";
import type { MediaItem } from "@/app/actions/admin";
import { MediaLibrary, UploadDropzone } from "./MediaLibrary";

/** Halaman Pustaka Media (upload.php) */
export default function MediaManager({ startWithUploader = false }: { startWithUploader?: boolean }) {
  const [uploader, setUploader] = useState(startWithUploader);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [preselect, setPreselect] = useState<number[] | undefined>();

  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">Pustaka Media</h1>
      <button type="button" className="page-title-action" onClick={() => setUploader((v) => !v)}>
        Tambah File Media Baru
      </button>
      <hr className="wp-header-end" />
      {uploader && (
        <div className="relative mt-4 bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,.04)]">
          <button type="button" className="absolute right-2 top-1 text-2xl text-[#646970]" aria-label="Tutup pengunggah" onClick={() => setUploader(false)}>
            ×
          </button>
          <UploadDropzone
            onUploaded={(ids) => {
              setPreselect(ids.slice(-1));
              setRefresh((r) => r + 1);
            }}
          />
        </div>
      )}
      <div className="mt-4 h-[calc(100vh-170px)] min-h-[520px] border border-[#c3c4c7] bg-white">
        <MediaLibrary selected={selected} onSelect={setSelected} refreshKey={refresh} preselect={preselect} />
      </div>
    </div>
  );
}
