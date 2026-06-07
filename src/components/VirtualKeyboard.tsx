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
    ['ظ', 'ط', 'ز', 'ڕ', 'ر', 'و', 'ۆ', 'پ', 'د', 'ژ', 'Delete'],
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
        
        if (!key || !inputRef.current) return;
        
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
            setTimeout(() => input.setSelectionRange(start + charToAdd.length, start + charToAdd.length), 0);
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
        <div id="virtual-keyboard" className="fixed bottom-0 left-0 right-0 bg-[#Fdfbf7]/90 backdrop-blur-2xl shadow-[0_-20px_60px_rgba(30,36,32,0.15)] border-t border-[#D4A373]/30 p-4 lg:p-6 z-50 select-none animate-in slide-in-from-bottom-full duration-500 ease-out">
            <div className={`mx-auto ${isNumeric ? 'max-w-md' : 'max-w-5xl'}`}>
                <div className="flex justify-between items-center mb-5 px-4 bg-white/50 py-3 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-xl shadow-md border border-[#D4A373]/20">
                            <Keyboard size={20} />
                        </div>
                        <span className="font-black tracking-tight text-[#1E2420] text-base drop-shadow-sm">
                            {isNumeric ? 'تەختەکلیلی پێشکەوتووی ژمارەیی' : 'تەختەکلیلی پێشکەوتووی سیستەم'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isNumeric && (
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); setLanguage(lang => lang === 'ku' ? 'en' : 'ku'); }}
                                className="flex items-center gap-2 bg-gradient-to-b from-white to-[#F9F7F2] border border-[#E9E5D9] hover:border-[#D4A373] px-4 py-2 rounded-xl text-sm font-black text-[#2D3631] shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                <Globe size={18} className={language === 'ku' ? 'text-[#D4A373]' : 'text-[#8DAA91]'} />
                                {language === 'ku' ? 'کوردی (KU)' : 'English (EN)'}
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 border border-red-200 hover:border-red-600"
                        >
                            <X size={20} className="stroke-[2.5]" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {layout.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 lg:gap-3 w-full">
                            {!isNumeric && rowIndex === (language === 'ku' ? 2 : 3) && language === 'en' && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); setIsShift(!isShift); }}
                                    className={`px-5 py-3.5 rounded-[18px] shadow-sm font-bold text-sm transition-all focus:outline-none flex items-center justify-center active:scale-95 border-2 ${isShift ? 'bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] border-[#1E2420] shadow-inner' : 'bg-white text-[#1E2420] border-[#E9E5D9] hover:border-[#D4A373] hover:shadow-md'}`}
                                >
                                    <ArrowUp size={22} className={isShift ? "stroke-[3]" : "stroke-[2.5]"} />
                                </button>
                            )}
                            
                            {row.map((key, keyIndex) => {
                                if (key === '') return <div key={keyIndex} className={isNumeric ? 'flex-1 max-w-[100px]' : ''}></div>;
                                
                                const isAction = key === 'Space' || key === 'Clear' || key === 'Delete';
                                return (
                                    <button
                                        key={key}
                                        onMouseDown={(e) => key === 'Delete' ? handleDelete(e) : handleKeyPress(key, e)}
                                        className={`
                                            ${key === 'Space' ? 'w-[70%] lg:w-[600px] bg-white border border-[#E9E5D9] shadow-sm' : 
                                              (isNumeric ? 'flex-1 h-16 lg:h-[85px] max-w-[110px] bg-white border border-[#E9E5D9] shadow-sm' : 
                                              'w-11 h-14 lg:w-[72px] lg:h-[72px] bg-white border border-[#E9E5D9] shadow-sm')}
                                            ${key === 'Clear' ? '!bg-gradient-to-br !from-red-50 !to-red-100 !text-red-500 hover:!from-red-500 hover:!to-red-600 hover:!text-white !border-red-200' : 
                                              key === 'Delete' ? '!bg-gradient-to-br !from-slate-100 !to-slate-200 !text-slate-700 hover:!from-slate-700 hover:!to-slate-800 hover:!text-white !border-slate-300' :
                                              key === 'Space' ? 'hover:border-[#D4A373] text-[#8B8378]' :
                                              'hover:border-[#D4A373] hover:text-[#D4A373] text-[#1E2420]'}
                                            font-black ${isNumeric && !isAction ? 'text-3xl lg:text-4xl' : 'text-2xl'}
                                            rounded-[20px] lg:rounded-[24px] hover:shadow-[0_8px_20px_rgba(212,163,115,0.15)] 
                                            active:scale-95 active:shadow-inner active:translate-y-1
                                            transition-all flex items-center justify-center focus:outline-none
                                        `}
                                    >
                                        {key === 'Space' ? 'بۆشایی SPACE' : 
                                         key === 'Delete' ? <Delete size={28} className={isNumeric ? 'stroke-[2]' : ''} /> : 
                                         key === 'Clear' ? 'C' : 
                                         (isShift && language === 'en' ? key.toUpperCase() : key)}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
