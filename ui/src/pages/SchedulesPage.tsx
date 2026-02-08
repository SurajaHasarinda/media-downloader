import { useState, useEffect } from 'react';
import {
    Clock,
    Plus,
    Trash2,

    Loader2,
    RefreshCw,
    Calendar,
    Settings,
    Zap,
    X,
    Check,
    Monitor
} from 'lucide-react';
import { api, Schedule, ScheduleCreate } from '../api';
import Snackbar, { SnackbarType } from '../components/Snackbar';
import ConfirmDialog from '../components/ConfirmDialog';
import TimePicker from '../components/TimePicker';

const SchedulesPage = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [runningId, setRunningId] = useState<number | null>(null);

    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        scheduleId: number;
        name: string;
    }>({
        isOpen: false,
        scheduleId: 0,
        name: '',
    });

    // Form state
    const [formData, setFormData] = useState<ScheduleCreate>({
        name: '',
        hour: 2,
        minute: 0,
        max_size_gb: 2.0,
        min_quality: 720,
        enabled: true,
    });

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const data = await api.getSchedules();
            setSchedules(data);
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to load schedules', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSchedule) {
                await api.updateSchedule(editingSchedule.id, {
                    name: formData.name,
                    hour: formData.hour,
                    minute: formData.minute,
                    max_size_gb: formData.max_size_gb,
                    min_quality: formData.min_quality,
                    enabled: formData.enabled,
                });
                setSnackbar({ isOpen: true, message: 'Schedule updated', type: 'success' });
            } else {
                await api.createSchedule(formData);
                setSnackbar({ isOpen: true, message: 'Schedule created', type: 'success' });
            }
            setShowModal(false);
            setEditingSchedule(null);
            resetForm();
            fetchSchedules();
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to save schedule';
            setSnackbar({ isOpen: true, message: msg, type: 'error' });
        }
    };

    const handleToggle = async (schedule: Schedule) => {
        try {
            await api.toggleSchedule(schedule.id);
            fetchSchedules();
            setSnackbar({
                isOpen: true,
                message: `Schedule ${schedule.enabled ? 'disabled' : 'enabled'}`,
                type: 'success',
            });
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to toggle schedule', type: 'error' });
        }
    };

    const handleRunNow = async (schedule: Schedule) => {
        setRunningId(schedule.id);
        try {
            await api.runScheduleNow(schedule.id);
            setSnackbar({ isOpen: true, message: 'Processing started', type: 'success' });
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to start processing', type: 'error' });
        } finally {
            setRunningId(null);
        }
    };

    const handleDeleteClick = (scheduleId: number, name: string) => {
        setConfirmDialog({ isOpen: true, scheduleId, name });
    };

    const handleConfirmDelete = async () => {
        try {
            await api.deleteSchedule(confirmDialog.scheduleId);
            setSnackbar({ isOpen: true, message: 'Schedule deleted', type: 'success' });
            fetchSchedules();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to delete schedule', type: 'error' });
        } finally {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            name: schedule.name,
            hour: schedule.cron_hour,
            minute: schedule.cron_minute,
            max_size_gb: schedule.max_size_gb,
            min_quality: schedule.min_quality,
            enabled: schedule.enabled,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            hour: 2,
            minute: 0,
            max_size_gb: 2.0,
            min_quality: 720,
            enabled: true,
        });
    };

    const openNewModal = () => {
        setEditingSchedule(null);
        resetForm();
        setShowModal(true);
    };

    const formatTime = (hour: number, minute: number) => {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const formatNextRun = (nextRun?: string) => {
        if (!nextRun) return 'Not scheduled';
        const date = new Date(nextRun);
        return date.toLocaleString();
    };

    const formatLastRun = (lastRun?: string) => {
        if (!lastRun) return 'Never';
        const date = new Date(lastRun);
        return date.toLocaleString();
    };

    const qualityOptions = [
        { value: 480, label: '480p' },
        { value: 720, label: '720p' },
        { value: 1080, label: '1080p' },
        { value: 2160, label: '4K' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Calendar className="text-primary" size={24} />
                        Schedules
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">
                        Automate wishlist processing
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={fetchSchedules}
                        disabled={loading}
                        className="p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={openNewModal}
                        className="flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all text-sm sm:text-base"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Schedule</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Schedules List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={40} className="text-primary animate-spin" />
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-16 sm:py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <Clock size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No schedules yet</h3>
                    <p className="text-sm text-slate-500 mt-1">Create a schedule to automate processing</p>
                    <button
                        onClick={openNewModal}
                        className="mt-4 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all"
                    >
                        Create Schedule
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {schedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className={`bg-slate-900 rounded-xl border transition-all ${schedule.enabled
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-slate-800 opacity-60'
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                                {/* Schedule Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${schedule.enabled ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'
                                            }`}>
                                            <Clock size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white truncate">{schedule.name}</h3>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatTime(schedule.cron_hour, schedule.cron_minute)} daily
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Settings size={12} />
                                                    {qualityOptions.find(q => q.value === schedule.min_quality)?.label || schedule.min_quality + 'p'} / {schedule.max_size_gb}GB
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Next/Last Run */}
                                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                                        <span>
                                            <span className="text-slate-600">Next:</span>{' '}
                                            <span className="text-slate-400">{formatNextRun(schedule.next_run)}</span>
                                        </span>
                                        <span>
                                            <span className="text-slate-600">Last:</span>{' '}
                                            <span className="text-slate-400">{formatLastRun(schedule.last_run)}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleRunNow(schedule)}
                                        disabled={runningId === schedule.id}
                                        className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors disabled:opacity-50"
                                        title="Run Now"
                                    >
                                        {runningId === schedule.id ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Zap size={18} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleToggle(schedule)}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${schedule.enabled ? 'bg-primary' : 'bg-slate-700'}`}
                                        title={schedule.enabled ? 'Disable' : 'Enable'}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${schedule.enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(schedule)}
                                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                        title="Edit"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(schedule.id, schedule.name)}
                                        className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowModal(false);
                    }}
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div
                        className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-white mb-4">
                                    {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
                                </h2>

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Daily Night Scan"
                                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-500"
                                            required
                                        />
                                    </div>



                                    {/* Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                                        <TimePicker
                                            value={`${String(formData.hour).padStart(2, '0')}:${String(formData.minute).padStart(2, '0')}`}
                                            onChange={(time) => {
                                                const [h, m] = time.split(':').map(Number);
                                                setFormData({ ...formData, hour: h, minute: m });
                                            }}
                                        />
                                    </div>

                                    {/* Quality */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Quality</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {qualityOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, min_quality: opt.value })}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${formData.min_quality === opt.value
                                                        ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary/50'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                                        }`}
                                                >
                                                    <Monitor size={20} className="mb-2" />
                                                    <span className="font-semibold">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Max Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Max Size: {formData.max_size_gb} GB
                                        </label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="10"
                                            step="0.5"
                                            value={formData.max_size_gb}
                                            onChange={(e) => setFormData({ ...formData, max_size_gb: parseFloat(e.target.value) })}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                                            <span>0.5 GB</span>
                                            <span>10 GB</span>
                                        </div>
                                    </div>

                                    {/* Enabled */}
                                    <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl">
                                        <div>
                                            <span className="text-white font-medium">Enabled</span>
                                            <p className="text-xs text-slate-500 mt-0.5">Schedule will run automatically</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                                            className={`w-12 h-7 rounded-full transition-colors relative ${formData.enabled ? 'bg-primary' : 'bg-slate-700'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.enabled ? 'left-6' : 'left-1'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors"
                                >
                                    <Check size={18} />
                                    {editingSchedule ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Schedule"
                message={`Are you sure you want to delete "${confirmDialog.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            {/* Snackbar */}
            <Snackbar
                isOpen={snackbar.isOpen}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
            />
        </div>
    );
};

export default SchedulesPage;
