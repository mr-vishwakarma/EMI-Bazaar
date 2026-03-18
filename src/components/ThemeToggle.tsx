import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={cycleTheme}
            className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative overflow-hidden group"
            title={`Current theme: ${theme}`}
        >
            <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {theme === 'light' && <Sun size={20} className="relative z-10" />}
            {theme === 'dark' && <Moon size={20} className="relative z-10" />}
            {theme === 'system' && <Monitor size={20} className="relative z-10" />}
        </motion.button>
    );
}
