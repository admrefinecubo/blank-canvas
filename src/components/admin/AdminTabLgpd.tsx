import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function AdminTabLgpd({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [termContent, setTermContent] = useState("");
  const [termTitle, setTermTitle] = useState("Termo de Consentimento");

  const { data: terms = [] } = useQuery({
    queryKey: ["consent-terms", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("consent_terms").select("*").eq("clinic_id", clinicId).order("version", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const activeTerm = terms.find((t: any) => t.active);

  useEffect(() => {
    if (activeTerm) { setTermContent(activeTerm.content); setTermTitle(activeTerm.title); }
  }, [activeTerm]);

  const { data: consents = [] } = useQuery({
    queryKey: ["patient-consents", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase.from("patient_consents").select("*, patients(name)").eq("clinic_id", clinicId).order("consented_at", { ascending: false });
      return data || [];
    },
    enabled: !!clinicId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clinicId) throw new Error("Sem clínica");
      if (activeTerm) await supabase.from("consent_terms").update({ active: false }).eq("clinic_id", clinicId);
      const nextVersion = (terms[0]?.version || 0) + 1;
      const { error } = await supabase.from("consent_terms").insert({ clinic_id: clinicId, title: termTitle, content: termContent, version: nextVersion, active: true });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consent-terms"] }); toast({ title: "Termo salvo com sucesso!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!clinicId) return <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione uma loja.</CardContent></Card>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Termos de Consentimento LGPD</CardTitle></div></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Título do Termo</Label><Input value={termTitle} onChange={e => setTermTitle(e.target.value)} placeholder="Ex: Termo de Consentimento para Tratamento" /></div>
          <div><Label>Conteúdo do Termo</Label><Textarea value={termContent} onChange={e => setTermContent(e.target.value)} placeholder="Escreva aqui o texto do termo..." className="min-h-[200px]" /></div>
          {activeTerm && <p className="text-xs text-muted-foreground">Versão atual: v{activeTerm.version} — Salvar criará uma nova versão.</p>}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !termContent.trim()}>{saveMutation.isPending ? "Salvando..." : activeTerm ? "Salvar Nova Versão" : "Criar Termo"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><CardTitle className="text-sm">Registros de Consentimento</CardTitle></div></CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <div className="py-8 text-center"><FileText className="mx-auto h-10 w-10 text-muted-foreground/30" /><p className="mt-3 text-muted-foreground">Nenhum consentimento registrado.</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
              <TableBody>{consents.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.patients?.name || "—"}</TableCell>
                  <TableCell className="capitalize">{c.consent_type === "treatment" ? "Tratamento" : c.consent_type === "marketing" ? "Marketing" : "Compartilhamento"}</TableCell>
                  <TableCell><Badge variant={c.consented ? (c.revoked_at ? "destructive" : "default") : "secondary"}>{c.revoked_at ? "Revogado" : c.consented ? "Consentido" : "Recusado"}</Badge></TableCell>
                  <TableCell>{new Date(c.consented_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
