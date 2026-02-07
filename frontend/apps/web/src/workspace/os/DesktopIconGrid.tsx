import { WindowId } from "./types";

type Props = {
  onOpen: (id: WindowId) => void;
  visibleIds?: WindowId[];
};

const icons: { id: WindowId; label: string; icon: string }[] = [
  { id: "explorer", label: "File Explorer", icon: "📁" },
  { id: "editor", label: "Editor", icon: "📝" },
  { id: "controller", label: "Controller", icon: "🧭" },
  { id: "server1", label: "Server S1", icon: "🖥️" },
  { id: "server2", label: "Server S2", icon: "🖥️" },
  { id: "dashboard", label: "Dashboard", icon: "📊" }
];

export function DesktopIconGrid({ onOpen, visibleIds }: Props) {
  const visible = visibleIds ? icons.filter((item) => visibleIds.includes(item.id)) : icons;
  return (
    <div className="desktop-icon-grid">
      {visible.map((item) => (
        <button
          key={item.id}
          className="desktop-icon"
          onClick={() => onOpen(item.id)}
        >
          <div className="desktop-icon-emoji">{item.icon}</div>
          <div className="desktop-icon-label">{item.label}</div>
        </button>
      ))}
    </div>
  );
}
