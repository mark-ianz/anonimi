import { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/images/icon/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
