import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import useSEO from "../hooks/useSEO";
import UpgradeModal from "../components/UpgradeModal";

const ArtisanProfileView = () => {
  const { id } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // --- NEW STATE VARIABLES ---
  const [revealLoading, setRevealLoading] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useSEO({
    title: artisan
      ? `${artisan?.firstName} - ${artisan?.artisanProfile?.category}`
      : "Loading Artisan...",
    description: `Hire ${artisan?.firstName}, a professional ${artisan?.artisanProfile?.category || "Artisan"}. Verified on Abeg Fix.`,
    ogImage: artisan?.profileImage || "/default-preview.png",
    ogType: "profile",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Artisan Data (Public)
        const artisanRes = await API.get(`/users/artisan/${id}`);
        setArtisan(artisanRes.data);

        // 2. Fetch Reviews (Public)
        const reviewsRes = await API.get(`/reviews/artisan/${id}`);
        setReviews(reviewsRes.data);

        // 3. ONLY get current user IF they are logged in
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userRes = await API.get("/auth/me");
            setCurrentUser(userRes.data);
          } catch (authErr) {
            console.log("Token invalid or expired, staying as guest.");
            // Don't throw here, just let them be a guest
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Could not load artisan profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await API.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted");
      // Filter out the deleted review from the state
      setReviews(reviews.filter((rev) => rev._id !== reviewId));
    } catch (err) {
      toast.error("Could not delete review");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== "customer") {
      return toast.error("Only registered customers can leave reviews.");
    }

    setSubmitting(true);
    try {
      const { data } = await API.post("/reviews", {
        artisanId: id,
        rating,
        comment,
      });
      toast.success("Review posted successfully!");
      setReviews([data, ...reviews]); // Add new review to the top of the list
      setComment(""); // Reset form
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevealContact = async (targetArtisan) => {
    // Fallback to the state artisan if none passed (for the payment success call)
    const artisanToReveal = targetArtisan || artisan;

    if (!artisanToReveal) return;

    setRevealLoading(true);
    try {
      // 1. Call backend
      const { data } = await API.post(
        `/users/reveal-artisan/${artisanToReveal._id}`,
      );

      // 2. Update local state to show the number in the UI instead of the button
      setWhatsappNumber(data.whatsapp);
      setContactRevealed(true);

      // 3. Construct WhatsApp Link
      const message = encodeURIComponent(
        `Hello ${artisanToReveal.artisanProfile?.businessName}, I found you on Abeg Fix.`,
      );
      const whatsappUrl = `https://wa.me/${data.whatsapp}?text=${message}`;

      // 4. Open WhatsApp
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Daily limit reached.";

      // Only show the modal if they are actually over the limit
      if (err.response?.status === 403) {
        toast.error(errorMsg);
        setShowUpgradeModal(true);
      } else {
        toast.error("Could not reveal contact. Please try again.");
      }
    } finally {
      setRevealLoading(false);
    }
  };

  // Add this helper at the top of your component file or in a utils folder
  const getOptimizedUrl = (url, width = 600) => {
    if (!url || !url.includes("cloudinary")) return url;

    // This splits the URL and inserts the transformation parameters
    // It changes .../upload/v123/... to .../upload/f_auto,q_auto,w_600/v123/...
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  };

  const handlePaymentSuccess = async (res) => {
    const toastId = toast.loading("Confirming your Premium status...");

    try {
      // 1. Verify with your backend
      // We use the reference Paystack just gave us
      await API.post("/payments", {
        reference: res.reference,
        type: "premium",
      });

      // 2. Add a small artificial delay so the DB can 'breathe'
      // and the user feels the 'processing' happening.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Close the modal NOW that we know the backend is updated
      setShowUpgradeModal(false);

      // 4. Fetch the fresh user data so 'currentUser' is now Premium
      const userRes = await API.get("/auth/me");
      setCurrentUser(userRes.data);

      toast.success("Welcome to Premium!", { id: toastId });

      // 5. Trigger the reveal automatically
      // Because currentUser is now Premium, this call will succeed!
      handleRevealContact();
    } catch (err) {
      console.error(err);
      toast.error("Payment verified, but status sync failed. Please refresh.", {
        id: toastId,
      });
    }
  };

  const handleShareProfile = async () => {
    const shareData = {
      title: profile.businessName || "Check out this Artisan!",
      text: `Take a look at ${profile.businessName || "this professional"} on our platform!`,
      url: window.location.href, // Captures the exact profile URL dynamically
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback if Web Share API is missing (e.g., standard desktop browsers)
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      } catch (err) {
        toast.error("Could not copy link automatically.");
      }
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse font-bold text-gray-400 uppercase tracking-widest">
        Loading Artisan Details...
      </div>
    );
  if (!artisan)
    return <div className="p-20 text-center">Artisan not found.</div>;

  const profile = artisan.artisanProfile || {};

  const portfolioImages =
    profile.subscriptionTier === "pro"
      ? profile.portfolio || []
      : (profile.portfolio || []).slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* --- HEADER SECTION --- */}
        <div className="h-64 bg-[#1E3A8A] relative">
          <button
            onClick={handleShareProfile}
            className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-2xl hover:bg-white/20 active:scale-95 transition flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg group z-10"
            title="Share Profile"
          >
            <svg
              className="w-5 h-5 text-white group-hover:rotate-12 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
          <div className="absolute -bottom-16 left-8">
            <img
              // 1. Apply the optimization helper with a smaller width (300px is plenty for a 128px UI)
              // 2. We'll add 'c_fill,g_face' to ensure the artisan's face is centered automatically
              src={
                profile.profilePic
                  ? profile.profilePic.replace(
                      "/upload/",
                      "/upload/f_auto,q_auto,w_300,h_300,c_fill,g_face/",
                    )
                  : "https://via.placeholder.com/300"
              }
              alt={profile.businessName}
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
            />
          </div>
        </div>

        <div className="pt-20 px-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {profile.category || "Professional"}
              </span>
              <h1 className="text-4xl font-black text-gray-900 mt-2 tracking-tight flex items-center gap-2">
                {profile.businessName ||
                  `${artisan.firstName} ${artisan.lastName}`}

                {/* THE GREEN TICK */}
                {profile.isVerified && (
                  <span
                    className="bg-green-100 text-green-600 p-1 rounded-full flex items-center justify-center"
                    title="BVN Verified"
                  >
                    <svg
                      className="w-6 h-6"
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
              </h1>
              <p className="text-gray-500 flex items-center gap-1 mt-1 font-medium">
                📍 {profile.address || "Lagos, Nigeria"}
              </p>
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-black uppercase tracking-widest mb-4">
                Contact Artisan
              </h3>

              {!contactRevealed ? (
                <button
                  onClick={() => handleRevealContact(artisan)}
                  disabled={revealLoading}
                  className="w-full md:w-auto px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition disabled:opacity-50"
                >
                  {revealLoading ? "Unlocking..." : "Unlock WhatsApp Number"}
                </button>
              ) : (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-green-50 text-green-700 border-2 border-green-600 rounded-2xl font-black uppercase tracking-widest hover:bg-green-100 transition"
                >
                  Chat on WhatsApp ({whatsappNumber})
                </a>
              )}
            </div>
          </div>

          <hr className="my-10 border-gray-100" />

          {/* --- MAIN CONTENT: BIO & RATING --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                About the Business
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {profile.bio || "This artisan hasn't added a bio yet."}
              </p>

              {/* --- PORTFOLIO GALLERY --- */}
              <div className="mt-12">
                <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tighter">
                  Work Portfolio
                </h3>
                {portfolioImages?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
                      >
                        <img
                          // Optimized for the grid (width 600 is plenty for mobile/web squares)
                          src={getOptimizedUrl(img, 600)}
                          alt={`Work sample ${idx + 1}`}
                          loading="lazy" // ONLY download when visible
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400 italic">
                    No portfolio images uploaded yet.
                  </div>
                )}
              </div>
            </div>

            {/* --- SIDEBAR: RATING & VERIFICATION --- */}
            <div className="space-y-6">
              <div className="bg-[#1E3A8A] p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
                <h4 className="font-bold uppercase tracking-widest text-[10px] opacity-70 mb-2">
                  Artisan Score
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black">
                    {profile.rating?.toFixed(1) || "5.0"}
                  </span>
                  <div className="text-yellow-400 text-xl tracking-tighter">
                    ★★★★★
                  </div>
                </div>
                <p className="text-xs mt-4 opacity-80 leading-relaxed">
                  Calculated from {reviews.length} verified customer reviews.
                </p>
              </div>
              <div className="border-2 border-dashed border-gray-200 p-6 rounded-3xl">
                <h4 className="font-bold text-gray-900 mb-3">Trust Score</h4>
                <div className="space-y-3">
                  <div
                    className={`flex items-center gap-2 font-bold text-sm ${profile.isVerified ? "text-green-600" : "text-gray-400 opacity-50"}`}
                  >
                    {profile.isVerified
                      ? "✅ BVN Identity Verified"
                      : "⚪ ID Not Verified"}
                  </div>
                  {profile.subscriptionTier === "pro" && (
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                      ⭐ Pro Professional
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- REVIEWS SECTION --- */}
          <div className="mt-20 pt-10 border-t border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">
              Customer Reviews
            </h3>

            {/* REVIEW FORM: ONLY FOR CUSTOMERS */}
            {currentUser?.role === "customer" ? (
              <form
                onSubmit={handleReviewSubmit}
                className="mb-16 bg-gray-50 p-8 rounded-3xl border border-gray-100"
              >
                <h4 className="font-black text-gray-900 mb-4 uppercase tracking-tighter">
                  Leave a Review
                </h4>

                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition ${rating >= star ? "text-yellow-400 scale-110" : "text-gray-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  rows="4"
                  className="w-full p-5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                  placeholder="Tell others about your experience with this professional..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 bg-[#1E3A8A] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition disabled:bg-gray-400"
                >
                  {submitting ? "Posting..." : "Submit My Review"}
                </button>
              </form>
            ) : (
              !currentUser && (
                <div className="mb-12 p-6 bg-blue-50 rounded-2xl text-blue-800 text-sm font-bold text-center">
                  Please log in as a Customer to leave a review for this
                  artisan.
                </div>
              )
            )}

            {/* REVIEWS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-6 rounded-2xl border border-gray-100 shadow-sm bg-white relative group"
                >
                  {/* DELETE BUTTON: Only show if the logged-in user is the owner */}
                  {currentUser?._id === (rev.customer?._id || rev.customer) && (
                    <button
                      onClick={() => handleDeleteReview(rev._id)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition"
                      title="Delete Review"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-gray-900 uppercase text-xs tracking-widest">
                        {rev.customer?.firstName}{" "}
                        {rev.customer?.lastName?.charAt(0)}.
                      </p>
                      <div className="text-yellow-400 text-xs mt-1">
                        {"★".repeat(rev.rating)}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* --- LIGHTBOX OVERLAY --- */}
      {lightboxIndex >= 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxIndex(-1)} // Click outside to close
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(-1)}
            className="absolute top-6 right-8 text-white text-5xl hover:text-gray-400 transition"
          >
            &times;
          </button>

          <div className="relative w-full max-w-5xl flex items-center justify-between">
            {/* Prev Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev > 0 ? prev - 1 : portfolioImages.length - 1,
                );
              }}
              className="text-white text-6xl p-4 hover:text-gray-400 transition drop-shadow-lg"
            >
              &#8249;
            </button>

            {/* Main Image */}
            <img
              src={portfolioImages[lightboxIndex]}
              alt="Enlarged Portfolio"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
              className="max-h-[85vh] max-w-full object-contain mx-auto rounded-lg shadow-2xl"
            />

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev < portfolioImages.length - 1 ? prev + 1 : 0,
                );
              }}
              className="text-white text-6xl p-4 hover:text-gray-400 transition drop-shadow-lg"
            >
              &#8250;
            </button>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="premium"
        userEmail={currentUser?.email} // Passed from your auth context
        userId={currentUser?._id}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default ArtisanProfileView;
