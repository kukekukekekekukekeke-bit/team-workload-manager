import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Layout, ChevronLeft, ChevronRight, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlanSidebar() {
    const { plans, activePlanId, addPlan, switchPlan, updatePlanName, deletePlan } = useAppStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState("");
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleAddPlan = () => {
        if (!newPlanName.trim()) return;
        addPlan(newPlanName);
        setNewPlanName("");
        setIsAddDialogOpen(false);
    };

    const handleStartEdit = (id: string, currentName: string) => {
        setEditingPlanId(id);
        setEditName(currentName);
    };

    const handleSaveEdit = () => {
        if (editingPlanId && editName.trim()) {
            updatePlanName(editingPlanId, editName);
            setEditingPlanId(null);
            setEditName("");
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
            deletePlan(id);
        }
    };

    return (
        <div
            className={cn(
                "border-r bg-muted/10 h-full flex flex-col transition-all duration-300 ease-in-out relative",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>

            <div className={cn("p-4 border-b flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <h2 className="font-semibold flex items-center gap-2 truncate">
                        <Layout className="h-4 w-4" />
                        Plans
                    </h2>
                )}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Create New Plan">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Plan</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Plan Name (e.g., PI 1)"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddPlan()}
                            />
                        </div>
                        <Button onClick={handleAddPlan}>Create Plan</Button>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "group flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors relative",
                            activePlanId === plan.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted",
                            isCollapsed ? "justify-center" : "justify-between"
                        )}
                        onClick={() => switchPlan(plan.id)}
                        title={isCollapsed ? plan.name : undefined}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Briefcase className={cn("h-4 w-4 flex-shrink-0", activePlanId === plan.id ? "text-primary-foreground" : "text-muted-foreground")} />
                            {!isCollapsed && (
                                editingPlanId === plan.id ? (
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={handleSaveEdit}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                                        autoFocus
                                        className="h-8 text-foreground min-w-0"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="truncate font-medium">{plan.name}</span>
                                )
                            )}
                        </div>

                        {!isCollapsed && (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-6 w-6",
                                                activePlanId === plan.id ? "text-primary-foreground hover:text-primary-foreground/80" : ""
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(plan.id, plan.name);
                                        }}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(plan.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
