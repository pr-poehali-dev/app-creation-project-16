import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const SYSTEM_CATEGORY_IDS = ["all"];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "all", name: "Все заметки", icon: "LayoutGrid" },
  { id: "personal", name: "Личное", icon: "User" },
  { id: "work", name: "Работа", icon: "Briefcase" },
  { id: "ideas", name: "Идеи", icon: "Lightbulb" },
  { id: "archive", name: "Архив", icon: "Archive" },
];

const DEFAULT_TAGS: Tag[] = [
  { id: "t1", name: "важное", color: "#f59e0b" },
  { id: "t2", name: "задача", color: "#3b82f6" },
  { id: "t3", name: "позже", color: "#8b5cf6" },
  { id: "t4", name: "идея", color: "#10b981" },
];

const TAG_COLORS = [
  "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981",
  "#ef4444", "#ec4899", "#f97316", "#14b8a6",
];

const SAMPLE_NOTES: Note[] = [
  {
    id: "1",
    title: "Добро пожаловать в DF заметки",
    content:
      "Это твоё пространство для мыслей, идей и задач. DF заметки работает офлайн и синхронизируется когда появляется интернет.\n\nНачни с создания первой заметки — нажми кнопку «+» слева.",
    categoryId: "personal",
    tags: ["t4"],
    createdAt: new Date("2026-03-17"),
    updatedAt: new Date("2026-03-17"),
    isPinned: true,
  },
  {
    id: "2",
    title: "Список задач на неделю",
    content:
      "— Завершить квартальный отчёт\n— Встреча с командой во вторник\n— Подготовить презентацию\n— Ответить на письма",
    categoryId: "work",
    tags: ["t1", "t2"],
    createdAt: new Date("2026-03-16"),
    updatedAt: new Date("2026-03-18"),
    isPinned: false,
  },
  {
    id: "3",
    title: "Идеи для нового проекта",
    content:
      "Мобильное приложение для отслеживания привычек. Геймификация через очки и достижения. Социальный аспект — делиться прогрессом с друзьями.",
    categoryId: "ideas",
    tags: ["t4"],
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-03-15"),
    isPinned: false,
  },
];

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `Сегодня ${time}`;
  if (days === 1) return `Вчера ${time}`;
  if (days < 7) return `${days} дн. назад ${time}`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ` ${time}`;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

// --- Theme definitions ---
const THEME_DARK: Record<string, string> = {
  "--background": "220 16% 8%",
  "--foreground": "210 20% 90%",
  "--card": "220 14% 11%",
  "--card-foreground": "210 20% 90%",
  "--muted": "220 12% 14%",
  "--muted-foreground": "215 12% 50%",
  "--border": "220 12% 18%",
  "--input": "220 12% 16%",
  "--popover": "220 14% 11%",
  "--popover-foreground": "210 20% 90%",
  "--secondary": "220 12% 15%",
  "--secondary-foreground": "210 20% 75%",
  "--sidebar-background": "220 16% 6%",
  "--sidebar-foreground": "210 15% 70%",
  "--sidebar-accent": "220 12% 13%",
  "--sidebar-accent-foreground": "210 20% 85%",
  "--sidebar-border": "220 12% 14%",
  "--surface": "220 14% 11%",
  "--surface-hover": "220 12% 14%",
};

const THEME_LIGHT: Record<string, string> = {
  "--background": "0 0% 98%",
  "--foreground": "220 16% 12%",
  "--card": "0 0% 100%",
  "--card-foreground": "220 16% 12%",
  "--muted": "220 12% 92%",
  "--muted-foreground": "215 12% 45%",
  "--border": "220 12% 88%",
  "--input": "220 12% 88%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "220 16% 12%",
  "--secondary": "220 12% 94%",
  "--secondary-foreground": "220 16% 12%",
  "--sidebar-background": "0 0% 96%",
  "--sidebar-foreground": "220 12% 35%",
  "--sidebar-accent": "220 12% 92%",
  "--sidebar-accent-foreground": "220 16% 12%",
  "--sidebar-border": "220 12% 88%",
  "--surface": "0 0% 100%",
  "--surface-hover": "220 12% 96%",
};

