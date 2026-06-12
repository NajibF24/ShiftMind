import os
import numpy as np
from openai import OpenAI

# Connect to 9Router locally
NINEROUTER_BASE_URL = os.getenv("NINEROUTER_BASE_URL", "http://host.docker.internal:20128/v1")
NINEROUTER_API_KEY = os.getenv("NINEROUTER_API_KEY", "sk-local-dev")
NINEROUTER_MODEL = os.getenv("NINEROUTER_MODEL", "openai/gpt-4o-mini")
FALLBACK_MODELS = os.getenv("FALLBACK_MODELS", "ag/gemini-3.1-pro-high,bb/gpt-4o-mini,bb/claude-sonnet-4.6").split(",")

client = OpenAI(
    base_url=NINEROUTER_BASE_URL,
    api_key=NINEROUTER_API_KEY,
)

# Initialize local embedding model
# FastEmbed uses local ONNX models without PyTorch, avoiding 9Router/OpenAI embedding limits
try:
    from fastembed import TextEmbedding
    embedding_model = TextEmbedding()
except ImportError:
    print("Warning: fastembed is not installed. Embeddings will be mocked.")
    embedding_model = None

def generate_embedding(text: str) -> list[float]:
    """Generate vector embedding using fastembed locally, padded to 1536 dims."""
    if embedding_model:
        try:
            # fastembed returns an iterator of numpy arrays
            vectors = list(embedding_model.embed([text]))[0]
            # Pad 384 dim to 1536 dim to match pgvector schema
            padded = np.zeros(1536)
            padded[:len(vectors)] = vectors
            return padded.tolist()
        except Exception as e:
            print(f"Error generating local embedding: {e}")
            return [0.0] * 1536
    else:
        return [0.0] * 1536

def get_chat_completion(messages: list[dict], model: str = None) -> str:
    """Get chat completion from 9Router with automatic fallback for limits/errors."""
    # Fetch available models dynamically
    try:
        available_models = [m.id for m in client.models.list().data]
    except Exception as e:
        print(f"Failed to fetch models from 9Router: {e}")
        available_models = FALLBACK_MODELS

    # If the user requested a specific model (or default NINEROUTER_MODEL)
    target_model = model if model else NINEROUTER_MODEL
    
    # Prioritize the target model, then fallback to others
    models_to_try = [target_model] + [m for m in available_models if m != target_model]
        
    last_error = None
    for attempt_model in models_to_try:
        try:
            print(f"Attempting to generate response using 9Router model: {attempt_model}")
            response = client.chat.completions.create(
                model=attempt_model,
                messages=messages,
                temperature=0.3,  # Low temperature for focused, accurate answers
            )
            print(f"Success with model: {attempt_model}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Model {attempt_model} failed: {e}. Trying next model...")
            last_error = str(e)
            continue
            
    print(f"All models failed. Last error: {last_error}")
    return "Maaf, sistem AI sedang mengalami limit rate atau tidak tersedia pada semua model. Mohon coba beberapa saat lagi."

