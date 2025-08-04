import { MenuItem } from "../types";
import BottomDock from "./bottom-dock";
import HomeIcon from "./icons/home-icon";
import SettingsIcon from "./icons/settings-icon";

export default function Navbar() {
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

    return (
        <nav>
          <BottomDock menuItems={menuItems} />
        </nav>
    );
}