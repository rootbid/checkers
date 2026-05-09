import { RotateCcw, PlayCircle, Trophy, Loader2, Users, Copy, Check } from 'lucide-react';
import { useCheckers } from '../hooks/useCheckers';
import { useState } from 'react';

export default function Game() {
  const { board, currentTurn, selectedPiece, validMoves, winner, status, playerRole, handleSquareClick, resetGame } = useCheckers();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'waiting') {
    return (
      <div className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-[150%] aspect-square rounded-full border border-primary animate-ping duration-[3s]"></div>
          </div>
          <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm z-10 relative">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-2 z-10 relative">Waiting for Opponent</h2>
          <p className="text-on-surface-variant font-body mb-6 z-10 relative">Share the link with a friend, another player will join shortly.</p>
          
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/50 p-2 rounded-xl mb-8 z-10 relative">
            <input 
              type="text" 
              readOnly 
              value={window.location.href} 
              className="bg-transparent border-none outline-none text-on-surface-variant w-full text-sm px-2 truncate"
            />
            <button 
              onClick={handleCopyLink}
              className="bg-primary text-on-primary p-2 rounded-lg hover:bg-surface-tint transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Copy link"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 text-primary font-bold z-10 relative">
            <Loader2 size={24} className="animate-spin" />
            Searching...
          </div>
        </div>
      </div>
    );
  }

  const isPlayer1 = playerRole === 'player1';

  return (
    <div className="flex-grow container mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="flex-grow flex flex-col items-center max-w-[600px] mx-auto w-full gap-8">
        
        {/* Opponent Area (Top) */}
        <div className={`w-full flex justify-between items-center p-4 rounded-xl border transition-colors ${currentTurn !== playerRole && !winner ? 'bg-surface-container border-primary shadow-sm' : 'bg-surface-container-lowest border-transparent opacity-60'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex justify-center items-center font-bold ${isPlayer1 ? 'bg-on-background border-2 border-on-secondary-fixed text-surface' : 'bg-surface-variant border-2 border-outline-variant text-on-surface'}`}>
              {isPlayer1 ? 'P2' : 'P1'}
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">Opponent</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {currentTurn !== playerRole && !winner && (
               <div className="bg-primary text-on-primary px-4 py-1 rounded-full font-label text-sm font-bold flex items-center gap-2">
                 <PlayCircle size={18} /> Turn
               </div>
            )}
            {winner && winner !== playerRole && (
              <div className="text-primary font-bold flex items-center gap-1"><Trophy size={18} /> Winner</div>
            )}
          </div>
        </div>

        {/* The Board */}
        <div className={`w-full aspect-square rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(46,50,48,0.06)] border-[8px] border-primary grid grid-cols-8 grid-rows-8 ${!isPlayer1 ? 'rotate-180' : ''}`}>
          {board.map((row, rowIndex) => (
            row.map((piece, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1;
              const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
              const isValideMove = validMoves.some(m => m.toRow === rowIndex && m.toCol === colIndex);

              return (
                <div 
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`
                    flex items-center justify-center 
                    ${isDark ? 'bg-tertiary cursor-pointer' : 'bg-surface-container-low'}
                    ${isSelected ? 'brightness-125 ring-2 ring-inset ring-primary-fixed' : ''}
                    ${isValideMove ? 'brightness-125 cursor-pointer relative' : ''}
                    ${!isPlayer1 ? 'rotate-180' : ''}
                  `}
                >
                  {/* Valid move indicator */}
                  {isValideMove && (
                      <div className="absolute w-1/3 h-1/3 bg-primary/40 rounded-full animate-pulse z-10 pointer-events-none"></div>
                  )}

                  {/* Piece */}
                  {piece && (
                    <div 
                      className={`
                        w-[70%] h-[70%] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_8px_rgba(0,0,0,0.2)]
                        relative transition-transform duration-200 z-20 ${currentTurn === playerRole && piece.player === playerRole && !winner ? 'hover:scale-105 cursor-pointer' : ''}
                        ${piece.player === 'player1' ? 'bg-surface-variant border-2 border-outline-variant' : 'bg-on-background border-2 border-on-secondary-fixed'}
                      `}
                    >
                       <div className="absolute top-[15%] left-[15%] right-[15%] bottom-[15%] rounded-full border-2 border-black/15 pointer-events-none"></div>
                       {piece.isKing && (
                           <div className={`absolute inset-0 flex items-center justify-center text-3xl leading-none font-headline font-bold pointer-events-none ${piece.player === 'player1' ? 'text-primary' : 'text-surface-variant'}`}>
                               K
                           </div>
                       )}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {/* You Area (Bottom) */}
        <div className={`w-full flex justify-between items-center p-4 rounded-xl border transition-colors ${currentTurn === playerRole && !winner ? 'bg-surface-container border-primary shadow-sm' : 'bg-surface-container-lowest border-transparent opacity-60'}`}>
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-full flex justify-center items-center font-bold ${isPlayer1 ? 'bg-surface-variant border-2 border-outline-variant text-on-surface' : 'bg-on-background border-2 border-on-secondary-fixed text-surface'}`}>
              You
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">You ({playerRole === 'player1' ? 'P1' : 'P2'})</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
             {currentTurn === playerRole && !winner && (
                <div className="bg-primary text-on-primary px-4 py-1 rounded-full font-label text-sm font-bold flex items-center gap-2">
                    <PlayCircle size={18} /> Your Turn
                </div>
             )}
             {winner === playerRole && (
              <div className="text-primary font-bold flex items-center gap-1"><Trophy size={18} /> Winner</div>
            )}
          </div>
        </div>

        {winner && (
          <div className="text-center mt-4">
             <h2 className="text-2xl font-headline font-bold text-primary mb-4">
               {winner === playerRole ? 'You Win!' : 'Opponent Wins!'}
             </h2>
             <button 
              onClick={resetGame}
              className="px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-surface-tint transition-colors flex items-center gap-2 cursor-pointer shadow-sm mx-auto"
            >
              <RotateCcw size={20} />
              Play Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
