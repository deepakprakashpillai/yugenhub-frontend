import { useState, useEffect, useRef } from 'react';
import { Settings, RefreshCw, Save, User, Users, AlertTriangle, FileText, Clock, Play, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import * as commApi from '../../api/communications';
import { getClients } from '../../api/clients';
import api from '../../api/axios';

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({ tpl, onSaved, theme }) {
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState(tpl.body_template);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const textareaRef = useRef(null);

    const insertVariable = (v) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newBody = body.slice(0, start) + `{{${v}}}` + body.slice(end);
        setBody(newBody);
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + v.length + 4;
            el.focus();
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await commApi.saveTemplate(tpl.alert_type, body);
            toast.success('Template saved');
            onSaved(tpl.alert_type, body, true);
            setOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await commApi.resetTemplate(tpl.alert_type);
            toast.success('Reset to default');
            setBody(tpl.default_template);
            onSaved(tpl.alert_type, tpl.default_template, false);
            setOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Reset failed');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-xl overflow-hidden`}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${theme.text.primary}`}>{tpl.label}</span>
                    {tpl.is_custom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">custom</span>
                    )}
                </div>
                {open ? <ChevronUp size={13} className={theme.text.secondary} /> : <ChevronDown size={13} className={theme.text.secondary} />}
            </button>

            {open && (
                <div className={`border-t ${theme.canvas.border} p-4 space-y-3`}>
                    {/* Variable pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {tpl.variables.map(v => (
                            <button
                                key={v}
                                onClick={() => insertVariable(v)}
                                className={`text-[10px] px-2 py-0.5 rounded-md border ${theme.canvas.border} ${theme.text.secondary} hover:text-accent hover:border-accent/30 transition-colors font-mono`}
                            >
                                {`{{${v}}}`}
                            </button>
                        ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={10}
                        className={`w-full font-mono text-xs ${theme.canvas.card} border ${theme.canvas.border} rounded-xl px-3 py-2.5 ${theme.text.primary} resize-none focus:outline-none focus:border-violet-500/40 whitespace-pre-wrap`}
                        style={{ whiteSpace: 'pre-wrap' }}
                    />

                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={handleReset}
                            disabled={resetting || !tpl.is_custom}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${theme.canvas.border} ${theme.text.secondary} hover:text-white disabled:opacity-40 transition-colors`}
                        >
                            <RotateCcw size={11} className={resetting ? 'animate-spin' : ''} />
                            Reset to default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors font-medium"
                        >
                            {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Scheduler Card ───────────────────────────────────────────────────────────

function SchedulerCard({ title, enabledKey, thresholdKey, thresholdLabel, jobName, config, onToggle, onThreshold, onRunNow, theme }) {
    const enabled = config[enabledKey] ?? true;
    const threshold = config[thresholdKey] ?? (jobName === 'task_deadline' ? 24 : 3);
    const [running, setRunning] = useState(false);

    const handleRunNow = async () => {
        setRunning(true);
        try {
            const result = await commApi.runSchedulerNow(jobName);
            toast.success(`Scan complete — ${result.queued} message${result.queued !== 1 ? 's' : ''} queued`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Scan failed');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-xl p-4 space-y-3`}>
            <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${theme.text.primary}`}>{title}</p>
                <button
                    onClick={() => onToggle(enabledKey, !enabled)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-zinc-700'}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`} />
                </button>
            </div>

            {enabled && (
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${theme.text.secondary}`}>{thresholdLabel}</span>
                    <input
                        type="number"
                        min={1}
                        max={jobName === 'task_deadline' ? 168 : 30}
                        value={threshold}
                        onChange={e => onThreshold(thresholdKey, parseInt(e.target.value) || 1)}
                        className={`w-16 text-xs px-2 py-1 rounded-lg border ${theme.canvas.border} ${theme.canvas.card} ${theme.text.primary} outline-none focus:border-violet-500/40`}
                    />
                    <span className={`text-[11px] ${theme.text.secondary}`}>
                        {jobName === 'task_deadline' ? 'hours' : 'days'} before
                    </span>
                </div>
            )}

            <button
                onClick={handleRunNow}
                disabled={running || !enabled}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${theme.canvas.border} ${theme.text.secondary} hover:text-white disabled:opacity-40 transition-colors`}
            >
                {running ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                {running ? 'Running…' : 'Run now'}
            </button>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SettingsTab({ theme }) {
    // eslint-disable-next-line no-unused-vars
    const [settings, setSettings] = useState(null);
    const [alertTypes, setAlertTypes] = useState([]);
    const [clients, setClients] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [globalEnabled, setGlobalEnabled] = useState([]);
    const [clientOverrides, setClientOverrides] = useState({});
    const [operatorOverrides, setOperatorOverrides] = useState({});

    const [templates, setTemplates] = useState([]);
    const [schedulerConfig, setSchedulerConfig] = useState({});
    const [savingScheduler, setSavingScheduler] = useState(false);
    const [teamNotificationsEnabled, setTeamNotificationsEnabled] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [s, types, cls, team, tpls, sched] = await Promise.all([
                    commApi.getSettings(),
                    commApi.getAlertTypes(),
                    getClients(),
                    api.get('/settings/team').then(r => r.data).catch(() => []),
                    commApi.getTemplates().catch(() => []),
                    commApi.getSchedulerConfig().catch(() => ({})),
                ]);
                setSettings(s);
                setAlertTypes(types);
                setClients(Array.isArray(cls) ? cls : (cls.data || []));
                setTeamMembers(Array.isArray(team) ? team : []);
                setGlobalEnabled(s.globally_enabled_types || types.map(t => t.value));
                setClientOverrides(s.client_overrides || {});
                setOperatorOverrides(s.operator_overrides || {});
                setTeamNotificationsEnabled(s.team_notifications_enabled ?? true);
                setTemplates(tpls);
                setSchedulerConfig(sched);
            } catch {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await commApi.updateSettings({
                globally_enabled_types: globalEnabled,
                client_overrides: clientOverrides,
                operator_overrides: operatorOverrides,
                team_notifications_enabled: teamNotificationsEnabled,
            });
            toast.success('Settings saved');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleGlobalType = (type) => {
        setGlobalEnabled(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const getClientOverride = (cid) => clientOverrides[cid] || { excluded: false, disabled_types: [] };
    const setClientOverride = (cid, val) => setClientOverrides(prev => ({ ...prev, [cid]: val }));

    const getOpOverride = (uid) => operatorOverrides[uid] || { excluded: false, hidden_types: [] };
    const setOpOverride = (uid, val) => setOperatorOverrides(prev => ({ ...prev, [uid]: val }));

    const handleTemplateSaved = (alertType, bodyTemplate, isCustom) => {
        setTemplates(prev => prev.map(t =>
            t.alert_type === alertType ? { ...t, body_template: bodyTemplate, is_custom: isCustom } : t
        ));
    };

    const handleSchedulerToggle = (key, value) => {
        setSchedulerConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSchedulerThreshold = (key, value) => {
        setSchedulerConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveScheduler = async () => {
        setSavingScheduler(true);
        try {
            await commApi.updateSchedulerConfig({
                task_deadline_enabled: schedulerConfig.task_deadline_enabled ?? true,
                task_deadline_hours_before: schedulerConfig.task_deadline_hours_before ?? 24,
                invoice_scan_enabled: schedulerConfig.invoice_scan_enabled ?? true,
                invoice_due_soon_days_before: schedulerConfig.invoice_due_soon_days_before ?? 3,
            });
            toast.success('Scheduler settings saved');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save scheduler config');
        } finally {
            setSavingScheduler(false);
        }
    };

    if (loading) {
        return (
            <div className="py-16 text-center">
                <RefreshCw size={20} className={`animate-spin mx-auto ${theme.text.secondary}`} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Global alert types */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <Settings size={15} className="text-violet-400" />
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Globally Enabled Alert Types</h3>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Uncheck a type to stop generating those messages entirely for your agency.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {alertTypes.map(type => {
                        const on = globalEnabled.includes(type.value);
                        return (
                            <button
                                key={type.value}
                                onClick={() => toggleGlobalType(type.value)}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition-all ${on
                                    ? 'bg-violet-500/10 border-violet-500/25'
                                    : `${theme.canvas.bg} border-zinc-700 opacity-50`
                                    }`}
                            >
                                <span className={`text-xs font-medium ${on ? 'text-violet-300' : theme.text.secondary}`}>
                                    {type.label}
                                </span>
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${on ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'}`}>
                                    {on && <span className="text-white text-[9px]">✓</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Template editor */}
            {templates.length > 0 && (
                <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={15} className="text-emerald-400" />
                        <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Message Templates</h3>
                    </div>
                    <p className={`text-xs ${theme.text.secondary} mb-4`}>
                        Customise the WhatsApp message body for each alert type. Use{' '}
                        <span className="font-mono text-accent/80">{'{{variable}}'}</span> placeholders for dynamic values.
                    </p>
                    <div className="space-y-2">
                        {templates.map(tpl => (
                            <TemplateEditor
                                key={tpl.alert_type}
                                tpl={tpl}
                                onSaved={handleTemplateSaved}
                                theme={theme}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Automation schedule */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={15} className="text-amber-400" />
                        <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Automation Schedule</h3>
                    </div>
                    <button
                        onClick={handleSaveScheduler}
                        disabled={savingScheduler}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                        {savingScheduler ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                        Save
                    </button>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Configure when automated reminders are sent. "Run now" triggers an immediate scan for your agency.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SchedulerCard
                        title="Task Deadline Reminders"
                        enabledKey="task_deadline_enabled"
                        thresholdKey="task_deadline_hours_before"
                        thresholdLabel="Warn"
                        jobName="task_deadline"
                        config={schedulerConfig}
                        onToggle={handleSchedulerToggle}
                        onThreshold={handleSchedulerThreshold}
                        theme={theme}
                    />
                    <SchedulerCard
                        title="Invoice Reminders"
                        enabledKey="invoice_scan_enabled"
                        thresholdKey="invoice_due_soon_days_before"
                        thresholdLabel="Warn"
                        jobName="invoice"
                        config={schedulerConfig}
                        onToggle={handleSchedulerToggle}
                        onThreshold={handleSchedulerThreshold}
                        theme={theme}
                    />
                </div>
            </section>

            {/* Team notifications */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users size={15} className="text-teal-400" />
                        <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Team Notifications</h3>
                    </div>
                    <button
                        onClick={() => setTeamNotificationsEnabled(v => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${teamNotificationsEnabled ? 'bg-teal-600' : 'bg-zinc-700'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${teamNotificationsEnabled ? 'translate-x-4' : ''}`} />
                    </button>
                </div>
                <p className={`text-xs ${theme.text.secondary}`}>
                    When enabled, associates are notified via WhatsApp when tasks are assigned to them and as deadlines approach.
                    Uses the <span className="font-mono text-accent/80">phone_number</span> field on each associate record.
                </p>
            </section>

            {/* Per-client overrides */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <Users size={15} className="text-blue-400" />
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Per-Client Overrides</h3>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Exclude a client entirely or disable specific alert types for them.
                </p>
                <div className="space-y-3">
                    {clients.map(client => {
                        const cid = client._id;
                        const ov = getClientOverride(cid);
                        return (
                            <div key={cid} className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-xl p-4`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className={`text-xs font-semibold ${theme.text.primary}`}>{client.name}</p>
                                        <p className={`text-[10px] ${theme.text.secondary}`}>{client.whatsapp_number || client.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => setClientOverride(cid, { ...ov, excluded: !ov.excluded })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium border transition-all ${ov.excluded
                                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                            : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                            }`}
                                    >
                                        <AlertTriangle size={10} />
                                        {ov.excluded ? 'Excluded' : 'Exclude'}
                                    </button>
                                </div>
                                {!ov.excluded && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {alertTypes.map(type => {
                                            const disabled = (ov.disabled_types || []).includes(type.value);
                                            return (
                                                <button
                                                    key={type.value}
                                                    onClick={() => {
                                                        const newDisabled = disabled
                                                            ? ov.disabled_types.filter(t => t !== type.value)
                                                            : [...(ov.disabled_types || []), type.value];
                                                        setClientOverride(cid, { ...ov, disabled_types: newDisabled });
                                                    }}
                                                    className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${disabled
                                                        ? 'bg-red-500/10 border-red-500/25 text-red-400 line-through'
                                                        : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {clients.length === 0 && (
                        <p className={`text-xs ${theme.text.secondary} text-center py-4`}>No clients yet</p>
                    )}
                </div>
            </section>

            {/* Per-operator overrides */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <User size={15} className="text-amber-400" />
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Per-Team-Member Overrides</h3>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Control which alert types are visible to specific team members in their queue view.
                </p>
                <div className="space-y-3">
                    {teamMembers.filter(m => m.role !== 'owner').map(member => {
                        const ov = getOpOverride(member.id);
                        return (
                            <div key={member.id} className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-xl p-4`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className={`text-xs font-semibold ${theme.text.primary}`}>{member.name}</p>
                                        <p className={`text-[10px] ${theme.text.secondary}`}>{member.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setOpOverride(member.id, { ...ov, excluded: !ov.excluded })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium border transition-all ${ov.excluded
                                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                            : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                            }`}
                                    >
                                        <AlertTriangle size={10} />
                                        {ov.excluded ? 'Hidden' : 'Hide all'}
                                    </button>
                                </div>
                                {!ov.excluded && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {alertTypes.map(type => {
                                            const hidden = (ov.hidden_types || []).includes(type.value);
                                            return (
                                                <button
                                                    key={type.value}
                                                    onClick={() => {
                                                        const newHidden = hidden
                                                            ? ov.hidden_types.filter(t => t !== type.value)
                                                            : [...(ov.hidden_types || []), type.value];
                                                        setOpOverride(member.id, { ...ov, hidden_types: newHidden });
                                                    }}
                                                    className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${hidden
                                                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 line-through'
                                                        : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {teamMembers.filter(m => m.role !== 'owner').length === 0 && (
                        <p className={`text-xs ${theme.text.secondary} text-center py-4`}>No team members yet</p>
                    )}
                </div>
            </section>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
                >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving…' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
