import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DaysSchedulePicker from "@/components/DaysSchedulePicker";
import type { HorariosEspeciais } from "@/lib/constants";
import { Loader2, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import AdminTabMetas from "@/components/admin/AdminTabMetas";

export default function SettingsPage() {
  const { clinicId, activeLojaId } = useAuth();
  const queryClient = useQueryClient();

  const [clinicForm, setClinicForm] = useState({ name: "", phone: "", email: "" });
  const [storeForm, setStoreForm] = useState({
    nome_loja: "",
    horario_inicio: "08:00",
    horario_fim: "18:00",
    dias_funcionamento: "",
    horarios_especiais: {} as HorariosEspeciais,
  });

  const { data: clinic } = useQuery({
    queryKey: ["clinic-settings", clinicId],
    queryFn: async () => { if (!clinicId) return null; const { data } = await supabase.from("clinics").select("*").eq("id", clinicId).single(); return data; },
    enabled: !!clinicId,
  });

  const { data: activeLoja } = useQuery({
    queryKey: ["settings-loja", activeLojaId],
    queryFn: async () => {
      if (!activeLojaId) return null;
      const { data, error } = await supabase
        .from("lojas")
        .select("id, nome_loja, horario_inicio, horario_fim, dias_funcionamento, horarios_especiais")
        .eq("id", activeLojaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeLojaId,
  });

  useEffect(() => { if (clinic) setClinicForm({ name: clinic.name || "", phone: clinic.phone || "", email: clinic.email || "" }); }, [clinic]);

  useEffect(() => {
    if (!activeLoja) return;
    setStoreForm({
      nome_loja: activeLoja.nome_loja || "",
      horario_inicio: activeLoja.horario_inicio || "08:00",
      horario_fim: activeLoja.horario_fim || "18:00",
      dias_funcionamento: activeLoja.dias_funcionamento || "seg,ter,qua,qui,sex",
      horarios_especiais: ((activeLoja as any).horarios_especiais as HorariosEspeciais) || {},
    });
  }, [activeLoja]);

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!activeLojaId) throw new Error("Nenhuma loja selecionada");
      const { error } = await supabase
        .from("lojas")
        .update({
          horario_inicio: storeForm.horario_inicio || null,
          horario_fim: storeForm.horario_fim || null,
          dias_funcionamento: storeForm.dias_funcionamento.trim() || null,
          horarios_especiais: storeForm.horarios_especiais || {},
        } as any)
        .eq("id", activeLojaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-loja"] });
      toast({ title: "Horário salvo!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="clinic">
        <TabsList className="bg-accent flex-wrap h-auto gap-1">
          <TabsTrigger value="clinic">Conta</TabsTrigger>
          <TabsTrigger value="metas"><Target className="h-3.5 w-3.5 mr-1" />Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="mt-4 space-y-4">
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm">Dados da Loja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Nome da Loja</Label><Input value={storeForm.nome_loja} readOnly /></div>
                <div><Label>Telefone</Label><Input value={clinicForm.phone} readOnly /></div>
                <div><Label>E-mail</Label><Input value={clinicForm.email} readOnly /></div>
              </div>
              <p className="text-sm text-muted-foreground">Para alterar esses dados, entre em contato com o administrador.</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm">Horário de Funcionamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <DaysSchedulePicker
                diasFuncionamento={storeForm.dias_funcionamento}
                onDiasChange={(v) => setStoreForm(f => ({ ...f, dias_funcionamento: v }))}
                horarioInicio={storeForm.horario_inicio}
                horarioFim={storeForm.horario_fim}
                onHorarioInicioChange={(v) => setStoreForm(f => ({ ...f, horario_inicio: v }))}
                onHorarioFimChange={(v) => setStoreForm(f => ({ ...f, horario_fim: v }))}
                horariosEspeciais={storeForm.horarios_especiais}
                onHorariosEspeciaisChange={(v) => setStoreForm(f => ({ ...f, horarios_especiais: v }))}
              />
              <Button onClick={() => saveScheduleMutation.mutate()} disabled={saveScheduleMutation.isPending} size="sm">
                {saveScheduleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar horário
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="mt-4">
          <AdminTabMetas clinicId={clinicId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
