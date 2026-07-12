import React, { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import BackToTopButton from "../components/BackToTopButton";
import useSEO from "../hooks/useSEO";
import { useAuth } from "../context/AuthContext";

const Directory = () => {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { user, loading: authLoading } = useAuth();

  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [skillSearch, setSkillSearch] = useState(""); // This acts as our category search
  const [filterLocation, setFilterLocation] = useState("");
  const [filterRating, setFilterRating] = useState(0);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);

  // --- LOAD MORE STATE ---
  const ITEMS_PER_PAGE = 12;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // --- GEOLOCATION STATE ---
  const [userLocation, setUserLocation] = useState(null);

  // --- 1. INITIAL LOAD: USER PROFILE & ARTISANS ---
  useEffect(() => {
    if (user) {
      setFavorites(user.favorites || []);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch artisans once the global Auth Context has finished resolving
    if (!authLoading) {
      fetchArtisans();
    }
  }, [authLoading, userLocation, user]); // Refetch if live GPS or user profile loads

  useSEO({
    title: "Artisan Directory",
    description: `Search for artisans in your area. Verified on Abeg Fix.`,
    ogType: "directory",
  });

  const fetchArtisans = async () => {
    try {
      setLoading(true);

      let lat = null;
      let lng = null;

      // Priority 1: Live browser GPS
      if (userLocation) {
        lat = userLocation.lat;
        lng = userLocation.lng;
      }
      // Priority 2: Saved Profile Location
      else if (user?.customerProfile?.location?.coordinates) {
        lng = user.customerProfile.location.coordinates[0];
        lat = user.customerProfile.location.coordinates[1];
      }

      const params = new URLSearchParams();
      if (lat && lng) {
        params.append("lat", lat);
        params.append("lng", lng);
      }

      // Add category if skillSearch is active
      if (skillSearch) {
        params.append("category", skillSearch);
      }

      const { data } = await API.get(`/users/artisans?${params.toString()}`);
      setArtisans(data);
    } catch (err) {
      toast.error("Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast.success("GPS Active! Sorting by proximity...");
      },
      () => toast.error("Unable to retrieve location"),
    );
  };

  const handleFavoriteClick = async (artisanId) => {
    try {
      const res = await API.post(`/users/favorite/${artisanId}`);
      if (res.data.favorites) {
        setFavorites(res.data.favorites);
        toast.success(res.data.msg);
      }
    } catch (err) {
      toast.error("Failed to update favorites");
    }
  };

  // --- FILTERING (Frontend fallback for search/rating) ---
  // --- UPDATED SORTING LOGIC ---
  // We filter first, THEN sort so Pro users always jump to the top of the current results
  const filteredAndSortedArtisans = artisans
    .filter((artisan) => {
      const profile = artisan.artisanProfile || {};
      const matchesSearch =
        searchTerm === "" ||
        profile.businessName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        artisan.firstName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSkill =
        skillSearch === "" ||
        profile.category?.toLowerCase().includes(skillSearch.toLowerCase());

      const matchesRating = (profile.rating || 0) >= filterRating;
      const matchesVerified =
        !filterVerifiedOnly || profile.isVerified === true;

      return matchesSearch && matchesSkill && matchesRating && matchesVerified;
    })
    .sort((a, b) => {
      // 1. Pro Tier takes absolute priority
      const aPro = a.artisanProfile?.subscriptionTier === "pro" ? 1 : 0;
      const bPro = b.artisanProfile?.subscriptionTier === "pro" ? 1 : 0;
      if (bPro !== aPro) return bPro - aPro;

      // 2. Distance is the secondary sort (if distance exists)
      if (a.distance && b.distance) return a.distance - b.distance;

      return 0;
    });

  const displayedArtisans = filteredAndSortedArtisans.slice(0, visibleCount);
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            Artisan Directory
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Showing {filteredAndSortedArtisans.length} artisans near you
          </p>
        </div>

        <button
          onClick={handleGetLocation}
          className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
            userLocation
              ? "bg-green-100 text-green-700"
              : "bg-white text-[#1E3A8A] border border-gray-200"
          }`}
        >
          {userLocation ? "📍 Live GPS Enabled" : "🎯 Sort By Proximity"}
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <input
            type="checkbox"
            id="verifiedFilter"
            className="w-5 h-5 accent-green-600 cursor-pointer"
            checked={filterVerifiedOnly}
            onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
          />
          <label
            htmlFor="verifiedFilter"
            className="text-xs font-black uppercase tracking-widest text-gray-700 cursor-pointer select-none"
          >
            BVN Verified Only ✅
          </label>
        </div>
      </div>

      {/* --- SEARCHBARS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <input
          type="text"
          placeholder="What do you need? (Plumber, Tailor...)"
          className="p-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-all"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Name"
          className="p-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm"
          value={filterRating}
          onChange={(e) => setFilterRating(Number(e.target.value))}
        >
          <option value={0}>Any Rating ⭐</option>
          <option value={4}>4+ Stars</option>
          <option value={5}>5 Stars</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Finding Artisans...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {" "}
            {displayedArtisans.map((artisan) => {
              const isPro = artisan.artisanProfile?.subscriptionTier === "pro";
              const isVerified = artisan.artisanProfile?.isVerified;

              return (
                <div
                  key={artisan._id}
                  className={`relative bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col ${
                    isPro
                      ? "border-blue-500 ring-1 ring-blue-500/20 shadow-blue-50"
                      : "border-gray-100"
                  }`}
                >
                  {/* --- PRO RIBBON --- */}
                  {isPro && (
                    <div className="absolute top-3 -right-7 w-24 bg-blue-600 text-white text-[8px] font-black uppercase tracking-tighter py-1 text-center rotate-45 z-10 shadow-md">
                      PRO
                    </div>
                  )}

                  {/* Image Section */}
                  <div className="h-10 bg-gray-100 relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-[10px] font-black z-20">
                      ★ {artisan.artisanProfile?.rating?.toFixed(1) || "5.0"}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => handleFavoriteClick(artisan._id)}
                      className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg z-20 hover:scale-110 transition"
                    >
                      <svg
                        className={`w-3 h-3 ${favorites.includes(artisan._id) ? "text-red-500 fill-current" : "text-gray-400"}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center gap-1 mb-1">
                      <p
                        className={`text-[9px] font-black uppercase tracking-widest ${isPro ? "text-blue-600" : "text-gray-400"}`}
                      >
                        {artisan.artisanProfile?.category}
                      </p>
                      {isPro && (
                        <span className="text-blue-500 text-[10px]">⚡</span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 truncate flex items-center gap-1 uppercase tracking-tight">
                      {artisan.artisanProfile?.businessName ||
                        artisan.firstName}
                      {isVerified && (
                        <span
                          className="text-green-500"
                          title="BVN Verified Professional"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </h3>

                    {/* Distance Badge */}
                    <div className="mt-2 flex items-center gap-1.5 min-h-[20px]">
                      <span className="text-[10px] text-gray-400 font-medium truncate">
                        📍{" "}
                        {artisan.artisanProfile?.address?.split(",")[0] ||
                          "Lagos"}
                      </span>
                      {artisan.distance && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[9px] ${isPro ? "bg-blue-600 text-white" : "bg-blue-50 text-[#1E3A8A]"}`}
                        >
                          {artisan.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/artisan/${artisan.username}`}
                        className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-sm ${
                          isPro
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-900 text-white hover:bg-black"
                        }`}
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {visibleCount < filteredAndSortedArtisans.length && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="px-12 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg transition"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
      <BackToTopButton />
    </div>
  );
};

export default Directory;
