import { useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
export const CreateTicket = () => {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tickets", formData);
      // Redirect to list or show success
      window.location.href = "/support/tickets";
    } catch (err) {
      toast.error("Error creating ticket");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-2xl font-black text-blue-900 mb-6">
        How can we help?
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Subject
          </label>
          <input
            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none transition"
            placeholder="Briefly describe the issue"
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Detailed Description
          </label>
          <textarea
            rows="5"
            className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-blue-500 outline-none transition"
            placeholder="Tell us more so we can help faster..."
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>
        <button className="w-full bg-blue-900 text-white font-black py-4 rounded-xl hover:bg-blue-800 shadow-xl transition transform active:scale-95">
          Submit Ticket
        </button>
      </form>
    </div>
  );
};
