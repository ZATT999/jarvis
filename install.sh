#!/usr/bin/env bash
set -e

echo "╔═══════════════════════════════════╗"
echo "║   Instalador de Jarvis IA         ║"
echo "╚═══════════════════════════════════╝"

# Detectar OS
OS=$(uname -s)

# Verificar Node
if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js no encontrado. Instalá Node.js 20+ desde https://nodejs.org"
  exit 1
fi

NODE_VER=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VER" -lt 20 ]; then
  echo "[WARN] Node.js $NODE_VER detectado. Se recomienda Node.js 20+"
fi

# Python para STT/TTS
if command -v python3 &>/dev/null; then
  echo "[OK] Python3 detectado"
  pip3 install --quiet SpeechRecognition pyaudio pyttsx3 2>/dev/null || true
else
  echo "[WARN] Python3 no encontrado — STT/TTS por voz limitado"
fi

# edge-tts (opcional, mejor TTS)
pip3 install --quiet edge-tts 2>/dev/null || true

# Linux: instalar portaudio y espeak
if [ "$OS" = "Linux" ]; then
  if command -v pacman &>/dev/null; then
    sudo pacman -S --noconfirm portaudio espeak-ng mpg123 2>/dev/null || true
  elif command -v apt &>/dev/null; then
    sudo apt-get install -y portaudio19-dev espeak-ng mpg123 2>/dev/null || true
  fi
fi

# macOS: instalar dependencias
if [ "$OS" = "Darwin" ]; then
  if command -v brew &>/dev/null; then
    brew install portaudio 2>/dev/null || true
  fi
fi

# Instalar dependencias de Node
echo "[*] Instalando dependencias de Node.js..."
npm install

# Crear directorios
mkdir -p data logs config

# Copiar .env si no existe
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] .env creado — editá tus API keys en .env"
fi

# Copiar config de usuario si no existe
if [ ! -f config/config.yaml ]; then
  cp config/default.yaml config/config.yaml
  echo "[OK] config/config.yaml creado — editá según tus preferencias"
fi

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   Instalación completada                      ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║   Modo GUI:   npm start                       ║"
echo "║   Modo CLI:   npm run cli                     ║"
echo "║   Con Ollama: ollama pull llama3.2:3b          ║"
echo "╚═══════════════════════════════════════════════╝"
