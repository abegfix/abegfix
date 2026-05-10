import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Added for ticket navigation
import API from "../api/axios";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tickets, setTickets] = useState([]); // State for tickets
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketFilter, setTicketFilter] = useState("all"); // Filter for tickets

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- FILTER LOGIC ---
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const dateStr = new Date(log.createdAt).toLocaleDateString();
    return (
      log.adminName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.targetUserEmail.toLowerCase().includes(term) ||
      dateStr.includes(term)
    );
  });

  // Ticket filtering logic
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user.firstName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      ticketFilter === "all" ? true : t.status === ticketFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await API.get("/admin/users");
        setUsers(res.data);
      } else if (activeTab === "support tickets") {
        const res = await API.get("/tickets/admin/all");
        setTickets(res.data);
      } else {
        const res = await API.get("/admin/logs");
        setLogs(res.data);
      }
    } catch (err) {
      toast.error("Failed to load data. Are you an admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, actionType) => {
    try {
      await API.put(`/admin/users/${userId}/${actionType}`);
      toast.success("Action completed and logged!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Action failed");
    }
  };

  const handleResolveTicket = async (ticketId) => {
    if (
      !window.confirm("Are you sure you want to mark this ticket as resolved?")
    )
      return;

    try {
      await API.put(`/tickets/${ticketId}/resolve`);
      toast.success("Ticket resolved and logged.");
      fetchData(); // Refresh the list
    } catch (err) {
      toast.error("Failed to resolve ticket.");
    }
  };

  if (loading && users.length === 0 && tickets.length === 0)
    return <div className="p-20 text-center">Loading Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">
        Platform Administration
      </h1>

      {/* Tabs - Added Support Tickets */}
      <div className="flex border-b border-gray-200 mb-8">
        {["users", "support tickets", "audit logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm("");
            }}
            className={`py-4 px-6 text-sm font-bold uppercase tracking-wider ${
              activeTab === tab
                ? "border-b-2 border-red-600 text-red-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SEARCH & ACTION BAR */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === "support tickets" && (
          <div className="flex gap-2">
            {["all", "open", "pending", "resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setTicketFilter(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${ticketFilter === s ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TICKETS TAB */}
      {activeTab === "support tickets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[10px] font-black px-2 py-1 rounded uppercase ${ticket.priority === "high" ? "bg-red-100 text-red-600" : "bg-gray-100"}`}
                >
                  {ticket.priority} Priority
                </span>
                {/* Replace the existing status span with this */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1.5 ${
                      ticket.status === "open"
                        ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                        : ticket.status === "resolved"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {/* The Flashing Dot for 'open' tickets */}
                    {ticket.status === "open" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                    {ticket.status}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{ticket.subject}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                {ticket.description}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="flex gap-2">
                  <Link
                    to={`/support/tickets/${ticket._id}`}
                    className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg font-bold hover:bg-black transition"
                  >
                    VIEW THREAD
                  </Link>
                  {/* RESOLVE BUTTON */}
                  {ticket.status !== "resolved" && (
                    <button
                      onClick={() => handleResolveTicket(ticket._id)}
                      className="border border-green-600 text-green-600 text-[10px] px-3 py-2 rounded-lg font-bold hover:bg-green-50 transition"
                    >
                      MARK RESOLVED
                    </button>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-400">User</p>
                  <p className="text-[11px] font-bold text-gray-700">
                    {ticket.user.firstName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map((u) => (
                <tr
                  key={u._id}
                  className={`border-b border-gray-100 ${u.isBanned ? "bg-red-50 opacity-75" : ""}`}
                >
                  <td className="p-4">
                    <p className="font-bold text-gray-900">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === "artisan" && (
                      <div className="flex flex-col gap-1 text-xs">
                        <span
                          className={
                            u.artisanProfile?.isVerified
                              ? "text-green-600 font-bold"
                              : "text-gray-400"
                          }
                        >
                          {u.artisanProfile?.isVerified
                            ? "✓ Verified"
                            : "Unverified"}
                        </span>
                        <span
                          className={
                            u.artisanProfile?.subscriptionTier === "pro"
                              ? "text-blue-600 font-bold"
                              : "text-gray-400"
                          }
                        >
                          {u.artisanProfile?.subscriptionTier === "pro"
                            ? "PRO TIER"
                            : "Free Tier"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.role === "artisan" && (
                      <>
                        <button
                          onClick={() => handleAction(u._id, "verify")}
                          className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded hover:bg-green-100"
                        >
                          Toggle Verify
                        </button>
                        <button
                          onClick={() => handleAction(u._id, "tier")}
                          className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100"
                        >
                          Toggle Pro
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleAction(u._id, "ban")}
                      className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100"
                    >
                      {u.isBanned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === "audit logs" && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-black uppercase text-gray-500 mb-4 flex justify-between">
            Immutable Activity Stream
            <span className="text-[10px] lowercase font-normal opacity-70">
              Showing {filteredLogs.length} logs
            </span>
          </h2>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-bold">{log.adminName}</span> performed{" "}
                    <span
                      className={`font-black font-mono px-2 py-0.5 rounded text-[11px] ${log.action.includes("BAN") ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-800"}`}
                    >
                      {log.action}
                    </span>{" "}
                    on <span className="font-bold">{log.targetUserEmail}</span>
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-xs text-gray-400 font-bold">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] text-gray-300">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="p-10 text-center text-gray-400 italic">
                No activity logs matching your search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
