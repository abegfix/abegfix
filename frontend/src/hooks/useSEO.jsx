import { useEffect } from "react";

const SITE_NAME = "Abeg Fix";
const SITE_URL = "https://abegfix.com";
const DEFAULT_IMAGE = `https://abegfix.com/assets/logo-eaDYfWcH.png`;

const useSEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  structuredData = null,
}) => {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : SITE_NAME;

    const pageUrl =
      canonical ||
      `${SITE_URL}${window.location.pathname}`;

    const image = ogImage || DEFAULT_IMAGE;

    document.title = fullTitle;

    // --------------------------------
    // Meta helper
    // --------------------------------

    const setMetaTag = (attr, value, content) => {
      if (!content) return;

      let element = document.querySelector(
        `meta[${attr}="${value}"]`
      );

      if (!element) {
        element = document.createElement("meta");

        element.setAttribute(attr, value);

        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // --------------------------------
    // Link helper
    // --------------------------------

    const setLinkTag = (rel, href) => {
      let element = document.querySelector(
        `link[rel="${rel}"]`
      );

      if (!element) {
        element = document.createElement("link");

        element.setAttribute("rel", rel);

        document.head.appendChild(element);
      }

      element.setAttribute("href", href);
    };

    // --------------------------------
    // Canonical
    // --------------------------------

    setLinkTag("canonical", pageUrl);

    // --------------------------------
    // Robots
    // --------------------------------

    setMetaTag(
      "name",
      "robots",
      noIndex
        ? "noindex, nofollow"
        : "index, follow"
    );

    // --------------------------------
    // Standard SEO
    // --------------------------------

    setMetaTag(
      "name",
      "description",
      description
    );

    // --------------------------------
    // Open Graph
    // --------------------------------

    setMetaTag(
      "property",
      "og:title",
      fullTitle
    );

    setMetaTag(
      "property",
      "og:description",
      description
    );

    setMetaTag(
      "property",
      "og:url",
      pageUrl
    );

    setMetaTag(
      "property",
      "og:type",
      ogType
    );

    setMetaTag(
      "property",
      "og:site_name",
      SITE_NAME
    );

    setMetaTag(
      "property",
      "og:image",
      image
    );

    setMetaTag(
      "property",
      "og:image:width",
      "1200"
    );

    setMetaTag(
      "property",
      "og:image:height",
      "630"
    );

    // --------------------------------
    // Twitter
    // --------------------------------

    setMetaTag(
      "name",
      "twitter:card",
      "summary_large_image"
    );

    setMetaTag(
      "name",
      "twitter:title",
      fullTitle
    );

    setMetaTag(
      "name",
      "twitter:description",
      description
    );

    setMetaTag(
      "name",
      "twitter:image",
      image
    );

    // --------------------------------
    // Structured Data
    // --------------------------------

    const existingSchema =
      document.getElementById(
        "seo-structured-data"
      );

    if (existingSchema) {
      existingSchema.remove();
    }

    if (structuredData) {
      const script =
        document.createElement("script");

      script.id =
        "seo-structured-data";

      script.type =
        "application/ld+json";

      script.textContent =
        JSON.stringify(structuredData);

      document.head.appendChild(script);
    }

    // --------------------------------
    // Cleanup
    // --------------------------------

    return () => {
      const schema =
        document.getElementById(
          "seo-structured-data"
        );

      if (schema) {
        schema.remove();
      }
    };
  }, [
    title,
    description,
    canonical,
    ogImage,
    ogType,
    noIndex,
    structuredData,
  ]);
};

export default useSEO;
