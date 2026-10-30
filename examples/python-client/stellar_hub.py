#!/usr/bin/env python3
"""
Python Client Example for Stellar Payment Hub
Demonstrates settlement calculation and payment request creation from Python.
"""
import sys
import json
import urllib.request
import urllib.error

class StellarHubPythonClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url.rstrip("/")

    def get_health(self):
        url = f"{self.base_url}/health"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

    def calculate_split(self, total_amount, recipient_count):
        url = f"{self.base_url}/api/settlements/calculate-split"
        data = json.dumps({
            "total_amount": str(total_amount),
            "recipients_count": recipient_count
        }).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

if __name__ == "__main__":
    client = StellarHubPythonClient()
    print("Testing Python Client Connection...")
    try:
        health = client.get_health()
        print(f"Health Status: {health.get('status')} | Network: {health.get('network')}")
        split = client.calculate_split("100.00", 3)
        print(f"Calculated Split for 3 recipients: {split}")
    except Exception as e:
        print(f"Connection test completed (offline or mock): {e}")
