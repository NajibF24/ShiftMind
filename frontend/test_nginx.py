import requests
import json
import time

url = "http://shiftmind-nginx-1:80/api/ask"
headers = {"Content-Type": "application/json"}
data = {"query": "Apa visi GYS?"}

print("Sending request to Nginx proxy...")
start_time = time.time()
try:
    response = requests.post(url, json=data, headers=headers, timeout=120)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Time taken: {time.time() - start_time:.2f}s")
except Exception as e:
    print(f"Error: {e}")
