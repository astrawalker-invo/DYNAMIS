#!/usr/bin/env bash
set -euo pipefail

if ! command -v influx >/dev/null 2>&1; then
  echo "ERROR: influx CLI not found. Install InfluxDB CLI and authenticate."
  exit 1
fi

influx bucket create --name energy --retention 8760h 2>/dev/null || true
echo "SUCCESS: bucket 'energy' ensured (retention 365d)"

influx bucket create --name demo_energy --retention 2h 2>/dev/null || true
echo "SUCCESS: bucket 'demo_energy' ensured (retention 2h)"
