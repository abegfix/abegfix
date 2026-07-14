import React, { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import ArtisanLocationPicker from "../components/ArtisanLocationPicker";
import useSEO from "../hooks/useSEO";
import UpgradeModal from "../components/UpgradeModal";
import confetti from "canvas-confetti";

const ArtisanDashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "pro",
  });

  // 1. STATE UPDATE: We added address and location here
  const [profileData, setProfileData] = useState({
    businessName: "",
    category: "",
    bio: "",
    whatsapp: "",
    profilePic: "",
    portfolio: [],
    address: "", // New field
    location: { type: "Point", coordinates: [3.3792, 6.5244] }, // Default to Lagos [lng, lat]
  });

  // Add this after your useState declarations
  const tier = user?.artisanProfile?.subscriptionTier || "free";
  const maxPortfolioLimit = tier === "pro" ? 15 : 3;
  const currentPortfolioCount = profileData.portfolio?.length || 0;
  const isVerified = user?.artisanProfile?.isVerified;

  useSEO({
    title: user
      ? `${user.firstName} - ${user.artisanProfile.category} | Artisan Dashboard`
      : "Loading Artisan...",
    ogType: "profile",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const initDashboard = async () => {
      await getProfile();
    };
    initDashboard();
  }, []);

  const getReviews = async (artisanId) => {
    try {
      const res = await API.get(`/reviews/artisan/${artisanId}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to load reviews", err);
    }
  };

  const getProfile = async () => {
    setLoading(true);
    try {
      // Force a fresh fetch by adding a unique timestamp to the URL
      const timestamp = new Date().getTime();
      const res = await API.get(`/auth/me?t=${timestamp}`);

      const userData = res.data;

      setUser(userData);

      if (
        userData.artisanProfile?.subscriptionTier === "pro" &&
        user?.artisanProfile?.subscriptionTier === "free"
      ) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#93c5fd", "#ffffff"], // Pro Blue theme
        });
      }

      getReviews(userData._id);

      if (userData.artisanProfile) {
        setProfileData({
          businessName: userData.artisanProfile.businessName || "",
          category: userData.artisanProfile.category || "",
          bio: userData.artisanProfile.bio || "",
          whatsapp: userData.artisanProfile.whatsapp || "",
          profilePic: userData.artisanProfile.profilePic || "",
          portfolio: userData.artisanProfile.portfolio || [],
          address: userData.artisanProfile.address || "",
          location: userData.artisanProfile.location || {
            type: "Point",
            coordinates: [3.3792, 6.5244],
          },
        });
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // HANDLER: This is the function the LocationPicker will call
  const handleLocationChange = (loc) => {
    setProfileData((prev) => ({
      ...prev,
      address: loc.address,
      location: {
        type: "Point",
        coordinates: loc.coords, // [lng, lat]
      },
    }));
  };

  // --- CLOUDINARY WIDGET LOGIC ---
  const openCloudinaryWidget = (isProfilePic) => {
    if (!window.cloudinary) {
      toast.error("Cloudinary not loaded.");
      return;
    }

    const remainingSlots = maxPortfolioLimit - currentPortfolioCount;
    if (!isProfilePic && remainingSlots <= 0) {
      toast.error("Limit reached!");
      return;
    }

    let sessionUrls = [];

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_PRESET_NAME,

        // --- THE DYNAMIC FOLDER LOGIC ---
        // This creates: abeg_fix/users/[USER_ID]/portfolio
        // or: abeg_fix/users/[USER_ID]/profile_pic
        folder: `abeg_fix/users/${user._id}/${isProfilePic ? "avatar" : "portfolio"}`,

        // Adding tags makes searching/deleting via API or Console much easier later
        tags: [
          "artisan_upload",
          user._id,
          isProfilePic ? "profile" : "portfolio",
        ],

        sources: ["local", "camera"],
        multiple: !isProfilePic,
        maxFiles: isProfilePic ? 1 : remainingSlots,
        cropping: isProfilePic,
        resourceType: "image",
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
      },
      (error, result) => {
        if (!error && result) {
          if (result.event === "success") {
            sessionUrls.push(result.info.secure_url);

            // If it's a profile pic, update local state immediately
            if (isProfilePic) {
              setProfileData((prev) => ({
                ...prev,
                profilePic: result.info.secure_url,
              }));
              toast.success("Profile photo updated!");
            }
          }

          // Handle batch portfolio save
          if (
            result.event === "queues-end" &&
            !isProfilePic &&
            sessionUrls.length > 0
          ) {
            const updatedPortfolio = [
              ...(profileData.portfolio || []),
              ...sessionUrls,
            ];
            setProfileData((prev) => ({
              ...prev,
              portfolio: updatedPortfolio,
            }));

            const saveToast = toast.loading(
              `Syncing ${sessionUrls.length} new items...`,
            );

            API.put("/auth/update-profile", {
              artisanProfile: { portfolio: updatedPortfolio },
            })
              .then(() => {
                toast.success("Portfolio synchronized!", { id: saveToast });
                sessionUrls = [];
              })
              .catch(() =>
                toast.error("Cloud sync failed.", { id: saveToast }),
              );
          }
        }
      },
    );
    widget.open();
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // Sends the whole profileData (including the new location object)
      await API.put("/auth/update-profile", { artisanProfile: profileData });
      toast.success("Profile and location updated!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put("/auth/update-password", passwords);
      toast.success("Password updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Password update failed");
    }
  };

  // Add useCallback to your imports: import React, { useState, useEffect, useCallback } from "react";

  const handlePaymentSuccess = useCallback(
    async (flutterResponse) => {
      // response from Flutterwave callback
      toast.loading("Verifying payment...", { id: "payment-toast" });

      try {
        const transaction_id = flutterResponse.transaction_id;
        const pType = modalConfig?.type;

        setModalConfig((prev) => ({ ...prev, isOpen: false }));

        // 1. Verify with Backend (passing transaction_id instead of reference)
        await API.post("/payments", {
          transaction_id, // Key change
          type: pType,
          firstName: user?.firstName,
          lastName: user?.lastName,
        });

        toast.loading("Syncing your new status...", { id: "payment-toast" });
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await getProfile();
        toast.success("Upgrade Successful!", { id: "payment-toast" });

        if (pType === "pro") {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      } catch (err) {
        toast.error("Sync was slow, but payment was successful. Refresh.", {
          id: "payment-toast",
        });
      } finally {
        setLoading(false);
      }
    },
    [modalConfig.type, getProfile],
  );

  const handleModalClose = async () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

    // FAIL-SAFE: If the user paid but the 'Success' alert never fired,
    // this will catch the change when they manually close the modal.
    toast("Refreshing account status...", { icon: "🔄" });
    await getProfile();
  };

  // Calculate days remaining for Pro status
  const getDaysRemaining = () => {
    if (!user?.artisanProfile?.proExpiresAt) return null;
    const expiry = new Date(user.artisanProfile.proExpiresAt);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = getDaysRemaining();
  const isExpired = tier === "free" && user?.artisanProfile?.proExpiresAt;

  const handleRemoveImage = async (imgUrl) => {
    const deleteToast = toast.loading("Removing from Cloud...");

    try {
      const res = await API.put("/auth/delete-portfolio-image", {
        imageUrl: imgUrl,
      });

      // Update local state with the new portfolio returned from backend
      setProfileData((prev) => ({
        ...prev,
        portfolio: res.data.portfolio,
      }));

      toast.success("Permanently deleted!", { id: deleteToast });
    } catch (err) {
      toast.error("Failed to delete. Try again.", { id: deleteToast });
    }
  };

  if (loading && !user)
    return (
      <div className="p-20 text-center text-gray-500">Loading Dashboard...</div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Title & Verified Tick */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-gray-900">
            Artisan Dashboard
          </h1>
          {user?.artisanProfile?.isVerified && (
            <span
              className="bg-green-100 text-green-600 p-1.5 rounded-full flex items-center justify-center shadow-sm"
              title="Verified Artisan"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>
        {/* --- Pro Status Logic --- */}
        <div className="flex items-center gap-3">
          {tier === "pro" ? (
            <div className="flex flex-col items-end">
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100 flex items-center gap-2">
                <span>⭐</span> PRO MEMBER
              </div>
            </div>
          ) : (
            <button
              onClick={() => setModalConfig({ isOpen: true, type: "pro" })}
              className={`${
                isExpired
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2`}
            >
              <span>{isExpired ? "⚠️" : "🚀"}</span>
              {isExpired ? "RENEW PRO" : "GO PRO"}
            </button>
          )}
        </div>
        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          {!user?.artisanProfile?.isVerified && (
            <button
              onClick={() => setModalConfig({ isOpen: true, type: "verified" })}
              className="bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-md hover:bg-green-600 transition"
            >
              Get BVN Verified
            </button>
          )}
          <a
            href={`/artisan/${user?._id}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition"
          >
            View Public Profile ↗
          </a>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        {["profile", "reviews", "portfolio", "security"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-b-2 border-[#1E3A8A] text-[#1E3A8A]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
        {/* --- PROFILE TAB --- */}
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center overflow-hidden">
                {profileData.profilePic ? (
                  <img
                    // 1. Apply the optimization helper with a smaller width (300px is plenty for a 128px UI)
                    // 2. We'll add 'c_fill,g_face' to ensure the artisan's face is centered automatically
                    src={
                      profileData.profilePic
                        ? profileData.profilePic.replace(
                            "/upload/",
                            "/upload/f_auto,q_auto,w_300,h_300,c_fill,g_face/",
                          )
                        : "https://via.placeholder.com/300"
                    }
                    alt={profileData.businessName}
                    className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                  />
                ) : (
                  <span className="text-gray-400 text-xs font-bold uppercase p-2 text-center">
                    No Photo
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => openCloudinaryWidget(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition"
              >
                Change Photo
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">
                  Email Account
                </label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={profileData.businessName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      businessName: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Lagos Elite Plumbing"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-2">
                Bio / About Your Service
              </label>
              <textarea
                rows="4"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                placeholder="Describe your expertise and the quality of your work..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-black uppercase mb-4 text-blue-900">
                  Shop Location
                </h3>
                <ArtisanLocationPicker
                  onLocationSelect={handleLocationChange}
                  initialAddress={profileData.address}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={profileData.whatsapp}
                  onChange={(e) =>
                    setProfileData({ ...profileData, whatsapp: e.target.value })
                  }
                  placeholder="080..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition disabled:bg-gray-300 shadow-lg shadow-blue-100"
            >
              {loading ? "Processing..." : "Save Profile Changes"}
            </button>
          </form>
        )}

        {/* --- PORTFOLIO TAB --- */}
        {activeTab === "portfolio" && (
          <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Work Portfolio
                </h3>
                <p className="text-gray-500 text-sm">
                  Showcase your best projects to customers.
                </p>
              </div>

              {/* Dynamic Counter */}
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full border ${
                    currentPortfolioCount >= maxPortfolioLimit
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}
                >
                  {currentPortfolioCount} / {maxPortfolioLimit} Images
                </span>

                {/* Upgrade Prompt for Free Users */}
                {tier === "free" && currentPortfolioCount >= 3 && (
                  <button
                    onClick={() =>
                      setModalConfig({ isOpen: true, type: "pro" })
                    }
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    {isExpired
                      ? "🔄 Renew Pro to unlock your 15 slots"
                      : "🚀 Go Pro for 15 slots"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profileData?.portfolio?.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                >
                  <img
                    src={imgUrl}
                    alt={`Work ${idx}`}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => handleRemoveImage(imgUrl)}
                      className="bg-white text-red-500 p-2 rounded-full font-bold text-xs hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* --- CONDITIONAL ADD BUTTON --- */}
              {currentPortfolioCount < maxPortfolioLimit ? (
                <button
                  onClick={() => openCloudinaryWidget(false)}
                  className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <span className="text-2xl">+</span>
                  </div>
                  <span className="text-blue-600 font-bold text-xs uppercase tracking-tighter">
                    Add Project
                  </span>
                </button>
              ) : (
                /* The "Locked" Button */
                <div className="aspect-square border-2 border-dashed border-gray-100 bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-2 grayscale opacity-60">
                  <span className="text-xl">🔒</span>
                  <span className="text-gray-400 font-bold text-[10px] uppercase text-center px-4">
                    Limit Reached
                  </span>
                </div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100">
              <button
                onClick={handleUpdateProfile}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition"
              >
                Save Portfolio
              </button>
            </div>
          </div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === "security" && (
          <div className="max-w-md animate-fadeIn">
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Account Security
            </h3>
            <p className="text-gray-500 text-sm mb-8">
              Update your password regularly to keep your business profile safe.
            </p>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  required
                  minLength="6"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition shadow-lg shadow-gray-200"
              >
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* --- REVIEWS TAB --- */}
        {activeTab === "reviews" && (
          <div className="animate-fadeIn">
            {/* RATING SUMMARY CARD */}
            <div className="bg-[#1E3A8A] rounded-3xl p-8 text-white mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-1">
                  Total Reputation
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black">
                    {user?.artisanProfile?.rating?.toFixed(1) || "5.0"}
                  </span>
                  <div className="text-yellow-400 text-2xl">
                    {"★".repeat(Math.round(user?.artisanProfile?.rating || 5))}
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-3xl font-black">{reviews.length}</p>
                <p className="text-xs font-bold uppercase opacity-70">
                   Reviews
                </p>
              </div>
            </div>

            {/* REVIEWS LIST */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest">
                          {rev.customer?.firstName} {rev.customer?.lastName}
                        </p>
                        <div className="text-yellow-500 text-xs mt-1">
                          {"★".repeat(rev.rating)}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <p className="text-gray-400 font-bold italic">
                    No reviews yet. Share your profile to get your first rating!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Add the Modal component at the very bottom of the return statement */}
      <UpgradeModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        userEmail={user?.email}
        userId={user?._id}
        userFirstName={user?.firstName} // Pass names for the NIN logic
        userLastName={user?.lastName}
        onClose={handleModalClose} // <--- Use the new handler here
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default ArtisanDashboard;
