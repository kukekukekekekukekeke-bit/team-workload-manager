"use client";

import { useState } from "react";
import { useActivePlan } from "@/hooks/useActivePlan";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Member } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Trash2, UserPlus } from "lucide-react";

export function MemberManager() {
    const { members, addMember, updateMember, deleteMember } = useActivePlan();
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMembers, setEditedMembers] = useState<Member[]>([]);
    const [newMember, setNewMember] = useState<Partial<Member>>({
        name: "",
        buffer: 0,
        projectRatio: 50,
        featureRatio: 50,
    });

    const handleSave = () => {
        if (!newMember.name) return;
        const member: Member = {
            id: uuidv4(),
            name: newMember.name,
            buffer: Number(newMember.buffer) || 0,
            projectRatio: Number(newMember.projectRatio) || 0,
            featureRatio: Number(newMember.featureRatio) || 0,
        };
        addMember(member);
        setIsOpen(false);
        setNewMember({ name: "", buffer: 0, projectRatio: 50, featureRatio: 50 });
    };

    const startEditing = () => {
        setEditedMembers(JSON.parse(JSON.stringify(members)));
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedMembers([]);
    };

    const saveEditing = () => {
        editedMembers.forEach((member) => {
            updateMember(member.id, {
                buffer: member.buffer,
                projectRatio: member.projectRatio,
                featureRatio: member.featureRatio,
            });
        });
        setIsEditing(false);
    };

    const updateEditedMember = (id: string, updates: Partial<Member>) => {
        setEditedMembers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Team Members</h2>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={cancelEditing}>
                                Cancel
                            </Button>
                            <Button onClick={saveEditing}>Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={startEditing}>
                                Bulk Edit
                            </Button>
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Team Member</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right">Name</Label>
                                            <Input
                                                id="name"
                                                value={newMember.name}
                                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="buffer" className="text-right">Buffer (%)</Label>
                                            <Input
                                                id="buffer"
                                                type="number"
                                                value={newMember.buffer}
                                                onChange={(e) => setNewMember({ ...newMember, buffer: Number(e.target.value) })}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Ratio Target</Label>
                                            <div className="col-span-3 space-y-2">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Project: {newMember.projectRatio}%</span>
                                                    <span>Feature: {newMember.featureRatio}%</span>
                                                </div>
                                                <Input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={newMember.projectRatio}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setNewMember({ ...newMember, projectRatio: val, featureRatio: 100 - val });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={handleSave}>Save</Button>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                    <h3 className="text-sm font-medium">Batch Update</h3>
                    <div className="flex gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Buffer (%)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    className="w-24"
                                    placeholder="0"
                                    id="batch-buffer"
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        const val = Number((document.getElementById('batch-buffer') as HTMLInputElement).value);
                                        setEditedMembers(prev => prev.map(m => ({ ...m, buffer: val })));
                                    }}
                                >
                                    Apply to All
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label>Target Ratio (Project/Feature)</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="range"
                                    min="0"
                                    max="100"
                                    className="w-48"
                                    defaultValue="50"
                                    id="batch-ratio"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const display = document.getElementById('batch-ratio-display');
                                        if (display) display.innerText = `P: ${val}% / F: ${100 - Number(val)}%`;
                                    }}
                                />
                                <span id="batch-ratio-display" className="text-xs text-muted-foreground w-24">P: 50% / F: 50%</span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        const val = Number((document.getElementById('batch-ratio') as HTMLInputElement).value);
                                        setEditedMembers(prev => prev.map(m => ({
                                            ...m,
                                            projectRatio: val,
                                            featureRatio: 100 - val
                                        })));
                                    }}
                                >
                                    Apply to All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Buffer</TableHead>
                            <TableHead>Target Ratio (P/F)</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(isEditing ? editedMembers : members).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No members added.
                                </TableCell>
                            </TableRow>
                        ) : (
                            (isEditing ? editedMembers : members).map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={member.buffer}
                                                    onChange={(e) => updateEditedMember(member.id, { buffer: Number(e.target.value) })}
                                                    className="w-20"
                                                />
                                                <span>%</span>
                                            </div>
                                        ) : (
                                            `${member.buffer}%`
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>P: {member.projectRatio}%</span>
                                                    <span>F: {member.featureRatio}%</span>
                                                </div>
                                                <Input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={member.projectRatio}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        updateEditedMember(member.id, {
                                                            projectRatio: val,
                                                            featureRatio: 100 - val,
                                                        });
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{member.projectRatio}%</span>
                                                <Progress value={member.projectRatio} className="h-2 w-20" />
                                                <span className="text-xs text-muted-foreground">{member.featureRatio}%</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {!isEditing && (
                                            <Button variant="ghost" size="icon" onClick={() => deleteMember(member.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
