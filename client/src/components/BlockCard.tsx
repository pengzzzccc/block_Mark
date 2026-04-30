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

const colorMap: Record<string, string> = {
    red: 'bg-card-red',
    yellow: 'bg-card-yellow',
    blue: 'bg-card-blue',
    green: 'bg-card-green',
    purple: 'bg-card-purple',
    black: 'bg-card-black',
};

const colorTextMap: Record<string, string> = {
    red: 'text-card-red',
    yellow: 'text-card-yellow',
    blue: 'text-card-blue',
    green: 'text-card-green',
    purple: 'text-card-purple',
    black: 'text-card-black',
};

const sizeClasses = {
    sm: 'w-14 h-20 text-sm',
    md: 'w-16 h-24 text-base',
    lg: 'w-20 h-28 text-lg',
};

export default function BlockCard({ block, size = 'md', selected, onClick, showBack, animDelay = 0 }: BlockCardProps) {
    if (showBack) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animDelay * 0.05, type: 'spring' }}
                className={`${sizeClasses[size]} rounded-lg shadow-card border border-gold-400/10 
                    bg-gradient-to-br from-felt-700 to-felt-800 flex items-center justify-center
                    select-none`}
            >
                <div className="text-gold-400/20 text-2xl font-display transform -rotate-12">BM</div>
            </motion.div>
        );
    }

    const isPurple = block.category === 'purple';
    const isBlack = block.category === 'black';
    const bgClass = colorMap[block.color] ?? 'bg-felt-600';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 1,
                scale: selected ? 1.08 : 1,
                y: selected ? -8 : 0,
            }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                delay: animDelay * 0.05,
                type: 'spring',
                stiffness: 300,
                damping: 20,
            }}
            onClick={onClick}
            className={`
                ${sizeClasses[size]} rounded-lg shadow-card cursor-pointer select-none relative
                flex flex-col items-center justify-center
                ${bgClass}
                ${isPurple ? 'border-2 border-transparent bg-clip-padding' : ''}
                ${isBlack ? 'ring-2 ring-gold-500/50' : ''}
                ${selected ? 'ring-2 ring-gold-400 shadow-gold-lg' : 'border border-white/10'}
                transition-shadow duration-200
            `}
            style={
                isPurple
                    ? {
                        background: 'linear-gradient(135deg, #9B59B6, #E91E63, #FF9800, #9B59B6)',
                        backgroundSize: '300% 300%',
                        animation: 'shimmer 3s ease infinite',
                    }
                    : undefined
            }
        >
            {/* Purple wild indicator */}
            {isPurple && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-gold-400 drop-shadow-lg">
                    W
                </span>
            )}

            {/* Black shield */}
            {isBlack && (
                <span className="absolute -top-1 -right-1 text-xs">🛡️</span>
            )}

            {/* Number */}
            {block.number !== undefined && block.number !== null && block.number > 0 && (
                <span
                    className={`font-bold ${size === 'sm' ? 'text-lg' : 'text-xl'} ${block.color === 'black' ? 'text-gold-400' : 'text-white/90'
                        } drop-shadow-md`}
                >
                    {block.number}
                </span>
            )}

            {/* Category label */}
            <span
                className={`text-[10px] uppercase tracking-wider mt-0.5 ${block.color === 'black' ? 'text-gold-400' : 'text-white/60'
                    }`}
            >
                {isPurple ? 'WILD' : isBlack ? 'BLOCK' : block.color}
            </span>

            {/* Price on market */}
            {onClick && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gold-400 font-mono text-[10px] whitespace-nowrap">
                    ${block.basePrice ?? '?'}
                </span>
            )}
        </motion.div>
    );
}