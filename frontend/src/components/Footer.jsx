import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Row: Internal Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-blue-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/support/tickets" className="hover:text-blue-400">
                  Tickets
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-blue-400">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-blue-400">
                  Cookies
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-blue-400">
                  How it Works
                </Link>
              </li>
              <li>
                <Link to="/data-policy" className="hover:text-blue-400">
                  Data Policy
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-blue-400">
                  Safety
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-blue-400">
                  Guidelines
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-blue-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-blue-400">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/copyright-policy" className="hover:text-blue-400">
                  Copyright Policy
                </Link>
              </li>
              <li>
                <Link to="/earnings-disclaimer" className="hover:text-blue-400">
                  Earnings Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-blue-400">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Artisans</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/guidelines" className="hover:text-blue-400">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row: Copyright & Socials */}
        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Abeg Fix. All rights reserved.
          </p>
          <p className="mt-2 mb-6 text-sm">
            Connecting Lagosians with trusted local professionals.
          </p>

          {/* Social Links Row */}
          <div className="flex justify-center space-x-6 items-center">
            {/* Email */}
            <a
              href="mailto:support@abegfix.com"
              aria-label="Email"
              className="hover:text-blue-400 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </a>
            {/* WhatsApp */}
            <a
              href="https://wa.me/2348162317196"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:text-green-500 transition"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.031 0C5.385 0 0 5.383 0 12.028c0 2.126.551 4.195 1.595 6.02L.03 24l6.113-1.6c1.782.96 3.791 1.464 5.888 1.465v.001c6.643 0 12.029-5.384 12.029-12.03C24.06 5.215 18.675 0 12.031 0zm0 21.826c-1.8 0-3.565-.484-5.112-1.4l-.367-.217-3.794.994 1.014-3.698-.238-.379c-1.004-1.604-1.535-3.465-1.535-5.385 0-5.545 4.515-10.059 10.063-10.059 5.545 0 10.057 4.514 10.057 10.059 0 5.548-4.512 10.06-10.057 10.06l-.031.025zm5.522-7.545c-.302-.152-1.794-.886-2.072-.988-.278-.101-.482-.152-.685.152-.204.302-.782.988-.957 1.188-.175.202-.351.226-.653.076-.302-.152-1.28-.472-2.438-1.503-.902-.803-1.51-1.795-1.685-2.097-.175-.303-.018-.466.133-.617.136-.135.302-.353.454-.528.151-.176.202-.303.303-.505.101-.202.051-.379-.025-.53-.076-.152-.685-1.648-.938-2.256-.247-.591-.497-.512-.685-.521l-.583-.008c-.204 0-.533.076-.811.379-.278.303-1.062 1.037-1.062 2.527 0 1.488 1.088 2.926 1.239 3.129.151.202 2.135 3.256 5.174 4.567.722.311 1.285.497 1.725.636.726.232 1.385.198 1.905.12.584-.088 1.794-.732 2.046-1.439.252-.707.252-1.314.177-1.44-.076-.126-.279-.202-.582-.353z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://instagram.com/abegfix"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-pink-500 transition"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            {/* X (Twitter) */}
            <a
              href="https://x.com/abeg_fix"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="hover:text-white transition"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
