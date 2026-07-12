import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO";
import { ArtisanTiers } from "../components/Pricing";
import CustomerTiers from "../components/CustomerTiers";

export default function Home() {
  useSEO({ title: "Hire Better. Faster." });
  return (
    <main className="bg-white">
      {/* HERO */}
      <section
        className="relative flex flex-col justify-center items-center text-center px-6 h-[90vh] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1521633246924-67d02995bb46'",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-bold text-white relative z-10"
        >
          ABEG FIX. Hire Better. Faster.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-xl mt-4 text-gray-200 relative z-10"
        >
          Find and compare Lagos artisans. View their work, location, and
          customer reviews before contacting them
        </motion.p>
      </section>

      {/* BENTO FEATURE MENU */}
      <ArtisanTiers />
      <CustomerTiers />
    </main>
  );
}
