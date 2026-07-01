import { motion } from "framer-motion";
import { forwardRef } from "react";
import clsx from "clsx";

const variants = {
  default: "bg-white/[0.04] border-white/10",

  elevated:
    "bg-white/[0.05] border-white/10 shadow-[0_12px_45px_rgba(0,0,0,.35)]",

  accent:
    "bg-gradient-to-br from-[var(--accent)]/10 via-white/[0.04] to-transparent border-[var(--accent)]/25",

  outline:
    "bg-transparent border-white/15",
};

const radius = {
  sm: "rounded-2xl",
  md: "rounded-3xl",
  lg: "rounded-[34px]",
  xl: "rounded-[42px]",
};

const padding = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const blur = {
  none: "",
  sm: "backdrop-blur-md",
  md: "backdrop-blur-xl",
  lg: "backdrop-blur-3xl",
};

const hoverAnimation = {
  rest: {
    y: 0,
    scale: 1,
  },

  hover: {
    y: -5,
    scale: 1.01,
  },
};

const transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
};

const GlassCard = forwardRef(
  (
    {
      children,

      className,

      variant = "default",

      radiusSize = "lg",

      paddingSize = "md",

      blurSize = "lg",

      hover = true,

      glow = false,

      bordered = true,

      animated = true,

      onClick,

      ...props
    },

    ref
  ) => {
    const Component = animated ? motion.div : "div";

    return (
      <Component
        ref={ref}
        onClick={onClick}
        initial="rest"
        whileHover={hover ? "hover" : undefined}
        variants={hoverAnimation}
        transition={transition}
        className={clsx(
          "relative overflow-hidden",

          bordered && "border",

          variants[variant],

          radius[radiusSize],

          padding[paddingSize],

          blur[blurSize],

          "transition-all duration-300",

          className
        )}
        {...props}
      >
        {/* Animated Glow */}

        {glow && (
          <motion.div
            animate={{
              opacity: [0.25, 0.45, 0.25],
              scale: [1, 1.08, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
            }}
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-[100px]"
            style={{
              background: "var(--accent)",
            }}
          />
        )}

        {/* Noise */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,white 1px,transparent 0)",
            backgroundSize: "14px 14px",
          }}
        />

        {/* Top Highlight */}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Accent Border */}

        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: "inset 0 0 0 1px var(--accent)",
          }}
        />

        {/* Content */}

        <div className="relative z-10">{children}</div>
      </Component>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
