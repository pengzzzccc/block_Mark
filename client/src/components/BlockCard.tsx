import { motion } from 'framer-motion';
import type { Block } from '../stores/gameStore';

interface BlockCardProps {
    block: Block;
    size?: 'sm' | 'md' | 'lg';
    selected?: boolean;
    onClick?: () => void;
    showBack?: boolean;
    animDelay?: number;
}

const colorClassMap: Record<string, string> = {
    red: 'block-red',
    yellow: 'block-yellow',
    blue: 'block-blue',
    green: 'block-green',
    purple: 'block-purple',
    black: 'block-black',
};

const sizeClasses = {
    sm: 'w-14 h-20 text-sm',
    md: 'w-20 h-28 text-lg',
    lg: 'w-24 h-34 text-2xl',
};

const numberSymbols: Record<number, string> = {
    1: '①', 2: '②', 3: '③', 4: '④',
};

export default function BlockCard({ block, size = 'md', selected, onClick, showBack, animDelay = 0 }: BlockCardProps) {
    if (showBack) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animDelay * 0.05, type: 'spring' }}
                className={`${sizeClasses[size]} rounded-xl shadow-lg border border-white/5
                    flex items-center justify-center select-none relative overflow-hidden`}
                style={{
                    background: 'linear-gradient(145deg, #1a3d28 0%, #0f2318 100%)',
                }}
            >
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(232,197,74,0.1) 4px, rgba(232,197,74,0.1) 5px)',
                    }}
                />
                <div className="text-lg font-black tracking-tighter opacity-20" style={{ color: '#E8C54A', fontFamily: "'Playfair Display', serif" }}>
                    BM
                </div>
            </motion.div>
        );
    }

    const isPurple = block.category === 'purple';
    const isBlack = block.category === 'black';
    const bgClass = colorClassMap[block.color] ?? '';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 1,
                scale: selected ? 1.1 : 1,
                y: selected ? -10 : 0,
            }}
            whileHover={{ scale: 1.08, y: -5 }}
            whileTap={{ scale: 0.92 }}
            transition={{
                delay: animDelay * 0.05,
                type: 'spring',
                stiffness: 300,
                damping: 20,
            }}
            onClick={onClick}
            className={`
                ${sizeClasses[size]} rounded-xl cursor-pointer select-none relative
                flex flex-col items-center justify-center gap-0.5
                shadow-lg
                ${selected ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(232,197,74,0.4)]' : 'border border-white/10'}
                transition-shadow duration-200 overflow-hidden
                ${!isPurple && !isBlack ? bgClass : ''}
            `}
            style={
                isPurple
                    ? {
                        background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 30%, #C026D3 60%, #7C3AED 100%)',
                        backgroundSize: '200% 200%',
                        animation: 'shimmer 4s ease infinite',
                        border: '2px solid rgba(232,197,74,0.4)',
                    }
                    : isBlack
                        ? {
                            background: 'linear-gradient(145deg, #374151 0%, #111827 50%, #1F2937 100%)',
                            border: '2px solid rgba(232,197,74,0.3)',
                        }
                        : undefined
            }
        >
            {/* Inner shine effect */}
            <div className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%)' }}
            />

            {/* Purple wild badge */}
            {isPurple && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: 'linear-gradient(135deg, #E8C54A, #B8941F)', color: '#0D1F14' }}>
                    W
                </div>
            )}

            {/* Black shield badge */}
            {isBlack && (
                <div className="absolute -top-0.5 -right-0.5 text-sm">🛡️</div>
            )}

            {/* Number */}
            {block.number !== null && block.number > 0 && (
                <span className={`font-black drop-shadow-lg leading-none
                    ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl'}
                    ${isBlack ? 'text-gray-300' : 'text-white'}`}
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
                >
                    {block.number}
                </span>
            )}

            {/* Purple symbol */}
            {isPurple && (
                <span className={`font-black leading-none ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl'}`}
                    style={{ color: '#F0D78C', textShadow: '0 2px 8px rgba(232,197,74,0.5)' }}>
                    ★
                </span>
            )}

            {/* Black symbol */}
            {isBlack && (
                <span className={`font-black leading-none ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl'}`}
                    style={{ color: '#9CA3AF', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    ◆
                </span>
            )}

            {/* Category label */}
            <span className={`text-[8px] uppercase tracking-wider font-bold
                ${isBlack ? 'text-gray-400' : isPurple ? 'text-yellow-200/70' : 'text-white/70'}`}
            >
                {isPurple ? 'WILD' : isBlack ? 'GUARD' : block.color}
            </span>

            {/* Price tag (market view) */}
            {onClick && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(13,31,20,0.9)', color: '#E8C54A', border: '1px solid rgba(232,197,74,0.2)' }}>
                    ${block.basePrice}
                </span>
            )}
        </motion.div>
    );
}