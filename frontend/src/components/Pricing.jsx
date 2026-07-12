import { motion } from "framer-motion";
import { Check, X, ShieldCheck, Zap } from "lucide-react"; // Or use SVG icons
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tiers = [
  {
    name: "Basic",
    price: "Free",
    description: "Start listing your services.",
    features: ["Public Profile", "List 1 Category", "Standard Search Results"],
    notIncluded: ["Verified Badge", "BVN Validation"],
    cta: "Get Started",
    style: "bg-white border-gray-200",
  },
  {
    name: "Verified",
    price: "₦1,500", // Example one-time cost
    period: "One-time fee",
    description: "Build ultimate trust with clients.",
    icon: <ShieldCheck className="text-green-600" />,
    features: [
      "Everything in Basic",
      "BVN Identity Badge",
      "Official 'BVN Verified' Seal",
      "Higher Trust Score",
      "Trust-Based Search Filter",
    ],
    cta: "Verify My Identity",
    style: "bg-green-50 border-green-200 ring-2 ring-green-500",
  },
  {
    name: "Pro Tier",
    price: "₦1,500", // Example monthly
    period: "/month",
    description: "Dominate your local area.",
    icon: <Zap className="text-blue-600" />,
    features: [
      "Top-of-Search Ranking",
      "Featured Profile Label",
      "Up 15 portfolio upload slots",
    ],
    cta: "Go Pro Now",
    style: "bg-blue-600 text-white border-blue-700 shadow-xl",
  },
];

export const ArtisanTiers = () => {
  const { user } = useAuth();
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase">
          Choose Your Growth Level
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto font-medium">
          Zero commission. Keep 100% of your earnings. Just pick the tier that
          fits your hustle.
        </p>
      </div>

      {/* CHANGE THIS LINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {tiers.map((tier, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 rounded-3xl border flex flex-col ${tier.style}`}
          >
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-widest opacity-80">
                  {tier.name}
                </span>
                {tier.icon}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{tier.price}</span>
                <span className="text-sm opacity-70">{tier.period}</span>
              </div>
              <p className="text-sm mt-2 font-medium opacity-80">
                {tier.description}
              </p>
            </div>

            <ul className="space-y-4 mb-10 flex-grow">
              {tier.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
              {tier.notIncluded?.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm opacity-40"
                >
                  <X className="h-5 w-5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <Link to={user ? "/profile" : "/artisan-signup"}>
              <button
                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-transform active:scale-95 ${
                  tier.name === "Pro Tier"
                    ? "bg-white text-blue-600"
                    : "bg-gray-900 text-white"
                }`}
              >
                {user ? "Go to Dashboard" : tier.cta}
              </button>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
