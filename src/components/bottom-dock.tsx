import type { MenuItem } from "@/types";
import { animate, eases, utils } from "animejs";
import { For, onMount } from "solid-js";
import HomeIcon from "./icons/home-icon";
import SettingsIcon from "./icons/settings-icon";

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

  const itemVariants = {
    initial: { rotateX: 0, opacity: 1 },
    hover: { rotateX: -90, opacity: 0 },
  };

  const backVariants = {
    initial: { rotateX: 90, opacity: 0 },
    hover: { rotateX: 0, opacity: 1 },
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    hover: {
      opacity: 1,
      scale: 2,
      transition: {
        opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
      },
    },
  };

  const navGlowVariants = {
    initial: { opacity: 0 },
    hover: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const sharedTransition = {
    type: "spring",
    stiffness: 100,
    damping: 20,
    duration: 0.5,
  };

  onMount(() => {
    applyNavAnimation();
  });
  return (
    <nav class="relative">
      <div class="absolute -inset-2 rounded-3xl z-0 pointer-events-none nav-glow" />
      <ul class="flex items-center gap-2 relative z-10">
        <For each={menuItems}>
          {(item: MenuItem) => (
            <li class="relative">
              <div
                class="block rounded-xl overflow-visible group relative"
                style={{ perspective: "600px" }}
              >
                <div
                  class="absolute inset-0 z-0 pointer-events-none rounded-2xl"
                  style={{
                    background: item.gradient,
                    opacity: 0,
                  }}
                />
                <a
                  href={item.href}
                  class="flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                  style="transform-style: preserve-3d; transform-origin: center bottom;"
                >
                  <span
                    class={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
                <a
                  href={item.href}
                  class="flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                  style="transform-style: preserve-3d; transform-origin: center top; rotate: x 90deg;"
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

function applyNavAnimation() {
  const [$navContainer] = utils.$(".nav-glow");
  const { linear } = eases;
  const navAnimation = () => {
    animate($navContainer, {
      opacity: 1,
      ease: linear(0.4, 0, 0.2, 1),
      duration: 500,
    });
    console.log("exists");
  };
  document.addEventListener("mouseenter", navAnimation);
}
