import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
    value: string; // Format: "HH:mm"
    onChange: (time: string) => void;
    label?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse hour and minute from value
    const [hour, minute] = value ? value.split(':').map(Number) : [0, 0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatTime = (h: number, m: number) => {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const formatDisplay = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    const handleHourChange = (delta: number) => {
        const newHour = (hour + delta + 24) % 24;
        onChange(formatTime(newHour, minute));
    };

    const handleMinuteChange = (delta: number) => {
        const newMinute = (minute + delta + 60) % 60;
        onChange(formatTime(hour, newMinute));
    };

    const handleQuickTime = (h: number, m: number) => {
        onChange(formatTime(h, m));
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="text-sm font-medium text-slate-300 mb-2 block">{label}</label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-800 border ${isOpen ? 'border-primary ring-1 ring-primary/50' : 'border-slate-700 hover:border-slate-600'} text-white px-4 py-3 rounded-xl transition-all flex items-center justify-between group`}
            >
                <span className="font-mono text-lg tracking-wider">
                    {formatDisplay(hour, minute)}
                </span>
                <Clock size={18} className={`transition-colors ${isOpen ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 animate-scale-in origin-top">
                    {/* Time Spinner */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                        {/* Hour Spinner */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleHourChange(1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronUp size={20} />
                            </button>
                            <div className="w-16 h-14 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                <span className="text-2xl font-mono font-bold text-white">
                                    {String(hour).padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleHourChange(-1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronDown size={20} />
                            </button>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hour</span>
                        </div>

                        <span className="text-3xl text-slate-600 font-bold pb-6">:</span>

                        {/* Minute Spinner */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleMinuteChange(1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronUp size={20} />
                            </button>
                            <div className="w-16 h-14 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                <span className="text-2xl font-mono font-bold text-white">
                                    {String(minute).padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleMinuteChange(-1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronDown size={20} />
                            </button>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Min</span>
                        </div>
                    </div>

                    {/* Quick Time Buttons */}
                    <div className="pt-4 border-t border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Quick Select</div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { h: 6, m: 0, label: 'Morning' },
                                { h: 12, m: 0, label: 'Noon' },
                                { h: 18, m: 0, label: 'Evening' },
                                { h: 22, m: 0, label: 'Night' },
                                { h: 0, m: 0, label: 'Midnight' },
                                { h: 2, m: 0, label: 'Late' },
                            ].map(({ h, m, label }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => handleQuickTime(h, m)}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all border
                                        ${hour === h && minute === m
                                            ? 'bg-primary/20 text-primary border-primary/30'
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
