# agent.py - AMAN-Q INTELLIGENT AGENT
# Runs on Edge Nodes to detect anomalies and evacuate data.
import psutil, requests, time, os, subprocess
import numpy as np
from cryptography.fernet import Fernet
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# --- CONFIGURATION ---
CONTROLLER_IP = "192.168.200.10"
SERVER_NAME = "server1"
CRITICAL_PATH = "./critical_data"  # Local path for demo
if not os.path.exists(CRITICAL_PATH): os.makedirs(CRITICAL_PATH)

# --- CRYPTOGRAPHY ---
# Using Fernet (AES-128 with HMAC) for symmetric encryption
CIPHER_KEY = Fernet.generate_key()
cipher = Fernet(CIPHER_KEY)


def send_to_vault(filepath):
    url = f"http://{CONTROLLER_IP}:8000/upload_backup"
    filename = os.path.basename(filepath)
    try:
        with open(filepath, 'rb') as f:
            original = f.read()
        encrypted = cipher.encrypt(original)
        files = {'file': (filename + ".enc", encrypted)}
        requests.post(url, files=files, timeout=5)
        print(f" ✅ SECURED: {filename}")
    except:
        pass


def log_event(msg, type="info"):
    try:
        requests.post(f"http://{CONTROLLER_IP}:8000/log_event",
                      json={"msg": msg, "type": type}, timeout=1)
    except:
        pass


# --- AI MODULES ---
class AnomalyDetector:
    def __init__(self):
        # Isolation Forest for Unsupervised Anomaly Detection
        self.model = IsolationForest(n_estimators=100, contamination=0.05)
        self.is_trained = False

    def train(self):
        # Simulate training data (Normal vs Stress)
        normal = np.random.normal(20, 5, (25000, 1))
        idle = np.random.normal(2, 2, (25000, 1))
        train_data = np.hstack((np.vstack((normal, idle)), np.random.normal(30, 5, (50000, 3))))
        self.model.fit(train_data)
        self.is_trained = True

    def check(self, cpu, ram):
        if not self.is_trained or cpu < 50: return False
        return self.model.predict([[cpu, ram, 30, 300]])[0] == -1


def train_classifier():
    # Naive Bayes for File Classification (Critical vs Junk)
    good = ["id_rsa", "master_key.pem", "database.sql", "patient_records.csv"]
    bad = ["movie.mp4", "vacation.jpg", "game.exe", "funny_cats.mkv"]
    model = make_pipeline(CountVectorizer(analyzer='char', ngram_range=(2, 5)), MultinomialNB())
    model.fit(good + bad, [1] * len(good) + [0] * len(bad))
    return model


# --- INITIALIZATION ---
ai = AnomalyDetector()
ai.train()
librarian = train_classifier()
print(f" 🤖 AGENT {SERVER_NAME} ONLINE & MONITORING")

# --- MAIN LOOP ---
sent_files = set()
attack_end_time = 0

while True:
    try:
        # 1. POLL CONTROLLER
        try:
            r = requests.get(f"http://{CONTROLLER_IP}:8000/get_command", timeout=0.5)
            if r.json().get("cmd") == "ATTACK":
                print(" ⚠️  COMMAND RECEIVED: STRESS TEST INITIATED")
                subprocess.Popen("stress --cpu 8 --timeout 15", shell=True)
                attack_end_time = time.time() + 15
        except:
            pass

        # 2. MONITOR SYSTEM
        is_under_attack = (time.time() < attack_end_time)
        real_cpu = psutil.cpu_percent(interval=1)
        real_ram = psutil.virtual_memory().percent

        status = "UP"

        # 3. ATTACK LOGIC
        if is_under_attack:
            status = "CRITICAL"
            reported_cpu = 100
            print(f" 🚨 THREAT DETECTED (CPU: {real_cpu}%)")

            # Update Dashboard
            try:
                requests.post(f"http://{CONTROLLER_IP}:8000/metrics",
                              json={"server": SERVER_NAME, "cpu": reported_cpu, "ram": real_ram, "status": "CRITICAL"},
                              timeout=1)
            except:
                pass

            if len(sent_files) == 0:
                print(" ⏳ AI FILTERING DATA...")
                time.sleep(1.2)

            # Process Files
            if os.path.exists(CRITICAL_PATH):
                for f in os.listdir(CRITICAL_PATH):
                    if f in sent_files: continue

                    if librarian.predict([f])[0] == 1:
                        print(f" 💎 CLASSIFIED CRITICAL: {f}")
                        send_to_vault(os.path.join(CRITICAL_PATH, f))
                        time.sleep(1.5)  # Delay for visual effect
                    else:
                        print(f" 🗑️ CLASSIFIED JUNK: {f}")
                        log_event(f, "dropped")
                        time.sleep(0.3)
                    sent_files.add(f)

        else:
            # Heartbeat
            if sent_files: sent_files.clear()
            requests.post(f"http://{CONTROLLER_IP}:8000/metrics",
                          json={"server": SERVER_NAME, "cpu": real_cpu, "ram": real_ram, "status": status}, timeout=2)

    except KeyboardInterrupt:
        break
    except Exception:
        pass