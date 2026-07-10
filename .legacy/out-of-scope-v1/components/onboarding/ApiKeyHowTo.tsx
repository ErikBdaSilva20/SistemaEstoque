import { useState } from "react";
import {
  Bot,
  Box,
  ExternalLink,
  HelpCircle,
  Mail,
  MessageCircle,
  ScanLine,
  ShoppingBag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type HowToProvider = "anthropic" | "evolution" | "resend" | "shopify" | "bling" | "cosmos";

interface Guide {
  title: string;
  icon: typeof Bot;
  summary: string;
  pricing: string;
  link: { url: string; label: string };
  steps: string[];
  tips?: string[];
}

const GUIDES: Record<HowToProvider, Guide> = {
  anthropic: {
    title: "API key Anthropic (Claude)",
    icon: Bot,
    summary:
      "A IA lê seu histórico, sugere quantidades de reabastecimento e responde perguntas sobre o estoque em linguagem natural.",
    pricing:
      "Pago por uso (sem mensalidade). Usamos Claude Haiku — tipicamente < US$ 1/mês pra volumes de PME.",
    link: {
      url: "https://console.anthropic.com/settings/keys",
      label: "console.anthropic.com",
    },
    steps: [
      "Acesse console.anthropic.com e faça login (ou crie conta — email + verificação).",
      "Em Billing, adicione um cartão e compre um crédito inicial (mínimo US$ 5).",
      "Abra Settings → API Keys.",
      'Clique em Create Key. Dê um nome (ex: "Compras & Estoque") e defina permissões padrão.',
      "Copie a chave (começa com sk-ant-). Ela só aparece uma vez.",
      "Cole no campo ao lado — validamos com uma chamada real antes de salvar.",
    ],
    tips: [
      "Guardamos a chave criptografada no Vault do Supabase — ela nunca vai pro frontend.",
      "Se a chave for revogada no console da Anthropic, a IA para de funcionar e mostra o erro no chat.",
    ],
  },
  evolution: {
    title: "Evolution API (WhatsApp)",
    icon: MessageCircle,
    summary:
      "Gateway open-source que conecta seu número WhatsApp (sem precisar da API oficial da Meta). Usamos pra notificar estoque crítico, aprovações e enviar orçamentos aos fornecedores.",
    pricing:
      "Self-hosted é gratuito (você paga só o VPS). SaaS gerenciado costuma custar R$ 50–150/mês por instância.",
    link: {
      url: "https://doc.evolution-api.com/v2/en/install/docker",
      label: "doc.evolution-api.com",
    },
    steps: [
      "Você precisa de uma instância Evolution API rodando — ou self-host (docker-compose em 5 min) ou contrata um SaaS tipo evolutionapi.com / sendbot / easypanel templates.",
      'Na dashboard da instância, crie uma Instance com um nome (ex: "compras").',
      "Conecte um número WhatsApp pelo QR code exibido no painel (importante: use um chip secundário — evita ban).",
      "Pegue 3 valores no painel: Base URL da instância (ex: https://evo.meu.com), nome da Instance, e a API Key (normalmente mostrada em Settings → API Keys).",
      "Cole cada um no campo correspondente.",
      'Informe um número de teste (com DDI, só dígitos: 5511988887777) pra validarmos enviando um "Hello".',
    ],
    tips: [
      "Use chip dedicado pro negócio — a Meta pode banir chips com muitos envios outbound.",
      "Se mudar o número, refaça o QR code na instância; não precisa mexer aqui.",
    ],
  },
  resend: {
    title: "API key Resend (Email)",
    icon: Mail,
    summary:
      "Provedor de email transacional (alternativa/complemento ao WhatsApp). Usado pra alertas de estoque crítico e relatórios periódicos.",
    pricing: "Grátis até 3.000 emails/mês e 100/dia. Acima, US$ 20/mês por 50k emails.",
    link: { url: "https://resend.com/signup", label: "resend.com" },
    steps: [
      "Crie conta em resend.com (Google OAuth ou email).",
      "Em Domains, clique Add Domain e informe seu domínio (ex: seudominio.com).",
      "Copie os 3 registros DNS (SPF, DKIM, MX) e adicione no seu provedor de DNS (Cloudflare, Route53 etc). Aguarde ~1h pra verificação — status vira verde.",
      "Defina o remetente que vai aparecer nos emails (ex: estoque@seudominio.com).",
      "Em API Keys → Create API Key → Full access ou Sending access.",
      "Copie a chave (começa com re_) e cole aqui.",
    ],
    tips: [
      "Sem domínio verificado o envio falha. Se só testar, use onboarding@resend.dev (restrito ao email da sua conta).",
      "Email é o canal de backup — mesmo se o WhatsApp cair, os alertas ainda chegam.",
    ],
  },
  shopify: {
    title: "Admin API token do Shopify",
    icon: ShoppingBag,
    summary:
      "Sincroniza catálogo de produtos por SKU e atualiza estoque em ambas as direções: venda no Shopify → baixa estoque aqui; ajuste aqui → atualiza estoque lá.",
    pricing: "Sem custo adicional da Shopify — usa a Admin API grátis de todas as contas.",
    link: {
      url: "https://help.shopify.com/en/manual/apps/app-types/custom-apps",
      label: "help.shopify.com — Custom apps",
    },
    steps: [
      "No Shopify Admin → Settings → Apps and sales channels.",
      'Clique "Develop apps" (no canto superior direito). Na primeira vez, libere "Allow custom app development".',
      'Create an app → dê um nome (ex: "Compras & Estoque") → Create app.',
      "Na aba Configuration → Admin API integration → Configure.",
      "Marque os scopes: read_products, read_inventory, write_inventory. Salve.",
      "Vá em API credentials → Install app.",
      "Copie o Admin API access token (começa com shpat_). Ele só aparece uma vez.",
      "Informe seu shop domain (minha-loja.myshopify.com) e cole o token.",
    ],
    tips: [
      "Se a loja usa múltiplos locations, na aba Integrações você escolhe qual dos locations Shopify mapeia pro depósito aqui.",
      "Pra também receber vendas em tempo real, configure o webhook (passo anterior do onboarding) no Shopify Notifications.",
    ],
  },
  bling: {
    title: "Access token do Bling ERP",
    icon: Box,
    summary:
      "Sincroniza produtos do Bling pelo código/SKU. Atualiza estoque de volta. Ideal se o Bling é seu ERP fiscal principal.",
    pricing: "Sem custo extra do Bling — usa a API v3 incluída em qualquer plano pago.",
    link: {
      url: "https://developer.bling.com.br/aplicativos",
      label: "developer.bling.com.br",
    },
    steps: [
      "Bling → Preferências → Sistema → Integrações → Aplicativos.",
      'Clique "Criar aplicativo" e escolha "Uso próprio" (não precisa submeter pra marketplace).',
      "Em Escopos, marque ao menos: produtos (leitura/escrita) e estoque (leitura/escrita).",
      "Defina a URL de callback (pode ser http://localhost — não vamos usar).",
      'Abra o app criado e clique em "Obter token" (fluxo OAuth). Aceite as permissões.',
      "Copie o Access token gerado (duração 6 horas).",
      "Cole no campo ao lado.",
    ],
    tips: [
      "O token do Bling expira em 6h. Por ora você precisa renovar manualmente na tela de Integrações quando quiser sincronizar de novo. (Rotação automática via refresh_token está no roadmap.)",
      "Se você usa Bling pra fiscal e o Shopify pra vitrine, conecte os dois — Compras & Estoque funciona como orquestrador.",
    ],
  },
  cosmos: {
    title: "Token Cosmos/Bluesoft (catálogo nacional)",
    icon: ScanLine,
    summary:
      "Catálogo brasileiro com ~26 milhões de produtos. Ao escanear um código de barras, traz nome, marca, NCM, categoria, imagem e peso automaticamente — você não precisa digitar nada.",
    pricing:
      "Plano gratuito tem limite diário baixo (confirma no painel). Planos pagos começam em ~R$ 50/mês com milhares de requests/dia.",
    link: {
      url: "https://cosmos.bluesoft.com.br/users/sign_up",
      label: "cosmos.bluesoft.com.br",
    },
    steps: [
      "Acesse cosmos.bluesoft.com.br e crie conta gratuita (email + senha).",
      "Faça login e abra seu perfil (ícone no canto superior direito).",
      "Vá em Developers ou API Tokens — copie o token (~40 caracteres).",
      "Cole o token no campo ao lado.",
      "(Opcional) Defina um User-Agent que identifique seu app (ex: minhaloja/1.0). Se deixar vazio, usamos smart-stock-pal/1.0.",
    ],
    tips: [
      "Sem este token, a busca por código de barras cai automaticamente no Open Food Facts — gratuito, sem configuração, mas com cobertura limitada a alimentos/bebidas/cosméticos.",
      "Cosmos cobre bem supermercado (FLV, mercearia, higiene, limpeza) e razoavelmente farma/papelaria. Fraco em ferragem e eletrônicos.",
    ],
  },
};

/* -------------------------------------------------------------------------- */

export function ApiKeyHowToButton({ provider }: { provider: HowToProvider }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-text-primary"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Como obter?
      </Button>
      <ApiKeyHowToModal provider={provider} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ApiKeyHowToModal({
  provider,
  open,
  onOpenChange,
}: {
  provider: HowToProvider;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const guide = GUIDES[provider];
  const Icon = guide.icon;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-accent-primary" />
            {guide.title}
          </DialogTitle>
          <DialogDescription>{guide.summary}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary">
              {guide.pricing}
            </Badge>
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <a href={guide.link.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" />
                {guide.link.label}
              </a>
            </Button>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Passo a passo</h4>
            <ol className="space-y-2 text-sm">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-[11px] font-semibold text-accent-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-text-primary">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {guide.tips && guide.tips.length > 0 && (
            <div className="rounded-lg border border-border bg-bg-base/40 p-3">
              <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Dicas</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {guide.tips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span>💡</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
