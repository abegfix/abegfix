import { motion } from "framer-motion";
import { Check, X, Star, CreditCard } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const customerTiers = [
  {
    name: "Basic",
    price: "Free",
    description: "Browse and find local help.",
    features: [
      "Browse all categories",
      "View Artisan ratings",
      "3 Phone number reveals/day",
      "Standard search filters",
      "Store Favourite Artisans",
    ],
    notIncluded: ["Unlimited Reveals", "Priority Support"],
    cta: "Start Browsing",
    style: "bg-white border-gray-200",
  },
  {
    name: "Premium",
    price: "₦500",
    period: "/month",
    description: "The ultimate power for busy people.",
    icon: <Star className="text-yellow-500 fill-yellow-500" />,
    features: [
      "Everything in Basic",
      "Unlimited Contact Reveals",
      "Ad-free Experience",
      "Priority Customer Support",
    ],
    cta: "Go Premium",
    style:
      "bg-gray-900 text-white border-gray-800 shadow-2xl ring-4 ring-blue-600/20",
  },
];

export const CustomerTiers = () => {
  const { user } = useAuth();

  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase italic">
          Get More Done
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto font-medium">
          Stop waiting. Get instant access to the best hands in Lagos. Upgrade
          to Premium and never lose a good artisan's contact again.
        </p>
      </div>

      {/* CHANGE THIS LINE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {customerTiers.map((tier, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-10 rounded-3xl border flex flex-col justify-between ${tier.style}`}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">
                  {tier.name}
                </span>
                {tier.icon}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">{tier.price}</span>
                <span className="text-sm opacity-70">{tier.period}</span>
              </div>
              <p className="text-sm mt-3 font-medium opacity-80">
                {tier.description}
              </p>

              <ul className="space-y-4 mt-10">
                {tier.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check
                      className={`h-5 w-5 shrink-0 ${tier.name === "Premium" ? "text-blue-400" : "text-green-500"}`}
                    />
                    <span>{feat}</span>
                  </li>
                ))}
                {tier.notIncluded?.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm opacity-30"
                  >
                    <X className="h-5 w-5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12">
              <Link
                to={
                  user
                    ? user.role === "customer"
                      ? "/customer-profile"
                      : "/artisan-dashboard"
                    : "/signup-customer"
                }
              >
                <button
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 ${
                    tier.name === "Premium"
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {user ? "View My Status" : tier.cta}
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CustomerTiers;
