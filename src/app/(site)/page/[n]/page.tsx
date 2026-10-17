import { ArchivePage, archiveMetadata } from "@/lib/archive";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props) {
  return archiveMetadata("blog", "", (await params).n);
}

export default async function Page({ params }: Props) {
  return <ArchivePage kind="blog" slug="" pageParam={(await params).n} />;
}
