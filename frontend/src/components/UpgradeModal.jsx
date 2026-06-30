import React, { useState, useMemo, useEffect } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import API from "../api/axios";
import toast from "react-hot-toast";

const UpgradeModal = ({
  isOpen,
  onClose,
  type, // "pro", "verified", or "premium"
  userEmail,
  onSuccess,
  userId,
  userPhone,
  userFirstName,
  userLastName,
}) => {
  const [step, setStep] = useState("info");
  const [bvn, setBvn] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) setStep("info");
    setBvn("");
  }, [isOpen, type]);

  // Content configurations for all 3 tiers
  const content = {
    pro: {
      title: "Upgrade to Pro",
      price: 1500, // ₦1,500
      displayPrice: "₦1,500/month",
      color: "bg-blue-600",
      benefits: [
        "15 Portfolio Slots",
        "Priority Search Ranking",
        "Priority Service",
      ],
    },
    verified: {
      title: "Get Verified",
      price: 1500, // ₦1,500
      displayPrice: "₦1,500 one time",
      color: "bg-green-600",
      benefits: ["BVN Identity Badge", "Higher Trust Score"],
    },
    premium: {
      title: "Go Premium",
      price: 500, // ₦500
      displayPrice: "₦500/month",
      color: "bg-gray-900",
      benefits: ["Unlimited Contact Reveals"],
    },
  };

  const active = content[type] || content.pro;

  // Flutterwave Config
  const config = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "",
    tx_ref: `REF_${Date.now()}`,
    amount: active.price, // Flutterwave takes Naira directly (not kobo)
    currency: "NGN",
    payment_options: "banktransfer",
    customer: {
      email: userEmail,
      phone_number: userPhone || "",
      name: `${userFirstName} ${userLastName}`,
    },
    meta: { userId, upgradeType: type },
    customizations: {
      title: "Abeg Fix Upgrade",
      description: `Payment for ${active.title}`,
      logo: "https://res.cloudinary.com/diwz3uvgw/image/upload/v1774534460/RE79T3F_a8s3kh.png",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  if (!isOpen) return null;

  const handleNext = () => {
    if (type === "verified") {
      setStep("bvn");
    } else {
      setStep("pay");
    }
  };

  const handleBvnVerify = async () => {
    setVerifying(true);
    try {
      await API.post("/payments/verify-bvn-only", { bvn });
      toast.success("Identity Confirmed!");
      setStep("pay");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Verification Failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header Section */}
        <div className={`${active.color} p-6 text-white text-center`}>
          <h2 className="text-xl font-black uppercase tracking-tighter">
            {active.title}
          </h2>
          <p className="text-4xl font-black mt-1 italic">
            {active.displayPrice}
          </p>
        </div>

        <div className="p-6">
          {/* STEP 1: INFO */}
          {step === "info" && (
            <>
              <ul className="space-y-3 mb-6">
                {active.benefits.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-700 font-bold"
                  >
                    <span className="text-blue-500">★</span> {b}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleNext}
                className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest ${active.color}`}
              >
                Continue
              </button>
            </>
          )}

          {/* STEP 2: BVN (Artisan only) */}
          {step === "bvn" && (
            <div className="space-y-4">
              <input
                type="text"
                maxLength="11"
                value={bvn}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl font-black text-center text-xl tracking-widest focus:border-green-500 outline-none"
                placeholder="BVN NUMBER"
              />
              <button
                disabled={bvn.length < 11 || verifying}
                onClick={handleBvnVerify}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Confirm Identity"}
              </button>
            </div>
          )}

          {/* STEP 3: PAY */}
          {step === "pay" && (
            <div className="text-center p-6">
              <button
                onClick={() => {
                  handleFlutterPayment({
                    callback: (response) => {
                      console.log(response);
                      if (response.status === "completed") {
                        onSuccess(response, bvn); // Pass response to parent
                      } else {
                        toast.error("Payment was not successful");
                      }
                      closePaymentModal();
                    },
                    onClose: () => onClose(),
                  });
                }}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-colors"
              >
                Pay {active.displayPrice}
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-400 text-[10px] font-black uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
