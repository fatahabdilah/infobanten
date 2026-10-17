"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveTerm, type TermState } from "@/app/actions/admin";

type Term = { id: number; name: string; slug: string; description: string; parentId: number | null };

export default function TermForm({ taxonomy, parents, term }: { taxonomy: "category" | "post_tag"; parents: Term[]; term?: Term }) {
  const [state, action, pending] = useActionState<TermState, FormData>(saveTerm, null);
  const form = useRef<HTMLFormElement>(null);
  const isCat = taxonomy === "category";
  const noun = isCat ? "Kategori" : "Tag";

  useEffect(() => {
    if (state?.ok && !term) form.current?.reset();
  }, [state, term]);

  return (
    <form ref={form} action={action}>
      <input type="hidden" name="taxonomy" value={taxonomy} />
      {term && <input type="hidden" name="tag_ID" value={term.id} />}
      {state && (
        <div className={`notice ${state.ok ? "notice-success" : "notice-error"}`}>
          <p>{state.message}</p>
        </div>
      )}
      <div className={term ? "" : "space-y-4"}>
        <Row term={term} label="Nama" htmlFor="tag-name" help="Nama ini akan tampil di situs Anda.">
          <input id="tag-name" name="tag-name" type="text" required defaultValue={term?.name} className="w-full" />
        </Row>
        <Row term={term} label="Slug" htmlFor="tag-slug" help="“Slug” adalah versi nama yang ramah URL. Biasanya huruf kecil semua dan hanya berisi huruf, angka, dan tanda hubung.">
          <input id="tag-slug" name="slug" type="text" defaultValue={term?.slug} className="w-full" />
        </Row>
        {isCat && (
          <Row term={term} label="Induk Kategori" htmlFor="parent" help="Kategori, tidak seperti tag, bisa memiliki hierarki. Anda bisa memiliki kategori Jazz, dan di bawahnya kategori anak untuk Bebop dan Big Band.">
            <select id="parent" name="parent" defaultValue={term?.parentId ?? ""} className="w-full max-w-[300px]">
              <option value="">Tidak ada</option>
              {parents.filter((p) => p.id !== term?.id).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Row>
        )}
        <Row term={term} label="Deskripsi" htmlFor="tag-description" help="Deskripsi tidak tampil secara default; namun, beberapa tema mungkin menampilkannya.">
          <textarea id="tag-description" name="description" rows={5} defaultValue={term?.description} className="w-full" />
        </Row>
      </div>
      <p className="mt-4">
        <button type="submit" className="button button-primary" disabled={pending}>
          {term ? "Perbarui" : `Tambah ${noun} Baru`}
        </button>
      </p>
    </form>
  );
}

function Row({ term, label, htmlFor, help, children }: { term?: Term; label: string; htmlFor: string; help: string; children: React.ReactNode }) {
  if (term)
    return (
      <table className="form-table">
        <tbody>
          <tr>
            <th scope="row"><label htmlFor={htmlFor}>{label}</label></th>
            <td>{children}<p className="description">{help}</p></td>
          </tr>
        </tbody>
      </table>
    );
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      <p className="description">{help}</p>
    </div>
  );
}
