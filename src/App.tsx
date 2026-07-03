import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { 
  Trophy, TrendingUp, RotateCcw, Brain, Volume2, VolumeX, Sparkles, 
  Clock, ChevronRight, User, Cpu, HelpCircle, Activity, CheckCircle, 
  RefreshCw, Play, Flame, Award, Lightbulb, BarChart2, Shield, Info
} from 'lucide-react';

// ==========================================
// 1. PREMIUM SOUND SYSTEM (Web Audio Synth)
// ==========================================
class SoundSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction due to browser policies
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playMove() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playCapture() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator(); // Simulating snap with dual frequency
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);
    
    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(800, this.ctx.currentTime);
    noise.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + 0.15);
    noise.stop(this.ctx.currentTime + 0.05);
  }

  playCheck() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // A tense double-tone check sound
    const now = this.ctx.currentTime;
    [520, 660].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.15);
    });
  }

  playGameOver(isVictory: boolean) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = isVictory ? [261.63, 329.63, 392.00, 523.25] : [220.00, 196.00, 174.61, 146.83]; // C Maj chord vs descending sad notes
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(0.12, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.45);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
  }
}

const soundManager = new SoundSynth();

// ==========================================
// 2. PIECE-SQUARE POSITIONAL TABLES FOR AI
// ==========================================
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLE_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// In endgame, kings want to centralize to support pawns
const KING_END_PST = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

// Flip positional tables for black pieces
function getPSTValue(pieceType: string, isWhite: boolean, r: number, c: number, isEndgame: boolean = false): number {
  const row = isWhite ? 7 - r : r; // Black table orientation is index-normal, white flips
  const col = c;

  switch (pieceType.toLowerCase()) {
    case 'p': return PAWN_PST[row][col];
    case 'n': return KNIGHT_PST[row][col];
    case 'b': return BISHOP_PST[row][col];
    case 'r': return ROOK_PST[row][col];
    case 'q': return QUEEN_PST[row][col];
    case 'k': return isEndgame ? KING_END_PST[row][col] : KING_MIDDLE_PST[row][col];
    default: return 0;
  }
}

// ==========================================
// 3. STATS & ANALYTICS MODEL TYPES
// ==========================================
interface GameMetrics {
  accuracy: number;
  blunders: number;
  tacticalAwareness: number; // 0 to 100
  timePerMove: number; // in seconds
  movesCount: number;
}

interface ELOPoint {
  gameIndex: number;
  elo: number;
}

// ==========================================
// 4. SVG CHESS PIECE COMPONENT (Vector Minimalist Design)
// ==========================================
const ChessPiece: React.FC<{ type: string; color: string; className?: string }> = ({ type, color, className = "w-full h-full" }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? 'url(#white-gradient)' : 'url(#black-gradient)';
  const stroke = isWhite ? '#1e293b' : '#f8fafc';
  const strokeWidth = 1.5;

  // Render high-quality embedded vector SVGs
  switch (type.toLowerCase()) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <defs>
            <linearGradient id="white-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="black-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B0F19" />
            </linearGradient>
          </defs>
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.62-1.41 1.61-1.41 2.72 0 1.93 1.57 3.5 3.5 3.5h4c1.93 0 3.5-1.57 3.5-3.5 0-1.11-.58-2.1-1.41-2.72C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,21 16,20 C 18,19 20,20 20,20 C 20,20 17,22 15,25 C 13,28 13,31 14,33 C 15,35 18,36 20,36 C 22,36 24,35 26,33 C 28,31 29,26 29,22 C 29,18 27,12 22,10 z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5 25.5 A 0.5 0.5 0 1 1 9.5 25.5 z"
            transform="matrix(0.861785,0.507278,-0.507278,0.861785,32.4839,-5.3905)"
            fill={isWhite ? '#1e293b' : '#ffffff'}
          />
        </svg>
      );
    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M9 36c3.39 0 7.66-.69 11.77-2.3 4.11 1.61 8.38 2.3 11.77 2.3H9zm13.5-31c-3.5 0-7 7.5-7 13.5 0 2.21.9 4.3 2.41 5.9C16.81 25.3 16 27.06 16 29c0 2.21 1.79 4 4 4h5c2.21 0 4-1.79 4-4 0-1.94-.81-3.7-2.91-4.6 1.51-1.6 2.41-3.69 2.41-5.9 0-6-3.5-13.5-7-13.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22.5" cy="5" r="2" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M22.5 11v8M18.5 15h8" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );
    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M9 39h27v-3H9v3zm3-13v10h21V26H12zm1.5-16h18v6h-18v-6zm-3 3h3v3h-3V13zm7.5 0h3v3h-3v-3zm7.5 0h3v3h-3v-3zm7.5 0h3v3h-3v-3z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M9 37h27v-3H9v3zm3.5-22l3 17h14l3-17-7 10-4-12-4 12-7-10z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="12" r="1.5" fill={fill} stroke={stroke} />
          <circle cx="15.5" cy="25" r="1.5" fill={fill} stroke={stroke} />
          <circle cx="22.5" cy="10" r="1.5" fill={fill} stroke={stroke} />
          <circle cx="29.5" cy="25" r="1.5" fill={fill} stroke={stroke} />
          <circle cx="36" cy="12" r="1.5" fill={fill} stroke={stroke} />
        </svg>
      );
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M9 38h27v-3H9v3zm13.5-30V5m-3 1.5h6M9 32.5c3.04 0 7.23-1.63 11.23-4.37 4 2.74 8.19 4.37 11.23 4.37h-22.46zM22.5 10c-5.5 0-9 4-9 9.5 0 4.5 4.5 9.5 9 12 4.5-2.5 9-7.5 9-12 0-5.5-3.5-9.5-9-9.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
};

