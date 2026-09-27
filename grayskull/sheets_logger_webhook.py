"""
sheets_logger_webhook.py
-------------------------
Background-threaded Google Sheets logger using Apps Script webhook.
- Non-blocking: detector loop never waits for network
- Retries on failure (queue-based)
- Sends keys that exactly match the Apps Script doPost expectations
"""

import queue
import threading
import time
from datetime import datetime

import requests


class SheetsLogger:
    def __init__(self, webhook_url):
        self.url = webhook_url
        self.q = queue.Queue()
        self.stop_flag = threading.Event()
        self.worker = threading.Thread(target=self._run, daemon=True)
        self.worker.start()
        print(f"[SheetsLogger] Webhook logger started.")

    def log_event(self, zone, new_state, face_count, motion_flag):
        ts = time.time()
        payload = {
            "timestamp_iso": datetime.fromtimestamp(ts).isoformat(timespec="seconds"),
            "zone": zone,
            "new_state": "OCCUPIED" if new_state else "VACANT",
            "face_count": int(face_count),
            "motion_flag": bool(motion_flag),
            "unix_time": ts,
        }
        self.q.put(payload)
        print(f"[SheetsLogger] Queued event for {zone} -> {payload['new_state']}")

    def _run(self):
        while not self.stop_flag.is_set():
            try:
                payload = self.q.get(timeout=0.5)
            except queue.Empty:
                continue
            try:
                # Apps Script returns 302 redirect — must follow it
                # Cold starts can take 8+ seconds, so generous timeout
                r = requests.post(
                    self.url,
                    json=payload,
                    timeout=15,
                    allow_redirects=True,
                )
                if r.status_code == 200:
                    print(f"[SheetsLogger] LOGGED {payload['zone']} {payload['new_state']}")
                else:
                    print(f"[SheetsLogger] HTTP {r.status_code}: {r.text[:200]}")
            except Exception as e:
                print(f"[SheetsLogger] POST failed ({e}); retrying in 5s")
                self.q.put(payload)
                time.sleep(5)

    def shutdown(self):
        self.stop_flag.set()
        self.worker.join(timeout=3)
