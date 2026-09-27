"""
=============================================================================
  Hybrid Occupancy Detection + ESP Control + MQTT
=============================================================================
"""

import signal
import sys
import os
import threading
import queue
import json
import time
from datetime import datetime, UTC
from typing import Dict, Tuple
from dotenv import load_dotenv

import cv2
import requests
from paho.mqtt import client as mqtt_client


load_dotenv()

# Load from .env or use defaults
ESP_IP = os.getenv("ESP_IP", "http://10.250.151.160")
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
HOME_ID = os.getenv("HOME_ID", "home_001")
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "8883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")

MIN_FACE_SIZE = (80, 80)
FACE_SCALE_FACTOR = 1.1
FACE_MIN_NEIGHBORS = 5

OCCUPIED_FRAMES = 3
VACANT_FRAMES = 30




class HybridDetector:
    def __init__(self):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def detect(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, FACE_SCALE_FACTOR, FACE_MIN_NEIGHBORS, minSize=MIN_FACE_SIZE)
        return len(faces) > 0, faces


class Debounce:
    def __init__(self):
        self.occupied = False
        self.consec_detected = 0
        self.consec_empty = 0

    def update(self, detected):
        if detected:
            self.consec_detected += 1
            self.consec_empty = 0
            if not self.occupied and self.consec_detected >= OCCUPIED_FRAMES:
                self.occupied = True
        else:
            self.consec_empty += 1
            self.consec_detected = 0
            if self.occupied and self.consec_empty >= VACANT_FRAMES:
                self.occupied = False

        return self.occupied


def split_zones(frame):
    h, w = frame.shape[:2]
    return [
        frame[0:h//2, 0:w//2],
        frame[0:h//2, w//2:w],
        frame[h//2:h, 0:w//2],
        frame[h//2:h, w//2:w]
    ]


def send_to_esp(states):
    try:
        url = f"{ESP_IP}/?Z1={int(states[0])}&Z2={int(states[1])}&Z3={int(states[2])}&Z4={int(states[3])}"
        requests.get(url, timeout=0.3)
    except:
        print("ESP not reachable")


class MqttPublisher:
    """
    Background thread-based MQTT publisher for occupancy data.
    Connects to HiveMQ Cloud over TLS on port 8883.
    Publishes zone state changes to home/{HOME_ID}/vision/{room_name}.
    """

    def __init__(
        self,
        broker_host: str,
        broker_port: int,
        username: str,
        password: str,
        home_id: str,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.username = username
        self.password = password
        self.home_id = home_id

        # Queue for non-blocking publish calls
        self.publish_queue = queue.Queue()
        self.running = False
        self.client = None
        self.thread = None

    def start(self) -> None:
        """Start MQTT publisher background thread."""
        self.running = True
        self.client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
        self.client.username_pw_set(self.username, self.password)
        self.client.tls_set(tls_version=mqtt_client.ssl.PROTOCOL_TLSv1_2)
        self.client.tls_insecure = False

        # Callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()  # Non-blocking network loop
            print(f"✓ MQTT connected to {self.broker_host}:{self.broker_port}")

            # Start queue processor thread
            self.thread = threading.Thread(target=self._process_queue, daemon=True)
            self.thread.start()
        except Exception as e:
            print(f"✗ MQTT connection failed: {e}")
            self.running = False

    def _on_connect(self, client, userdata, flags, rc, properties=None):  # noqa: ARG001
        """MQTT on_connect callback."""
        if rc == 0:
            print("✓ MQTT broker connected")
        else:
            print(f"✗ MQTT connection failed with code {rc}")

    def _on_disconnect(self, client, userdata, rc, properties=None):  # noqa: ARG001
        """MQTT on_disconnect callback."""
        if rc != 0:
            print(f"✗ MQTT disconnected with code {rc}")

    def publish_zone_state(
        self, room_name: str, person_detected: bool, confidence: float
    ) -> None:
        """
        Queue room state for non-blocking publishing.
        """
        if not self.running:
            return

        payload = {
            "person_detected": person_detected,
            "confidence": confidence,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        self.publish_queue.put((room_name, payload))

    def _process_queue(self) -> None:
        """Process queued publish requests in background thread."""
        while self.running:
            try:
                room_name, payload = self.publish_queue.get(timeout=1)
                topic = f"home/{self.home_id}/vision/{room_name}"
                self.client.publish(topic, json.dumps(payload), qos=1)
            except queue.Empty:
                pass
            except Exception as e:
                print(f"✗ MQTT publish error: {e}")

    def stop(self) -> None:
        """Stop MQTT publisher and cleanup."""
        self.running = False
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
        if self.thread:
            self.thread.join(timeout=2)
        print("✓ MQTT publisher stopped")





def main():
    cap = cv2.VideoCapture(CAMERA_INDEX)

    detector = HybridDetector()
    debouncers = [Debounce() for _ in range(4)]

    # Initialize MQTT publisher
    mqtt_pub = MqttPublisher(
        broker_host=MQTT_BROKER_HOST,
        broker_port=MQTT_BROKER_PORT,
        username=MQTT_USERNAME,
        password=MQTT_PASSWORD,
        home_id=HOME_ID,
    )
    mqtt_pub.start()

    prev_states = [0, 0, 0, 0]
    zone_names = ["zone1", "zone2", "zone3", "zone4"]
    # Map zones to rooms for occupancy fusion while still exposing all 4 zones visually
    zone_to_room = {
        "zone1": "bedroom",
        "zone2": "living",
        "zone3": "kitchen",
        "zone4": "bedroom",
    }

    print("🚀 System Running...")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                continue

            zones = split_zones(frame)
            zone_states = []

            for i, z in enumerate(zones):
                detected, faces = detector.detect(z)
                state = debouncers[i].update(detected)
                zone_states.append(1 if state else 0)

            # Only act on state changes
            if zone_states != prev_states:
                print("Sending:", zone_states)
                send_to_esp(zone_states)

                # Publish MQTT for changed zones and preserve existing room-based occupancy
                for i, (curr_state, prev_state) in enumerate(zip(zone_states, prev_states)):
                    if curr_state != prev_state:
                        person_detected = bool(curr_state)
                        confidence = 1.0 if curr_state else 0.0
                        zone_name = zone_names[i]
                        mqtt_pub.publish_zone_state(zone_name, person_detected, confidence)

                        room_name = zone_to_room.get(zone_name)
                        if room_name and room_name != zone_name:
                            mqtt_pub.publish_zone_state(room_name, person_detected, confidence)

                prev_states = zone_states.copy()

            # DRAW GRID
            h, w = frame.shape[:2]
            cv2.line(frame, (w//2, 0), (w//2, h), (255,255,255), 2)
            cv2.line(frame, (0, h//2), (w, h//2), (255,255,255), 2)

            labels = ["Z1", "Z2", "Z3", "Z4"]
            positions = [
                (10, 30),
                (w//2 + 10, 30),
                (10, h//2 + 30),
                (w//2 + 10, h//2 + 30)
            ]

            for i in range(4):
                text = f"{labels[i]}: {'OCC' if zone_states[i] else 'VAC'}"
                color = (0,255,0) if zone_states[i] else (0,0,255)

                cv2.putText(frame, text, positions[i],
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            cv2.imshow("4-Zone ESP Control", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        print("⚠ Interrupted by user")
    finally:
        mqtt_pub.stop()
        cap.release()
        cv2.destroyAllWindows()
        print("🛑 System stopped")



def handle_exit(signum, frame):  # noqa: ARG001
    """Handle graceful shutdown on SIGINT."""
    print("\nShutting down Grayskull.")
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_exit)
    main()
