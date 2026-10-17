"use client";

/** Tombol submit dengan konfirmasi (seperti dialog konfirmasi hapus di WordPress) */
export default function ConfirmButton({
  message,
  children,
  formAction,
  className,
  name,
  value,
}: {
  message: string;
  children: React.ReactNode;
  formAction?: (fd: FormData) => void | Promise<void>;
  className?: string;
  name?: string;
  value?: string | number;
}) {
  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      formAction={formAction}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
