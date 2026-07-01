import { Volume2, VolumeX } from "lucide-react";

export default function VolumeControl({
  volume,
  muted,
  onMute,
  onVolumeChange,
}) {

  return (

    <div className="flex items-center gap-3">

      <button
        onClick={onMute}
        className="text-zinc-400 transition hover:text-cyan-400"
      >

        {muted || volume === 0
          ? <VolumeX size={18} />
          : <Volume2 size={18} />
        }

      </button>

      <div className="relative w-32">

        <div className="h-2 rounded-full bg-white/10">

          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
            style={{ width: `${volume}%` }}
          />

        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

      </div>

      <span className="w-10 text-right text-xs text-zinc-400">

        {volume}%

      </span>

    </div>

  );

}
