# Local AI and model files

## Model files on this machine

Your downloaded models live under **`D:/models`** (top-level folders such as `LLM-Models-2025`, `image gen models`, `video gen models`, `upscalers`, etc.). The web app does **not** read those paths directly; it talks to a **local inference server** that loads a model you choose in that server (Ollama, LM Studio, llama.cpp, etc.).

## Recommended setup (fastest path)

1. Install [Ollama](https://ollama.com/) (or use LM Studio with an OpenAI-compatible server on `127.0.0.1`).
2. Pull or point the server at a model that fits your **RAM/VRAM** (see machine profile below).
3. In the project root, create `.env.local`:

```env
VITE_LOCAL_AI_URL=http://127.0.0.1:11434
VITE_LOCAL_AI_MODEL=llama3.2
```

Adjust `VITE_LOCAL_AI_MODEL` to the tag shown by `ollama list`.

4. Restart `npm run dev`. Story Builder will show **Local AI** in the toolbar when the URL is set.

## API shape

The client uses **OpenAI-compatible** `POST {VITE_LOCAL_AI_URL}/v1/chat/completions` (supported by current Ollama and many local runners).

## Machine profile

Run when you want to record this PC’s specs (pick models accordingly):

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/capture-machine-profile.ps1"
```

Output: `docs/MACHINE_PROFILE.generated.md` (gitignored if you prefer not to commit).

## Troubleshooting

- **CORS**: Ollama allows browser requests from localhost by default. If you use another host, enable CORS or run the app same-origin via a dev proxy.
- **Nothing happens**: Confirm Ollama is listening (`curl http://127.0.0.1:11434/api/tags`).
