import type { Metadata } from "next";
import { DesignSystemGallery } from "./gallery";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemGallery />;
}
