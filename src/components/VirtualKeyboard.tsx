import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, Delete, ArrowUp, Keyboard, Check, Sparkles, Volume2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VirtualKeyboardProps {
    inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
    onChange: (value: string) => void;
    onClose: () => void;
}

// Kurdish Standard letters with dedicated sub-numbers
const kurdishLayout = [
    ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'],
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'خٔ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ', 'ڕ'],
    ['ظ', 'ط', 'ز', 'ر', 'و', 'ۆ', 'پ', 'د', 'ژ', 'ە', 'ێ', 'Delete'],
    ['Space']
];

const englishLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'Delete'],
    ['Space']
];

const numericLayout = [
    ['7', '8', '9', 'Delete'],
    ['4', '5', '6', 'Clear'],
    ['1', '2', '3', '000'],
    ['0', '00', '.', '0000']
];

const textSuggestions = [
    'قاوە', 'چای', 'کاپاتشینۆ', 'لاتێ', 'ئیسپریسۆ', 
    'سارد', 'گەرم', 'ئاو', 'کێک', 'شەربەت', 
    'پیتزا', 'بەرگر', 'سوپاس بۆ کڕینەکەت'
];

const numericSuggestions = [250, 500, 1000, 5000, 10000, 25000];

type SoundType = 'click' | 'chime' | 'beep' | 'mute';

