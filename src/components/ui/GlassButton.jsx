import { motion } from "framer-motion";
import clsx from "clsx";

const variants = {
  primary:
    "bg-[var(--accent)] text-white shadow-[0_10px_30px_rgba(0,0,0,.25)]",

  secondary:
    "bg-white/[0.05] border border-white/10 text-white",

  ghost:
    "bg-transparent text-zinc-300 hover:bg-white/5",

  danger:
    "bg-red-500 text-white",

  success:
    "bg-emerald-500 text-white",
};

const sizes = {
  sm: "h-9 px-4 text-sm rounded-xl",

  md: "h-11 px-5 text-sm rounded-2xl",

  lg: "h-12 px-6 text-base rounded-2xl",

  icon: "h-11 w-11 rounded-2xl",
};

export default function GlassButton({

  children,

  variant = "primary",

  size = "md",

  leftIcon,

  rightIcon,

  loading = false,

  disabled = false,

  className,

  ...props

}) {

  return (

    <motion.button

      whileHover={{
        y: -2,
        scale: 1.02,
      }}

      whileTap={{
        scale: .97,
      }}

      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}

      disabled={disabled || loading}

      className={clsx(

        "inline-flex items-center justify-center gap-2",

        "font-semibold",

        "transition-all duration-300",

        "disabled:pointer-events-none",

        "disabled:opacity-50",

        "hover:shadow-[0_0_25px_rgba(255,255,255,.08)]",

        "active:scale-95",

        variants[variant],

        sizes[size],

        className

      )}

      {...props}

    >

      {loading && (

        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />

      )}

      {!loading && leftIcon}

      <span>{children}</span>

      {!loading && rightIcon}

    </motion.button>

  );

}
