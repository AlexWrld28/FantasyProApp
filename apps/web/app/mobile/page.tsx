import type { Metadata } from "next";
import MobileMvpApp from "./MobileMvpApp";

export const metadata: Metadata = {
  title: "FantasyPro Mobile",
  description: "Mobile fantasy football league dashboard demo.",
  alternates: {
    canonical: "/mobile"
  }
};

export default function MobilePage() {
  return <MobileMvpApp />;
}
