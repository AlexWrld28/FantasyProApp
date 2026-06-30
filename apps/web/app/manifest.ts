import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FantasyPro Mobile",
    short_name: "FantasyPro",
    description: "Mobile fantasy football league dashboard.",
    start_url: "/mobile",
    scope: "/",
    display: "standalone",
    background_color: "#081019",
    theme_color: "#081019",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
