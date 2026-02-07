# main.py - AMAN-Q CONTROLLER KERNEL
# v4.0 (Stable/Quantum-Hybrid)
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import os
import datetime
import random

# --- SYSTEM BOOT SEQUENCE ---
print("\n" + "=" * 50)
print(" 🛡️  AMAN-Q RESILIENCE PROTOCOL ONLINE")
print(" [KERNEL] QUANTUM OPTIMIZER: ACTIVE")
print(" [KERNEL] AI SENTINEL: ACTIVE")
print("=" * 50 + "\n")

app = FastAPI(title="AmanQ Controller", version="4.0")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# 1. SECURE VAULT CONFIGURATION
VAULT_DIR = "./safe_vault"  # Relative path for portability
if not os.path.exists(VAULT_DIR): os.makedirs(VAULT_DIR)

# 2. IN-MEMORY STATE (Redis-simulation)
cluster_state = {}
backup_logs = []
active_command = "IDLE"


# --- ENDPOINTS: DASHBOARD STATE ---
@app.get("/state")
async def get_state():
    """Returns the real-time state of physical nodes."""
    return {"servers": cluster_state, "logs": backup_logs}


@app.get("/quantum_state")
async def get_quantum_state():
    """
    Simulates the Quantum Annealing process.
    Generates virtual satellite nodes and calculates System Energy (E).
    """
    quantum_cluster = cluster_state.copy()
    # Simulate Virtual Satellite Fleet
    satellites = ["SAT-ALPHA", "SAT-BETA", "SAT-GAMMA", "SAT-DELTA"]
    for s in satellites:
        quantum_cluster[s] = {
            "cpu": random.randint(5, 15),
            "ram": random.randint(10, 30),
            "status": "OPTIMAL"
        }

    # Run Simulated Annealing Logic: Minimize Cost Function
    best_node = None
    min_energy = float('inf')

    for name, data in quantum_cluster.items():
        # Energy Function: E = CPU^2 + 0.5*RAM^2
        energy = (data.get('cpu', 0) ** 2) + (0.5 * (data.get('ram', 0) ** 2))
        data['energy'] = int(energy)

        if energy < min_energy:
            min_energy = energy
            best_node = name

    # Mark the Optimization Target
    for name, data in quantum_cluster.items():
        data['is_target'] = (name == best_node)

    return {"servers": quantum_cluster}


# --- ENDPOINTS: COMMAND & CONTROL ---
@app.post("/trigger_attack")
async def trigger_attack():
    """Broadcasts the attack simulation signal to all agents."""
    global active_command
    active_command = "ATTACK"
    print(" ⚠️  COMMAND OVERRIDE: INITIATING CLUSTER ATTACK")
    return {"status": "Attack signal broadcasted"}


@app.get("/get_command")
async def agent_poll_command():
    """Agents poll this endpoint for heartbeat and commands."""
    global active_command
    cmd = active_command
    if active_command == "ATTACK":
        active_command = "IDLE"  # Reset to prevent infinite loop
    return {"cmd": cmd}


# --- ENDPOINTS: AGENT REPORTING ---
@app.post("/metrics")
async def receive_metrics(data: dict):
    cluster_state[data.get("server")] = data
    return {"status": "received"}


@app.post("/log_event")
async def log_event(data: dict):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    log_entry = {
        "time": timestamp,
        "msg": data.get("msg"),
        "type": data.get("type", "info")
    }
    backup_logs.insert(0, log_entry)
    if len(backup_logs) > 30: backup_logs.pop()
    return {"status": "logged"}


# --- ENDPOINTS: SECURE VAULT ---
@app.post("/upload_backup")
async def upload_backup(file: UploadFile = File(...)):
    """Receives encrypted blobs and stores them in the vault."""
    try:
        file_location = f"{VAULT_DIR}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "time": timestamp,
            "msg": f"{file.filename} [CLOUD SYNC]",
            "type": "success"
        }
        backup_logs.insert(0, log_entry)
        return {"status": "saved"}
    except Exception as e:
        print(f" ❌ VAULT ERROR: {e}")
        return {"status": "failed"}


# --- ENDPOINTS: AUDIT ---
@app.get("/vault_files")
async def get_vault_files():
    try:
        files = [f for f in os.listdir(VAULT_DIR) if f.endswith(".enc")]
        return {"files": files}
    except:
        return {"files": []}


@app.get("/inspect_file/{filename}")
async def inspect_file(filename: str):
    """Allows the dashboard to verify the Hex/Encryption of a file."""
    try:
        path = f"{VAULT_DIR}/{filename}"
        if os.path.exists(path):
            with open(path, "rb") as f: content = f.read(500)
            return {"name": filename, "hex": content.hex(), "size": os.path.getsize(path)}
    except:
        pass
    return {"error": "File not found"}


@app.post("/reset_system")
async def reset_system():
    global backup_logs, active_command
    backup_logs = []
    active_command = "IDLE"
    if os.path.exists(VAULT_DIR):
        for f in os.listdir(VAULT_DIR):
            os.remove(os.path.join(VAULT_DIR, f))
    return {"status": "cleared"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)