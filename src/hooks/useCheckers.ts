import { useState, useCallback, useEffect } from 'react';
import { BoardState, Player, Move, Piece } from '../types';
import { io, Socket } from 'socket.io-client';

export function useCheckers() {
  const [board, setBoard] = useState<BoardState>(Array(8).fill(null).map(() => Array(8).fill(null)));
  const [currentTurn, setCurrentTurn] = useState<Player>('player1');
  const [selectedPiece, setSelectedPiece] = useState<{row: number, col: number} | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [status, setStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("waiting_for_opponent", (data) => {
      setStatus('waiting');
      setGameId(data.gameId);
      setPlayerRole('player1');
    });

    newSocket.on("game_start", (data) => {
      setStatus('playing');
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      setWinner(null);
      // Wait, we need to know who we are if we joined late
      if (!playerRole) {
         if (data.player1 === newSocket.id) setPlayerRole('player1');
         else if (data.player2 === newSocket.id) setPlayerRole('player2');
      }
    });

    newSocket.on("state_update", (data) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      setWinner(data.winner);
      if (data.winner) {
        setStatus('finished');
      }
    });

    newSocket.on("opponent_disconnected", (data) => {
      setStatus('finished');
      setWinner(data.winner);
    });

    newSocket.emit("join_match");

    return () => {
      newSocket.close();
    };
  }, []); // Only run once on mount

  const calculateValidMoves = useCallback((row: number, col: number, player: Player, b: BoardState) => {
    const piece = b[row][col];
    if (!piece || piece.player !== player) return [];

    const moves: Move[] = [];
    const directions = piece.isKing 
      ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] 
      : (player === 'player1' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

    directions.forEach(([dr, dc]) => {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (!b[nr][nc]) {
          moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc, isJump: false });
        } else if (b[nr][nc]?.player !== player) {
          const nnr = nr + dr;
          const nnc = nc + dc;
          if (nnr >= 0 && nnr < 8 && nnc >= 0 && nnc < 8 && !b[nnr][nnc]) {
            moves.push({ fromRow: row, fromCol: col, toRow: nnr, toCol: nnc, isJump: true, jumpedRow: nr, jumpedCol: nc });
          }
        }
      }
    });

    return moves;
  }, []);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (status !== 'playing' || winner) return;
    if (playerRole !== currentTurn) return; // Not our turn!

    const piece = board[row][col];
    
    // Select piece
    if (piece && piece.player === currentTurn) {
        setSelectedPiece({row, col});
        setValidMoves(calculateValidMoves(row, col, currentTurn, board));
        return;
    }

    // Move piece
    if (selectedPiece && !piece) {
        const move = validMoves.find(m => m.toRow === row && m.toCol === col);
        if (move) {
            // Optimistic selection clear
            setSelectedPiece(null);
            setValidMoves([]);
            socket?.emit("make_move", { move });
        }
    }
  }, [board, currentTurn, selectedPiece, validMoves, calculateValidMoves, winner, status, playerRole, socket]);

  const resetGame = () => {
    socket?.emit("rematch");
  };

  return { board, currentTurn, selectedPiece, validMoves, winner, status, playerRole, gameId, handleSquareClick, resetGame };
}
