import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import sanityClient from "../api/sanityClient";
import { PortableText } from "@portabletext/react";

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const query = `*[_type == "article" && slug.current == $slug][0]{
      title,
      content,
      "category": category->{title, slug}
    }`;
    sanityClient.fetch(query, { slug }).then(setArticle);
  }, [slug]);

  if (!article)
    return <div className="p-20 text-center">Loading article...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <Link
          to="/help"
          className="text-sm text-gray-400 hover:text-red-600 font-bold uppercase tracking-tighter"
        >
          Help Center
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link
          to={`/help/category/${article.category.slug.current}`}
          className="text-sm text-gray-400 hover:text-red-600 font-bold uppercase tracking-tighter"
        >
          {article.category.title}
        </Link>
      </nav>

      <h1 className="text-4xl font-black text-gray-900 mb-8">
        {article.title}
      </h1>

      {/* RICH TEXT CONTENT */}
      <div className="prose prose-red max-w-none text-gray-700 leading-relaxed">
        <PortableText value={article.content} />
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-400">
          Was this article helpful? Contact support if you're still stuck.
        </p>
      </div>
    </div>
  );
}
