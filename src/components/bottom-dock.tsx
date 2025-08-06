import type { MenuItem } from "@/types";
import { animate, utils } from "animejs";
import { For, onMount } from "solid-js";
import HomeIcon from "./icons/home-icon";
import SettingsIcon from "./icons/settings-icon";

// Potential changes to WAAPI if needed to make initial page load better: https://animejs.com/documentation/web-animation-api/when-to-use-waapi

export default function BottomDock() {
  const menuItems: MenuItem[] = [
    {
      icon: <HomeIcon />,
      label: "Home",
      href: "/",
      gradient: "from-[#0093E9] to-[#80D0C7]",
      iconColor: "text-[#0093E9]",
    },
    {
      icon: <SettingsIcon />,
      label: "Settings",
      href: "/settings",
      gradient: "from-[#0093E9] to-[#80D0C7]",
      iconColor: "text-[#0093E9]",
    },
  ];

  onMount(() => {
    applyHoverAnimations();
  });

  return (
    <nav class="fixed bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-background/30 dark:bg-neutral-900/30 backdrop-blur-lg border border-black/10 dark:border-white/10 shadow-lg">
      <ul class="flex items-center gap-2">
        <For each={menuItems}>
          {(item) => (
            <li class="relative">
              {/* Container */}
              <div
                class="menu-item-container block rounded-xl group"
                style={{ perspective: "600px" }}
              >
                <div
                  class={`nav-glow-item absolute -inset-1 z-0 pointer-events-none rounded-xl opacity-0 scale-90 ${item.gradient}`}
                />

                {/* --- 3D Flip Container --- */}
                {/* Front face of the button */}
                <a
                  href={item.href}
                  class="nav-item flex items-center gap-2 px-4 py-2 relative z-10 text-neutral-600 dark:text-neutral-400 rounded-xl"
                  // Initial state for the front-face, changes with the animate function
                >
                  <span
                    class={`transition-colors duration-300 ${item.iconColor}`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>

                {/* Back face of the button */}
                <a
                  href={item.href}
                  class="nav-item-back flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 text-neutral-600 dark:text-neutral-400 rounded-xl"
                >
                  <span
                    class={`transition-colors duration-300 ${item.iconColor}`}
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

  $containers.forEach((container) => {
    // Find the children *within each container*
    const $item = container.querySelector(".nav-item");
    const $itemBack = container.querySelector(".nav-item-back");
    const $glow = container.querySelector(".nav-glow-item");

    // Set initial styles using utils.set
    utils.set($item!, {
      rotateX: 0,
      opacity: 1,
      transformStyle: "preserve-3d",
      transformOrigin: "center bottom",
    });
    utils.set($itemBack!, {
      rotateX: -90,
      opacity: 0,
      transformStyle: "preserve-3d",
      transformOrigin: "center top",
    });
    utils.set($glow!, {
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
      animate($item!, {
        rotateX: 90, // Flips "up" and away
        opacity: 0,
        ...animationConfig,
      });
      animate($itemBack!, {
        rotateX: 0,
        opacity: 1,
        ...animationConfig,
      });
      animate($glow!, {
        opacity: 1,
        scale: 1,
        ...animationConfig,
      });
    });

    // Attach listener to the STABLE PARENT on mouseleave
    container.addEventListener("mouseleave", () => {
      // Animate all children back to their initial state
      animate($item!, {
        rotateX: 0,
        opacity: 1,
        ...animationConfig,
      });
      animate($itemBack!, {
        rotateX: -90, // Return to its starting "up" position
        opacity: 0,
        ...animationConfig,
      });
      animate($glow!, {
        opacity: 0,
        scale: 0.9,
        ...animationConfig,
      });
    });
  });
}
