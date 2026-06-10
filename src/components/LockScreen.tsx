import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';
import { motion } from 'motion/react';

interface LockScreenProps {
  onUnlock: () => void;
  correctPin: string;
}

export function LockScreen({ onUnlock, correctPin }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (success) return;
      
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        handlePadClick(key);
      } else if (key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, success]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 200); // Wait for success animation
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 250);
      }
    }
  }, [pin, correctPin, onUnlock]);

  const handlePadClick = (num: string) => {
    if (pin.length < 4 && !success) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    if (!success) {
      setPin(prev => prev.slice(0, -1));
      setError(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-[32px] z-[99999] flex flex-col items-center justify-center p-4 selection:bg-transparent"
    >
      {/* Ambient background glow dots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-gold)]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8DAA91]/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <motion.div 
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center max-w-sm w-full"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              animate={{ 
                scale: success ? 1.1 : 1,
                color: success ? '#8DAA91' : error ? '#EF4444' : 'var(--accent-gold)',
                backgroundColor: success ? 'rgba(141, 170, 145, 0.1)' : error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)'
              }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-lg shadow-black/40"
            >
              {success ? (
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                  <Unlock size={28} />
                </motion.div>
              ) : (
                <Lock size={28} />
              )}
            </motion.div>
            
            <h2 className="text-xl font-bold text-white mb-2 font-['Cairo'] tracking-wide">
              {success ? 'کرایەوە' : 'شاشەی داخراوە'}
            </h2>
            <p className="text-sm text-gray-400 font-['Cairo']">
              {error ? (
                <span className="text-red-400">پێن کۆد هەڵەیە، دووبارە تاقیبکەرەوە</span>
              ) : success ? (
                <span className="text-[#8DAA91]">بەخێربێیتەوە</span>
              ) : (
                "تکایە پێن کۆد داخڵ بکە"
              )}
            </p>
          </div>

          {/* Dots Indicator with Shake on Error */}
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-6 mb-14"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i} 
                className="relative w-4 h-4 flex items-center justify-center"
              >
                {/* Empty outline */}
                <div className={`absolute inset-0 rounded-full border-2 transition-colors ${error ? 'border-red-500' : 'border-white/20'}`}></div>
                
                {/* Filled inner */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: i < pin.length ? 1 : 0,
                    opacity: i < pin.length ? 1 : 0,
                    backgroundColor: error ? '#EF4444' : success ? '#8DAA91' : 'var(--accent-gold)'
                  }}
                  className="w-[calc(100%+0px)] h-[calc(100%+0px)] rounded-full"
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px]" dir="ltr">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, backgroundColor: "rgba(255,255,255,0.1)" }}
                key={num}
                onClick={() => handlePadClick(num.toString())}
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light text-white font-mono transition-colors select-none bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 shadow-sm"
              >
                {num}
              </motion.button>
            ))}
            
            <div className="w-20 h-20"></div> {/* Spacer */}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, backgroundColor: "rgba(255,255,255,0.1)" }}
              onClick={() => handlePadClick('0')}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light text-white font-mono transition-colors select-none bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 shadow-sm"
            >
              0
            </motion.button>
            
            <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95, backgroundColor: "rgba(239, 68, 68, 0.15)" }}
              onClick={handleDelete}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.02] transition-colors select-none"
            >
              <Delete size={28} strokeWidth={1.5} />
            </motion.button>
          </div>
          
      </motion.div>
    </motion.div>
  );
}
