import type { MenuItem } from "@/types";
import { animate, createSpring, eases, utils } from "animejs";
import { For, onMount } from "solid-js";
import HomeIcon from "./icons/home-icon";
import SettingsIcon from "./icons/settings-icon";

// Potential changes to WAAPI if needed to make initial page load better: https://animejs.com/documentation/web-animation-api/when-to-use-waapi

export default function BottomDock() {
  const menuItems: MenuItem[] = [
    {
      icon: HomeIcon,
      label: "Home",
      href: "/",
      gradient:
        "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
      iconColor: "text-[#0093E9]",
    },
    {
      icon: SettingsIcon,
      label: "Settings",
      href: "/settings",
      gradient:
        "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
      iconColor: "text-[#0093E9]",
    },
  ];

  onMount(() => {
    applyHoverAnimations();
  });
  return (
    <nav class="fixed bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-neutral-900/10 backdrop-blur-lg border border-white/10 shadow-lg">
      <div
        class={`nav-glow-variants absolute -inset-2 bg-gradient-radial from-transparent via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90% to-transparent rounded-3xl z-0 pointer-events-none`}
      />
      <ul class="flex items-center gap-2 relative z-10">
        <For each={menuItems}>
          {(item) => (
            <li class="relative">
              {/* Container */}
              <div
                class="menu-item-container block rounded-xl overflow-visible group relative"
                style={{ perspective: "600px" }}
              >
                <div
                  class={`nav-glow-item absolute inset-0 z-0 pointer-events-none rounded-2xl`}
                  style={{
                    background: item.gradient,
                  }}
                />

                {/* --- 3D Flip Container --- */}
                {/* Front face of the button */}
                <a
                  href={item.href}
                  class="nav-item flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                >
                  <span
                    class={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>

                {/* Back face of the button */}
                <a
                  href={item.href}
                  class="nav-item-back flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                >
                  <span
                    class={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </div>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
}

function applyHoverAnimations() {
  // Select all the stable parent containers
  const $containers = utils.$(".menu-item-container");
  const { linear } = eases;
  $containers.forEach((container) => {
    // Find the children *within each container*
    const $item = container.querySelector(".nav-item")!;
    const $itemBack = container.querySelector(".nav-item-back")!;
    const $glow = container.querySelector(".nav-glow-item")!;

    // Set initial styles using utils.set
    utils.set($item, {
      rotateX: 0,
      opacity: 1,
      transformStyle: "preserve-3d",
      transformOrigin: "center bottom",
    });
    utils.set($itemBack, {
      rotateX: 90,
      opacity: 0,
      transformStyle: "preserve-3d",
      transformOrigin: "center top",
    });
    utils.set($glow, {
      opacity: 0,
      scale: 0.8,
    });

    // Animation parameters
    const animationConfig = {
      duration: 500,
      easing: "easeOutQuint",
    };

    // Attach listener to the STABLE PARENT on mouseenter
    container.addEventListener("mouseenter", () => {
      // Animate all children simultaneously
      animate($item, {
        rotateX: -90,
        opacity: 0,
        ...animationConfig,
      });
      animate($itemBack, {
        rotateX: 0,
        opacity: 1,
        ...animationConfig,
      });
      animate($glow, {
        opacity: {
          to: 1,
          duration: 500,
          ease: linear(0.4, 0, 0.2, 1),
        },
        scale: {
          to: 2,
          duration: 500,
          ease: createSpring({
            stiffness: 300,
            damping: 25,
          }),
        },

        ...animationConfig,
      });
    });

    container.addEventListener("mouseleave", () => {
      // Animate all children back to their initial state
      animate($item, {
        rotateX: 0,
        opacity: 1,
        ...animationConfig,
      });
      animate($itemBack, {
        rotateX: -90,
        opacity: 0,
        ...animationConfig,
      });
      animate($glow, {
        opacity: 0,
        scale: 0.9,
        ...animationConfig,
      });
    });
  });

  const [$navGlowVariants] = utils.$(".nav-glow-variants");
  utils.set($navGlowVariants, {
    opacity: 0,
  });

  $navGlowVariants.addEventListener("onmouseenter", () => {
    animate($navGlowVariants, {
      opacity: 1,
      duration: 500,
      easing: linear(0.4, 0, 0.2, 1),
    });
  });

  $navGlowVariants.addEventListener("onmouseleave", () => {
    animate($navGlowVariants, {
      opacity: 0,
      duration: 500,
      easing: linear(0.4, 0, 0.2, 1),
    });
  });
}
