import { useEffect, useState, useRef } from "react";
import "./App.css";
import { Shield, Activity, Server, Database, Grid, Trash2, Lock, Zap, AlertTriangle, Cloud, FileText, CheckCircle, RefreshCw, Cpu, TrendingDown } from "lucide-react";

const API_BASE = "http://192.168.200.10:8000";
const POLL_INTERVAL_MS = 800;

export default function App() {
    const [currentView, setCurrentView] = useState("dashboard");
    const [servers, setServers] = useState({});
    const [quantumServers, setQuantumServers] = useState({});
    const [logs, setLogs] = useState([]);
    const [connectionStatus, setConnection] = useState("CONNECTING...");
    const [hexLines, setHexLines] = useState([]);
    const [vaultFiles, setVaultFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const processedRef = useRef(new Set());

    // --- CHART STATE (For the Quantum Graph) ---
    const [energyHistory, setEnergyHistory] = useState(new Array(40).fill(100)); // Start flat

    const triggerAttack = async () => {
        try { await fetch(`${API_BASE}/trigger_attack`, { method: "POST" }); }
        catch (e) { alert("ERROR: COMMAND NODE UNREACHABLE"); }
    };

    const resetSystem = async () => {
        if (!confirm("⚠️ PURGE ALL DATA?")) return;
        try {
            await fetch(`${API_BASE}/reset_system`, { method: "POST" });
            setLogs([]); setVaultFiles([]); setSelectedFile(null);
            processedRef.current = new Set();
            setEnergyHistory(new Array(40).fill(100)); // Reset graph
        } catch (e) { }
    };

    const processLogs = (fetchedLogs) => {
        const newUniqueLogs = fetchedLogs.filter(log => {
            const id = log.time + log.msg + log.type;
            if (processedRef.current.has(id)) return false;
            processedRef.current.add(id);
            return true;
        });
        if (newUniqueLogs.length > 0) {
            const successCount = newUniqueLogs.filter(l => l.type === 'success').length;
            if (successCount > 0) {
                const noise = Array(successCount).fill(0).map(() => Math.floor(Math.random() * 16777215).toString(16));
                setHexLines(prev => [...noise, ...prev].slice(0, 15));
            }
            setLogs(prev => [...newUniqueLogs, ...prev].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 25));
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                // 1. Dashboard State
                const r = await fetch(`${API_BASE}/state`);
                const json = await r.json();
                setServers(json.servers || {});
                if (json.logs) processLogs(json.logs);
                setConnection("ONLINE");

                // 2. Quantum/Optimizer State
                if (currentView === "quantum") {
                    const rq = await fetch(`${API_BASE}/quantum_state`);
                    const jsonQ = await rq.json();
                    setQuantumServers(jsonQ.servers || {});

                    // --- UPDATE THE GRAPH ---
                    // Calculate Total System Energy from the backend
                    let totalEnergy = 0;
                    Object.values(jsonQ.servers || {}).forEach(s => totalEnergy += (s.energy || 0));

                    // Add to history (keep last 40 points)
                    setEnergyHistory(prev => [...prev.slice(1), totalEnergy]);
                }

                // 3. Vault State
                if (currentView === "vault") {
                    const rv = await fetch(`${API_BASE}/vault_files`);
                    const jsonV = await rv.json();
                    setVaultFiles(jsonV.files || []);
                }
            } catch (e) { setConnection("OFFLINE"); }
        };
        load();
        const id = setInterval(load, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [currentView]);

    const inspectFile = async (filename) => {
        try {
            const r = await fetch(`${API_BASE}/inspect_file/${filename}`);
            const data = await r.json();
            setSelectedFile(data);
        } catch (e) { }
    };

    const clearLogs = () => { setLogs([]); setHexLines([]); };
    const isSystemCritical = Object.values(servers).some(s => s.status === "CRITICAL");

    // --- COMPONENT: LIVE SVG CHART ---
    const RenderGraph = () => {
        // Normalize data to fit SVG height (0-100)
        const maxVal = Math.max(...energyHistory, 500); // 500 is baseline max
        const minVal = Math.min(...energyHistory);
        const points = energyHistory.map((val, i) => {
            const x = (i / (energyHistory.length - 1)) * 100; // percent width
            const y = 100 - ((val / maxVal) * 90); // percent height inverted
            return `${x},${y}`;
        }).join(" ");

        return (
            <div className="graph-container" style={{ height: '100%', width: '100%', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.7rem', marginBottom: '10px' }}>
                    <span>COST FUNCTION MINIMIZATION (J)</span>
                    <span style={{ color: '#facc15' }}>SIMULATED ANNEALING REAL-TIME</span>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        <line x1="0" y1="25" x2="100" y2="25" className="chart-grid" />
                        <line x1="0" y1="50" x2="100" y2="50" className="chart-grid" />
                        <line x1="0" y1="75" x2="100" y2="75" className="chart-grid" />
                        {/* The Data Line */}
                        <polyline points={points} className="chart-line" vectorEffect="non-scaling-stroke" />
                    </svg>
                </div>
            </div>
        );
    };

    // --- VIEW 1: DASHBOARD ---
    const renderDashboard = () => (
        <main className="terminal-area">
            <div className="header-info">
                <h1>RESILIENCE PROTOCOL</h1>
                <div className="stats-row">
                    <span>TARGET: <span style={{ color: '#fff' }}>{API_BASE}</span></span>
                    <span>Q-ENTROPY: <span style={{ color: '#bd00ff' }}>{(Math.random() * (9.9 - 9.1) + 9.1).toFixed(4)} eV</span></span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '15px', height: '260px', marginTop: '20px' }}>
                <div className="server-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#94a3b8', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                        ACTIVE NODES {isSystemCritical && <span style={{ color: '#ff0055', float: 'right' }}>⚠ THREAT DETECTED</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                        {Object.entries(servers).map(([name, data]) => (
                            <div key={name} style={{ background: data.status === "CRITICAL" ? 'rgba(255,0,85,0.2)' : 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: data.status === "CRITICAL" ? '3px solid #ff0055' : '3px solid #00ff9d' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                                    <strong style={{ color: '#fff' }}>{name.toUpperCase()}</strong>
                                    <span style={{ color: data.status === "CRITICAL" ? '#ff0055' : '#00ff9d' }}>{data.status}</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: '#334155' }}>
                                    <div style={{ width: `${Math.min(data.cpu, 100)}%`, height: '100%', background: data.status === "CRITICAL" ? '#ff0055' : '#00f0ff', transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lattice-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.7rem', color: '#94a3b8' }}>Q-STATE SUPERPOSITION</div>
                    <div className={`bloch-circle ${isSystemCritical ? "critical" : ""}`}><div className="bloch-vector" /></div>
                    <div style={{ marginTop: 15, fontSize: '0.8rem', fontFamily: 'monospace', color: isSystemCritical ? '#ff0055' : '#00f0ff' }}>
                        {isSystemCritical ? "⚠ COLLAPSE" : "⚪ COHERENT"}
                    </div>
                </div>

                <div className="hex-box">
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: 5, marginBottom: 5, fontSize: '0.7rem', color: '#00ff9d' }}>AES-256 STREAM</div>
                    {hexLines.map((l, i) => <div key={i} style={{ fontSize: '0.65rem', color: isSystemCritical ? '#ff0055' : '#00ff9d', fontFamily: 'monospace' }}>{l}</div>)}
                </div>
            </div>

            <div className="logs-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 10 }}>
                    <span><Zap size={14} style={{ verticalAlign: 'middle' }} /> SYSTEM LOGS</span>
                    <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>CLEAR</button>
                </div>
                {logs.map((log, idx) => (
                    <div key={idx} className="log-line">
                        <span style={{ color: '#64748b' }}>[{log.time}]</span>
                        {log.msg.includes(".enc") && <span style={{ color: '#bd00ff' }}> [LATTICE] </span>}
                        {log.msg.includes("CLOUD") && <span style={{ color: '#00f0ff' }}> [UPLOAD] </span>}
                        <span style={{ color: '#e2e8f0' }}> {log.msg.replace(".enc", "").replace(" [CLOUD SYNC]", "")}</span>
                    </div>
                ))}
            </div>
        </main>
    );

    // --- VIEW 2: QUANTUM OPTIMIZER (THE UPGRADE) ---
    const renderQuantum = () => (
        <main className="terminal-area">
            <div className="header-info" style={{ marginBottom: '20px' }}>
                <h1>QUANTUM LOAD OPTIMIZER</h1>
                <div className="stats-row">
                    <span>ALGORITHM: <span style={{ color: '#facc15' }}>SIMULATED ANNEALING (METROPOLIS)</span></span>
                    <span>FLEET: <span style={{ color: '#00f0ff' }}>BALANCED</span></span>
                </div>
            </div>

            {/* TOP ROW: THE GRAPH AND THE BEST NODE */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', height: '200px', marginBottom: '20px' }}>
                <RenderGraph /> {/* THE NEW LIVE CHART */}

                {/* Find the Best Node to highlight */}
                {Object.values(quantumServers).find(s => s.is_target) && (
                    <div style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid #facc15', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Zap size={40} color="#facc15" />
                        <h3 style={{ color: '#facc15', margin: '10px 0' }}>OPTIMAL TARGET</h3>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {Object.entries(quantumServers).find(([k, v]) => v.is_target)?.[0]}
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM ROW: THE FLEET */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                {Object.entries(quantumServers).map(([name, data]) => (
                    <div key={name} style={{
                        border: data.is_target ? '1px solid #facc15' : '1px solid #1e293b',
                        background: 'rgba(11, 17, 33, 0.6)',
                        padding: '15px',
                        opacity: data.is_target ? 1 : 0.7,
                        transition: 'all 0.5s'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong style={{ color: data.is_target ? '#facc15' : '#fff' }}>{name}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{data.energy} J</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#334155', marginTop: '10px' }}>
                            <div style={{ width: `${data.cpu}%`, height: '100%', background: data.is_target ? '#facc15' : '#00f0ff' }} />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );

    const renderVault = () => (
        <main className="terminal-area">
            <div className="header-info" style={{ marginBottom: '30px' }}>
                <h1>CRYPTOGRAPHIC AUDIT</h1>
                <div className="stats-row">
                    <span>ALGORITHM: <span style={{ color: '#bd00ff' }}>FERNET (AES-128)</span></span>
                    <span>INTEGRITY: <span style={{ color: '#00ff9d' }}>VERIFIED</span></span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                <div style={{ width: '30%', borderRight: '1px solid #1e293b', paddingRight: '20px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '10px' }}>ENCRYPTED STORAGE</div>
                    {vaultFiles.map(f => (
                        <div key={f} onClick={() => inspectFile(f)} style={{
                            padding: '12px', border: '1px solid #334155', marginBottom: '8px', cursor: 'pointer',
                            background: selectedFile?.name === f ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                            borderColor: selectedFile?.name === f ? '#00f0ff' : '#334155',
                            display: 'flex', justifyContent: 'space-between', color: '#e2e8f0'
                        }}>
                            <span>{f.replace(".enc", "")}</span>
                            <Lock size={14} color="#bd00ff" />
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1, background: '#02040a', border: '1px solid #1e293b', padding: '20px', fontFamily: 'monospace', color: '#00ff9d', overflowY: 'auto', wordBreak: 'break-all' }}>
                    {selectedFile ? selectedFile.hex.match(/.{1,2}/g).join(" ").toUpperCase() : "SELECT FILE TO INSPECT"}
                </div>
            </div>
        </main>
    );

    return (
        <>
            <div className="scanline" />
            <div className="app-container">
                <aside className="sidebar">
                    <div className="brand">
                        <Shield className="icon-brand" size={28} color="#00f0ff" />
                        <span>AMAN-Q</span>
                    </div>
                    <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                        <Activity size={18} /> DASHBOARD
                    </div>
                    <div className={`nav-item ${currentView === 'vault' ? 'active' : ''}`} onClick={() => setCurrentView('vault')}>
                        <Database size={18} /> VAULT
                    </div>
                    <div className={`nav-item ${currentView === 'quantum' ? 'active' : ''}`} onClick={() => setCurrentView('quantum')}>
                        <TrendingDown size={18} color="#facc15" /> OPTIMIZER
                    </div>

                    <div style={{ marginTop: 'auto', gap: '10px', display: 'flex', flexDirection: 'column' }}>
                        <button className="alert-btn" onClick={triggerAttack}>
                            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 5 }} /> TRIGGER ATTACK
                        </button>
                        <button onClick={resetSystem} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px', cursor: 'pointer' }}>
                            <RefreshCw size={12} /> RESET SYSTEM
                        </button>
                    </div>
                    <div style={{ marginTop: 20, fontSize: '0.8rem', color: connectionStatus === "ONLINE" ? '#00ff9d' : '#ff0055' }}>
                        SYSTEM: {connectionStatus}
                    </div>
                </aside>
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'vault' && renderVault()}
                {currentView === 'quantum' && renderQuantum()}
            </div>
        </>
    );
}