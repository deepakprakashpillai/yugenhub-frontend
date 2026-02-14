import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    LayoutDashboard,
    Search,
    Plus,
    Briefcase,
    Users
} from "lucide-react";
import { Icons } from "./Icons";
import { useAgencyConfig } from "../context/AgencyConfigContext";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { config } = useAgencyConfig();

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[9999]"
        // Creating a backdrop manually or handling it via CSS
        >
            <div className="flex items-center border-b border-zinc-800 px-4">
                <Search className="w-5 h-5 text-zinc-500 mr-2" />
                <Command.Input
                    placeholder="Type a command or search..."
                    className="w-full bg-transparent border-none p-4 text-white placeholder:text-zinc-500 focus:outline-none text-base"
                />
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                    No results found.
                </Command.Empty>

                <Command.Group heading="Suggestions" className="text-xs text-zinc-500 font-medium mb-2 px-2">
                    <div className="space-y-1">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/tasks?action=new"))}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                        >
                            <Plus className="w-4 h-4 text-zinc-400" />
                            <span>Create New Task</span>
                        </Command.Item>

                        {config?.verticals?.map(vertical => (
                            <Command.Item
                                key={vertical.id}
                                onSelect={() => runCommand(() => navigate(`/${vertical.id}?action=new`))}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                            >
                                <span
                                    className="w-4 h-4 rounded-full border border-current opacity-70 flex items-center justify-center text-[10px]"
                                    style={{ color: vertical.color }}
                                >
                                    <Icons.Plus className="w-3 h-3" />
                                </span>
                                <span>Create {vertical.label} Project</span>
                            </Command.Item>
                        ))}
                    </div>
                </Command.Group>

                <div className="border-t border-zinc-800 my-2" />

                <Command.Group heading="Navigation" className="text-xs text-zinc-500 font-medium mb-2 px-2">
                    <div className="space-y-1">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/"))}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                        >
                            <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                            <span>Dashboard</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/tasks"))}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                        >
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <span>Tasks</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/clients"))}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                        >
                            <Users className="w-4 h-4 text-zinc-400" />
                            <span>Clients</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/settings"))}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                        >
                            <Settings className="w-4 h-4 text-zinc-400" />
                            <span>Settings</span>
                        </Command.Item>
                    </div>
                </Command.Group>

                {config?.verticals?.length > 0 && (
                    <>
                        <div className="border-t border-zinc-800 my-2" />
                        <Command.Group heading="Verticals" className="text-xs text-zinc-500 font-medium mb-2 px-2">
                            <div className="space-y-1">
                                {config.verticals.map((vertical) => (
                                    <Command.Item
                                        key={vertical.id}
                                        onSelect={() => runCommand(() => navigate(`/${vertical.id}`))}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-zinc-800 transition-colors cursor-pointer aria-selected:bg-zinc-800"
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: vertical.color || '#fff' }}
                                        />
                                        <span>{vertical.label}</span>
                                    </Command.Item>
                                ))}
                            </div>
                        </Command.Group>
                    </>
                )}
            </Command.List>
        </Command.Dialog>
    );
}
