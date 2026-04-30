/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                felt: {
                    900: '#0D1F14',
                    800: '#122B1C',
                    700: '#1A3D28',
                    600: '#214F34',
                },
                gold: {
                    300: '#F0D78C',
                    400: '#E8C54A',
                    500: '#C9A026',
                    600: '#A07D1A',
                },
                neon: {
                    red: '#FF3B3B',
                    green: '#00E676',
                },
                card: {
                    red: '#E74C3C',
                    yellow: '#F1C40F',
                    blue: '#3498DB',
                    green: '#2ECC71',
                    purple: '#9B59B6',
                    black: '#1A1A2E',
                },
                glass: {
                    bg: 'rgba(18, 43, 28, 0.7)',
                    border: 'rgba(232, 197, 74, 0.3)',
                },
            },
            fontFamily: {
                display: ['"Playfair Display"', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
                body: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                gold: '0 0 20px rgba(232, 197, 74, 0.3)',
                'gold-lg': '0 0 40px rgba(232, 197, 74, 0.5)',
                card: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin 2s linear infinite',
                'pulse-gold': 'pulseGold 2s ease-in-out infinite',
                'shake': 'shake 0.4s ease-in-out',
                'flip': 'flip 0.6s ease-out',
                'fly-in': 'flyIn 0.5s ease-out',
                'cash-fly': 'cashFly 1s ease-out forwards',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                pulseGold: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(232, 197, 74, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(232, 197, 74, 0.6)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                flip: {
                    '0%': { transform: 'rotateY(0deg)' },
                    '100%': { transform: 'rotateY(360deg)' },
                },
                flyIn: {
                    '0%': { transform: 'translateY(-30px) scale(0.5)', opacity: '0' },
                    '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
                },
                cashFly: {
                    '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
                    '100%': { transform: 'translateY(-100px) scale(1.5)', opacity: '0' },
                },
                glow: {
                    '0%': { textShadow: '0 0 5px rgba(232,197,74,0.3)' },
                    '100%': { textShadow: '0 0 20px rgba(232,197,74,0.8), 0 0 40px rgba(232,197,74,0.4)' },
                },
            },
        },
    },
    plugins: [],
};