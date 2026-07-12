import React, { useState, useEffect } from "react";
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
    username: "",
    firstName: "",
    lastName: "",
    businessName: "",
    category: "",
    whatsapp: "",
    address: "",
    coords: null,
  });
  const [showPassword, setShowPassword] = useState(false);

  // 🎯 New state management for username verification metrics
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });

  useSEO({ title: "Artisan Signup" });

  // 🎯 Debounce API Engine to check username status dynamically
  useEffect(() => {
    if (!formData.username) {
      setUsernameStatus({ checking: false, available: null, message: "" });
      return;
    }

    // Don't hit API if username is too short to be viable
    if (formData.username.length < 3) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: "⚠️ Username must be at least 3 characters.",
      });
      return;
    }

    setUsernameStatus((prev) => ({ ...prev, checking: true, message: "" }));

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await API.get(
          `/auth/check-username?username=${formData.username}`,
        );
        if (res.data.available) {
          setUsernameStatus({
            checking: false,
            available: true,
            message: "✅ This username is available!",
          });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: "❌ This username is already taken.",
          });
        }
      } catch (err) {
        setUsernameStatus({
          checking: false,
          available: null,
          message: "Could not verify username availability.",
        });
      }
    }, 500); // ⏱️ Wait 500ms after user finishes typing

    return () => clearTimeout(delayDebounceFn);
  }, [formData.username]);

  const getStrengthScore = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthScore = getStrengthScore(formData.password);

  const strengthConfig = [
    { label: "Weak", color: "bg-red-500", width: "25%" },
    { label: "Fair", color: "bg-orange-500", width: "50%" },
    { label: "Good", color: "bg-blue-500", width: "75%" },
    { label: "Strong", color: "bg-green-500", width: "100%" },
  ];

  const currentLevel =
    strengthScore > 0 ? strengthConfig[Math.min(strengthScore - 1, 3)] : null;

  const handleLocationChange = (locationPayload) => {
    setFormData((prev) => ({
      ...prev,
      address: locationPayload.address,
      coords: locationPayload.coords,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🚨 Guard: Verify that username is checked and confirmed available
    if (usernameStatus.available === false) {
      toast.error("Please choose an available username before submitting.");
      return;
    }

    // 🚨 Guard: Stop registration if they haven't pinned a location
    if (!formData?.address || !formData?.coords) {
      toast.error("Please select and pin your business shop location.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/signup-artisan", formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email_to_verify", formData.email);
      localStorage.setItem("user_role", res.data.role);

      toast.success("Account created! Please verify your email.");
      navigate("/verify-email");
    } catch (err) {
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

          {/* 🎯 USERNAME MODULE BLOCK */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Choose Username
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="bg-gray-100 text-gray-500 px-3 py-3 text-sm flex items-center border-r border-gray-200 select-none font-medium">
                abegfix.com/
              </span>
              <input
                type="text"
                placeholder="username"
                value={formData.username}
                required
                className="w-full p-3 outline-none text-sm lowercase"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, ""),
                  })
                }
              />
            </div>

            {/* 🎯 Real-Time Status Notification Messages */}
            {formData.username && (
              <div className="mt-1 text-xs font-medium pl-1">
                {usernameStatus.checking && (
                  <span className="text-gray-400 animate-pulse">
                    Checking availability...
                  </span>
                )}
                {!usernameStatus.checking && usernameStatus.message && (
                  <span
                    className={
                      usernameStatus.available
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {usernameStatus.message}
                  </span>
                )}
              </div>
            )}
          </div>

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
            disabled={
              loading ||
              usernameStatus.checking ||
              usernameStatus.available === false
            }
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
