import React, { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO";
import UpgradeModal from "../components/UpgradeModal";

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // <--- MODAL STATE
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    profilePic: "",
    premiumStatus: "free",
    premiumExpiresAt: null,
    id: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useSEO({
    title: `Customer Profile - ${profile.firstName} ${profile.lastName}`,
    ogType: "profile",
  });

  useEffect(() => {
    if (activeTab === "favorites") fetchFavorites();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/auth/me");
      setProfile({
        id: data._id, // <--- ADD THIS
        email: data.email, // <--- ADD THIS
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data?.customerProfile?.phoneNumber || "",
        profilePic: data.profilePic || "",
        premiumStatus: data.customerProfile?.premiumStatus || "free",
        premiumExpiresAt: data.customerProfile?.premiumExpiresAt || null,
      });
    } catch (err) {
      toast.error("Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      // We'll create a specific route for this: GET /api/users/favorites
      const { data } = await API.get("/users/favorites");
      setFavorites(data);
    } catch (err) {
      toast.error("Could not load favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put("/auth/update-customer", profile);

      // Update local state with the fresh data from the server
      setProfile({
        ...profile,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.customerProfile?.phoneNumber || "",
      });

      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
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

  const handleUpgradeSuccess = async (flutterResponse) => {
    const toastId = toast.loading("Verifying payment...");

    try {
      // 1. Flutterwave returns transaction_id in its success callback
      const transaction_id = flutterResponse.transaction_id;

      // 2. Close the modal early for better UX
      setIsUpgradeModalOpen(false);

      // 3. Verify with your backend
      // Note: We send 'transaction_id' now, matching the new backend logic
      await API.post("/payments", {
        transaction_id,
        type: "premium",
      });

      // 4. SYNC DELAY: Keep this as it ensures the MongoDB change reflects in your next fetch
      toast.loading("Syncing your Premium status...", { id: toastId });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 5. Refresh the UI
      await fetchProfile();

      toast.success("Welcome to Premium!", { id: toastId });
    } catch (err) {
      console.error("Verification Error:", err);
      toast.error(
        "Sync was slow, but your payment was successful. Please refresh.",
        { id: toastId },
      );
    }
  };

  if (loading && activeTab === "profile")
    return <div className="p-20 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {["profile", "favorites", "security"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-6 font-bold uppercase text-xs tracking-widest transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        {activeTab === "profile" && (
          <div className="space-y-8">
            {/* --- PREMIUM STATUS SECTION --- */}
            <div className="p-6 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 text-center">
              {profile.premiumStatus === "premium" ? (
                <div className="space-y-2">
                  <span className="inline-block bg-yellow-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    ★ Premium Member
                  </span>
                  <p className="text-sm font-bold text-gray-700">
                    Unlimited Contact Reveals Active
                  </p>
                  <p className="text-[10px] text-gray-400 font-black uppercase">
                    Expires:{" "}
                    {new Date(profile.premiumExpiresAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tighter text-gray-400">
                      Current Plan:{" "}
                      <span className="text-gray-900">Free Tier</span>
                    </p>
                    <p className="text-xs text-gray-500 font-bold">
                      Limited to 3 contact reveals per day.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Upgrade to Premium — ₦500
                  </button>
                </div>
              )}
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={profile.firstName}
                  className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={profile.lastName}
                  className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
              <input
                type="text"
                placeholder="Phone Number"
                value={profile.phoneNumber}
                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  setProfile({ ...profile, phoneNumber: e.target.value })
                }
              />

              <button className="w-full bg-[#1E3A8A] text-white p-3 rounded-lg font-bold hover:bg-blue-900 transition">
                Save Changes
              </button>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Account Security</h3>
            <p className="text-sm text-gray-500">
              Want to change your password? We'll send a secure link to your
              email.
            </p>
            <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition">
              Send Reset Email
            </button>
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <p className="text-center py-10">Loading favorites...</p>
            ) : favorites.length > 0 ? (
              favorites.map((artisan) => (
                <div
                  key={artisan._id}
                  className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition bg-white"
                >
                  <img
                    src={
                      artisan.artisanProfile?.profilePic ||
                      "https://via.placeholder.com/50"
                    }
                    className="w-12 h-12 rounded-full object-cover border"
                    alt="Artisan"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">
                      {artisan.artisanProfile?.businessName || "Professional"}
                    </h4>
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-tighter">
                      {artisan.artisanProfile?.category}
                    </p>
                  </div>
                  <Link
                    to={`/artisan/${artisan._id}`}
                    className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleFavoriteClick(artisan._id)}
                    className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100"
                  >
                    ★ Remove from Favorites
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 py-10 text-center col-span-2">
                You haven't added any favorites yet.
              </p>
            )}
          </div>
        )}
      </div>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        type="premium"
        userEmail={profile.email}
        userId={profile.id}
        userPhone={profile.phoneNumber}
        userFirstName={profile.firstName} // <--- ADD THIS
        userLastName={profile.lastName} // <--- ADD THIS
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
};

export default CustomerProfile;
