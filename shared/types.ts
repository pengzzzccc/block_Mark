// ============================================================
// Block Market — Shared Type Definitions
// ============================================================

// --- Block Types ---

export type BlockColor = 'red' | 'yellow' | 'blue' | 'green' | 'purple' | 'black';
export type BlockCategory = 'ordinal' | 'purple' | 'black';
export type OrdinalNumber = 1 | 2 | 3 | 4;

export interface Block {
    id: string;
    category: BlockCategory;
    color: BlockColor;
    number: OrdinalNumber | null; // null for purple/black
    basePrice: number;
}

// --- Dice ---

export interface DiceResult {
    red: number;   // 1-6
    green: number; // 1-6
}

export interface IncomeResult {
    dice: DiceResult;
    income: number;
    isDouble6: boolean;
}

export interface DuelDiceResult {
    attacker: DiceResult;
    defender: DiceResult;
    attackerSum: number;
    defenderSum: number;
    attackerDoubles: boolean;
    defenderDoubles: boolean;
    blackBlockHalved: boolean;
}

// --- Game Phases & Actions ---

export type TurnPhase = 'settlement' | 'action' | 'duel' | 'negotiation' | 'finished';

export type ActionType = 'buy' | 'swap' | 'negotiate' | 'forcedTrade';

export type BuySource = 'openMarket' | 'blindDraw';

// --- Players ---

export interface PlayerState {
    id: string;
    name: string;
    cash: number;
    hand: Block[];
    connected: boolean;
    isHost: boolean;
}

export interface PublicPlayerInfo {
    id: string;
    name: string;
    cash: number;
    handCount: number;
    connected: boolean;
    isHost: boolean;
    hasBlackBlock: boolean;
}

// --- Negotiation ---

export interface NegotiationOffer {
    fromPlayerId: string;
    toPlayerId: string;
    offeredBlock: Block | null;
    requestedBlock: Block | null;
    cashOffered: number;
    cashRequested: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    expiresAt: number;
}

// --- Duel ---

export interface DuelState {
    attackerId: string;
    defenderId: string;
    targetBlockId: string;
    wagerAmount: number;
    phase: 'selecting' | 'rolling' | 'result';
    result?: {
        attackerRoll: number;
        defenderRoll: number;
        attackerDoubles: boolean;
        defenderDoubles: boolean;
        blackBlockHalved: boolean;
        winnerId: string;
    };
}

// --- Sets & Win Detection ---

export interface DetectedSet {
    type: 'sequence' | 'triplet' | 'rainbow';
    blocks: Block[];
}

export interface DetectedPair {
    blocks: [Block, Block];
}

export interface WinResult {
    isWin: boolean;
    sets: DetectedSet[];
    pair: DetectedPair | null;
}

// --- Game State ---

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface GameState {
    players: PlayerState[];
    currentPlayerIndex: number;
    currentTurn: number;
    phase: TurnPhase;
    openMarket: Block[];
    blindPile: Block[];
    discardPile: Block[];
    currentAction: ActionType | null;
    diceResult: IncomeResult | null;
    duelState: DuelState | null;
    negotiation: NegotiationOffer | null;
    winnerId: string | null;
    turnDeadline: number | null;
    extraAction: boolean; // 双6额外行动标记
}

export interface RoomState {
    roomId: string;
    roomCode: string;
    players: PlayerState[];
    gameState: GameState | null;
    status: RoomStatus;
    hostId: string;
    maxPlayers: number;
    createdAt: number;
}

// --- Socket Events: Client → Server ---

export interface ClientToServerEvents {
    'room:create': (data: { playerName: string; maxPlayers?: number }) => void;
    'room:join': (data: { roomCode: string; playerName: string }) => void;
    'room:leave': () => void;
    'game:start': () => void;
    'turn:rollDice': () => void;
    'turn:buy': (data: { blockId: string; source: BuySource }) => void;
    'turn:swap': (data: { sellBlockId: string; buyBlockId: string }) => void;
    'turn:negotiate': (data: {
        targetPlayerId: string;
        offeredBlockId: string | null;
        requestedBlockId: string | null;
        cashOffered: number;
        cashRequested: number;
    }) => void;
    'turn:negotiateReply': (data: { accept: boolean }) => void;
    'turn:forcedTrade': (data: { targetPlayerId: string; targetBlockId: string }) => void;
    'turn:duelRoll': () => void;
    'turn:end': () => void;
}

// --- Socket Events: Server → Client ---

export interface ServerToClientEvents {
    'room:created': (data: { roomId: string; roomCode: string }) => void;
    'room:updated': (data: RoomState) => void;
    'room:error': (data: { message: string }) => void;
    'game:started': (data: { gameState: ClientGameState }) => void;
    'game:stateUpdate': (data: { gameState: ClientGameState }) => void;
    'turn:diceResult': (data: IncomeResult) => void;
    'turn:actionResult': (data: { success: boolean; message: string }) => void;
    'duel:initiated': (data: DuelState) => void;
    'duel:rolled': (data: DuelDiceResult) => void;
    'duel:result': (data: { winnerId: string; blockTransferred: Block; cashTransferred: number }) => void;
    'negotiate:request': (data: NegotiationOffer) => void;
    'negotiate:response': (data: { accepted: boolean; offerId: string }) => void;
    'game:winner': (data: { playerId: string; playerName: string; winResult: WinResult }) => void;
    'game:error': (data: { message: string }) => void;
    'player:reconnected': (data: { playerId: string }) => void;
}

// --- Client-side Game State (filtered visibility) ---

export interface ClientGameState {
    myPlayerId: string;
    myHand: Block[];
    players: PublicPlayerInfo[];
    currentPlayerIndex: number;
    currentTurn: number;
    phase: TurnPhase;
    openMarket: Block[];
    blindPileCount: number;
    discardPileCount: number;
    diceResult: IncomeResult | null;
    duelState: DuelState | null;
    negotiation: NegotiationOffer | null;
    winnerId: string | null;
    turnDeadline: number | null;
    extraAction: boolean;
}