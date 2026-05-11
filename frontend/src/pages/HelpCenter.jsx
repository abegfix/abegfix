import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sanityClient from "../api/sanityClient";
import {
  BadgeAlert,
  Pickaxe,
  SquareUserRound,
  ListStart,
  CreditCard,
  HelpCircle,
  Search, // Added Search icon
} from "lucide-react";

const ICON_MAP = {
  BadgeAlert: BadgeAlert,
  pickaxe: Pickaxe,
  SquareUserRound: SquareUserRound,
  ListStart: ListStart,
  CreditCard: CreditCard,
};

export default function HelpCenter() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const query = `*[_type == "category"]{
      title,
      slug,
      description,
      icon,
      "articleCount": count(*[_type == "article" && references(^._id)])
    }`;

    sanityClient.fetch(query).then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  // Handle Live Search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      // Search logic: check title or content text for the term
      const searchQuery = `*[_type == "article" && (title match $term || pt::text(content) match $term)][0...5]{
        title,
        slug
      }`;

      sanityClient
        .fetch(searchQuery, { term: `${searchTerm}*` })
        .then((data) => {
          setSearchResults(data);
          setIsSearching(false);
        });
    }, 300); // 300ms debounce to save API credits

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  if (loading)
    return <div className="p-20 text-center">Loading Help Center...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          How can we help?
        </h1>

        {/* SEARCH BAR */}
        <div className="relative max-w-2xl mx-auto mt-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for articles (e.g. 'refunds', 'artisan verify')..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#1E3A8A] outline-none transition-all shadow-sm text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* SEARCH RESULTS DROPDOWN */}
          {searchTerm.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              {isSearching ? (
                <div className="p-4 text-sm text-gray-500 italic">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((article) => (
                  <Link
                    key={article.slug.current}
                    to={`/help-center/article/${article.slug.current}`}
                    className="block p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 text-left transition-colors"
                  >
                    <p className="font-bold text-gray-900">{article.title}</p>
                    <p className="text-xs text-[#1E3A8A] uppercase font-black">
                      Read Guide &rarr;
                    </p>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-500">
                  No results found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon] || HelpCircle;
          return (
            <Link
              key={cat.slug.current}
              to={`/help-center/category/${cat.slug.current}`}
              className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-red-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
                <IconComponent size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {cat.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {cat.description}
              </p>
              <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">
                {cat.articleCount} Articles &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