// ==========================================
// 5. HELPER FUNCTIONS: MOVE & SCORE EVAL
// ==========================================
function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  
  // Count material and check endgame phase
  let totalPieces = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) totalPieces++;
    }
  }
  const isEndgame = totalPieces <= 10;

  const weights: Record<string, number> = {
    p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = weights[piece.type];
      const sign = piece.color === 'w' ? 1 : -1;
      
      // Base Material
      score += val * sign;

      // Position (PST Value)
      const pstVal = getPSTValue(piece.type, piece.color === 'w', r, c, isEndgame);
      score += pstVal * sign * 0.5; // Scale positional adjustments slightly
    }
  }

  return score;
}

// Alpha-Beta Minimax search
function minimax(
  chess: Chess, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean
): [number, string | null] {
  if (depth === 0 || chess.isGameOver()) {
    return [evaluateBoard(chess), null];
  }

  const moves = chess.moves({ verbose: true });
  
  // Sort moves: Captures & checks first to improve alpha-beta pruning efficiency
  moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 10;
    if (b.captured) scoreB += 10;
    if (a.san.includes('+')) scoreA += 5;
    if (b.san.includes('+')) scoreB += 5;
    return scoreB - scoreA;
  });

  let bestMove: string | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move.lan);
      const [evaluation] = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move.lan;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Pruning
    }
    return [maxEval, bestMove];
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move.lan);
      const [evaluation] = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move.lan;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Pruning
    }
    return [minEval, bestMove];
  }
}

// Selects AI move based on ELO-based depth and blunder configurations
function computeAIMove(chess: Chess, aiElo: number): string | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // 1. Determine depth and blunder probability from ELO
  let depth = 2;
  let blunderRate = 0.15; // default 15%

  if (aiElo < 1000) {
    depth = 1;
    blunderRate = 0.35;
  } else if (aiElo >= 1000 && aiElo < 1300) {
    depth = 2;
    blunderRate = 0.20;
  } else if (aiElo >= 1300 && aiElo < 1600) {
    depth = 3;
    blunderRate = 0.08;
  } else if (aiElo >= 1600 && aiElo < 1900) {
    depth = 3;
    blunderRate = 0.0;
  } else {
    depth = 4; // High level
    blunderRate = 0.0;
  }

  // 2. Decide if the AI makes a blunder (plays random legal move or sub-optimal move)
  const isBlunder = Math.random() < blunderRate;
  if (isBlunder && moves.length > 1) {
    // Blunder: choose either a completely random move or the second-best move
    if (Math.random() < 0.5) {
      // Pick second best move if possible
      const scoredMoves: { move: string; score: number }[] = [];
      // Evaluate all moves with depth 1
      for (const m of moves) {
        chess.move(m.lan);
        const score = evaluateBoard(chess);
        chess.undo();
        scoredMoves.push({ move: m.lan, score });
      }
      // Sort by score ascending (since AI wants lowest score - it's black)
      scoredMoves.sort((a, b) => a.score - b.score);
      return scoredMoves[1]?.move || scoredMoves[0].move;
    } else {
      // Complete random blunder
      const randIndex = Math.floor(Math.random() * moves.length);
      return moves[randIndex].lan;
    }
  }

  // 3. Normal Search: AI plays Black (minimizing player)
  const [, bestMove] = minimax(chess, depth, -Infinity, Infinity, false);
  return bestMove;
}

