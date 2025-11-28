import React, { useState, useRef, useEffect } from "react";
import { SCENARIOS, CONTRACT_CONFIG } from "./constants";
import {
  initFhevm,
  setWeb3Context,
  mintIdentityOnChain,
  verifyAccessOnChain,
} from "./services/fheService";
import { BrowserProvider, Contract } from "ethers";

// 全局类型声明
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 初始化 Provider
const provider = new BrowserProvider(window.ethereum);

// 视图枚举
enum ViewState {
  DASHBOARD = "dashboard",
  MINT = "mint",
  ACCESS = "access",
}

// 类型定义
interface EncryptedAttribute {
  id: string;
  label: string;
  type: string;
  timestamp: number;
  encryptedValue: string;
  decryptedMockValue: number | string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: "success" | "pending" | "error";
}

// --- Navbar 组件 ---
const Navbar: React.FC<{
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}> = ({ currentView, onNavigate, walletAddress, onConnect, onDisconnect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "Dashboard", view: ViewState.DASHBOARD },
    { label: "Mint Identity", view: ViewState.MINT },
    { label: "Access Scenarios", view: ViewState.ACCESS },
  ];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <span className="text-2xl font-black tracking-wider text-cyan-400">
            FHE Identity
          </span>

          {/* 导航按钮 */}
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.view)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentView === item.view
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/50"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 钱包连接区域 */}
          <div className="relative" ref={dropdownRef}>
            {walletAddress ? (
              <div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-4 py-2 text-sm font-bold rounded-full transition bg-fuchsia-600 text-white hover:bg-fuchsia-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {`Connected (${walletAddress.slice(0, 6)}...)`}
                  <span className="text-xs ml-1">▼</span>
                </button>

                {/* 下拉菜单 */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-2 animate-fadeIn z-50">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-xs text-slate-400">Current Wallet</p>
                      <p className="text-sm text-white font-mono truncate">
                        {walletAddress}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onDisconnect();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition first:rounded-t-none last:rounded-b-lg"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="px-4 py-2 text-sm font-bold rounded-full transition bg-cyan-500 text-slate-900 hover:bg-cyan-400"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Main App 组件 ---
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(
    ViewState.DASHBOARD
  );
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<EncryptedAttribute[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    Record<string, "idle" | "verifying" | "granted" | "denied">
  >({});
  const [mintForm, setMintForm] = useState({
    age: "25",
    creditScore: "750",
    tier: "1",
  });

  // 添加日志辅助函数
  const addLog = (
    action: string,
    details: string,
    status: "success" | "pending" | "error"
  ) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toLocaleTimeString(),
        action,
        details,
        status,
      },
      ...prev,
    ]);
  };

  // 连接钱包
  const handleConnect = async () => {
    try {
      if (!window.ethereum)
        return addLog("Error", "MetaMask not found", "error");
      addLog("Wallet", "Connecting...", "pending");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      setWalletAddress(account);
      addLog("Wallet", `Connected: ${account.slice(0, 6)}...`, "success");
      await initFhevm();
      await setWeb3Context(account);
      addLog("FHEVM", "FHEVM & Contract Ready", "success");
    } catch (err: any) {
      addLog("Error", err.message, "error");
    }
  };

  // 断开连接
  const handleDisconnect = () => {
    setWalletAddress(null);
    setAttributes([]);
    setVerificationStatus({});
    addLog("Wallet", "Disconnected", "pending");
  };

  // 铸造身份
  const handleMint = async () => {
    if (!walletAddress) return addLog("Error", "Connect wallet first", "error");

    setIsMinting(true);
    const age = parseInt(mintForm.age);
    const credit = parseInt(mintForm.creditScore);
    const tier = parseInt(mintForm.tier);

    // --- 输入校验 ---
    if (isNaN(age) || age < 1 || age > 120) {
      addLog("Validation", "Age must be between 1 and 120", "error");
      setIsMinting(false);
      return;
    }

    if (isNaN(credit) || credit < 300 || credit > 850) {
      addLog("Validation", "Credit Score must be between 300 and 850", "error");
      setIsMinting(false);
      return;
    }

    if (isNaN(tier) || tier < 1 || tier > 5) {
      addLog("Validation", "Tier must be between 1 and 5", "error");
      setIsMinting(false);
      return;
    }
    // ----------------

    try {
      addLog("Encryption", "Encrypting inputs...", "pending");
      const userAddress = walletAddress;
      const { handles, proofs } = await mintIdentityOnChain(
        CONTRACT_CONFIG.ADDRESS,
        userAddress,
        age,
        credit,
        tier
      );

      const signer = await provider.getSigner();
      const contract = new Contract(
        CONTRACT_CONFIG.ADDRESS,
        CONTRACT_CONFIG.ABI,
        signer
      );

      addLog("Transaction", "Sending transaction...", "pending");

      const tx = await contract.setIdentity(
        handles[0],
        proofs[0],
        handles[1],
        proofs[1],
        handles[2],
        proofs[2]
      );
      await tx.wait();
      addLog("Transaction", `Mined: ${tx.hash.slice(0, 10)}...`, "success");

      setAttributes([
        {
          id: "age",
          label: "Age",
          type: "uint32",
          timestamp: Date.now(),
          encryptedValue: "0xEncryptedAge...",
          decryptedMockValue: age,
        },
        {
          id: "creditScore",
          label: "Credit Score",
          type: "uint32",
          timestamp: Date.now(),
          encryptedValue: "0xEncryptedCredit...",
          decryptedMockValue: credit,
        },
        {
          id: "membershipTier",
          label: "Membership Tier",
          type: "uint32",
          timestamp: Date.now(),
          encryptedValue: "0xEncryptedTier...",
          decryptedMockValue: tier,
        },
      ]);

      addLog("Success", "Identity Minted ✔", "success");
      setCurrentView(ViewState.DASHBOARD);
    } catch (err: any) {
      addLog("Error", err.message, "error");
    } finally {
      setIsMinting(false);
    }
  };

  // 验证访问权限
  async function handleAccessCheck(scenarioId: string) {
    try {
      if (!walletAddress) {
        addLog("Error", "Please connect wallet first", "error");
        return;
      }

      let methodName: "checkIsAdult" | "checkIsVIP" | null = null;

      if (scenarioId === "club-access") {
        methodName = "checkIsAdult";
      } else {
        methodName = "checkIsVIP";
      }

      setVerificationStatus((prev) => ({ ...prev, [scenarioId]: "verifying" }));
      addLog("AccessCheck", `Starting check: ${methodName}`, "success");

      const result = await verifyAccessOnChain(methodName);

      setVerificationStatus((prev) => ({
        ...prev,
        [scenarioId]: result ? "granted" : "denied",
      }));

      addLog(
        "Decryption",
        `Result: ${result ? "GRANTED" : "DENIED"}`,
        result ? "success" : "error"
      );
    } catch (err: any) {
      setVerificationStatus((prev) => ({ ...prev, [scenarioId]: "idle" }));
      addLog("Error", err.message, "error");
    }
  }

  // --- 视图渲染函数 ---

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="lg:col-span-2 bg-slate-800/70 p-6 rounded-xl shadow-xl border border-cyan-600/20">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
          <span>🛡️</span> Encrypted Identity
        </h2>
        {attributes.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-slate-400 mb-4">No identity found on chain</p>
            <button
              onClick={() => setCurrentView(ViewState.MINT)}
              className="bg-cyan-500 text-white px-6 py-3 rounded-full hover:bg-cyan-400 transition"
            >
              Mint Identity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="bg-slate-900/40 p-4 rounded-lg border border-cyan-600/20 hover:border-cyan-500/50 transition"
              >
                <div className="text-lg text-slate-200 font-semibold opacity-80">
                  {attr.label}
                </div>
                <div className="text-cyan-300 text-3xl font-bold mt-2 font-mono">
                  {attr.decryptedMockValue}
                </div>
                <div className="text-xs text-slate-500 mt-2 truncate">
                  Encrypted: {attr.encryptedValue}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/70 p-6 rounded-xl shadow-xl border border-cyan-600/20 overflow-y-auto h-[550px]">
        <h2 className="text-xl text-cyan-400 mb-4">Activity Log</h2>
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-3 mb-2 rounded border-l-4 text-sm ${
              log.status === "success"
                ? "border-emerald-500 bg-emerald-900/10"
                : log.status === "error"
                ? "border-red-500 bg-red-900/10"
                : "border-yellow-500 bg-yellow-900/10"
            }`}
          >
            <div className="flex justify-between text-slate-400 text-xs mb-1">
              <span className="font-mono">{log.action}</span>
              <span>{log.timestamp}</span>
            </div>
            <div
              className={`${
                log.status === "success"
                  ? "text-emerald-300"
                  : log.status === "error"
                  ? "text-red-300"
                  : "text-yellow-300"
              }`}
            >
              {log.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMint = () => (
    <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-xl shadow-xl border border-cyan-600/20 animate-fadeIn">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6 flex items-center gap-3">
        <span>🔒</span> Mint Private Identity
      </h2>
      <div className="space-y-6">
        <div>
          <label className="text-slate-300 block mb-2">Age (1-120)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={mintForm.age}
            onChange={(e) => setMintForm({ ...mintForm, age: e.target.value })}
            className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 focus:outline-none transition"
          />
        </div>
        <div>
          <label className="text-slate-300 block mb-2">
            Credit Score (300-850)
          </label>
          <input
            type="number"
            min="300"
            max="850"
            value={mintForm.creditScore}
            onChange={(e) =>
              setMintForm({ ...mintForm, creditScore: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {" "}
            Membership Tier (1-3)
          </label>
          <select
            value={mintForm.tier}
            onChange={(e) => setMintForm({ ...mintForm, tier: e.target.value })}
            className="w-full bg-cyber-900 border border-cyber-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyber-500 focus:outline-none"
          >
            <option value="1">Gold (Tier 1)</option>
            <option value="2">Silver (Tier 2)</option>
            <option value="3">Bronze (Tier 3)</option>
          </select>
        </div>
        <button
          onClick={handleMint}
          disabled={isMinting}
          className={`w-full p-4 rounded-lg text-white font-bold transition transform active:scale-95 ${
            isMinting
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/30"
          }`}
        >
          {isMinting
            ? "Processing Encryption & Proofs..."
            : "Encrypt & Mint Identity"}
        </button>
      </div>
    </div>
  );

  // --- 修改点：渲染Access视图，增加图标 ---
  const renderAccess = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
      {SCENARIOS.map((scenario) => {
        const status = verificationStatus[scenario.id] || "idle";
        return (
          <div
            key={scenario.id}
            className="bg-slate-800/70 p-6 rounded-xl shadow-lg border border-cyan-600/20 hover:border-cyan-500 transition-all duration-300 flex flex-col"
          >
            {/* 图标显示区域 */}
            <div className="flex justify-between items-start mb-4">
              <div className="text-6xl filter drop-shadow-md hover:scale-110 transition cursor-default">
                {scenario.icon}
              </div>
              <div className="text-xs text-slate-500 border border-slate-600 rounded px-2 py-1">
                {scenario.operator} {scenario.threshold}
              </div>
            </div>

            <h3 className="text-xl text-cyan-400 font-bold mb-2">
              {scenario.title}
            </h3>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed flex-grow">
              {scenario.description}
            </p>

            <button
              onClick={() => handleAccessCheck(scenario.id)}
              disabled={status === "verifying"}
              className={`w-full py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 ${
                status === "verifying"
                  ? "bg-slate-600 cursor-wait"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
              }`}
            >
              {status === "verifying" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Verifying...
                </>
              ) : (
                "Verify Access"
              )}
            </button>

            {status === "granted" && (
              <div className="mt-4 text-emerald-400 font-bold border-t border-slate-600 pt-3 text-center animate-bounce-short">
                ✔ ACCESS GRANTED
              </div>
            )}
            {status === "denied" && (
              <div className="mt-4 text-red-400 font-bold border-t border-slate-600 pt-3 text-center animate-shake">
                ✘ ACCESS DENIED
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-cyan-500/30">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <div className="max-w-6xl mx-auto p-8">
        {currentView === ViewState.DASHBOARD && renderDashboard()}
        {currentView === ViewState.MINT && renderMint()}
        {currentView === ViewState.ACCESS && renderAccess()}
      </div>
    </div>
  );
};

export default App;
