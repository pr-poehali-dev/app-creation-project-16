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
    title: "Добро пожаловать в Notum",
    content:
      "Это твоё пространство для мыслей, идей и задач. Notum работает офлайн и синхронизируется когда появляется интернет.\n\nНачни с создания первой заметки — нажми кнопку «+» слева.",
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
  if (days === 0) return "Сегодня";
  if (days === 1) return "Вчера";
  if (days < 7) return `${days} дн. назад`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const generateId = () => Math.random().toString(36).slice(2, 10);

// --- Inline dropdown menu ---
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

// --- Modal for create/edit ---
function EditModal({
  title,
  value,
  color,
  showColor,
  onSave,
  onClose,
}: {
  title: string;
  value: string;
  color?: string;
  showColor?: boolean;
  onSave: (name: string, color?: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(value);
  const [selectedColor, setSelectedColor] = useState(color || TAG_COLORS[0]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-5 w-72 shadow-2xl">
        <h3 className="font-semibold text-foreground mb-4 text-sm">{title}</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(name, selectedColor); if (e.key === "Escape") onClose(); }}
          className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber mb-3"
          placeholder="Название..."
        />
        {showColor && (
          <div className="flex gap-2 flex-wrap mb-4">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: selectedColor === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), selectedColor)}
            className="flex-1 py-2 text-sm rounded-lg bg-amber text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete confirm modal ---
function DeleteModal({
  label,
  onConfirm,
  onClose,
}: {
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 w-72 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center mb-3">
          <Icon name="Trash2" size={18} className="text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground mb-1 text-sm">Удалить?</h3>
        <p className="text-xs text-muted-foreground mb-5">
          «{label}» будет удалён навсегда.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-sm rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity font-medium"
          >
            Удалить
          </button>
        </div>
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

  // Dropdown open state: "cat-{id}" | "tag-{id}" | null
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Modals
  const [modal, setModal] = useState<
    | { type: "add-cat" }
    | { type: "edit-cat"; cat: Category }
    | { type: "delete-cat"; cat: Category }
    | { type: "add-tag" }
    | { type: "edit-tag"; tag: Tag }
    | { type: "delete-tag"; tag: Tag }
    | null
  >(null);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategory !== "all") {
      result = result.filter((n) => n.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
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
    const updated = {
      ...selectedNote,
      title: editTitle || "Без названия",
      content: editContent,
      categoryId: editCategory,
      tags: editTags,
      updatedAt: new Date(),
    };
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNote(updated);
    setIsEditing(false);
  }, [selectedNote, editTitle, editContent, editCategory, editTags]);

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: generateId(),
      title: "Новая заметка",
      content: "",
      categoryId: selectedCategory === "all" ? "personal" : selectedCategory,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditCategory(newNote.categoryId);
    setEditTags([]);
    setIsEditing(true);
  }, [selectedCategory]);

  const deleteNote = useCallback(() => {
    if (!selectedNote) return;
    const remaining = notes.filter((n) => n.id !== selectedNote.id);
    setNotes(remaining);
    setSelectedNote(remaining[0] || null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [selectedNote, notes]);

  const togglePin = useCallback(() => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, isPinned: !selectedNote.isPinned };
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNote(updated);
  }, [selectedNote]);

  // --- Category CRUD ---
  const addCategory = (name: string) => {
    const newCat: Category = { id: generateId(), name, icon: "Folder" };
    setCategories((prev) => [...prev, newCat]);
    setModal(null);
  };

  const editCategory_ = (id: string, name: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    setModal(null);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setNotes((prev) => prev.map((n) => n.categoryId === id ? { ...n, categoryId: "personal" } : n));
    if (selectedCategory === id) setSelectedCategory("all");
    setModal(null);
  };

  // --- Tag CRUD ---
  const addTag = (name: string, color?: string) => {
    const newTag: Tag = { id: generateId(), name, color: color || TAG_COLORS[0] };
    setTags((prev) => [...prev, newTag]);
    setModal(null);
  };

  const editTag_ = (id: string, name: string, color?: string) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name, color: color || t.color } : t)));
    setModal(null);
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setNotes((prev) => prev.map((n) => ({ ...n, tags: n.tags.filter((tid) => tid !== id) })));
    setModal(null);
  };

  const getTag = (id: string) => tags.find((t) => t.id === id);
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || id;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-56"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-amber flex items-center justify-center flex-shrink-0">
            <span className="text-[hsl(var(--primary-foreground))] font-mono font-semibold text-sm">N</span>
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-foreground tracking-tight animate-fade-in">
              Notum
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={15} />
          </button>
        </div>

        {/* New note button */}
        <div className="px-3 py-3">
          <button
            onClick={createNote}
            className={`flex items-center gap-2 w-full rounded-md bg-amber text-[hsl(var(--primary-foreground))] font-medium text-sm px-3 py-2 hover:opacity-90 transition-opacity ${sidebarCollapsed ? "justify-center px-2" : ""}`}
          >
            <Icon name="Plus" size={15} />
            {!sidebarCollapsed && <span>Новая заметка</span>}
          </button>
        </div>

        {/* Categories */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-2 mb-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Разделы
              </p>
              <button
                onClick={() => setModal({ type: "add-cat" })}
                className="text-muted-foreground hover:text-amber transition-colors"
                title="Добавить раздел"
              >
                <Icon name="Plus" size={12} />
              </button>
            </div>
          )}
          {categories.map((cat) => {
            const count =
              cat.id === "all"
                ? notes.length
                : notes.filter((n) => n.categoryId === cat.id).length;
            const active = selectedCategory === cat.id;
            const isSystem = SYSTEM_CATEGORY_IDS.includes(cat.id);
            const menuKey = `cat-${cat.id}`;
            return (
              <div key={cat.id} className="relative group mb-0.5">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-sm transition-all ${
                    active
                      ? "bg-[hsl(var(--sidebar-accent))] text-amber font-medium"
                      : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? cat.name : undefined}
                >
                  <Icon name={cat.icon} fallback="Folder" size={15} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </>
                  )}
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
                      <DropdownMenu
                        onClose={() => setOpenMenu(null)}
                        items={[
                          { label: "Переименовать", icon: "Pencil", onClick: () => setModal({ type: "edit-cat", cat }) },
                          { label: "Удалить", icon: "Trash2", danger: true, onClick: () => setModal({ type: "delete-cat", cat }) },
                        ]}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tags */}
          {!sidebarCollapsed && (
            <>
              <div className="flex items-center justify-between px-2 mt-4 mb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  Теги
                </p>
                <button
                  onClick={() => setModal({ type: "add-tag" })}
                  className="text-muted-foreground hover:text-amber transition-colors"
                  title="Добавить тег"
                >
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
                          <DropdownMenu
                            onClose={() => setOpenMenu(null)}
                            items={[
                              { label: "Изменить", icon: "Pencil", onClick: () => setModal({ type: "edit-tag", tag }) },
                              { label: "Удалить", icon: "Trash2", danger: true, onClick: () => setModal({ type: "delete-tag", tag }) },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* Bottom */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Офлайн-режим</span>
            </div>
          </div>
        )}
      </aside>

      {/* Notes list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {/* Search */}
        <div className="px-3 py-3 border-b border-border">
          <div className="relative">
            <Icon
              name="Search"
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Поиск по заметкам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted rounded-md pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Notes count */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredNotes.length}{" "}
            {filteredNotes.length === 1 ? "заметка" : "заметок"}
          </span>
        </div>

        {/* Notes list */}
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
                className={`w-full text-left px-4 py-3 border-b border-border note-card-hover transition-all animate-slide-in ${
                  selectedNote?.id === note.id
                    ? "bg-muted border-l-2 border-l-amber"
                    : "border-l-2 border-l-transparent"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-medium text-sm text-foreground line-clamp-1 flex-1">
                    {note.isPinned && (
                      <Icon name="Pin" size={10} className="inline mr-1 text-amber" />
                    )}
                    {note.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                  {note.content || "Пустая заметка"}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {note.tags.slice(0, 2).map((tid) => {
                      const tag = getTag(tid);
                      if (!tag) return null;
                      return (
                        <span
                          key={tid}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: tag.color + "20", color: tag.color }}
                        >
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

      {/* Editor */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {getCategoryName(selectedNote.categoryId)}
                </span>
                {selectedNote.tags.map((tid) => {
                  const tag = getTag(tid);
                  if (!tag) return null;
                  return (
                    <span
                      key={tid}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    >
                      #{tag.name}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={togglePin}
                  className={`p-2 rounded-md transition-colors ${
                    selectedNote.isPinned
                      ? "text-amber bg-amber/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Закрепить"
                >
                  <Icon name="Pin" size={15} />
                </button>
                <button
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Экспорт"
                >
                  <Icon name="Download" size={15} />
                </button>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={saveNote}
                      className="px-3 py-1.5 text-sm rounded-md bg-amber text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
                    >
                      Сохранить
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(selectedNote)}
                    className="px-3 py-1.5 text-sm rounded-md bg-muted text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon name="Pencil" size={13} className="inline mr-1.5" />
                    Редактировать
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="max-w-2xl mx-auto px-8 py-8 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="text-xs bg-muted border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-amber"
                    >
                      {categories
                        .filter((c) => c.id !== "all")
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-1.5 flex-wrap">
                      {tags.map((tag) => {
                        const active = editTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() =>
                              setEditTags((prev) =>
                                active ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                              )
                            }
                            className="text-xs px-2 py-1 rounded-full border transition-all"
                            style={{
                              borderColor: active ? tag.color : tag.color + "40",
                              backgroundColor: active ? tag.color + "25" : "transparent",
                              color: active ? tag.color : tag.color + "90",
                            }}
                          >
                            #{tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Заголовок заметки..."
                    className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none mb-4 border-b border-border pb-3"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Начните писать..."
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none leading-relaxed min-h-96"
                    style={{ fontFamily: "inherit" }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="max-w-2xl mx-auto px-8 py-8 animate-fade-in">
                  <h1 className="text-2xl font-semibold text-foreground mb-1">
                    {selectedNote.title}
                  </h1>
                  <p className="text-xs text-muted-foreground mb-6">
                    Изменено {formatDate(selectedNote.updatedAt)} ·{" "}
                    {selectedNote.content.length} символов
                  </p>
                  <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                    {selectedNote.content || (
                      <span className="text-muted-foreground italic">
                        Пустая заметка. Нажмите «Редактировать» чтобы начать.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Icon name="FileText" size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-1">Выберите заметку</h2>
            <p className="text-sm text-muted-foreground mb-4">или создайте новую</p>
            <button
              onClick={createNote}
              className="flex items-center gap-2 px-4 py-2 bg-amber text-[hsl(var(--primary-foreground))] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Icon name="Plus" size={15} />
              Новая заметка
            </button>
          </div>
        )}
      </main>

      {/* Note delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-80 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center mb-3">
              <Icon name="Trash2" size={18} className="text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Удалить заметку?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              «{selectedNote?.title}» будет удалена навсегда.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm rounded-lg bg-muted text-foreground hover:bg-secondary transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={deleteNote}
                className="flex-1 py-2 text-sm rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity font-medium"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category modals */}
      {modal?.type === "add-cat" && (
        <EditModal
          title="Новый раздел"
          value=""
          onSave={(name) => addCategory(name)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit-cat" && (
        <EditModal
          title="Переименовать раздел"
          value={modal.cat.name}
          onSave={(name) => editCategory_(modal.cat.id, name)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete-cat" && (
        <DeleteModal
          label={modal.cat.name}
          onConfirm={() => deleteCategory(modal.cat.id)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Tag modals */}
      {modal?.type === "add-tag" && (
        <EditModal
          title="Новый тег"
          value=""
          showColor
          onSave={(name, color) => addTag(name, color)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit-tag" && (
        <EditModal
          title="Изменить тег"
          value={modal.tag.name}
          color={modal.tag.color}
          showColor
          onSave={(name, color) => editTag_(modal.tag.id, name, color)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete-tag" && (
        <DeleteModal
          label={`#${modal.tag.name}`}
          onConfirm={() => deleteTag(modal.tag.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
