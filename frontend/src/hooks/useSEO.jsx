import { useEffect } from "react";

const SITE_NAME = "Abeg Fix";
const SITE_URL = "https://abegfix.com";

const useSEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
}) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const pageUrl = canonical || `${SITE_URL}${window.location.pathname}`;

    // Create or update meta tags
    const setMetaTag = (attr, value, content) => {
      let element = document.querySelector(`meta[${attr}="${value}"]`);

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Create or update link tags
    const setLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);

      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }

      element.setAttribute("href", href);
    };

    // Canonical
    setLinkTag("canonical", pageUrl);

    // Standard SEO
    setMetaTag("name", "description", description);

    // Open Graph
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", pageUrl);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:site_name", SITE_NAME);

    if (ogImage) {
      setMetaTag("property", "og:image", ogImage);
      setMetaTag("property", "og:image:width", "1200");
      setMetaTag("property", "og:image:height", "630");
    }

    // Twitter
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);

    if (ogImage) {
      setMetaTag("name", "twitter:image", ogImage);
    }
  }, [title, description, canonical, ogImage, ogType]);
};

export default useSEO;
