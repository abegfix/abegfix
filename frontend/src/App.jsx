import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css"; // Import your CSS file

// Import Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import VerifyEmail from "./components/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieConsent from "./components/CookieConsent";
import TicketList from "./components/TicketList";
import { CreateTicket } from "./components/CreateTicket.jsx";
import TicketThread from "./components/TicketThread.jsx";

// Import Pages
import Home from "./pages/Home";
import ArtisanSignup from "./pages/ArtisanSignup";
import CustomerSignup from "./pages/CustomerSignup";
import Directory from "./pages/Directory";
import Login from "./pages/Login";
import SignupChoice from "./pages/SignupChoice";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import CustomerProfile from "./pages/CustomerProfile";
import ArtisanDashboard from "./pages/ArtisanDashboard";
import ProfileRedirect from "./pages/ProfileRedirect";
import ArtisanProfileView from "./pages/ArtisanProfileView";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import HelpCenter from "./pages/HelpCenter";
import ArticlePage from "./pages/ArticlePage";
import CategoryArticles from "./components/documentation/CategoryArticles";

//Inner Pages
import About from "./pages/innerpages/About.jsx";
import Cookies from "./pages/innerpages/Cookies.jsx";
import DataPolicy from "./pages/innerpages/DataPolicy.jsx";
import Disclaimer from "./pages/innerpages/Disclaimer.jsx";
import CopyrightPolicy from "./pages/innerpages/CopyrightPolicy.jsx";
import EarningsDisclaimer from "./pages/innerpages/EarningsDisclaimer.jsx";
import FAQ from "./pages/innerpages/FAQ.jsx";
import Guidelines from "./pages/innerpages/Guidelines.jsx";
import HowItWorks from "./pages/innerpages/HowItWorks.jsx";
import Privacy from "./pages/innerpages/Privacy.jsx";
import RefundPolicy from "./pages/innerpages/RefundPolicy.jsx";
import Safety from "./pages/innerpages/Safety.jsx";
import Terms from "./pages/innerpages/Terms.jsx";

//Other Imports
import toast, { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Flex container forces the footer to the bottom of the screen */}
      <div className="flex flex-col min-h-screen">
        <Navbar />

        {/* The main content area that changes based on the URL */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artisan-signup" element={<ArtisanSignup />} />
            <Route path="/customer-signup" element={<CustomerSignup />} />
            <Route path="/signup" element={<SignupChoice />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            {/* The "Smart" Route */}
            <Route path="/profile" element={<ProfileRedirect />} />
            {/* SHARED SUPPORT ROUTES (Accessible by both Artisans and Customers) */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["artisan", "customer", "admin"]}
                />
              }
            >
              <Route path="/support/tickets" element={<TicketList />} />
              <Route path="/support/new" element={<CreateTicket />} />

              {/* This is the thread view for individual tickets */}
              <Route path="/support/tickets/:id" element={<TicketThread />} />
            </Route>
            {/* The Specific Dashboards */}
            {/* Artisan Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["artisan"]} />}>
              <Route path="/artisan-dashboard" element={<ArtisanDashboard />} />
            </Route>
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>
            {/* Customer Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
              <Route path="/customer-profile" element={<CustomerProfile />} />
            </Route>
            <Route path="/directory" element={<Directory />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/update-password/:token"
              element={<UpdatePassword />}
            />
            /**Inner Pages*/
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/data-policy" element={<DataPolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/copyright-policy" element={<CopyrightPolicy />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route
              path="/help-center/article/:slug"
              element={<ArticlePage />}
            />
            <Route
              path="/help-center/category/:slug"
              element={<CategoryArticles />}
            />
            <Route
              path="/earnings-disclaimer"
              element={<EarningsDisclaimer />}
            />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/artisan/:username" element={<ArtisanProfileView />} />
          </Routes>
        </main>

        <Footer />
        <CookieConsent />
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
