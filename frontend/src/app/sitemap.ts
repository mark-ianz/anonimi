import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";

type Route = {
  url: string;
  lastModified?: Date;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

const publicRoutes: Route[] = [
  {
    url: "",
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: "/about",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: "/features",
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: "/faq",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: "/contact",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: "/privacy",
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    url: "/terms",
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    url: "/register",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: "/login",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: "/temporary",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route.url}`,
    lastModified: route.lastModified ?? now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
