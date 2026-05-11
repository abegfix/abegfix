import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import sanityClient from "../../api/sanityClient";

export default function CategoryArticles() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GROQ Query: Get the category details AND its related articles
    const query = `*[_type == "category" && slug.current == $slug][0]{
      title,
      description,
      "articles": *[_type == "article" && references(^._id)]{
        title,
        slug,
        "excerpt": array::join(string::split(pt::text(content), "")[0...120], "") + "..."
      }
    }`;

    sanityClient.fetch(query, { slug }).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [slug]);

  if (loading)
    return <div className="p-20 text-center">Loading articles...</div>;
  if (!data) return <div className="p-20 text-center">Category not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* BREADCRUMB */}
      <nav className="mb-4">
        <Link
          to="/help"
          className="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest transition"
        >
          &larr; All Categories
        </Link>
      </nav>

      {/* HEADER */}
      <header className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">{data.title}</h1>
        <p className="text-lg text-gray-500">{data.description}</p>
      </header>

      {/* ARTICLE LIST */}
      <div className="space-y-4">
        {data.articles.length > 0 ? (
          data.articles.map((article) => (
            <Link
              key={article.slug.current}
              to={`/help-center/article/${article.slug.current}`}
              className="block p-6 bg-white border border-gray-100 rounded-2xl hover:border-[#1E3A8A] hover:shadow-sm transition-all group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {article.excerpt}
                  </p>
                </div>
                <div className="text-gray-300 group-hover:text-[#1E3A8A] transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center bg-gray-50 rounded-2xl text-gray-400 italic">
            No articles in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
