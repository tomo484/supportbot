# Customer Support Agent - Web Application

AI-powered customer support chatbot for Swiss Airlines with a modern web interface.

## 🏗️ Project Architecture

```
customersupport/
├── backend/          # FastAPI + WebSocket Server
│   ├── main.py      # WebSocket endpoint
│   ├── chatbot.py   # LangGraph agent logic
│   ├── db.py        # Database utilities
│   └── tool/        # Agent tools (flights, hotels, etc.)
│
└── frontend/         # Next.js + TypeScript + TailwindCSS
    └── src/
        ├── app/          # Pages
        ├── components/   # UI components
        ├── hooks/        # WebSocket hook
        └── types/        # TypeScript types
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- pnpm

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../.env.example ../.env
# Edit .env with your API keys (OpenAI, Tavily, etc.)

# Run the server
python main.py
```

The backend will start on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

The frontend will start on `http://localhost:3000`

## 📋 Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TAVILY_API_KEY=your_tavily_api_key
```

## 🎨 Features

### ✅ Implemented (Phase 1 & 2)

- **Backend (FastAPI + WebSocket)**
  - Real-time bidirectional communication
  - Session management
  - Sensitive tool approval flow
  - Error handling and reconnection
  
- **Frontend (Next.js + React)**
  - ChatGPT-like UI
  - Real-time messaging
  - Approval dialog for sensitive operations
  - Connection status indicator
  - Auto-scroll and typing indicator
  - Responsive design

### 🔧 Agent Capabilities

The AI agent can help with:
- ✈️ Flight search and booking
- 🏨 Hotel reservations
- 🚗 Car rental bookings
- 🎫 Excursion recommendations
- 📋 Company policy lookups
- 🔄 Modify/cancel existing reservations

**Sensitive Operations** (require user approval):
- Updating flight tickets
- Canceling bookings
- Making new reservations

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern async web framework
- **WebSocket**: Real-time communication
- **LangGraph**: Agent orchestration
- **LangChain**: LLM integration
- **OpenAI GPT-4**: Language model
- **SQLite**: Database

### Frontend
- **Next.js 14**: React framework (App Router)
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **WebSocket API**: Real-time communication

## 📝 Development Notes

### Design Principles

1. **Minimal Code**: Reuse existing `chatbot.py` logic
2. **No Redundancy**: Single source of truth for agent logic
3. **Simple Architecture**: Direct WebSocket communication
4. **Clean Separation**: Backend/Frontend clearly separated

### Project Structure

- **Backend**: All agent logic, tools, and database operations
- **Frontend**: Pure UI layer, no business logic
- **Communication**: WebSocket with JSON messages

## 🧪 Testing (Phase 3)

See `Todo.md` for the testing plan.

## 📄 License

MIT

## 🤝 Contributing

This is a tutorial project. Feel free to fork and modify!

---

**Note**: This project is based on LangGraph tutorials and adapted for a web interface.
