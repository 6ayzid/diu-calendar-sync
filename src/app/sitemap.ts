import { MetadataRoute } from 'next';
import { ALL_SECTIONS } from '@/data/sections';
import { DIU_FACULTY_DIRECTORY } from '@/data/faculty';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://diucal.vercel.app';
  const now = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic section routes (e.g. /?section=68_D)
  const sectionRoutes: MetadataRoute.Sitemap = ALL_SECTIONS.map((sec) => ({
    url: `${baseUrl}/?section=${encodeURIComponent(sec.id)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // Dynamic faculty routes (e.g. /?teacher=MSR)
  const facultyRoutes: MetadataRoute.Sitemap = DIU_FACULTY_DIRECTORY.map((f) => ({
    url: `${baseUrl}/?teacher=${encodeURIComponent(f.code)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...sectionRoutes, ...facultyRoutes];
}
