import React from "react";
import { ViewState } from "../types";

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  walletAddress: string | null;
  onConnect: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  walletAddress,
  onConnect,
}) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: "Dashboard" },
    { id: ViewState.MINT, label: "Mint Identity" },
    { id: ViewState.ACCESS, label: "Access Control" },
  ];

  return (
    <nav className="border-b border-cyber-700 bg-cyber-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-cyber-500/20 p-2 rounded-lg border border-cyber-500/30">
              <svg
                className="w-6 h-6 text-cyber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Cipher<span className="text-cyber-400">Identity</span>
            </span>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? "bg-cyber-800 text-cyber-400 border border-cyber-700"
                      : "text-gray-300 hover:bg-cyber-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={onConnect}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                walletAddress
                  ? "bg-cyber-800 text-emerald-400 border border-emerald-500/30"
                  : "bg-cyber-500 hover:bg-cyber-400 text-white shadow-lg shadow-cyber-500/20"
              }`}
            >
              {walletAddress ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
