import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InventoryPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const itemRaw = params.item;
  const item = Array.isArray(itemRaw) ? itemRaw[0] : itemRaw;
  const qs = new URLSearchParams({ tab: "inventory" });
  if (item?.trim()) {
    qs.set("item", item.trim());
  }
  redirect(`/dashboard/collection?${qs.toString()}`);
}
