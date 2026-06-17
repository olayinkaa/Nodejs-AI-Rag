# Nodejs AI Retrieval Augmented Generational

# Tech Stack
- Nodejs
- Express Js
- Typescript
- Langchain
- Chroma DB
- Pinecone
- Docker

## ⚙️ Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/get-started/)

# ⚙️ Installation & Setup
- Clone the Repository
```sh
git clone https://github.com/olayinkaa/Nodejs-AI-Rag.git
cd Nodejs-AI-Rag
```

- Install Dependencies
```sh
pnpm install
```

- Environment Variables <br/>
Create a `.env` file in the root directory:
```sh
PINECONE_API_KEY=""
PINECONE_INDEX="";
OPENAI_API_KEY=
```

- Run the docker compose command to start/stop
```sh
# start
docker compose -f chroma-compose.yml up -d
# stop
docker compose -f chroma-compose.yml down
```

- Run Development Server
```sh
pnpm run dev
```

- Application will run on:
<http://localhost:3000>

- Chroma DB will run on:
<http://localhost:8001>
connection string is `http://server:8000`