// Accuracy Evaluation: Helper to rate a single move
function rateMoveAccuracy(chessBefore: Chess, playerMove: string): number {
  const chessCopy = new Chess(chessBefore.fen());
  const legalMoves = chessCopy.moves({ verbose: true });
  
  // Find the evaluation score after each potential move
  const scoredMoves: { lan: string; score: number }[] = [];
  for (const m of legalMoves) {
    chessCopy.move(m.lan);
    const score = evaluateBoard(chessCopy);
    chessCopy.undo();
    scoredMoves.push({ lan: m.lan, score });
  }

  // Since player is White (maximizing), sort highest score first
  scoredMoves.sort((a, b) => b.score - a.score);

  const bestMoveVal = scoredMoves[0]?.score ?? 0;
  
  // Find player move score
  chessCopy.move(playerMove);
  const playerMoveVal = evaluateBoard(chessCopy);
  chessCopy.undo();

  const diff = bestMoveVal - playerMoveVal; // How many points they lost

  if (diff <= 10) return 100; // Best move / Excellent
  if (diff <= 50) return 85;  // Good
  if (diff <= 150) return 60; // Inaccuracy
  if (diff <= 300) return 30; // Mistake
  return 10; // Blunder
}

// ==========================================
// 6. MAIN APP COMPONENT
// ==========================================
export default function App() {
  // Game state
  const [chess, setChess] = useState<Chess>(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  
  // Audio settings
  const [isMuted, setIsMuted] = useState(false);
  const [hintSquare, setHintSquare] = useState<string | null>(null);

  // ELO & Calibration Engine state (persisted in localStorage)
  const [playerElo, setPlayerElo] = useState<number>(() => {
    const saved = localStorage.getItem('aether_player_elo');
    return saved ? parseInt(saved, 10) : 1200;
  });
  const [aiElo, setAiElo] = useState<number>(() => {
    const saved = localStorage.getItem('aether_ai_elo');
    return saved ? parseInt(saved, 10) : 1200;
  });
  const [calibrationProgress, setCalibrationProgress] = useState<number>(() => {
    const saved = localStorage.getItem('aether_calibration_progress');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameHistory, setGameHistory] = useState<ELOPoint[]>(() => {
    const saved = localStorage.getItem('aether_game_history');
    return saved ? JSON.parse(saved) : [{ gameIndex: 0, elo: 1200 }];
  });
  const [currentGameCount, setCurrentGameCount] = useState<number>(() => {
    const saved = localStorage.getItem('aether_game_count');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Sync state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('aether_player_elo', playerElo.toString());
  }, [playerElo]);

  useEffect(() => {
    localStorage.setItem('aether_ai_elo', aiElo.toString());
  }, [aiElo]);

  useEffect(() => {
    localStorage.setItem('aether_calibration_progress', calibrationProgress.toString());
  }, [calibrationProgress]);

  useEffect(() => {
    localStorage.setItem('aether_game_history', JSON.stringify(gameHistory));
  }, [gameHistory]);

  useEffect(() => {
    localStorage.setItem('aether_game_count', currentGameCount.toString());
  }, [currentGameCount]);

  // Calibration metrics tracker
  const [accuracyScores, setAccuracyScores] = useState<number[]>([]);
  const [blundersCount, setBlundersCount] = useState<number>(0);
  const [moveTimes, setMoveTimes] = useState<number[]>([]);
  const moveStartRef = useRef<number>(Date.now());

  // Board evaluation tracker
  const [boardEvaluation, setBoardEvaluation] = useState<number>(0);

  // UI States
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [postGameMetrics, setPostGameMetrics] = useState<GameMetrics | null>(null);

  // Synchronize mute setting with sound system
  useEffect(() => {
    soundManager.muted = isMuted;
  }, [isMuted]);

  // Handle board evaluation and state updates when chess object changes
  const updateBoardState = () => {
    setBoard(chess.board());
    const evalScore = evaluateBoard(chess);
    // Score is from White's perspective. Normalize it to show on the bar
    // e.g., +1000 is +10.0, -1000 is -10.0
    setBoardEvaluation(evalScore / 100);
    
    // Check if game is over
    if (chess.isGameOver()) {
      handleGameCompleted();
    }
  };

  // Perform AI Move
  const makeAIMove = () => {
    setIsAiThinking(true);
    
    // Slight timeout to simulate AI reflection and feel cinematic
    setTimeout(() => {
      const aiMove = computeAIMove(chess, aiElo);
      if (aiMove) {
        const tempChess = new Chess(chess.fen());
        try {
          const moveRes = tempChess.move(aiMove);
          
          if (moveRes.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }
          
          if (tempChess.inCheck()) {
            soundManager.playCheck();
          }

          setLastMove({ from: moveRes.from, to: moveRes.to });
          setChess(tempChess);
          setSelectedSquare(null);
          setPossibleMoves([]);
          setHintSquare(null);
        } catch (e) {
          console.error("AI Move failed", e);
        }
      }
      setIsAiThinking(false);
    }, 600);
  };

  // Trigger AI move if it's Black's turn
  useEffect(() => {
    if (chess.turn() === 'b' && !chess.isGameOver()) {
      makeAIMove();
    }
  }, [chess]);

  // Run update when chess updates
  useEffect(() => {
    updateBoardState();
  }, [chess]);

  // Handle human move selection
  const handleSquareClick = (square: string, piece: { type: string; color: string } | null) => {
    if (chess.isGameOver() || isAiThinking || chess.turn() === 'b') return;

    // Clicked on a valid target square to move
    if (possibleMoves.includes(square) && selectedSquare) {
      const moveStart = moveStartRef.current;
      const timeSpent = (Date.now() - moveStart) / 1000;
      setMoveTimes(prev => [...prev, timeSpent]);

      // Calculate accuracy
      const accuracyScore = rateMoveAccuracy(chess, selectedSquare + square);
      setAccuracyScores(prev => [...prev, accuracyScore]);
      
      if (accuracyScore <= 30) {
        setBlundersCount(prev => prev + 1);
      }

      // Execute move
      const tempChess = new Chess(chess.fen());
      try {
        const moveRes = tempChess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q' // Auto-promote to Queen for simplicity
        });

        if (moveRes.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        if (tempChess.inCheck()) {
          soundManager.playCheck();
        }

        setLastMove({ from: selectedSquare, to: square });
        setChess(tempChess);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setHintSquare(null);
      } catch (e) {
        console.error("Move execution failed", e);
      }
      return;
    }

    // Select piece
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as any, verbose: true });
      setPossibleMoves(moves.map(m => m.to));
      moveStartRef.current = Date.now();
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Generate tactical rating
  const getTacticalRating = (acc: number, blunds: number): number => {
    let rating = acc - (blunds * 15);
    return Math.max(10, Math.min(100, Math.round(rating)));
  };

  // Handle Game Completion and ELO Recalibration
  const handleGameCompleted = () => {
    let reason = "Game Over";
    let isVictory = false;
    
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black (AI)' : 'White (You)';
      reason = `Checkmate - ${winner} wins`;
      isVictory = chess.turn() === 'b'; // White won
    } else if (chess.isDraw()) {
      if (chess.isStalemate()) reason = "Draw by Stalemate";
      else if (chess.isThreefoldRepetition()) reason = "Draw by Threefold Repetition";
      else if (chess.isInsufficientMaterial()) reason = "Draw by Insufficient Material";
      else reason = "Draw Offer Accepted";
    }

    soundManager.playGameOver(isVictory);
    setGameOverReason(reason);

    // Compute metrics
    const avgAccuracy = accuracyScores.length > 0 
      ? Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length)
      : 80;
    
    const avgTime = moveTimes.length > 0 
      ? Math.round((moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length) * 10) / 10
      : 3.5;

    const tacticalAwareness = getTacticalRating(avgAccuracy, blundersCount);
    
    const gameMetrics: GameMetrics = {
      accuracy: avgAccuracy,
      blunders: blundersCount,
      tacticalAwareness,
      timePerMove: avgTime,
      movesCount: accuracyScores.length
    };

    setPostGameMetrics(gameMetrics);

    // ELO Recalibration Logic
    let eloDelta = 0;
    
    if (currentGameCount === 1) {
      // Game 1 is Calibration Game. Determine ELO based on accuracy and game result
      // Baseline 1200.
      const winMultiplier = isVictory ? 150 : (chess.isDraw() ? 0 : -150);
      const accuracyModifier = (avgAccuracy - 70) * 12; // E.g., 85% accuracy adds 180 ELO, 60% accuracy removes 120 ELO
      const timeModifier = avgTime < 2 ? 50 : (avgTime > 8 ? -50 : 0);
      const calibratedElo = Math.max(600, Math.min(2400, Math.round(1200 + winMultiplier + accuracyModifier + timeModifier)));
      
      setPlayerElo(calibratedElo);
      setCalibrationProgress(1); // Calibration completed!
      
      const newHistory = [...gameHistory, { gameIndex: 1, elo: calibratedElo }];
      setGameHistory(newHistory);
      
      // Scale AI to sit 50-100 ELO points above the player
      setAiElo(calibratedElo + 75);
    } else {
      // Subsequent games: standard ELO adjustments
      const expectedOutcome = 1 / (1 + Math.pow(10, (aiElo - playerElo) / 400));
      const actualOutcome = isVictory ? 1 : (chess.isDraw() ? 0.5 : 0);
      
      // K-Factor: 40 for responsiveness
      const kFactor = 40;
      eloDelta = Math.round(kFactor * (actualOutcome - expectedOutcome));
      const nextPlayerElo = Math.max(600, Math.min(2600, playerElo + eloDelta));
      
      setPlayerElo(nextPlayerElo);
      const newHistory = [...gameHistory, { gameIndex: currentGameCount, elo: nextPlayerElo }];
      setGameHistory(newHistory);
      
      // Calibrate AI ELO target (50-100 points higher)
      setAiElo(nextPlayerElo + 75);
    }

    setIsGameOverOpen(true);
  };

  // Start new round
  const handleStartNewGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setHintSquare(null);
    setAccuracyScores([]);
    setBlundersCount(0);
    setMoveTimes([]);
    setCurrentGameCount(prev => prev + 1);
    setIsGameOverOpen(false);
    moveStartRef.current = Date.now();
  };

  // Reset entire dashboard ELO state and clear localStorage
  const resetEntireSession = () => {
    if (window.confirm("Are you sure you want to reset all calibration and rating history?")) {
      localStorage.removeItem('aether_player_elo');
      localStorage.removeItem('aether_ai_elo');
      localStorage.removeItem('aether_calibration_progress');
      localStorage.removeItem('aether_game_history');
      localStorage.removeItem('aether_game_count');

      setChess(new Chess());
      setSelectedSquare(null);
      setPossibleMoves([]);
      setLastMove(null);
      setHintSquare(null);
      setAccuracyScores([]);
      setBlundersCount(0);
      setMoveTimes([]);
      setPlayerElo(1200);
      setAiElo(1200);
      setCalibrationProgress(0);
      setCurrentGameCount(1);
      setGameHistory([{ gameIndex: 0, elo: 1200 }]);
      setIsGameOverOpen(false);
    }
  };

  // Provide move hints (best move search at depth 3)
  const getEngineHint = () => {
    if (isAiThinking || chess.turn() === 'b') return;
    const [, bestMove] = minimax(chess, 3, -Infinity, Infinity, true);
    if (bestMove) {
      const fromSquare = bestMove.slice(0, 2);
      setHintSquare(fromSquare);
      // Fade hint square out after 2 seconds
      setTimeout(() => {
        setHintSquare(null);
      }, 2500);
    }
  };

  // Resign active match
  const handleResign = () => {
    if (window.confirm("Are you sure you want to resign this match?")) {
      handleGameCompleted();
    }
  };

  // Convert Evaluation value to render coordinates
  const getEvalBarPercentage = () => {
    // Clamped evaluation between -10 and +10
    const clamped = Math.max(-8, Math.min(8, boardEvaluation));
    // Maps -8 -> 5% and +8 -> 95%
    return 50 + (clamped / 8) * 45;
  };

  // Parse moves array into side-by-side moves pairs
  const renderMovesHistory = () => {
    const history = chess.history();
    const pairs = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        w: history[i],
        b: history[i + 1] || ""
      });
    }

    return pairs.map((p, idx) => (
      <div key={idx} className="grid grid-cols-6 py-1 px-2 text-sm border-b border-obsidian-600/30 hover:bg-obsidian-700/20 rounded transition">
        <span className="col-span-1 text-slate-500 font-mono">{p.num}.</span>
        <span className="col-span-2 text-slate-300 font-medium font-mono">{p.w}</span>
        <span className="col-span-3 text-cyan-400 font-mono">{p.b}</span>
      </div>
    ));
  };

  // Renders the board coordinates
  const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="min-h-screen bg-obsidian-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-obsidian-800 via-obsidian-900 to-obsidian-950 flex flex-col items-center justify-between text-slate-100 p-3 sm:p-6 overflow-hidden">
      
      {/* ==========================================
          HEADER SECTION
         ========================================== */}
      <header className="w-full max-w-7xl flex flex-row items-center justify-between py-2 border-b border-obsidian-700/40 mb-3 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-gradient-to-tr from-cyan-600 to-purple-600 rounded-xl shadow-glow-cyan">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400 font-sans">
              AETHER CHESS
            </h1>
            <p className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">
              Adaptive Calibration AI
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2.5 rounded-lg border border-obsidian-700/80 bg-obsidian-800/50 hover:bg-obsidian-700 text-slate-400 hover:text-cyan-400 transition"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={resetEntireSession} 
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Session
          </button>
        </div>
      </header>

      {/* ==========================================
          MAIN GAME AREA
         ========================================== */}
      <main className="w-full max-w-7xl flex-grow grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch py-2">
        
        {/* SIDEBAR LEFT: INSTRUCTIONS & CALIBRATION */}
        <section className="lg:col-span-3 flex flex-col gap-4 animate-slide-up">
          {/* ELO Calibration Status Card */}
          <div className="glass-panel rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-3 border-b border-obsidian-700/60 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-cyan-400" />
                Adaptive Core
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                calibrationProgress === 0 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {calibrationProgress === 0 ? "CALIBRATING" : "ACTIVE SCALING"}
              </span>
            </div>

            <div className="space-y-4 my-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Player Signature ELO</span>
                  <span className="font-mono text-white font-bold">{playerElo}</span>
                </div>
                <div className="w-full bg-obsidian-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(playerElo / 2400) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Target AI Strength</span>
                  <span className="font-mono text-cyan-400 font-bold">{aiElo} ELO</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>AI calibrated at +75 ELO to push your growth.</span>
                </div>
              </div>
            </div>

            <div className="bg-obsidian-800/40 border border-obsidian-700/40 rounded-lg p-2.5 mt-3 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Match Mode:</span>
                <span className="text-slate-200 font-medium">Single Player Vs AI</span>
              </div>
              <div className="flex justify-between">
                <span>Calib. Game:</span>
                <span className="text-slate-200 font-mono">#{currentGameCount}</span>
              </div>
            </div>
          </div>

          {/* Engine Calibration Info Details */}
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Zone of Proximal Development
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our AI dynamically adapts its positional evaluation matrices and search tree depth in real-time. 
            </p>
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                <span>Depth 1-4 adaptive scaling</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                <span>Adaptive blunder thresholds</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span>Continuous tactical feedback</span>
              </div>
            </div>
          </div>

          <button 
            onClick={resetEntireSession} 
            className="sm:hidden w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Calibration Session
          </button>
        </section>

        {/* MIDDLE SECTION: BOARD AND EVALUATION BAR */}
        <section className="lg:col-span-6 flex flex-row items-stretch gap-3 md:gap-5 justify-center">
          
          {/* THE EVALUATION BAR */}
          <div className="w-5 sm:w-6 bg-obsidian-800/80 border border-obsidian-700/60 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-2xl">
            {/* Black Eval (Top part) */}
            <div 
              className="w-full bg-obsidian-900 transition-all duration-300 relative flex items-start justify-center pt-2 font-mono text-[9px] text-slate-500 font-bold"
              style={{ height: `${100 - getEvalBarPercentage()}%` }}
            >
              {boardEvaluation < 0 && `${boardEvaluation.toFixed(1)}`}
            </div>
            
            {/* Divider line */}
            <div className="w-full h-[2px] bg-cyan-500/50 absolute left-0 right-0 z-10" style={{ bottom: `${getEvalBarPercentage()}%` }}></div>
            
            {/* White Eval (Bottom part) */}
            <div 
              className="w-full bg-slate-100 transition-all duration-300 relative flex items-end justify-center pb-2 font-mono text-[9px] text-obsidian-900 font-bold"
              style={{ height: `${getEvalBarPercentage()}%` }}
            >
              {boardEvaluation >= 0 && `+${boardEvaluation.toFixed(1)}`}
            </div>
          </div>

          {/* CHESSBOARD CONTAINER */}
          <div className="flex flex-col gap-3 justify-center items-center flex-grow max-w-[580px]">
            
            {/* AI Profile Bar */}
            <div className="w-full flex items-center justify-between bg-obsidian-800/30 border border-obsidian-700/30 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${isAiThinking ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-glow-cyan' : 'bg-obsidian-700/50'} transition`}>
                  <Cpu className={`w-4 h-4 ${isAiThinking ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold font-mono tracking-wider">AETHER_BOT</span>
                    <span className="text-[9px] text-slate-400 font-mono bg-obsidian-700/40 px-1.5 py-0.5 rounded">
                      Depth {aiElo < 1000 ? 1 : aiElo < 1600 ? 2 : 3}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isAiThinking ? "AI searching decision tree..." : "Waiting for your move..."}
                  </div>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-cyan-400">{aiElo} ELO</span>
            </div>

            {/* THE CHESS BOARD */}
            <div className="w-full aspect-square bg-obsidian-950 p-2.5 rounded-2xl border border-obsidian-700/60 shadow-2xl relative">
              <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden relative">
                {board.map((rowArr, rIndex) => 
                  rowArr.map((square, cIndex) => {
                    const file = columns[cIndex];
                    const rank = 8 - rIndex;
                    const squareName = `${file}${rank}`;
                    const isLight = (rIndex + cIndex) % 2 === 0;

                    // Compute highlights
                    const isSelected = selectedSquare === squareName;
                    const isPossibleTarget = possibleMoves.includes(squareName);
                    const isPrevMoveSource = lastMove?.from === squareName;
                    const isPrevMoveDest = lastMove?.to === squareName;
                    const isCheckingSquare = chess.inCheck() && square?.type === 'k' && square.color === chess.turn();
                    const isHint = hintSquare === squareName;

                    let highlightClass = "";
                    if (isSelected) highlightClass = "bg-board-selected ring-2 ring-inset ring-amber-500/50 z-10";
                    else if (isPrevMoveSource || isPrevMoveDest) highlightClass = "bg-board-prevMove";
                    else if (isCheckingSquare) highlightClass = "bg-red-500/30 animate-pulse ring-4 ring-inset ring-red-500/80 z-10";
                    else if (isHint) highlightClass = "bg-cyan-500/30 ring-2 ring-inset ring-cyan-400 z-10";

                    return (
                      <div
                        key={squareName}
                        onClick={() => handleSquareClick(squareName, square)}
                        className={`relative aspect-square cursor-pointer transition-all duration-150 flex items-center justify-center select-none ${
                          isLight ? 'bg-board-light text-slate-800' : 'bg-board-dark text-slate-200'
                        } ${highlightClass}`}
                      >
                        {/* Legal moves indicators */}
                        {isPossibleTarget && (
                          <div className={`absolute w-3.5 h-3.5 rounded-full z-20 ${
                            square ? 'border-4 border-amber-500/80 w-8 h-8' : 'bg-amber-500/60 shadow-glow-gold'
                          }`}></div>
                        )}

                        {/* Rendering Chess Piece */}
                        {square && (
                          <div className={`w-[85%] h-[85%] z-10 transform active:scale-95 transition-transform duration-100 ${
                            square.color === 'w' ? 'drop-shadow-[0_2px_4px_rgba(255,255,255,0.15)]' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                          } animate-piece`}>
                            <ChessPiece type={square.type} color={square.color} />
                          </div>
                        )}

                        {/* Render labels on border squares */}
                        {cIndex === 0 && (
                          <span className="absolute top-0.5 left-1 text-[9px] font-bold font-mono opacity-40 pointer-events-none">
                            {rank}
                          </span>
                        )}
                        {rIndex === 7 && (
                          <span className="absolute bottom-0.5 right-1.5 text-[9px] font-bold font-mono opacity-40 pointer-events-none">
                            {file}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Player Profile Bar */}
            <div className="w-full flex items-center justify-between bg-obsidian-800/30 border border-obsidian-700/30 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-obsidian-700/50 rounded-lg">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold tracking-wide">HUMAN_PLAYER</span>
                    <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Accuracy over match: {accuracyScores.length > 0 ? `${Math.round(accuracyScores.reduce((a,b)=>a+b,0)/accuracyScores.length)}%` : "Calculating..."}
                  </div>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-white">{playerElo} ELO</span>
            </div>

          </div>
        </section>

        {/* SIDEBAR RIGHT: MOVE HISTORY & GAME CONTROLS */}
        <section className="lg:col-span-3 flex flex-col gap-4 animate-slide-up">
          {/* Game controls */}
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-purple-400" />
              Tactics Console
            </span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button 
                onClick={getEngineHint}
                disabled={isAiThinking || chess.turn() === 'b' || chess.isGameOver()}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Get Hint
              </button>
              <button 
                onClick={handleResign}
                disabled={chess.isGameOver()}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resign
              </button>
            </div>
            
            <button 
              onClick={handleStartNewGame}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg border border-slate-700 bg-obsidian-700/50 hover:bg-obsidian-600 text-white transition mt-1"
            >
              <Play className="w-3.5 h-3.5" />
              Force Restart Round
            </button>
          </div>

          {/* Scrolling Move Log */}
          <div className="glass-panel rounded-xl p-4 flex-grow flex flex-col min-h-[220px] max-h-[360px] lg:max-h-none overflow-hidden relative">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              PGN Notation Log
            </span>
            
            <div className="flex-grow overflow-y-auto pr-1 space-y-1 mb-2">
              {chess.history().length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No moves recorded yet.
                </div>
              ) : (
                renderMovesHistory()
              )}
            </div>

            <div className="border-t border-obsidian-700/60 pt-3 flex justify-between items-center text-xs text-slate-400">
              <span className="font-mono">TURN: {chess.turn() === 'w' ? 'White' : 'Black (AI)'}</span>
              <span className="font-mono">{chess.history().length} ply</span>
            </div>
          </div>
        </section>

      </main>

      {/* ==========================================
          FOOTER / META INFO
         ========================================== */}
      <footer className="w-full max-w-7xl text-center py-4 text-xs text-slate-600 border-t border-obsidian-800/60 mt-4">
        AETHER CHESS Calibration Engine - Design & Mechanics Powered by Antigravity. Built with React & Tailwind.
      </footer>

      {/* ==========================================
          POST-GAME INSIGHTS MODAL
         ========================================== */}
      {isGameOverOpen && (
        <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel-glow w-full max-w-lg rounded-2xl overflow-hidden relative p-6 animate-slide-up">
            
            <div className="flex justify-between items-start border-b border-obsidian-700/60 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest uppercase block mb-1">
                  Calibration Report Complete
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-cyan-400" />
                  {gameOverReason}
                </h2>
              </div>
            </div>

            {postGameMetrics && (
              <div className="space-y-5">
                {/* Accuracy Circular Score & Insights */}
                <div className="grid grid-cols-3 gap-4 bg-obsidian-800/40 p-4 rounded-xl border border-obsidian-700/40">
                  <div className="col-span-1 flex flex-col items-center justify-center border-r border-obsidian-700/50 pr-2">
                    <span className="text-[10px] text-slate-400 font-semibold mb-1">ACCURACY</span>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="transparent" stroke="#1f2937" strokeWidth="4" />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          fill="transparent" 
                          stroke="#06b6d4" 
                          strokeWidth="4" 
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 - (175.9 * postGameMetrics.accuracy) / 100}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute font-mono text-base font-bold text-white">
                        {postGameMetrics.accuracy}%
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-col justify-center pl-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Blunders:</span>
                      <span className={`font-mono font-semibold ${postGameMetrics.blunders > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {postGameMetrics.blunders}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Tactical Rating:</span>
                      <span className="font-mono text-cyan-400 font-semibold">{postGameMetrics.tacticalAwareness}/100</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Avg. Move Time:</span>
                      <span className="font-mono text-slate-200 font-semibold">{postGameMetrics.timePerMove}s</span>
                    </div>
                  </div>
                </div>

                {/* ELO Progression Chart (Inline SVG) */}
                <div className="bg-obsidian-800/40 p-4 rounded-xl border border-obsidian-700/40">
                  <span className="text-xs text-slate-400 font-semibold block mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    ELO History Progression
                  </span>
                  <div className="h-28 w-full flex items-end justify-between relative mt-4 px-2">
                    {/* SVG Line path for ELO */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                        points={gameHistory.map((pt, i) => {
                          const x = (i / (gameHistory.length - 1 || 1)) * 390;
                          const normElo = (pt.elo - 600) / 1800; // Normalized between 600 and 2400
                          const y = 80 - (normElo * 60); // Inverted coordinates for SVG top-down
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      {gameHistory.map((pt, i) => {
                        const x = (i / (gameHistory.length - 1 || 1)) * 390;
                        const normElo = (pt.elo - 600) / 1800;
                        const y = 80 - (normElo * 60);
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#06b6d4" stroke="#090a0f" strokeWidth="1.5" />
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* Render ELO points values */}
                    {gameHistory.map((pt, i) => (
                      <div key={i} className="flex flex-col items-center z-10 text-[9px] font-mono text-slate-400" style={{ width: `${100 / gameHistory.length}%` }}>
                        <span className="bg-obsidian-900 border border-obsidian-700/40 px-1 py-0.5 rounded text-white font-bold mb-1">
                          {pt.elo}
                        </span>
                        <span>G{pt.gameIndex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adaptive ELO Calibration Statement */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-500/20 p-3 rounded-xl flex items-start gap-3">
                  <Brain className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong>AI Calibration Updated:</strong> The calibration engine has analyzed your tactical awareness score ({postGameMetrics.tacticalAwareness}) and updated your rating signature. 
                    AI matching ELO calibrated to <span className="text-cyan-400 font-bold font-mono">{aiElo}</span> for the next round.
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-obsidian-700/60 pt-4">
              <button 
                onClick={handleStartNewGame} 
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 font-semibold text-sm shadow-glow-cyan transition flex items-center gap-2"
              >
                Initialize Next Round
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
