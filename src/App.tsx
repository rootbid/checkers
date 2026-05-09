/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Game from './components/Game';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col w-full relative">
      <header className="bg-surface shadow-sm sticky top-0 z-40 border-b border-outline-variant/30">
        <div className="container mx-auto flex justify-center items-center px-6 py-4 w-full">
          <div className="text-3xl font-headline font-bold text-primary">
            Checkers
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-6 relative overflow-hidden">
        <Game />
      </main>
    </div>
  );
}

