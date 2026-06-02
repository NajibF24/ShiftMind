import os
import sys

# Mock env vars for testing
os.environ["NINEROUTER_BASE_URL"] = "http://localhost:20128/v1"
os.environ["NINEROUTER_API_KEY"] = "sk-e29acc7f268d50a8-9nmw4b-dfa25ba1"
os.environ["NINEROUTER_MODEL"] = "oc/deepseek-v4-flash-free"

sys.path.insert(0, r"c:\Users\najib.fauzan\OneDrive - PT Garuda Yamato Steel\Document\AI\ShiftMind\backend")

from services.ai_service import get_chat_completion

messages = [{"role": "user", "content": "Halo, tes koneksi 123"}]
print("Calling get_chat_completion...")
answer = get_chat_completion(messages)
print("--- ANSWER ---")
print(repr(answer))
