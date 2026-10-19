import { Link } from "react-router-dom";
import {
  Package,
  ScanLine,
  TrendingUp,
  ShieldCheck,
  Truck,
  ClipboardList,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ScanLine,
    title: "Venda rápida com leitor",
    desc: "Escaneia o código de barras pela câmera ou leitor e já desconta do estoque na hora.",
  },
  {
    icon: TrendingUp,
    title: "Painel em tempo real",
    desc: "Entradas, saídas, valor parado em estoque e pedidos em aberto num só lugar.",
  },
  {
    icon: ClipboardList,
    title: "Contagem cíclica",
    desc: "Inventários periódicos com ajuste automático assim que a contagem fecha.",
  },
  {
    icon: Truck,
    title: "Compras e fornecedores",
    desc: "Pedidos de compra, prazos de entrega e recebimento com entrada automática.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[color:var(--bg-base)]">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent-primary/20 blur-3xl" />
          <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-accent-success/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-warm/20 blur-3xl" />
        </div>

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary text-white shadow-elevation-1">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-text-primary">
              Compras &amp; Estoque
            </span>
          </div>
          <Button asChild variant="ghost">
            <Link to="/auth?tab=login">Entrar</Link>
          </Button>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 pt-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-elevation-1">
            <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
            Controle de estoque sem dor de cabeça
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-6xl">
            Estoque, compras e vendas tudo em um unico local
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Feito em parceria com uma empresa de tecnologia para dar clareza ao time de
            depósito e de vendas, do balcão ao relatório.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth?tab=login">
                Acessar o sistema
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth?tab=signup">Criar conta</Link>
            </Button>
          </div>

          <div className="mt-20 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="rounded-2xl border-border/60 bg-card/80 text-left shadow-elevation-1 backdrop-blur"
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent-success" />
            Acesso por perfil: administrador e representante, cada um com sua própria visão.
          </div>
        </main>
      </div>
    </div>
  );
}