export function VirtualKeyboard({ inputRef, onChange, onClose }: VirtualKeyboardProps) {
    const [language, setLanguage] = useState<'ku' | 'en'>('ku');
    const [isShift, setIsShift] = useState(false);
    const [soundMode, setSoundMode] = useState<SoundType>(() => {
        const saved = localStorage.getItem('vkey_sound_mode');
        return (saved as SoundType) || 'click';
    });
    
    // Track localized visual feedback for inputted keys
    const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);
    const pressedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isNumeric = inputRef.current?.type === 'number' || inputRef.current?.inputMode === 'numeric';
    const layout = isNumeric ? numericLayout : (language === 'ku' ? kurdishLayout : englishLayout);

    useEffect(() => {
        localStorage.setItem('vkey_sound_mode', soundMode);
    }, [soundMode]);

    // Acoustic physical-like feedbacks
    const playSoundEffect = () => {
        if (soundMode === 'mute') return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const audioCtx = new AudioCtx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            if (soundMode === 'click') {
                // Short organic click (mechanical key switch)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(650, audioCtx.currentTime); 
                gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.04);
            } else if (soundMode === 'chime') {
                // High premium chime/bell tone
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
            } else if (soundMode === 'beep') {
                // Retro arcade beep
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.06);
            }
        } catch (e) {
            // Gracefully ignore web audio block policies
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && e.target instanceof Node) {
                const keyboardEl = document.getElementById('virtual-keyboard');
                if (keyboardEl && !keyboardEl.contains(e.target) && !inputRef.current.contains(e.target)) {
                    onClose();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputRef, onClose]);

    const triggerKeyFeedback = (keyName: string) => {
        if (pressedTimeoutRef.current) {
            clearTimeout(pressedTimeoutRef.current);
        }
        setLastPressedKey(keyName);
        pressedTimeoutRef.current = setTimeout(() => {
            setLastPressedKey(null);
        }, 120);
    };

    const handleKeyPress = (key: string, e: React.MouseEvent) => {
        e.preventDefault(); 
        playSoundEffect();
        triggerKeyFeedback(key);
        
        if (!key || !inputRef.current) return;
        
        const input = inputRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        let currentValue = input.value;

        if (key === 'Space') {
            currentValue = currentValue.substring(0, start) + ' ' + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start + 1, start + 1), 10);
        } else if (key === 'Clear') {
            onChange('');
        } else {
            const charToAdd = isShift && !isNumeric ? key.toUpperCase() : key;
            currentValue = currentValue.substring(0, start) + charToAdd + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start + charToAdd.length, start + charToAdd.length), 10);
        }
        input.focus();
    };

    const handleSuggestionClick = (suggestion: string | number, e: React.MouseEvent) => {
        e.preventDefault();
        playSoundEffect();
        triggerKeyFeedback(suggestion.toString());
        if (!inputRef.current) return;

        const input = inputRef.current;
        if (isNumeric) {
            const currentNum = parseInt(input.value || '0', 10);
            const addedVal = Number(suggestion);
            const newVal = currentNum === 0 ? addedVal.toString() : (currentNum + addedVal).toString();
            onChange(newVal);
        } else {
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const currentValue = input.value;
            const word = suggestion.toString();
            const newVal = currentValue.substring(0, start) + word + currentValue.substring(end);
            onChange(newVal);
            setTimeout(() => input.setSelectionRange(start + word.length, start + word.length), 10);
        }
        input.focus();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        playSoundEffect();
        triggerKeyFeedback('🗑️');
        if (!inputRef.current) return;
        
        const input = inputRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        let currentValue = input.value;

        if (start === end && start > 0) {
            currentValue = currentValue.substring(0, start - 1) + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start - 1, start - 1), 10);
        } else if (start !== end) {
            currentValue = currentValue.substring(0, start) + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start, start), 10);
        }
        input.focus();
    };

    const cycleSoundMode = (e: React.MouseEvent) => {
        e.preventDefault();
        const modes: SoundType[] = ['click', 'chime', 'beep', 'mute'];
        const currentIndex = modes.indexOf(soundMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        setSoundMode(nextMode);
        
        if (nextMode !== 'mute') {
            // briefly play the new sound
            setTimeout(() => {
                try {
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioCtx) return;
                    const audioCtx = new AudioCtx();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(nextMode === 'chime' ? 1200 : (nextMode === 'beep' ? 880 : 650), audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.1);
                } catch {}
            }, 50);
        }
    };

    return (
        <motion.div 
            id="virtual-keyboard" 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed bottom-0 left-0 right-0 bg-[#161a1d]/95 backdrop-blur-3xl shadow-[0_-25px_60px_rgba(0,0,0,0.65)] border-t border-[var(--accent-gold)]/20 pb-4 pt-3.5 px-4 lg:px-6 z-50 select-none font-sans"
        >
            <div className={`mx-auto ${isNumeric ? 'max-w-md' : 'max-w-5xl'}`}>
                
                {/* Mirror Display + Control Header */}
                <div className="flex flex-col gap-2.5 mb-2.5">
                    {/* The Live typing mirror */}
                    <div className="w-full bg-[#1c2225] border border-neutral-800 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-inner">
                        <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider select-none shrink-0 border-r border-neutral-800 pr-2.5 ml-2.5">
                            نوسراو
                        </span>
                        <div className="flex-1 text-right truncate text-white font-extrabold text-sm font-mono flex items-center justify-end gap-1 px-1">
                            {inputRef.current?.value || <span className="text-neutral-600 text-xs font-normal">هیچ نەنوسراوە...</span>}
                            <motion.span 
                                animate={{ opacity: [1, 0, 1] }} 
                                transition={{ repeat: Infinity, duration: 1 }} 
                                className="inline-block w-1.5 h-4 bg-[var(--accent-gold)] rounded-sm shrink-0" 
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 px-2 bg-gradient-to-br from-[var(--accent-gold)] to-[#A37B4D] text-neutral-950 rounded-lg shadow-lg font-black text-[9px] flex items-center gap-1.5 antialiased">
                                <Keyboard size={12} className="stroke-[3]" />
                                <span className="tracking-widest">MAS MENU V-KEY</span>
                            </div>
                            {/* Sound cycle control */}
                            <button 
                                onMouseDown={cycleSoundMode}
                                className="flex items-center gap-1 bg-[#1c2225] hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg px-2 py-1 text-[10px] font-extrabold transition-all active:scale-95"
                                title="دەنگی دوگمەکان"
                            >
                                <Volume2 size={12} className={soundMode !== 'mute' ? 'text-[var(--accent-gold)]' : 'text-neutral-600'} />
                                <span>{soundMode === 'mute' ? 'دەنگ: بێدەنگ' : `دەنگ: ${soundMode === 'click' ? 'میکانیکی' : soundMode === 'chime' ? 'چایم' : 'بیپ'}`}</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isNumeric && (
                                <button 
                                    onMouseDown={(e) => { e.preventDefault(); playSoundEffect(); setLanguage(lang => lang === 'ku' ? 'en' : 'ku'); }}
                                    className="flex items-center gap-1.5 bg-[#1c2225] hover:bg-neutral-800 hover:text-[var(--accent-gold)] border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-black text-neutral-300 transition-all active:scale-95 shadow-md"
                                >
                                    <Globe size={13} className={language === 'ku' ? 'text-[var(--accent-gold)]' : 'text-sky-400'} />
                                    {language === 'ku' ? 'کوردی (KU)' : 'English (EN)'}
                                </button>
                            )}
                            <button 
                                onClick={(e) => { playSoundEffect(); onClose(); }}
                                className="p-1 px-2.5 bg-neutral-900/30 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 rounded-xl transition-all border border-neutral-800 hover:border-rose-950/40 active:scale-95 flex items-center gap-1 font-bold text-xs"
                                title="داخستن"
                            >
                                <span>داخستن</span>
                                <X size={13} className="stroke-[3.5]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Intelligent Dynamic Suggestions Track */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-1 text-[9px] text-[#A37B4D] font-extrabold shrink-0 bg-[#A37B4D]/5 px-2 py-1 rounded-lg border border-[var(--accent-gold)]/15 ml-1">
                        <Sparkles size={10} className="text-[var(--accent-gold)]" />
                        <span>خێرا نوسین:</span>
                    </div>
                    {isNumeric 
                        ? numericSuggestions.map(num => (
                            <button
                                key={num}
                                onMouseDown={(e) => handleSuggestionClick(num, e)}
                                className="bg-gradient-to-b from-[#1c2225] to-neutral-900 hover:from-neutral-800 hover:to-neutral-850 text-emerald-400 hover:text-emerald-300 border border-neutral-800 font-bold font-mono text-[11px] px-3 py-1.5 rounded-lg transition-all active:scale-95 shrink-0 shadow-sm"
                            >
                                +{num.toLocaleString('en-US')}
                            </button>
                          ))
                        : textSuggestions.map(word => (
                            <button
                                key={word}
                                onMouseDown={(e) => handleSuggestionClick(word, e)}
                                className="bg-gradient-to-b from-[#1c2225] to-neutral-900 hover:from-neutral-800 hover:to-neutral-850 text-neutral-200 hover:text-[var(--accent-gold)] border border-neutral-800 font-bold text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95 shrink-0 shadow-sm"
                            >
                                {word}
                            </button>
                          ))
                    }
                </div>

                {/* Keyboard keys layout panel */}
                <div className="flex flex-col gap-2">
                    {layout.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-1 lg:gap-1.5 w-full">
                            {!isNumeric && rowIndex === (language === 'ku' ? 3 : 3) && language === 'en' && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); playSoundEffect(); setIsShift(!isShift); }}
                                    className={`px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center active:scale-95 border-2 ${isShift ? 'bg-gradient-to-br from-[var(--accent-gold)] to-[#A37B4D] text-neutral-950 border-[var(--accent-gold)] shadow-lg' : 'bg-[#1c2225] hover:bg-neutral-800 text-neutral-200 border-neutral-800'}`}
                                >
                                    <ArrowUp size={16} className={isShift ? "stroke-[3.5]" : "stroke-[2.5]"} />
                                </button>
                            )}
                            
                            {row.map((key, keyIndex) => {
                                if (key === '') return <div key={keyIndex} className={isNumeric ? 'flex-1 max-w-[100px]' : ''}></div>;
                                
                                const isAction = key === 'Space' || key === 'Clear' || key === 'Delete';
                                return (
                                    <motion.button
                                        key={key}
                                        whileTap={{ scale: 0.92, y: 1 }}
                                        onMouseDown={(e) => key === 'Delete' ? handleDelete(e) : handleKeyPress(key, e)}
                                        className={`
                                            ${key === 'Space' ? 'w-[75%] lg:w-[480px] bg-[#1c2225] text-neutral-300 font-bold' : 
                                              (isNumeric ? 'flex-1 h-12 lg:h-[68px] max-w-[110px] bg-[#1c2225] border border-neutral-800 text-neutral-100 font-mono' : 
                                              'w-8.5 h-11 lg:w-[60px] lg:h-[60px] bg-[#1b2023] border border-neutral-800/80 text-neutral-100')}
                                            ${key === 'Clear' ? '!bg-gradient-to-br !from-rose-950/50 !to-rose-900/40 !text-rose-400 hover:!from-rose-800 hover:!to-rose-900 hover:!text-white !border-rose-950/60' : 
                                              key === 'Delete' ? '!bg-gradient-to-br !from-neutral-850 !to-neutral-900 !text-neutral-400 hover:!from-neutral-700 hover:!to-neutral-750 hover:!text-white !border-neutral-800' :
                                              key === 'Space' ? 'hover:bg-neutral-800 hover:text-[var(--accent-gold)]' :
                                              'hover:bg-neutral-800 hover:text-[var(--accent-gold)] active:bg-[var(--accent-gold)] active:text-neutral-950'}
                                            font-black ${isNumeric && !isAction ? 'text-lg lg:text-xl' : 'text-xs lg:text-[14px]'}
                                            rounded-xl lg:rounded-2xl transition-all flex items-center justify-center focus:outline-none 
                                            border border-neutral-800/70 shadow-md transform
                                            ${lastPressedKey === key ? 'bg-[var(--accent-gold)] !text-black border-[var(--accent-gold)]' : ''}
                                        `}
                                    >
                                        {key === 'Space' ? 'بۆشایی SPACE' : 
                                         key === 'Delete' ? <Delete size={15} className="stroke-[2.5]" /> : 
                                         key === 'Clear' ? 'CLEAR' : 
                                         (isShift && language === 'en' ? key.toUpperCase() : key)}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
