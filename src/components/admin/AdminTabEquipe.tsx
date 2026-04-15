import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function AdminTabEquipe({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", password: "", role: "clinic_staff" });

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "list", clinic_id: clinicId } });
      if (error) throw error;
      return data?.users || [];
    },
    enabled: !!clinicId,
  });

  const createMemberMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Nenhuma loja");
      const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "create", ...newMember, clinic_id: clinicId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setTeamDialogOpen(false);
      setNewMember({ email: "", password: "", role: "clinic_staff" });
      toast({ title: "Membro adicionado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async ({ role_id, user_id }: { role_id: string; user_id: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "delete", role_id, user_id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-members"] }); toast({ title: "Membro removido!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ role_id, new_role }: { role_id: string; new_role: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-team", { body: { action: "update_role", role_id, new_role } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-members"] }); toast({ title: "Cargo atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Membros da Equipe</CardTitle>
          <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Adicionar Membro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Membro da Equipe</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>E-mail</Label><Input value={newMember.email} onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
                <div><Label>Senha Inicial</Label><Input type="password" value={newMember.password} onChange={e => setNewMember(m => ({ ...m, password: e.target.value }))} placeholder="Mínimo 6 caracteres" /></div>
                <div><Label>Cargo</Label>
                  <Select value={newMember.role} onValueChange={v => setNewMember(m => ({ ...m, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic_owner">Proprietário</SelectItem>
                      <SelectItem value="clinic_staff">Vendedor</SelectItem>
                      <SelectItem value="clinic_receptionist">Recepcionista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => createMemberMutation.mutate()} disabled={createMemberMutation.isPending || !newMember.email || !newMember.password}>
                  {createMemberMutation.isPending ? "Criando..." : "Criar Membro"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : !teamMembers?.length ? (
          <div className="py-12 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/30" /><p className="mt-3 text-muted-foreground">Nenhum membro cadastrado.</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>Cargo</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader>
            <TableBody>{teamMembers.map((member: any) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.email}</TableCell>
                <TableCell>
                  <Select value={member.role} onValueChange={v => updateRoleMutation.mutate({ role_id: member.role_id, new_role: v })}>
                    <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic_owner">Proprietário</SelectItem>
                      <SelectItem value="clinic_staff">Vendedor</SelectItem>
                      <SelectItem value="clinic_receptionist">Recepcionista</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteMemberMutation.mutate({ role_id: member.role_id, user_id: member.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
