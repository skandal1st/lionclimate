import { useEffect } from 'react';
import { SITE_ORIGIN } from '../seo/site';

type Props = {
  title: string;
  description?: string;
  canonicalPath?: string;
  /** Админка и служебные страницы — не индексировать */
  noindex?: boolean;
};

export default function SeoHead({ title, description, canonicalPath, noindex }: Props) {
  useEffect(() => {
    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.setAttribute('content', description);
    }

    let linkCanon = document.querySelector('link[rel="canonical"]');
    if (canonicalPath !== undefined) {
      if (!linkCanon) {
        linkCanon = document.createElement('link');
        linkCanon.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanon);
      }
      linkCanon.setAttribute('href', `${SITE_ORIGIN}${canonicalPath}`);
    } else {
      document.querySelector('link[rel="canonical"]')?.remove();
    }

    let robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    } else if (robots) {
      robots.remove();
    }
  }, [title, description, canonicalPath, noindex]);

  return null;
}
