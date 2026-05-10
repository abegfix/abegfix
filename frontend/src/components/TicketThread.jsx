import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import API from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const TicketThread = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Initialize navigate
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const { user: authUser } = useAuth();
  const scrollRef = useRef(null);

  const fetchTicket = async () => {
    try {
      const { data } = await API.get(`/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      toast.error("Could not load conversation");
    }
  };

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 30000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [ticket?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      const isAdmin = authUser?.role === "admin";
      const endpoint = isAdmin
        ? `/tickets/${id}/admin-reply`
        : `/tickets/${id}/user-reply`;

      await API.put(endpoint, {
        message: reply,
        status: isAdmin ? "pending" : "open",
      });

      setReply("");
      fetchTicket();
      toast.success("Message sent");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  if (!ticket)
    return <div className="p-10 text-center">Loading conversation...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-6">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)} // Takes them back to their previous list
        className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to List
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="border-b pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
            <p className="text-sm text-gray-500">
              Ticket ID: {ticket._id.slice(-6).toUpperCase()}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              ticket.status === "open"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {ticket.status}
          </span>
        </div>

        {/* Message Thread */}
        <div className="space-y-4 mb-8 max-h-[500px] overflow-y-auto p-2 scrollbar-hide">
          {ticket.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === ticket.user._id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.sender === ticket.user._id
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-none border-l-4 border-red-500"
                }`}
              >
                {msg.sender !== ticket.user._id && (
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-red-600">
                    Support Agent
                  </p>
                )}
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <span className="text-[9px] opacity-60 block mt-2 font-bold uppercase">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        <div ref={scrollRef}>
          {ticket.status !== "resolved" ? (
            <form onSubmit={handleSend} className="relative">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl p-4 pr-16 focus:border-blue-500 outline-none transition resize-none text-sm"
                placeholder="Type your reply..."
                rows="3"
              />
              <button className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-bold text-[10px] uppercase tracking-wider">
                Send
              </button>
            </form>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl text-center text-gray-500 italic text-sm">
              This ticket has been resolved and closed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketThread;