const THEME_GOLDEN: Record<string, string> = {
  "--background": "40 30% 8%",
  "--foreground": "40 20% 88%",
  "--card": "40 25% 11%",
  "--card-foreground": "40 20% 88%",
  "--muted": "40 20% 15%",
  "--muted-foreground": "40 12% 48%",
  "--border": "40 20% 18%",
  "--input": "40 20% 16%",
  "--popover": "40 25% 11%",
  "--popover-foreground": "40 20% 88%",
  "--secondary": "40 18% 15%",
  "--secondary-foreground": "40 20% 78%",
  "--sidebar-background": "40 30% 6%",
  "--sidebar-foreground": "40 15% 65%",
  "--sidebar-accent": "40 18% 13%",
  "--sidebar-accent-foreground": "40 20% 85%",
  "--sidebar-border": "40 20% 14%",
  "--surface": "40 25% 11%",
  "--surface-hover": "40 20% 14%",
};

const THEMES: Record<string, Record<string, string>> = {
  dark: THEME_DARK,
  light: THEME_LIGHT,
  golden: THEME_GOLDEN,
};

// --- Accent color palette ---
const ACCENT_PALETTE = [
  { name: "Red", hex: "#ef4444", hsl: "0 84% 60%" },
  { name: "Orange", hex: "#f97316", hsl: "25 95% 53%" },
  { name: "Amber", hex: "#f59e0b", hsl: "38 92% 50%" },
  { name: "Yellow", hex: "#eab308", hsl: "48 96% 47%" },
  { name: "Lime", hex: "#84cc16", hsl: "84 81% 44%" },
  { name: "Green", hex: "#22c55e", hsl: "142 71% 45%" },
  { name: "Emerald", hex: "#10b981", hsl: "160 84% 39%" },
  { name: "Teal", hex: "#14b8a6", hsl: "173 80% 40%" },
  { name: "Cyan", hex: "#06b6d4", hsl: "189 94% 43%" },
  { name: "Sky", hex: "#0ea5e9", hsl: "199 89% 48%" },
  { name: "Blue", hex: "#3b82f6", hsl: "217 91% 60%" },
  { name: "Indigo", hex: "#6366f1", hsl: "239 84% 67%" },
  { name: "Violet", hex: "#8b5cf6", hsl: "258 90% 66%" },
  { name: "Purple", hex: "#a855f7", hsl: "271 91% 65%" },
  { name: "Fuchsia", hex: "#d946ef", hsl: "292 84% 61%" },
  { name: "Pink", hex: "#ec4899", hsl: "330 81% 60%" },
  { name: "Rose", hex: "#f43f5e", hsl: "350 89% 60%" },
  { name: "Slate", hex: "#64748b", hsl: "215 16% 47%" },
];

