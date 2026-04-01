import { useState } from "react";
import { MessageSquare, Wifi, WifiOff, QrCode, Send, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const TEMPLATES = [
  { category: "Atendimento", name: "Boas-vindas", text: "Olá, {{nome}}! Seja bem-vindo(a) à {{loja}}. Sou {{atendente}}, como posso ajudá-lo(a)?" },
  { category: "Atendimento", name: "Solicitar dados", text: "{{nome}}, para darmos andamento, preciso de algumas informações. Pode me informar seu nome completo e data de nascimento?" },
  { category: "Agenda", name: "Confirmação D-1", text: "{{nome}}, lembrando da sua consulta amanhã ({{data}}) às {{horário}} com {{profissional}}. Confirma sua presença? Responda SIM ou NÃO." },
  { category: "Agenda", name: "Lembrete 2h", text: "{{nome}}, sua consulta é daqui a 2 horas, às {{horário}}. Estamos aguardando você!" },
  { category: "Agenda", name: "Resgate no-show", text: "{{nome}}, sentimos sua falta hoje! Quer remarcar sua consulta? Temos horários disponíveis essa semana." },
  { category: "Orçamento", name: "Envio de orçamento", text: "{{nome}}, segue o orçamento do(s) procedimento(s) que conversamos. Qualquer dúvida, estou à disposição." },
  { category: "Orçamento", name: "Follow-up D+3", text: "{{nome}}, gostaria de saber se conseguiu analisar o orçamento que enviei. Posso esclarecer alguma dúvida?" },
  { category: "Pós-procedimento", name: "Pós-procedimento", text: "{{nome}}, como está se sentindo após o procedimento? Lembre-se de seguir as orientações que passamos. Qualquer dúvida, estamos aqui!" },
  { category: "NPS", name: "NPS", text: "{{nome}}, de 0 a 10, quanto recomendaria a {{loja}} para um amigo? Sua opinião é muito importante para nós." },
];

export default function WhatsApp() {
  const { clinicId } = useAuth();
  const queryClient = useQueryClient();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ api_url: "", api_key: "", instance_name: "" });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState({ phone: "", message: "" });

  const { data: connectionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["evolution-status", clinicId],
    queryFn: async () => {
      if (!clinicId) return { status: "disconnected" };
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "status", clinic_id: clinicId },
      });
      if (error) return { status: "disconnected" };
      return data;
    },
    enabled: !!clinicId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.status === "pending" ? 5000 : false;
    },
  });

  const isConnected = connectionStatus?.status === "connected";
  const isPending = connectionStatus?.status === "pending";

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "connect", clinic_id: clinicId, ...setupForm },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.qrcode) setQrCode(data.qrcode);
      queryClient.invalidateQueries({ queryKey: ["evolution-status"] });
      toast({ title: "Conexão iniciada! Escaneie o QR Code." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "disconnect", clinic_id: clinicId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evolution-status"] });
      setQrCode(null);
      toast({ title: "WhatsApp desconectado" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("evolution-api", {
        body: { action: "send_message", clinic_id: clinicId, phone: sendForm.phone, message: sendForm.message },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast({ title: "Mensagem enviada!" });
      setSendForm({ phone: "", message: "" });
    },
    onError: (e: any) => toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" }),
  });

  if (!clinicId) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-muted-foreground">Selecione uma conta para acessar o WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? "default" : isPending ? "secondary" : "destructive"} className="gap-1.5">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Conectado" : isPending ? "Aguardando QR Code" : "Desconectado"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>Templates</Button>
        </div>
      </div>

      {!isConnected && !isPending ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Conectar WhatsApp</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Configure a Evolution API para conectar o número da conta via QR Code e enviar mensagens automatizadas.
            </p>
            <Button className="mt-6" onClick={() => setShowSetup(true)}>
              <QrCode className="mr-2 h-4 w-4" /> Configurar Conexão
            </Button>
          </CardContent>
        </Card>
      ) : isPending && qrCode ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Escaneie o QR Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-xl border-2 border-dashed border-border p-4 bg-white">
                <img src={qrCode} alt="QR Code WhatsApp" className="h-64 w-64" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar um aparelho
              </p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => queryClient.invalidateQueries({ queryKey: ["evolution-status"] })}>
                <RefreshCw className="h-3.5 w-3.5" /> Verificar conexão
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Aguardando leitura do QR Code...</p>
                  <p className="text-sm text-muted-foreground">O status será atualizado automaticamente.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Enviar Mensagem</CardTitle>
                <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => disconnectMutation.mutate()}>
                  Desconectar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Telefone (com DDD)</Label>
                <Input placeholder="5511999999999" value={sendForm.phone} onChange={e => setSendForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea rows={4} placeholder="Digite a mensagem..." value={sendForm.message} onChange={e => setSendForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <Button className="w-full gap-2" onClick={() => sendMutation.mutate()} disabled={!sendForm.phone || !sendForm.message || sendMutation.isPending}>
                <Send className="h-4 w-4" />
                {sendMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Templates Rápidos</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {TEMPLATES.slice(0, 5).map((t, i) => (
                    <button key={i} className="w-full text-left rounded-lg border border-border p-3 hover:bg-accent transition-colors" onClick={() => setSendForm(f => ({ ...f, message: t.text }))}>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.text}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar Evolution API</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL da API *</Label>
              <Input placeholder="https://api.evolution.seudominio.com" value={setupForm.api_url} onChange={e => setSetupForm(f => ({ ...f, api_url: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">URL da sua instância da Evolution API</p>
            </div>
            <div>
              <Label>API Key *</Label>
              <Input type="password" placeholder="Sua chave de API" value={setupForm.api_key} onChange={e => setSetupForm(f => ({ ...f, api_key: e.target.value }))} />
            </div>
            <div>
              <Label>Nome da Instância *</Label>
              <Input placeholder="minha-loja" value={setupForm.instance_name} onChange={e => setSetupForm(f => ({ ...f, instance_name: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Identificador único para esta conexão</p>
            </div>
            <Button className="w-full" onClick={() => { connectMutation.mutate(); setShowSetup(false); }} disabled={!setupForm.api_url || !setupForm.api_key || !setupForm.instance_name || connectMutation.isPending}>
              {connectMutation.isPending ? "Conectando..." : "Conectar e Gerar QR Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Templates de Mensagem</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {Array.from(new Set(TEMPLATES.map(t => t.category))).map(category => (
                <div key={category}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
                  <div className="space-y-1.5">
                    {TEMPLATES.filter(t => t.category === category).map((t, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
