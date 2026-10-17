import { ArchivePage, archiveMetadata } from "@/lib/archive";

export const revalidate = 300;

// Dirender saat pertama diakses lalu di-cache (ISR)
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return archiveMetadata("category", decodeURIComponent(slug));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <ArchivePage kind="category" slug={decodeURIComponent(slug)} />;
}
