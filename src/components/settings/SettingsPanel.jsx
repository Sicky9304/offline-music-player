import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Volume2, Palette, Music4, Database, Trash2, Sliders, DownloadCloud, FolderOpen,
    Cpu, RefreshCw, FileText, CheckCircle, AlertTriangle
} from "lucide-react";
import { useSettings } from "../../hooks/useSettings";
import { useLibrary } from "../../hooks/useLibrary";
import { usePlayer } from "../../hooks/usePlayer";
import { useToast } from "../ui/Toast.jsx";
import PremiumToggle from "../ui/PremiumToggle.jsx";
import PremiumSlider from "../ui/PremiumSlider.jsx";
import GlassButton from "../ui/GlassButton.jsx";
import { ipc } from "../../utils/ipc.js";

function Card({ title, icon: Icon, children }) {
    return (
        <motion.section whileHover={{ y: -4 }}
            className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-3xl">
            <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                    <Icon className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="space-y-5">{children}</div>
        </motion.section>
    );
}

function Row({ label, desc, children }) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 md:flex-row md:items-center md:justify-between">
            <div>
                <h3 className="font-semibold text-white">{label}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
            </div>
            {children}
        </div>
    );
}

export default function SettingsPanel({ search = "" }) {
    const { settings, updateSetting, resetSettings } = useSettings();
    const { clearHistory } = useLibrary();
    const toast = useToast();

    const { activePresetId, presets, setEqPreset, importEqPreset } = usePlayer();

    const [updaterState, setUpdaterState] = useState({ status: "idle", percent: 0, version: "", error: null });

    useEffect(() => {
        let isMounted = true;

        // Fetch initial status
        const getStatus = async () => {
            try {
                const res = await ipc.updater.status();
                if (res && isMounted) {
                    setUpdaterState(res);
                }
            } catch (e) {
                console.error("Failed to get initial updater status:", e);
            }
        };
        getStatus();

        // Listen for updates
        const unsubscribe = ipc.on("updater:status", (state) => {
            if (isMounted) {
                setUpdaterState(state);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const q = search.toLowerCase().trim();

    const matches = (label, desc) => {
        if (!q) return true;
        return label.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    };

    // Playback Card
    const showVolume = matches("Default Volume", "Player startup volume");
    const showResume = matches("Resume Playback", "Continue where you stopped");
    const showCrossfade = matches("Crossfade", "Smooth transition");
    const showPlaybackCard = showVolume || showResume || showCrossfade;

    // Appearance Card
    const showDynamicTheme = matches("Dynamic Theme", "Match album colors");
    const showAnimations = matches("Animations", "Enable smooth motion");
    const showCompactView = matches("Compact View", "Reduce spacing");
    const showAppearanceCard = showDynamicTheme || showAnimations || showCompactView;

    // Audio Card
    const showDolbyAtmos = matches("Dolby Atmos", "3D virtual sound");
    const showSubtitleSize = matches("Subtitle Size", "Caption size");
    const showAudioCard = showDolbyAtmos || showSubtitleSize;

    // Database Card
    const showClearHistory = matches("Clear History", "Delete listening history");
    const showResetSettings = matches("Reset Settings", "Restore defaults");
    const showDatabaseCard = showClearHistory || showResetSettings;

    // Equalizer Card
    const showActivePreset = matches("Active Equalizer Preset", "Choose your audio frequency profile");
    const showImportPreset = matches("Import Local Preset", "Load a sound profile (.json) from your computer");
    const showOnlinePresets = matches("Online Preset Library", "Download advanced custom sound models from the cloud catalog");
    const showEqualizerCard = showActivePreset || showImportPreset || showOnlinePresets;

    // Updates Card
    const showVersion = matches("App Version", "Check for updates and logs");
    const showCheckUpdates = matches("Check for Updates", "Manually scan for new releases");
    const showUpdatesCard = showVersion || showCheckUpdates || matches("Updates", "auto update") || matches("System", "");

    const hasResults = showPlaybackCard || showAppearanceCard || showAudioCard || showDatabaseCard || showEqualizerCard || showUpdatesCard;

    if (!hasResults) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
            >
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-white">No Settings Found</h3>
                <p className="text-sm text-zinc-400 mt-1">We couldn't find any settings matching "{search}"</p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

            {showPlaybackCard && (
                <Card title="Playback" icon={Volume2}>
                    {showVolume && (
                        <PremiumSlider
                            label="Default Volume"
                            description="Player startup volume"
                            value={settings.defaultVolume}
                            min={0}
                            max={200}
                            suffix=""
                            onChange={val => updateSetting("defaultVolume", val)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}

                    {showResume && (
                        <PremiumToggle
                            label="Resume Playback"
                            description="Continue where you stopped"
                            checked={settings.resumePlayback}
                            onChange={v => updateSetting("resumePlayback", v)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}

                    {showCrossfade && (
                        <PremiumToggle
                            label="Crossfade"
                            description="Smooth transition"
                            checked={settings.crossfade}
                            onChange={v => updateSetting("crossfade", v)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}
                </Card>
            )}

            {showAppearanceCard && (
                <Card title="Appearance" icon={Palette}>
                    {showDynamicTheme && (
                        <PremiumToggle
                            label="Dynamic Theme"
                            description="Match album colors"
                            checked={settings.dynamicTheme}
                            onChange={v => updateSetting("dynamicTheme", v)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}

                    {showAnimations && (
                        <PremiumToggle
                            label="Animations"
                            description="Enable smooth motion"
                            checked={settings.animationsEnabled}
                            onChange={v => updateSetting("animationsEnabled", v)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}

                    {showCompactView && (
                        <PremiumToggle
                            label="Compact View"
                            description="Reduce spacing"
                            checked={settings.compactView}
                            onChange={v => updateSetting("compactView", v)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}
                </Card>
            )}

            {showAudioCard && (
                <Card title="Audio" icon={Music4}>
                    {showDolbyAtmos && (
                        <PremiumToggle
                            label="Dolby Atmos"
                            description="3D virtual sound"
                            checked={settings.dolbyAtmos}
                            onChange={v => updateSetting("dolbyAtmos", v)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}

                    {showSubtitleSize && (
                        <PremiumSlider
                            label="Subtitle Size"
                            description="Caption size"
                            value={settings.subtitleSize}
                            min={12}
                            max={48}
                            suffix="px"
                            onChange={val => updateSetting("subtitleSize", val)}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                        />
                    )}
                </Card>
            )}

            {showDatabaseCard && (
                <Card title="Database" icon={Database}>
                    {showClearHistory && (
                        <Row label="Clear History" desc="Delete listening history">
                            <GlassButton
                                variant="danger"
                                size="sm"
                                onClick={async () => { await clearHistory(); toast.success("History cleared"); }}
                                leftIcon={<Trash2 size={16} />}
                            >
                                Clear
                            </GlassButton>
                        </Row>
                    )}

                    {showResetSettings && (
                        <Row label="Reset Settings" desc="Restore defaults">
                            <GlassButton
                                variant="secondary"
                                size="sm"
                                onClick={() => { resetSettings(); toast.success("Settings reset"); }}
                                className="border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10"
                            >
                                Reset
                            </GlassButton>
                        </Row>
                    )}
                </Card>
            )}

            {showEqualizerCard && (
                <Card title="Sound Preset Studio" icon={Sliders}>
                    {showActivePreset && (
                        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">Active Equalizer Preset</h3>
                                    <p className="text-sm text-zinc-400">Choose your audio frequency profile</p>
                                </div>
                                <select
                                    value={activePresetId}
                                    onChange={(e) => setEqPreset(e.target.value)}
                                    className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                                >
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {showImportPreset && (
                        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">Import Local Preset</h3>
                                    <p className="text-sm text-zinc-400">Load a sound profile (.json) from your computer</p>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        id="preset-import-file"
                                        accept=".json"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                try {
                                                    const presetData = JSON.parse(event.target.result);
                                                    if (!presetData.gains || !Array.isArray(presetData.gains) || presetData.gains.length !== 5) {
                                                        throw new Error("Invalid preset structure: gains must be an array of 5 numbers");
                                                    }
                                                    importEqPreset(presetData);
                                                    toast.success("Sound preset imported and applied!");
                                                } catch (err) {
                                                    toast.error("Failed to import preset: " + err.message);
                                                }
                                            };
                                            reader.readAsText(file);
                                            e.target.value = "";
                                        }}
                                        style={{ display: "none" }}
                                    />
                                    <GlassButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => document.getElementById("preset-import-file").click()}
                                        leftIcon={<FolderOpen size={16} />}
                                    >
                                        Import
                                    </GlassButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {showOnlinePresets && (
                        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                            <h3 className="font-semibold text-white">Online Preset Library</h3>
                            <p className="text-sm text-zinc-400 mb-2">Download advanced custom sound models from the cloud catalog</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: "online-extreme-bass", name: "Bass Extreme", desc: "Sub-bass boost for club beats", gains: [10, 8, -2, -1, -4] },
                                    { id: "online-podcast", name: "Podcast Voice", desc: "Crisp dialogue and voice presence", gains: [-4, -2, 6, 8, 4] },
                                    { id: "online-acoustic", name: "Acoustic Harmony", desc: "Perfect warmth for guitars", gains: [2, 3, 1, 3, 2] },
                                    { id: "online-metalcore", name: "Metal Core", desc: "Heavy scoop mids and crisp treble", gains: [5, 1, -4, 4, 6] }
                                ].map(onlinePreset => {
                                    const isDownloaded = presets.some(p => p.id === onlinePreset.id);
                                    return (
                                        <div key={onlinePreset.id} className="flex items-center justify-between border border-white/5 bg-white/[0.01] rounded-xl p-3">
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs font-bold text-white truncate">{onlinePreset.name}</p>
                                                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{onlinePreset.desc}</p>
                                            </div>
                                            <GlassButton
                                                variant={isDownloaded ? "secondary" : "primary"}
                                                size="xs"
                                                disabled={isDownloaded}
                                                onClick={() => {
                                                    importEqPreset(onlinePreset);
                                                    toast.success(`Downloaded preset "${onlinePreset.name}"!`);
                                                }}
                                                leftIcon={!isDownloaded && <DownloadCloud size={12} />}
                                            >
                                                {isDownloaded ? "Installed" : "Get"}
                                            </GlassButton>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {showUpdatesCard && (
                <Card title="Updates & System" icon={Cpu}>
                    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">Current Version</h3>
                                <p className="text-sm text-zinc-400">You are running version {updaterState.version ? `v${updaterState.version}` : 'checking...'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {updaterState.status === 'idle' && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle size={12} />
                                        Up to date
                                    </span>
                                )}
                                {updaterState.status === 'checking' && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 animate-pulse">
                                        <RefreshCw size={12} className="animate-spin" />
                                        Checking...
                                    </span>
                                )}
                                {updaterState.status === 'available' && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 animate-pulse">
                                        Update available
                                    </span>
                                )}
                                {updaterState.status === 'downloading' && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20 animate-pulse">
                                        Downloading...
                                    </span>
                                )}
                                {updaterState.status === 'downloaded' && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                        Ready to install
                                    </span>
                                )}
                                {updaterState.status === 'error' && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
                                        <AlertTriangle size={12} />
                                        Update error
                                    </span>
                                )}
                            </div>
                        </div>

                        {updaterState.status === 'downloading' && (
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                                    <span>Downloading new version...</span>
                                    <span>{updaterState.percent}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all duration-300"
                                        style={{ width: `${updaterState.percent}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {updaterState.status === 'error' && updaterState.error && (
                            <p className="mt-2 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                                {updaterState.error}
                            </p>
                        )}

                        {updaterState.status === 'available' && updaterState.updateInfo && (
                            <div className="mt-2 text-xs text-zinc-400 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                                <p className="font-bold text-white mb-1">Release notes for {updaterState.updateInfo.version}:</p>
                                <p className="whitespace-pre-line">{updaterState.updateInfo.releaseNotes || 'No release notes provided.'}</p>
                            </div>
                        )}

                        <div className="mt-4 flex flex-col sm:flex-row gap-3 border-t border-white/5 pt-4 justify-between sm:items-center">
                            <div className="text-xs text-zinc-500">
                                Automatic background updates enabled
                            </div>
                            <div className="flex items-center gap-3">
                                <GlassButton
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                        const res = await ipc.updater.openLog();
                                        if (res && !res.ok) {
                                            toast.error(res.error || "Logs file not found");
                                        }
                                    }}
                                    leftIcon={<FileText size={16} />}
                                >
                                    View Logs
                                </GlassButton>

                                {updaterState.status === 'downloaded' ? (
                                    <GlassButton
                                        variant="primary"
                                        size="sm"
                                        onClick={async () => {
                                            toast.info("Restarting app to install update...");
                                            await ipc.updater.install();
                                        }}
                                        leftIcon={<RefreshCw size={16} />}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none text-white hover:shadow-lg hover:shadow-emerald-500/20"
                                    >
                                        Restart & Install
                                    </GlassButton>
                                ) : (
                                    <GlassButton
                                        variant="primary"
                                        size="sm"
                                        disabled={updaterState.status === 'checking' || updaterState.status === 'downloading'}
                                        onClick={async () => {
                                            toast.info("Checking for updates...");
                                            const res = await ipc.updater.check();
                                            if (res && res.simulated) {
                                                toast.success("Simulation started!");
                                            }
                                        }}
                                        leftIcon={<RefreshCw size={16} />}
                                    >
                                        Check for Updates
                                    </GlassButton>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}



        </div>
    );
}
