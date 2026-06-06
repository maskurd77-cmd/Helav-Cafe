import React, { useState, useEffect } from 'react';
import { X, Globe, Delete, ArrowUp } from 'lucide-react';

interface VirtualKeyboardProps {
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (value: string) => void;
    onClose: () => void;
}

const kurdishLayout = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ڕ', 'ر', 'و', 'ۆ', 'پ', 'د', 'ژ'],
    ['Space']
];

const englishLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ['Space']
];

export function VirtualKeyboard({ inputRef, onChange, onClose }: VirtualKeyboardProps) {
    const [language, setLanguage] = useState<'ku' | 'en'>('ku');
    const [isShift, setIsShift] = useState(false);

    const layout = language === 'ku' ? kurdishLayout : englishLayout;

    useEffect(() => {
        // Prevent click events from taking focus away from the input, or just restore it
        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && e.target instanceof Node) {
                // If it's a click outside the keyboard and outside the input, close it
                const keyboardEl = document.getElementById('virtual-keyboard');
                if (keyboardEl && !keyboardEl.contains(e.target) && !inputRef.current.contains(e.target)) {
                    onClose();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputRef, onClose]);

    const handleKeyPress = (key: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevents input from losing focus
        
        if (!inputRef.current) return;
        
        const input = inputRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        let currentValue = input.value;

        if (key === 'Space') {
            currentValue = currentValue.substring(0, start) + ' ' + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start + 1, start + 1), 0);
        } else {
            const charToAdd = isShift ? key.toUpperCase() : key;
            currentValue = currentValue.substring(0, start) + charToAdd + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start + 1, start + 1), 0);
        }
        input.focus();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!inputRef.current) return;
        
        const input = inputRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        let currentValue = input.value;

        if (start === end && start > 0) {
            currentValue = currentValue.substring(0, start - 1) + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start - 1, start - 1), 0);
        } else if (start !== end) {
            currentValue = currentValue.substring(0, start) + currentValue.substring(end);
            onChange(currentValue);
            setTimeout(() => input.setSelectionRange(start, start), 0);
        }
        input.focus();
    };

    return (
        <div id="virtual-keyboard" className="fixed bottom-0 left-0 right-0 bg-[#E9E5D9] shadow-2xl border-t border-[#D4A373]/30 p-2 lg:p-4 z-50 select-none animate-in slide-in-from-bottom-full duration-300">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-2 px-1">
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); setLanguage(lang => lang === 'ku' ? 'en' : 'ku'); }}
                        className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg text-sm font-bold text-[#2D3631] shadow-sm hover:bg-gray-50"
                    >
                        <Globe size={16} />
                        {language === 'ku' ? 'کوردی' : 'English'}
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-[#2D3631] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {layout.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-1.5">
                            {rowIndex === 2 && language === 'en' && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); setIsShift(!isShift); }}
                                    className={`px-3 py-3 rounded-lg shadow-sm font-bold text-sm transition-colors flex items-center justify-center ${isShift ? 'bg-[#8DAA91] text-white' : 'bg-[#D4A373] text-white'}`}
                                >
                                    <ArrowUp size={18} />
                                </button>
                            )}
                            
                            {row.map(key => (
                                <button
                                    key={key}
                                    onMouseDown={(e) => handleKeyPress(key, e)}
                                    className={`
                                        ${key === 'Space' ? 'w-64 lg:w-[400px]' : 'w-9 h-11 lg:w-12 lg:h-12'}
                                        bg-white hover:bg-gray-50 text-[#1E2420] text-lg lg:text-xl font-bold
                                        rounded-lg shadow-sm active:translate-y-[1px] active:shadow-none
                                        transition-all flex items-center justify-center
                                    `}
                                >
                                    {key === 'Space' ? 'بۆشایی Space' : (isShift && language === 'en' ? key.toUpperCase() : key)}
                                </button>
                            ))}

                            {rowIndex === 2 && (
                                <button
                                    onMouseDown={handleDelete}
                                    className="px-3 lg:px-4 py-3 rounded-lg bg-[#E11D48]/10 text-[#E11D48] hover:bg-[#E11D48]/20 shadow-sm font-bold transition-colors flex items-center justify-center"
                                >
                                    <Delete size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
