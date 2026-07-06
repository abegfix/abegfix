import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext"; // Import our new hook

const Navbar = () => {
  // Grab everything we need from Context
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const getProfileRoute = () => {
    switch (user?.role) {
      case "artisan":
        return "/artisan-dashboard";
      case "admin":
        return "/admin-dashboard";
      case "customer":
        return "/customer-profile";
      default:
        return "/";
    }
  };

  const handleLogout = () => {
    logout(); // This clears context + localStorage in one go
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={logo}
              alt="Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          {/* SHARED MENU */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8">
            <Link
              to="/directory"
              className="text-gray-600 hover:text-blue-700 text-sm md:text-base font-medium"
            >
              Directory
            </Link>

            {/* Use isAuthenticated instead of local state 'user' */}
            {isAuthenticated ? (
              <>
                <Link
                  to={getProfileRoute()}
                  className="text-gray-600 hover:text-blue-700 text-sm md:text-base font-medium"
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-[#1E3A8A] text-white px-3 py-1.5 md:px-5 md:py-2 rounded-lg hover:bg-black transition text-xs md:text-sm font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-700 text-sm md:text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#1E3A8A] text-white px-3 py-1.5 md:px-6 md:py-2 rounded-lg hover:bg-black transition text-xs md:text-sm font-bold text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
