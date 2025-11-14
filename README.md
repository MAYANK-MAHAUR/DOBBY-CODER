# 🧦 DobbyCoder

Turn your ideas into apps with AI-powered code generation using the Dobby Unhinged model.

## ✨ Features

- 🤖 Powered by **Dobby Unhinged** (Llama 3.3 70B) via Fireworks AI
- ⚛️ Support for **React**, **Vue**, and **Static HTML**
- 🎨 Built-in **Tailwind CSS** styling
- ⚡ Real-time code generation and preview
- 🔄 Iterative refinement - modify your app with follow-up prompts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Fireworks AI API key ([Get one here](https://fireworks.ai/))

### Installation

1. Clone the repository:
```bash
git clone [https://github.com/yourusername/dobbycoder.git](https://github.com/MAYANK-MAHAUR/DOBBY-CODER)
cd DOBBY-CODER
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
FIREWORKS_API_KEY=your_api_key_here
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
NEXT_PUBLIC_MODEL_NAME=accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

1. Enter a description of the app you want to build (e.g., "Build me a calculator app")
2. Select your preferred framework (React, Vue, or Static HTML)
3. Click the arrow to generate your app
4. Make iterative changes by entering follow-up prompts
5. Preview your app in real-time using the built-in editor

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **AI Model**: Dobby Unhinged (Llama 3.3 70B) via Fireworks AI
- **Styling**: Tailwind CSS
- **Code Editor**: Sandpack by CodeSandbox
- **Animations**: Framer Motion

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with [Fireworks AI](https://fireworks.ai/)
- Powered by the Dobby Unhinged model (SENTIENT)
