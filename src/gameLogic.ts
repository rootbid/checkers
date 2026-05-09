import type { BoardState, Player, Move } from './types';

export function createInitialBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
  let idCounter = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          board[row][col] = { player: 'player2', isKing: false, id: `p2-${idCounter++}` };
        } else if (row > 4) {
          board[row][col] = { player: 'player1', isKing: false, id: `p1-${idCounter++}` };
        }
      }
    }
  }
  return board;
}

export function calculateValidMoves(row: number, col: number, player: Player, b: BoardState): Move[] {
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
        // Jump over
        const nnr = nr + dr;
        const nnc = nc + dc;
        if (nnr >= 0 && nnr < 8 && nnc >= 0 && nnc < 8 && !b[nnr][nnc]) {
          moves.push({ fromRow: row, fromCol: col, toRow: nnr, toCol: nnc, isJump: true, jumpedRow: nr, jumpedCol: nc });
        }
      }
    }
  });

  return moves;
}

export function checkWinner(b: BoardState, nextTurn: Player): Player | null {
  let p1Count = 0;
  let p2Count = 0;
  let nextPlayerHasMoves = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = b[r][c];
      if (piece) {
        if (piece.player === 'player1') p1Count++;
        if (piece.player === 'player2') p2Count++;
        if (piece.player === nextTurn && !nextPlayerHasMoves) {
          const moves = calculateValidMoves(r, c, nextTurn, b);
          if (moves.length > 0) nextPlayerHasMoves = true;
        }
      }
    }
  }

  if (p1Count === 0) return 'player2';
  if (p2Count === 0) return 'player1';
  if (!nextPlayerHasMoves) return nextTurn === 'player1' ? 'player2' : 'player1';
  
  return null;
}
