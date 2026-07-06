import React, { useState } from "react";
import API from "../api/axios"; // Import your Axios instance
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useSEO from "../hooks/useSEO";
import ArtisanLocationPicker from "../components/ArtisanLocationPicker";

const ArtisanSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    businessName: "",
    category: "",
    whatsapp: "",
    address: "",
    coords: null,
  });
  const [showPassword, setShowPassword] = useState(false);

  useSEO({ title: "Artisan Signup" });

  const getStrengthScore = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++; // Basic requirement
    if (password.length >= 10) strength++; // Bonus length
    if (/[0-9]/.test(password)) strength++; // Has numbers
    if (/[A-Z]/.test(password)) strength++; // Has Uppercase
    if (/[^A-Za-z0-9]/.test(password)) strength++; // Has Special Char
    return strength; // 0 to 5
  };

  // Map strength score to colors and labels
  const strengthScore = getStrengthScore(formData.password);

  const strengthConfig = [
    { label: "Weak", color: "bg-red-500", width: "25%" },
    { label: "Fair", color: "bg-orange-500", width: "50%" },
    { label: "Good", color: "bg-blue-500", width: "75%" },
    { label: "Strong", color: "bg-green-500", width: "100%" },
  ];

  // We subtract 1 to align score (1-4) with array index (0-3)
  const currentLevel =
    strengthScore > 0 ? strengthConfig[Math.min(strengthScore - 1, 3)] : null;

  // 📍 Handle structured spatial data updates emitted from your picker
  const handleLocationChange = (locationPayload) => {
    setFormData((prev) => ({
      ...prev,
      address: locationPayload.address,
      coords: locationPayload.coords,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🚨 Validation: Stop registration if they haven't pinned a location
    if (!formData?.address || !formData?.coords) {
      toast.error("Please select and pin your business shop location.");
      return;
    }
    setLoading(true);
    try {
      // Hits your Node/Express route: POST /api/auth/signup-artisan
      const res = await API.post("/auth/signup-artisan", formData);

      // Store the JWT returned by Express
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email_to_verify", formData.email);
      localStorage.setItem("user_role", res.data.role);

      toast.success("Account created! Please verify your email.");
      navigate("/verify-email");
    } catch (err) {
      // Catching the errors sent by your express-validator or custom logic
      toast.error(
        err.response?.data?.msg || "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-gray-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Artisan Signup
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Join the network of Lagos professionals.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
          <div className="mt-2">
            {formData.password && (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Strength
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase ${currentLevel?.color.replace("bg-", "text-")}`}
                  >
                    {currentLevel?.label}
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${currentLevel?.color}`}
                    style={{ width: currentLevel?.width }}
                  />
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              required
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <input
            type="text"
            placeholder="Business Name"
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, businessName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Category (e.g. Tailor, Plumber)"
            required
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="WhatsApp Number (e.g. 080123...) "
            required
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, whatsapp: e.target.value })
            }
          />

          {/* 📍 INTEGRATED SHOP LOCATION PICKER PANEL */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mt-2">
            <h3 className="text-xs font-black uppercase mb-3 text-blue-900 tracking-wider">
              Shop Location Coordinates
            </h3>
            <ArtisanLocationPicker
              onLocationSelect={handleLocationChange}
              initialAddress={formData.address}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A8A] text-white p-4 rounded-lg font-bold hover:bg-blue-900 transition mt-4 disabled:bg-gray-400"
          >
            {loading ? "Creating Account..." : "Create My Artisan Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ArtisanSignup;