// --- Dropdown menu ---
function DropdownMenu({
  items,
  onClose,
}: {
  items: { label: string; icon: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 w-40 bg-popover border border-border rounded-lg shadow-xl py-1 animate-fade-in"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:bg-muted ${
            item.danger ? "text-destructive" : "text-foreground"
          }`}
        >
          <Icon name={item.icon} fallback="Circle" size={13} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

// --- Edit modal ---
function EditModal({
  title, value, color, showColor, onSave, onClose,
}: {
  title: string; value: string; color?: string; showColor?: boolean;
  onSave: (name: string, color?: string) => void; onClose: () => void;
}) {
  const [name, setName] = useState(value);
  const [selectedColor, setSelectedColor] = useState(color || TAG_COLORS[0]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-5 w-72 shadow-2xl">
        <h3 className="font-semibold text-foreground mb-4 text-sm">{title}</h3>
        <input
          autoFocus type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(name, selectedColor); if (e.key === "Escape") onClose(); }}
          className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber mb-3"
          placeholder="Название..."
        />
        {showColor && (
          <div className="flex gap-2 flex-wrap mb-4">
            {TAG_COLORS.map((c) => (
              <button key={c} onClick={() => setSelectedColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: selectedColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
              />
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors">Отмена</button>
          <button onClick={() => name.trim() && onSave(name.trim(), selectedColor)} className="flex-1 py-2 text-sm rounded-lg bg-amber text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium">Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// --- Delete modal ---
function DeleteModal({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 w-72 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center mb-3">
          <Icon name="Trash2" size={18} className="text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground mb-1 text-sm">Удалить?</h3>
        <p className="text-xs text-muted-foreground mb-5">«{label}» будет удалён навсегда.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors">Отмена</button>
          <button onClick={onConfirm} className="flex-1 py-2 text-sm rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity font-medium">Удалить</button>
        </div>
      </div>
    </div>
  );
}

// --- Settings panel ---
function SettingsPanel({
  theme, setTheme,
  accentColor, setAccentColor,
  password, setPassword,
  passwordEnabled, setPasswordEnabled,
  onClose,
}: {
  theme: string;
  setTheme: (t: "dark" | "light" | "golden") => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  password: string;
  setPassword: (p: string) => void;
  passwordEnabled: boolean;
  setPasswordEnabled: (v: boolean) => void;
  onClose: () => void;
}) {
  const [passwordInput, setPasswordInput] = useState(password);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-end z-50 animate-fade-in">
      <div
        ref={ref}
        className="h-full w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slide-settings 0.25s ease-out" }}
      >
        <style>{`
          @keyframes slide-settings {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="Settings" size={16} className="text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Настройки</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Theme selector */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Тема</h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "dark", label: "Тёмная", bg: "#141619", fg: "#d1d5db", accent: "#1c1f24" },
                { key: "light", label: "Светлая", bg: "#fafafa", fg: "#1e2433", accent: "#f0f0f0" },
                { key: "golden", label: "Золотая", bg: "#1a1508", fg: "#ddd0a8", accent: "#2a2210" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    theme === t.key
                      ? "border-amber bg-amber/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className="w-full h-10 rounded-md border border-border/30 flex items-end p-1.5 gap-1"
                    style={{ backgroundColor: t.bg }}
                  >
                    <div className="w-2 h-3 rounded-sm" style={{ backgroundColor: t.accent }} />
                    <div className="flex-1 h-4 rounded-sm" style={{ backgroundColor: t.accent }} />
                  </div>
                  <span className="text-xs text-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Accent color picker */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Цвет акцента</h3>
            <div className="grid grid-cols-6 gap-2">
              {ACCENT_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setAccentColor(c.hex)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{
                    backgroundColor: c.hex,
                    outline: accentColor === c.hex ? `2px solid ${c.hex}` : "none",
                    outlineOffset: "3px",
                  }}
                  title={c.name}
                >
                  {accentColor === c.hex && (
                    <Icon name="Check" size={14} className="text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Password section */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Пароль для входа</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Защита паролем</span>
                <button
                  onClick={() => {
                    if (!passwordEnabled && !passwordInput.trim()) return;
                    setPasswordEnabled(!passwordEnabled);
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    passwordEnabled ? "bg-amber" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      passwordEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Введите пароль..."
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber"
                />
              </div>
              <button
                onClick={() => {
                  if (passwordInput.trim()) {
                    setPassword(passwordInput.trim());
                  }
                }}
                className="w-full py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors font-medium"
              >
                Сохранить пароль
              </button>
              {password && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="ShieldCheck" size={12} className="text-emerald-500" />
                  Пароль установлен
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Lock screen ---
function LockScreen({
  password,
  onUnlock,
}: {
  password: string;
  onUnlock: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    if (window.PublicKeyCredential) {
      setBiometricSupported(true);
    }
  }, []);

  const handleSubmit = () => {
    if (input === password) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  const handleBiometric = async () => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: "required",
        },
      });
      onUnlock();
    } catch {
      // biometric failed or cancelled — do nothing
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100]">
      <div className="bg-card border border-border rounded-2xl p-8 w-80 shadow-2xl animate-fade-in flex flex-col items-center">
        <div className="w-14 h-14 rounded-xl bg-amber flex items-center justify-center mb-4">
          <span className="text-[hsl(var(--primary-foreground))] font-mono font-bold text-lg">DF</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-1">DF заметки</h1>
        <p className="text-xs text-muted-foreground mb-6">Введите пароль для входа</p>

        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="Пароль..."
          autoFocus
          className={`w-full bg-muted border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber mb-3 ${
            error ? "border-destructive" : "border-border"
          }`}
        />
        {error && (
          <p className="text-xs text-destructive mb-2">Неверный пароль</p>
        )}
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 text-sm rounded-lg bg-amber text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium mb-2"
        >
          Войти
        </button>
        {biometricSupported && (
          <button
            onClick={handleBiometric}
            className="w-full py-2.5 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="Fingerprint" size={16} />
            Биометрия
          </button>
        )}
      </div>
    </div>
  );
}

// --- Editor content (shared between inline / fullscreen / float) ---
function EditorContent({
  isEditing,
  selectedNote,
  editTitle, setEditTitle,
  editContent, setEditContent,
  editCategory, setEditCategory,
  editTags, setEditTags,
  categories, tags,
  formatDate: fmt,
}: {
  isEditing: boolean;
  selectedNote: Note;
  editTitle: string; setEditTitle: (v: string) => void;
  editContent: string; setEditContent: (v: string) => void;
  editCategory: string; setEditCategory: (v: string) => void;
  editTags: string[]; setEditTags: (v: string[]) => void;
  categories: Category[]; tags: Tag[];
  formatDate: (d: Date) => string;
}) {
  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-8 w-full animate-fade-in">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="text-xs bg-muted border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-amber"
          >
            {categories.filter((c) => c.id !== "all").map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-1.5 flex-wrap">
            {tags.map((tag) => {
              const active = editTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() =>
                    setEditTags(active ? editTags.filter((t) => t !== tag.id) : [...editTags, tag.id])
                  }
                  className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                    active ? "opacity-100" : "opacity-40 hover:opacity-70"
                  }`}
                  style={{ borderColor: tag.color + "60", color: tag.color, backgroundColor: active ? tag.color + "20" : "transparent" }}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>
        <input
          type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Заголовок заметки..."
          className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none mb-4 border-b border-border pb-3"
        />
        <textarea
          value={editContent} onChange={(e) => setEditContent(e.target.value)}
          placeholder="Начните писать..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none leading-relaxed min-h-96"
          style={{ fontFamily: "inherit" }}
          autoFocus
        />
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto px-8 py-8 w-full animate-fade-in">
      <h1 className="text-2xl font-semibold text-foreground mb-1">{selectedNote.title}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Изменено {fmt(selectedNote.updatedAt)} · {selectedNote.content.length} символов
      </p>
      <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
        {selectedNote.content || (
          <span className="text-muted-foreground italic">Пустая заметка. Нажмите «Редактировать» чтобы начать.</span>
        )}
      </div>
    </div>
  );
}

export default function Index() {
  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(SAMPLE_NOTES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("personal");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // --- New states ---
  const [notesListHidden, setNotesListHidden] = useState(false);
  const [editorMode, setEditorMode] = useState<"normal" | "fullscreen" | "float">("normal");
  const [searchOpen, setSearchOpen] = useState(false);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "golden">("dark");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [password, setPassword] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);

  const [modal, setModal] = useState<
    | { type: "add-cat" }
    | { type: "edit-cat"; cat: Category }
    | { type: "delete-cat"; cat: Category }
    | { type: "add-tag" }
    | { type: "edit-tag"; tag: Tag }
    | { type: "delete-tag"; tag: Tag }
    | null
  >(null);

  // Apply theme when it changes
  useEffect(() => {
    const vars = THEMES[theme];
    if (!vars) return;
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  // Apply accent color when it changes
  useEffect(() => {
    const accent = ACCENT_PALETTE.find((c) => c.hex === accentColor);
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty("--amber", accent.hsl);
    root.style.setProperty("--primary", accent.hsl);
    root.style.setProperty("--accent", accent.hsl);
    root.style.setProperty("--ring", accent.hsl);
    root.style.setProperty("--sidebar-primary", accent.hsl);
    root.style.setProperty("--sidebar-ring", accent.hsl);
  }, [accentColor]);

  // Lock on password enable
  useEffect(() => {
    if (passwordEnabled && password) {
      setIsUnlocked(false);
    }
    if (!passwordEnabled) {
      setIsUnlocked(true);
    }
  }, [passwordEnabled, password]);

  // Escape key for fullscreen/float
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editorMode !== "normal") setEditorMode("normal");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editorMode]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategory !== "all") result = result.filter((n) => n.categoryId === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [notes, selectedCategory, searchQuery]);

  const startEdit = useCallback((note: Note) => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.categoryId);
    setEditTags(note.tags);
    setIsEditing(true);
  }, []);

  const saveNote = useCallback(() => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, title: editTitle || "Без названия", content: editContent, categoryId: editCategory, tags: editTags, updatedAt: new Date() };
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNote(updated);
    setIsEditing(false);
  }, [selectedNote, editTitle, editContent, editCategory, editTags]);

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: generateId(), title: "Новая заметка", content: "",
      categoryId: selectedCategory === "all" ? "personal" : selectedCategory,
      tags: [], createdAt: new Date(), updatedAt: new Date(), isPinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setEditTitle(newNote.title); setEditContent(""); setEditCategory(newNote.categoryId); setEditTags([]);
    setIsEditing(true);
  }, [selectedCategory]);

  const deleteNote = useCallback(() => {
    if (!selectedNote) return;
    const remaining = notes.filter((n) => n.id !== selectedNote.id);
    setNotes(remaining); setSelectedNote(remaining[0] || null);
    setIsEditing(false); setShowDeleteConfirm(false);
  }, [selectedNote, notes]);

  const togglePin = useCallback(() => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, isPinned: !selectedNote.isPinned };
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNote(updated);
  }, [selectedNote]);

  const addCategory = (name: string) => { setCategories((prev) => [...prev, { id: generateId(), name, icon: "Folder" }]); setModal(null); };
  const editCategory_ = (id: string, name: string) => { setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name } : c)); setModal(null); };
  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setNotes((prev) => prev.map((n) => n.categoryId === id ? { ...n, categoryId: "personal" } : n));
    if (selectedCategory === id) setSelectedCategory("all");
    setModal(null);
  };
  const addTag = (name: string, color?: string) => { setTags((prev) => [...prev, { id: generateId(), name, color: color || TAG_COLORS[0] }]); setModal(null); };
  const editTag_ = (id: string, name: string, color?: string) => { setTags((prev) => prev.map((t) => t.id === id ? { ...t, name, color: color || t.color } : t)); setModal(null); };
  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setNotes((prev) => prev.map((n) => ({ ...n, tags: n.tags.filter((tid) => tid !== id) })));
    setModal(null);
  };

  const getTag = (id: string) => tags.find((t) => t.id === id);
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || id;

  // Lock screen
  if (passwordEnabled && password && !isUnlocked) {
    return <LockScreen password={password} onUnlock={() => setIsUnlocked(true)} />;
  }

  // Toolbar buttons for editor (reused in all modes)
  const editorToolbar = selectedNote && (
    <div className="flex items-center gap-1">
      {editorMode === "normal" && (
        <button
          onClick={() => { setSearchOpen((v) => !v); setNotesListHidden(false); }}
          className={`p-2 rounded-md transition-colors ${searchOpen ? "text-amber bg-amber/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          title="Поиск заметок"
        >
          <Icon name="Search" size={15} />
        </button>
      )}
      <button
        onClick={togglePin}
        className={`p-2 rounded-md transition-colors ${selectedNote.isPinned ? "text-amber bg-amber/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="Закрепить"
      >
        <Icon name="Pin" size={15} />
      </button>
      <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Экспорт">
        <Icon name="Download" size={15} />
      </button>
      {/* Window modes */}
      <button
        onClick={() => setEditorMode(editorMode === "fullscreen" ? "normal" : "fullscreen")}
        className={`p-2 rounded-md transition-colors ${editorMode === "fullscreen" ? "text-amber bg-amber/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="На весь экран"
      >
        <Icon name={editorMode === "fullscreen" ? "Minimize2" : "Maximize2"} size={15} />
      </button>
      <button
        onClick={() => setEditorMode(editorMode === "float" ? "normal" : "float")}
        className={`p-2 rounded-md transition-colors ${editorMode === "float" ? "text-amber bg-amber/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="Плавающее окно"
      >
        <Icon name={editorMode === "float" ? "Minimize2" : "PictureInPicture2"} size={15} />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      {isEditing ? (
        <>
          <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Отмена</button>
          <button onClick={saveNote} className="px-3 py-1.5 text-sm rounded-md bg-amber text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium">Сохранить</button>
        </>
      ) : (
        <button onClick={() => startEdit(selectedNote)} className="px-3 py-1.5 text-sm rounded-md bg-muted text-foreground hover:bg-secondary transition-colors">
          <Icon name="Pencil" size={13} className="inline mr-1.5" />Редактировать
        </button>
      )}
      <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Удалить">
        <Icon name="Trash2" size={15} />
      </button>
    </div>
  );

  const editorContentProps = {
    isEditing, selectedNote: selectedNote!,
    editTitle, setEditTitle, editContent, setEditContent,
    editCategory, setEditCategory, editTags, setEditTags,
    categories, tags, formatDate,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-56"}`}>
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-amber flex items-center justify-center flex-shrink-0">
            <span className="text-[hsl(var(--primary-foreground))] font-mono font-semibold text-xs">DF</span>
          </div>
          {!sidebarCollapsed && <span className="font-semibold text-foreground tracking-tight animate-fade-in">DF заметки</span>}
          <button onClick={() => setSidebarCollapsed((v) => !v)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <Icon name={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={15} />
          </button>
        </div>

        <div className="px-3 py-3">
          <button onClick={createNote} className={`flex items-center gap-2 w-full rounded-md bg-amber text-[hsl(var(--primary-foreground))] font-medium text-sm px-3 py-2 hover:opacity-90 transition-opacity ${sidebarCollapsed ? "justify-center px-2" : ""}`}>
            <Icon name="Plus" size={15} />
            {!sidebarCollapsed && <span>Новая заметка</span>}
          </button>
        </div>

        <nav className="flex-1 px-2 py-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-2 mb-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Разделы</p>
              <button onClick={() => setModal({ type: "add-cat" })} className="text-muted-foreground hover:text-amber transition-colors" title="Добавить раздел">
                <Icon name="Plus" size={12} />
              </button>
            </div>
          )}
          {categories.map((cat) => {
            const count = cat.id === "all" ? notes.length : notes.filter((n) => n.categoryId === cat.id).length;
            const active = selectedCategory === cat.id;
            const isSystem = SYSTEM_CATEGORY_IDS.includes(cat.id);
            const menuKey = `cat-${cat.id}`;
            return (
              <div key={cat.id} className="relative group mb-0.5">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-sm transition-all ${active ? "bg-[hsl(var(--sidebar-accent))] text-amber font-medium" : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground"} ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? cat.name : undefined}
                >
                  <Icon name={cat.icon} fallback="Folder" size={15} />
                  {!sidebarCollapsed && <><span className="flex-1 text-left">{cat.name}</span><span className="text-xs text-muted-foreground">{count}</span></>}
                </button>
                {!sidebarCollapsed && !isSystem && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === menuKey ? null : menuKey); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <Icon name="MoreHorizontal" size={13} />
                    </button>
                    {openMenu === menuKey && (
                      <DropdownMenu onClose={() => setOpenMenu(null)} items={[
                        { label: "Переименовать", icon: "Pencil", onClick: () => setModal({ type: "edit-cat", cat }) },
                        { label: "Удалить", icon: "Trash2", danger: true, onClick: () => setModal({ type: "delete-cat", cat }) },
                      ]} />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!sidebarCollapsed && (
            <>
              <div className="flex items-center justify-between px-2 mt-4 mb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Теги</p>
                <button onClick={() => setModal({ type: "add-tag" })} className="text-muted-foreground hover:text-amber transition-colors" title="Добавить тег">
                  <Icon name="Plus" size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 px-2">
                {tags.map((tag) => {
                  const menuKey = `tag-${tag.id}`;
                  return (
                    <div key={tag.id} className="relative group/tag">
                      <button
                        onClick={() => { setSearchQuery(tag.name); setSelectedCategory("all"); }}
                        className="text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
                        style={{ borderColor: tag.color + "60", color: tag.color, backgroundColor: tag.color + "15" }}
                      >
                        #{tag.name}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === menuKey ? null : menuKey); }}
                        className="absolute -top-1.5 -right-1.5 opacity-0 group-hover/tag:opacity-100 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Icon name="MoreHorizontal" size={9} />
                      </button>
                      {openMenu === menuKey && (
                        <div className="absolute left-0 top-full mt-1 z-50">
                          <DropdownMenu onClose={() => setOpenMenu(null)} items={[
                            { label: "Изменить", icon: "Pencil", onClick: () => setModal({ type: "edit-tag", tag }) },
                            { label: "Удалить", icon: "Trash2", danger: true, onClick: () => setModal({ type: "delete-tag", tag }) },
                          ]} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        <div className="px-3 py-3 border-t border-border">
          {!sidebarCollapsed ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Настройки"
                >
                  <Icon name="Settings" size={14} />
                </button>
                <button
                  onClick={() => setNotesListHidden((v) => !v)}
                  className={`p-1.5 rounded-md transition-colors ${notesListHidden ? "text-amber bg-amber/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  title={notesListHidden ? "Показать панель заметок" : "Скрыть панель заметок"}
                >
                  <Icon name={notesListHidden ? "PanelRightOpen" : "PanelRightClose"} size={14} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-muted-foreground">Офлайн-режим</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-center">
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Настройки"
              >
                <Icon name="Settings" size={14} />
              </button>
              <button
                onClick={() => setNotesListHidden((v) => !v)}
                className={`w-full flex justify-center p-1.5 rounded-md transition-colors ${notesListHidden ? "text-amber bg-amber/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                title={notesListHidden ? "Показать панель заметок" : "Скрыть панель заметок"}
              >
                <Icon name={notesListHidden ? "PanelRightOpen" : "PanelRightClose"} size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Notes list panel */}
      {!notesListHidden && (
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">
          {/* Search row */}
          <div className="px-3 py-3 border-b border-border">
            <div className="relative">
              <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Поиск по заметкам..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted rounded-md pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {filteredNotes.length}{" "}{filteredNotes.length === 1 ? "заметка" : "заметок"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Icon name="FileX" size={24} className="mb-2 opacity-40" />
                <p className="text-sm">Нет заметок</p>
              </div>
            ) : (
              filteredNotes.map((note, i) => (
                <button
                  key={note.id}
                  onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                  className={`w-full text-left px-4 py-3 border-b border-border note-card-hover transition-all animate-slide-in ${selectedNote?.id === note.id ? "bg-muted border-l-2 border-l-amber" : "border-l-2 border-l-transparent"}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-medium text-sm text-foreground line-clamp-1 flex-1">
                      {note.isPinned && <Icon name="Pin" size={10} className="inline mr-1 text-amber" />}
                      {note.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{formatDate(note.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{note.content || "Пустая заметка"}</p>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {note.tags.slice(0, 2).map((tid) => {
                        const tag = getTag(tid);
                        if (!tag) return null;
                        return (
                          <span key={tid} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color + "20", color: tag.color }}>
                            #{tag.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor — normal mode */}
      {editorMode === "normal" && (
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{getCategoryName(selectedNote.categoryId)}</span>
                  {selectedNote.tags.map((tid) => {
                    const tag = getTag(tid);
                    if (!tag) return null;
                    return <span key={tid} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tag.color + "20", color: tag.color }}>#{tag.name}</span>;
                  })}
                </div>
                {editorToolbar}
              </div>
              <div className="flex-1 overflow-y-auto">
                <EditorContent {...editorContentProps} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Icon name="FileText" size={28} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-1">Выберите заметку</h2>
              <p className="text-sm text-muted-foreground mb-4">или создайте новую</p>
              <button onClick={createNote} className="flex items-center gap-2 px-4 py-2 bg-amber text-[hsl(var(--primary-foreground))] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                <Icon name="Plus" size={15} />Новая заметка
              </button>
            </div>
          )}
        </main>
      )}

      {/* Editor — fullscreen overlay */}
      {editorMode === "fullscreen" && selectedNote && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-8 py-3.5 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{getCategoryName(selectedNote.categoryId)}</span>
              {selectedNote.tags.map((tid) => {
                const tag = getTag(tid);
                if (!tag) return null;
                return <span key={tid} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tag.color + "20", color: tag.color }}>#{tag.name}</span>;
              })}
            </div>
            {editorToolbar}
          </div>
          <div className="flex-1 overflow-y-auto">
            <EditorContent {...editorContentProps} />
          </div>
        </div>
      )}

      {/* Editor — floating window */}
      {editorMode === "float" && selectedNote && (
        <FloatEditor
          selectedNote={selectedNote}
          editorContentProps={editorContentProps}
          editorToolbar={editorToolbar}
          getCategoryName={getCategoryName}
          getTag={getTag}
          onClose={() => setEditorMode("normal")}
        />
      )}

      {/* Note delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-80 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center mb-3">
              <Icon name="Trash2" size={18} className="text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Удалить заметку?</h3>
            <p className="text-sm text-muted-foreground mb-5">«{selectedNote?.title}» будет удалена навсегда.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors">Отмена</button>
              <button onClick={deleteNote} className="flex-1 py-2 text-sm rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity font-medium">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* Category modals */}
      {modal?.type === "add-cat" && <EditModal title="Новый раздел" value="" onSave={(name) => addCategory(name)} onClose={() => setModal(null)} />}
      {modal?.type === "edit-cat" && <EditModal title="Переименовать раздел" value={modal.cat.name} onSave={(name) => editCategory_(modal.cat.id, name)} onClose={() => setModal(null)} />}
      {modal?.type === "delete-cat" && <DeleteModal label={modal.cat.name} onConfirm={() => deleteCategory(modal.cat.id)} onClose={() => setModal(null)} />}
      {modal?.type === "add-tag" && <EditModal title="Новый тег" value="" showColor onSave={(name, color) => addTag(name, color)} onClose={() => setModal(null)} />}
      {modal?.type === "edit-tag" && <EditModal title="Изменить тег" value={modal.tag.name} color={modal.tag.color} showColor onSave={(name, color) => editTag_(modal.tag.id, name, color)} onClose={() => setModal(null)} />}
      {modal?.type === "delete-tag" && <DeleteModal label={`#${modal.tag.name}`} onConfirm={() => deleteTag(modal.tag.id)} onClose={() => setModal(null)} />}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          password={password}
          setPassword={setPassword}
          passwordEnabled={passwordEnabled}
          setPasswordEnabled={setPasswordEnabled}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Lock screen */}
      {passwordEnabled && password && !isUnlocked && (
        <LockScreen password={password} onUnlock={() => setIsUnlocked(true)} />
      )}
    </div>
  );
}

// --- Floating editor window (draggable) ---
function FloatEditor({
  selectedNote, editorContentProps, editorToolbar, getCategoryName, getTag, onClose,
}: {
  selectedNote: Note;
  editorContentProps: Parameters<typeof EditorContent>[0];
  editorToolbar: React.ReactNode;
  getCategoryName: (id: string) => string;
  getTag: (id: string) => Tag | undefined;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 340, y: window.innerHeight / 2 - 260 });
  const [size, setSize] = useState({ w: 680, h: 520 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onMouseDownDrag = (e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      if (resizing.current) {
        const dw = e.clientX - resizeStart.current.x;
        const dh = e.clientY - resizeStart.current.y;
        setSize({ w: Math.max(400, resizeStart.current.w + dw), h: Math.max(300, resizeStart.current.h + dh) });
      }
    };
    const onUp = () => { dragging.current = false; resizing.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div
      className="fixed z-40 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Draggable title bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-[hsl(var(--sidebar-background))] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDownDrag}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{getCategoryName(selectedNote.categoryId)}</span>
          {selectedNote.tags.slice(0, 2).map((tid) => {
            const tag = getTag(tid);
            if (!tag) return null;
            return <span key={tid} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: tag.color + "20", color: tag.color }}>#{tag.name}</span>;
          })}
        </div>
        <div className="flex items-center gap-1 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
          {editorToolbar}
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1" title="Закрыть (Escape)">
            <Icon name="X" size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent {...editorContentProps} />
      </div>
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
        onMouseDown={onMouseDownResize}
        style={{ background: "linear-gradient(135deg, transparent 50%, hsl(var(--border)) 50%)", borderRadius: "0 0 12px 0" }}
      />
    </div>
  );
}