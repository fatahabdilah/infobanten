import { ArchivePage, archiveMetadata } from "@/lib/archive";

export const revalidate = 300;

// Dirender saat pertama diakses lalu di-cache (ISR)
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug, n } = await params;
  return archiveMetadata("author", decodeURIComponent(slug), n);
}

export default async function Page({ params }: Props) {
  const { slug, n } = await params;
  return <ArchivePage kind="author" slug={decodeURIComponent(slug)} pageParam={n} />;
}
