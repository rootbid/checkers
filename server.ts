import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { createInitialBoard, checkWinner } from "./src/gameLogic.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  // Simple in-memory state
  const games = new Map<string, any>();
  const clientToGame = new Map<string, string>();

  io.on("connection", (socket) => {
    socket.on("join_match", () => {
      // Find a waiting game or create a new one
      let gameId = null;
      for (const [id, game] of games.entries()) {
        if (game.status === 'waiting') {
          gameId = id;
          break;
        }
      }

      if (gameId) {
        const game = games.get(gameId);
        game.player2 = socket.id;
        game.status = 'playing';
        socket.join(gameId);
        clientToGame.set(socket.id, gameId);
        
        io.to(gameId).emit("game_start", {
          board: game.board,
          currentTurn: game.currentTurn,
          player1: game.player1,
          player2: game.player2
        });
      } else {
        gameId = Math.random().toString(36).substring(2, 8);
        const newGame = {
          id: gameId,
          player1: socket.id,
          player2: null,
          status: 'waiting',
          board: createInitialBoard(),
          currentTurn: 'player1',
          winner: null
        };
        games.set(gameId, newGame);
        socket.join(gameId);
        clientToGame.set(socket.id, gameId);
        
        socket.emit("waiting_for_opponent", { gameId });
      }
    });

    socket.on("make_move", ({ move }) => {
      const gameId = clientToGame.get(socket.id);
      if (!gameId) return;
      
      const game = games.get(gameId);
      if (!game || game.status !== 'playing') return;

      const playerRole = game.player1 === socket.id ? 'player1' : 'player2';
      if (game.currentTurn !== playerRole) return;

      // Apply move logic (trusting client's valid move for simplicity in this demo,
      // but proper app would re-validate with calculateValidMoves)
      const movingPiece = game.board[move.fromRow][move.fromCol];
      
      game.board[move.fromRow][move.fromCol] = null;
      game.board[move.toRow][move.toCol] = movingPiece;

      if (movingPiece.player === 'player1' && move.toRow === 0) movingPiece.isKing = true;
      if (movingPiece.player === 'player2' && move.toRow === 7) movingPiece.isKing = true;

      if (move.isJump && move.jumpedRow !== undefined && move.jumpedCol !== undefined) {
        game.board[move.jumpedRow][move.jumpedCol] = null;
      }

      const nextTurn = game.currentTurn === 'player1' ? 'player2' : 'player1';
      game.currentTurn = nextTurn;
      
      game.winner = checkWinner(game.board, nextTurn);
      if (game.winner) {
        game.status = 'finished';
      }

      io.to(gameId).emit("state_update", {
        board: game.board,
        currentTurn: game.currentTurn,
        winner: game.winner
      });
    });

    socket.on("rematch", () => {
      const gameId = clientToGame.get(socket.id);
      if (!gameId) return;
      const game = games.get(gameId);
      if (!game) return;

      // Ensure both players want a rematch (simplified here)
      game.board = createInitialBoard();
      game.currentTurn = 'player1';
      game.winner = null;
      game.status = 'playing';

      io.to(gameId).emit("game_start", {
        board: game.board,
        currentTurn: game.currentTurn,
        player1: game.player1,
        player2: game.player2
      });
    });

    socket.on("disconnect", () => {
      const gameId = clientToGame.get(socket.id);
      if (gameId) {
        const game = games.get(gameId);
        if (game) {
          game.status = 'finished';
          game.winner = game.player1 === socket.id ? 'player2' : 'player1';
          io.to(gameId).emit("opponent_disconnected", { winner: game.winner });
          games.delete(gameId);
        }
        clientToGame.delete(socket.id);
      }
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
