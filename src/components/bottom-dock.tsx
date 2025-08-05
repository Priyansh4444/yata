import type { MenuItem } from "@/types";
import { animate, eases, utils } from "animejs";
import { For, onMount } from "solid-js";
import HomeIcon from "./icons/home-icon";
import SettingsIcon from "./icons/settings-icon";

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
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
    applyNavAnimation();
    itemVariantAnimation();
    backNavVariants();
    glowVariants();
  });
  return (
    <nav class="fixed bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-background/30 dark:bg-neutral-900/30 backdrop-blur-lg border border-black/10 dark:border-white/10 shadow-lg">
      <ul class="flex items-center gap-2">
        <For each={menuItems}>
          {(item) => (
            <li class="relative">
              {/* This div is the container for a single menu item and its animations */}
              <div
                class="block rounded-xl group"
                style={{ perspective: "600px" }}
              >
                {/* Glow effect element */}
                <div
                  class="absolute nav-glow-item -inset-1 z-0 pointer-events-none rounded-xl transition-all duration-300 ease-in-out opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                  style={{ background: item.gradient }}
                />

                {/* --- 3D Flip Container --- */}
                {/* Both `a` tags are positioned absolutely to overlap. The `group-hover` classes handle the rotation. */}

                {/* Front face of the button */}
                <a
                  href={item.href}
                  class="flex items-center gap-2 px-4 nav-item py-2 relative z-10 text-neutral-600 dark:text-neutral-400 rounded-xl transition-all duration-500 ease-in-out group-hover:text-neutral-800 dark:group-hover:text-white"
                  style={{
                    "transform-style": "preserve-3d",
                    "transform-origin": "center bottom",
                    transform: "rotateX(0deg)",
                    opacity: 1,
                  }}
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
                  class="flex items-center gap-2 nav-item-back px-4 py-2 absolute inset-0 z-10 text-neutral-600 dark:text-neutral-400 rounded-xl transition-all duration-500 ease-in-out group-hover:text-neutral-800 dark:group-hover:text-white"
                  style={{
                    "transform-style": "preserve-3d",
                    "transform-origin": "center top",
                    transform: "rotateX(90deg)",
                    opacity: 0,
                  }}
                  // Use Tailwind classes for hover state transforms
                  // When the parent `group` is hovered, this element rotates into view
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
function applyNavAnimation() {
  const $navContainers = utils.$(".nav-glow");
  const { linear } = eases;
  $navContainers.forEach((navContainer) => {
    animate(navContainer, {
      opacity: 1,
      easing: linear(0.4, 0, 0.2, 1),
      duration: 500,
    });
  });
}

function itemVariantAnimation() {
  const $navItems = utils.$(".nav-item");
  $navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      animate(item, {
        rotateX: -90,
        opacity: 0,
        duration: 50,
        easing: "easeInOutQuad",
      });
    });
    item.addEventListener("mouseleave", () => {
      animate(item, {
        rotateX: 0,
        opacity: 1,
        duration: 50,
        easing: "easeInOutQuad",
      });
    });
  });
}

function backNavVariants() {
  const $navItemBacks = utils.$(".nav-item-back");
  $navItemBacks.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      animate(item, {
        rotateX: 0,
        opacity: 1,
        duration: 50,
        easing: "easeInOutQuad",
      });
    });
    item.addEventListener("mouseleave", () => {
      animate(item, {
        rotateX: 90,
        opacity: 0,
        duration: 50,
        easing: "easeInOutQuad",
      });
    });
  });
}

function glowVariants() {
  const $glowElements = utils.$(".nav-glow-item");
  $glowElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      animate(element, {
        opacity: 1,
        scale: 1,
        duration: 500,
        easing: "easeInOutQuad",
      });
    });
    element.addEventListener("mouseleave", () => {
      animate(element, {
        opacity: 0,
        scale: 0.9,
        duration: 500,
        easing: "easeInOutQuad",
      });
    });
  });
}
