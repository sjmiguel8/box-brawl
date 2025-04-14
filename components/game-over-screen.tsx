"use client"

type GameOverScreenProps = {
  winner: number | null
  onRestart: () => void
}

export default function GameOverScreen({ winner, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-6">{winner ? `Player ${winner} wins!` : "It's a draw!"}</p>
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
        >
          Play Again
        </button>
        <p className="mt-4 text-sm text-gray-500">Press 'R' to restart</p>
      </div>
    </div>
  )
}
