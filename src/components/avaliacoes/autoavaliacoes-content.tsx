"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { useMyParticipations } from "@/hooks/use-avaliacoes";
import {
  getDeadlineStatus,
  getEvaluatorsDisplay,
  getEvaluatorsTooltip,
  getResultStatusLabel,
  getAvailableActions,
  getActionLabel,
  getTypeLabel,
} from "@/lib/avaliacoes-utils";
import type { PerformanceAssessment, ActionType } from "@/types/avaliacoes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

export function AutoavaliacoesContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useMyParticipations({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const totalRecords = data?.totalRecords ?? 0;
  const assessments = data?.data ?? [];
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
  const showingFrom = totalRecords > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = Math.min(page * PAGE_SIZE, totalRecords);

  const handleActionClick = (action: ActionType, assessment: PerformanceAssessment) => {
    console.log("Action:", action, "Assessment:", assessment.id);
    switch (action) {
      case "RESPONDER":
        alert(`Navegar para formulário de autoavaliação: ${assessment.title}`);
        break;
      case "VER_RESPOSTAS":
        alert(`Abrir modal com respostas: ${assessment.title}`);
        break;
      case "VER_RESULTADO":
        alert(`Abrir relatório final: ${assessment.title}`);
        break;
      case "SOLICITAR_DEVOLUTIVA":
        alert(`Abrir agendamento de devolutiva: ${assessment.title}`);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Nome</TableHead>
                <TableHead>Prazo Autoavaliação</TableHead>
                <TableHead>Avaliadores/Pares</TableHead>
                <TableHead>Realizada</TableHead>
                <TableHead>Resultado Final</TableHead>
                <TableHead>Tipo de Avaliação</TableHead>
                <TableHead className="w-[180px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
          Erro ao carregar avaliações
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message || "Tente novamente mais tarde"}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
          Nenhuma avaliação encontrada
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {debouncedSearch
            ? `Nenhuma avaliação corresponde a "${debouncedSearch}"`
            : "Você não possui avaliações pendentes ou concluídas no momento."}
        </p>
        {debouncedSearch && (
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
            }}
          >
            Limpar busca
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-xs w-full sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Nome</TableHead>
              <TableHead>Prazo Autoavaliação</TableHead>
              <TableHead>Avaliadores/Pares</TableHead>
              <TableHead className="text-center">Realizada</TableHead>
              <TableHead>Resultado Final</TableHead>
              <TableHead>Tipo de Avaliação</TableHead>
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <AssessmentRow
                key={assessment.id}
                assessment={assessment}
                onActionClick={handleActionClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {showingFrom} até {showingTo} de {totalRecords} registros
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-20 text-center">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssessmentRow({
  assessment,
  onActionClick,
}: {
  assessment: PerformanceAssessment;
  onActionClick: (action: ActionType, assessment: PerformanceAssessment) => void;
}) {
  const deadlineStatus = getDeadlineStatus(assessment);
  const evaluatorsDisplay = getEvaluatorsDisplay(assessment.evaluatorsInfo);
  const evaluatorsTooltip = getEvaluatorsTooltip(assessment.evaluatorsInfo);
  const resultStatus = getResultStatusLabel(assessment);
  const availableActions = getAvailableActions(assessment);
  const devolutionLabel = {
    PENDENTE: "Devolutiva pendente",
    AGENDADA: "Devolutiva agendada",
    CONCLUIDA: "Devolutiva concluída",
  }[assessment.devolutionStatus];

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-foreground">{assessment.title}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {deadlineStatus.isExpired ? (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <XCircle className="h-4 w-4" />
              {deadlineStatus.text}
            </span>
          ) : assessment.isSelfEvaluationDone ? (
            <span className="flex items-center gap-1 text-accent-green font-medium">
              <CheckCircle className="h-4 w-4" />
              {deadlineStatus.text}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {deadlineStatus.text}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {assessment.evaluatorsInfo.isNotApplicable ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex items-center gap-1 text-muted-foreground cursor-help"
                title={evaluatorsTooltip}
              >
                <Users className="h-4 w-4" />
                N/A
              </span>
            </TooltipTrigger>
            <TooltipContent>{evaluatorsTooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="flex items-center gap-1 text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            {evaluatorsDisplay}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {assessment.isSelfEvaluationDone ? (
          <CheckCircle className="mx-auto h-5 w-5 text-accent-green" />
        ) : (
          <XCircle className="mx-auto h-5 w-5 text-muted-foreground" />
        )}
      </TableCell>
      <TableCell>
        {assessment.isResultPublished ? (
          <Badge variant={resultStatus.variant}>{resultStatus.label}</Badge>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="destructive">Não disponível</Badge>
            <Badge variant="destructive">{devolutionLabel}</Badge>
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {getTypeLabel(assessment.type)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableActions.map((action) => (
              <DropdownMenuItem
                key={action}
                onClick={() => onActionClick(action, assessment)}
                disabled={action === "RESPONDER" && deadlineStatus.isExpired}
                className={cn(action === "RESPONDER" && deadlineStatus.isExpired && "opacity-50")}
              >
                {getActionLabel(action)}
              </DropdownMenuItem>
            ))}
            {availableActions.length === 0 && (
              <DropdownMenuItem disabled className="text-muted-foreground">
                Nenhuma ação disponível
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
