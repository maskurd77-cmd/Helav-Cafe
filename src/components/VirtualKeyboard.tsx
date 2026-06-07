import React, { useState, useEffect } from 'react';
import { X, Globe, Delete, ArrowUp, Keyboard } from 'lucide-react';

interface VirtualKeyboardProps {
    inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
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
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ['Space']
];

const numericLayout = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.', 'Clear']
];

export function VirtualKeyboard({ inputRef, onChange, onClose }: VirtualKeyboardProps) {
    const [language, setLanguage] = useState<'ku' | 'en'>('ku');
    const [isShift, setIsShift] = useState(false);
    
    // Determine if the current input is intended to be numeric only.
    const isNumeric = inputRef.current?.type === 'number' || inputRef.current?.inputMode === 'numeric';

    const layout = isNumeric ? numericLayout : (language === 'ku' ? kurdishLayout : englishLayout);

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
        } else if (key === 'Clear') {
            onChange('');
        } else {
            const charToAdd = isShift && !isNumeric ? key.toUpperCase() : key;
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
        <div id="virtual-keyboard" className="fixed bottom-0 left-0 right-0 bg-[#F9F7F2]/95 backdrop-blur-md shadow-[0_-10px_40px_rgba(30,36,32,0.15)] border-t border-[#E9E5D9] p-3 lg:p-5 z-50 select-none animate-in slide-in-from-bottom-full duration-300">
            <div className={`mx-auto ${isNumeric ? 'max-w-sm' : 'max-w-5xl'}`}>
                <div className="flex justify-between items-center mb-4 px-2 border-b border-[#E9E5D9]/50 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1E2420] text-[#D4A373] rounded-xl shadow-sm">
                            <Keyboard size={18} />
                        </div>
                        <span className="font-bold text-[#1E2420] text-sm">
                            {isNumeric ? 'تەختەکلیلی ژمارەیی' : 'تەختەکلیلی سیستەم'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isNumeric && (
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); setLanguage(lang => lang === 'ku' ? 'en' : 'ku'); }}
                                className="flex items-center gap-2 bg-white border border-[#E9E5D9] hover:border-[#D4A373] px-3 py-1.5 rounded-xl text-sm font-bold text-[#2D3631] shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                <Globe size={16} className={language === 'ku' ? 'text-[#D4A373]' : 'text-[#8DAA91]'} />
                                {language === 'ku' ? 'کوردی' : 'English'}
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors active:scale-95 border border-red-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    {layout.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2">
                            {!isNumeric && rowIndex === (language === 'ku' ? 2 : 3) && language === 'en' && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); setIsShift(!isShift); }}
                                    className={`px-4 py-3 rounded-2xl shadow-sm font-bold text-sm transition-all focus:outline-none flex items-center justify-center active:scale-95 border ${isShift ? 'bg-[#1E2420] text-[#D4A373] border-[#1E2420]' : 'bg-white text-[#1E2420] border-[#E9E5D9] hover:border-[#D4A373]'}`}
                                >
                                    <ArrowUp size={20} />
                                </button>
                            )}
                            
                            {row.map(key => {
                                const isAction = key === 'Space' || key === 'Clear';
                                return (
                                    <button
                                        key={key}
                                        onMouseDown={(e) => handleKeyPress(key, e)}
                                        className={`
                                            ${key === 'Space' ? 'w-64 lg:w-[500px]' : (isNumeric ? 'w-20 h-16' : 'w-10 h-12 lg:w-14 lg:h-14')}
                                            ${key === 'Clear' ? 'bg-[#E11D48]/10 text-[#E11D48] hover:bg-[#E11D48]/20 border-transparent w-20 h-16' : 'bg-white hover:bg-[#1E2420] hover:text-[#D4A373] text-[#1E2420] border-[#E9E5D9] border'}
                                            font-black ${isNumeric ? 'text-2xl' : 'text-xl'}
                                            rounded-2xl shadow-sm active:scale-90 active:shadow-none
                                            transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#D4A373]
                                        `}
                                    >
                                        {key === 'Space' ? 'بۆشایی Space' : (isShift && language === 'en' ? key.toUpperCase() : key)}
                                    </button>
                                );
                            })}

                            {((!isNumeric && rowIndex === (language === 'ku' ? 2 : 3)) || (isNumeric && rowIndex === 0)) && (
                                <button
                                    onMouseDown={handleDelete}
                                    className={`px-4 lg:px-5 py-3 rounded-2xl bg-[#E11D48] text-white hover:bg-red-700 shadow-md font-bold transition-all flex items-center justify-center active:scale-95 focus:outline-none`}
                                >
                                    <Delete size={24} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
