export type Player = 'player1' | 'player2';

export interface Piece {
  player: Player;
  isKing: boolean;
  id: string; // unique identifier for animations/keys
}

export type BoardState = (Piece | null)[][];

export interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isJump: boolean;
  jumpedRow?: number;
  jumpedCol?: number;
}
