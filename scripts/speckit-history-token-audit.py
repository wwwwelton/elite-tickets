#!/usr/bin/env python3
"""
Auditoria retroativa de uso: GitHub Spec Kit + Codex.

Fontes:
  1) ~/.codex/history.jsonl
     - identifica os comandos $speckit-* realmente enviados pelo usuário
     - fornece session_id + timestamp + texto

  2) ~/.codex/sessions/**/rollout-*.jsonl
     (e ~/.codex/archived_sessions se existir)
     - identifica o cwd da sessão
     - lê snapshots cumulativos total_token_usage

Atribuição:
  - início de um comando = último snapshot cumulativo no instante do prompt
  - modo padrão `next-speckit`:
      fim = último snapshot antes do próximo comando $speckit-* na mesma sessão;
      se não houver próximo comando Spec Kit, usa o snapshot final da sessão.
    Esse modo mede o workflow disparado pelo Spec Kit, incluindo passos internos,
    tools, testes e continuação do agente entre comandos Spec Kit.
  - modo opcional `next-user`:
      fim = último snapshot antes da próxima mensagem do usuário.
    Esse modo é mais estrito, mas pode subestimar execuções longas/interrompidas.
  - consumo = fim - início

Não soma last_token_usage, evitando duplicações em eventos de rate limit.

Uso:
  python3 speckit-history-token-audit.py --project /home/avatar/elite-tickets

Saídas:
  .codex-usage-retro/report.md
  .codex-usage-retro/speckit-runs.csv
  .codex-usage-retro/report.json
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

SPECKIT_RE = re.compile(r"\$speckit-([a-z0-9_-]+)", re.I)
TASK_RE = re.compile(r"\bT\d{3,}\b", re.I)
UUID_RE = re.compile(
    r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"
)

TOKEN_FIELDS = (
    "input_tokens",
    "cached_input_tokens",
    "cache_write_input_tokens",
    "output_tokens",
    "reasoning_output_tokens",
    "total_tokens",
)


def zusage() -> dict[str, int]:
    return {k: 0 for k in TOKEN_FIELDS}


def normalize_usage(obj: Any) -> Optional[dict[str, int]]:
    if not isinstance(obj, dict):
        return None
    if not any(k in obj for k in TOKEN_FIELDS):
        return None

    out = zusage()
    for key in TOKEN_FIELDS:
        value = obj.get(key, 0)
        if isinstance(value, (int, float)):
            out[key] = int(value)

    if out["total_tokens"] == 0:
        out["total_tokens"] = out["input_tokens"] + out["output_tokens"]
    return out


def parse_time(value: Any) -> Optional[float]:
    """Converte epoch ou ISO-8601 para epoch seconds."""
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str) or not value:
        return None

    try:
        # Codex normalmente usa ISO com Z.
        v = value.replace("Z", "+00:00")
        return datetime.fromisoformat(v).timestamp()
    except ValueError:
        return None


def fmt_time(epoch: float) -> str:
    if epoch <= 0:
        return "-"
    return datetime.fromtimestamp(epoch).astimezone().strftime("%Y-%m-%d %H:%M:%S")


def fmt_int(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def project_contains(cwd: Optional[str], project: str) -> bool:
    if not cwd:
        return False
    try:
        cwd_r = os.path.realpath(os.path.expanduser(cwd))
        project_r = os.path.realpath(os.path.expanduser(project))
        return os.path.commonpath([cwd_r, project_r]) == project_r
    except (ValueError, OSError):
        return False


def recurse_find(obj: Any, key: str) -> list[Any]:
    found: list[Any] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == key:
                found.append(v)
            found.extend(recurse_find(v, key))
    elif isinstance(obj, list):
        for v in obj:
            found.extend(recurse_find(v, key))
    return found


def extract_total_usage(obj: dict[str, Any]) -> Optional[dict[str, int]]:
    payload = obj.get("payload")
    if isinstance(payload, dict) and payload.get("type") == "token_count":
        info = payload.get("info")
        if isinstance(info, dict):
            usage = normalize_usage(info.get("total_token_usage"))
            if usage:
                return usage

    # Compatibilidade com envelopes alternativos:
    for value in recurse_find(obj, "total_token_usage"):
        usage = normalize_usage(value)
        if usage:
            return usage
    return None


def extract_cwd(obj: dict[str, Any]) -> Optional[str]:
    for value in recurse_find(obj, "cwd"):
        if isinstance(value, str) and value:
            return value
    return None


def extract_model(obj: dict[str, Any]) -> Optional[str]:
    for value in recurse_find(obj, "model"):
        if isinstance(value, str) and value:
            return value
    return None


def session_id_from_path(path: Path) -> Optional[str]:
    match = UUID_RE.search(path.name)
    return match.group(1) if match else None


@dataclass
class Snapshot:
    ts: float
    usage: dict[str, int]


@dataclass
class Rollout:
    session_id: str
    path: str
    cwd: Optional[str]
    model: Optional[str]
    snapshots: list[Snapshot]

    @property
    def final_usage(self) -> dict[str, int]:
        return self.snapshots[-1].usage if self.snapshots else zusage()


@dataclass
class HistoryEntry:
    session_id: str
    ts: float
    text: str
    command: Optional[str]


@dataclass
class Run:
    timestamp: str
    session_id: str
    command: str
    occurrence: int
    task: str
    model: str
    input_tokens: int
    cached_input_tokens: int
    uncached_input_tokens: int
    cache_write_input_tokens: int
    output_tokens: int
    reasoning_output_tokens: int
    visible_output_tokens: int
    total_tokens: int
    source_rollout: str
    warning: str


def load_history(path: Path) -> list[HistoryEntry]:
    entries: list[HistoryEntry] = []
    if not path.exists():
        return entries

    with path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(obj, dict):
                continue

            sid = obj.get("session_id")
            text = obj.get("text")
            ts = parse_time(obj.get("ts"))

            if not isinstance(sid, str) or not isinstance(text, str) or ts is None:
                continue

            match = SPECKIT_RE.search(text)
            command = f"$speckit-{match.group(1).lower()}" if match else None
            entries.append(
                HistoryEntry(
                    session_id=sid,
                    ts=ts,
                    text=text,
                    command=command,
                )
            )

    entries.sort(key=lambda e: (e.session_id, e.ts))
    return entries


def load_rollout(path: Path) -> Optional[Rollout]:
    sid = session_id_from_path(path)
    if not sid:
        return None

    cwd: Optional[str] = None
    model: Optional[str] = None
    snapshots: list[Snapshot] = []

    try:
        with path.open("r", encoding="utf-8", errors="replace") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(obj, dict):
                    continue

                if cwd is None:
                    maybe_cwd = extract_cwd(obj)
                    if maybe_cwd:
                        cwd = maybe_cwd

                maybe_model = extract_model(obj)
                if maybe_model:
                    model = maybe_model

                usage = extract_total_usage(obj)
                if usage is not None:
                    ts = parse_time(obj.get("timestamp"))
                    if ts is None:
                        # Sem timestamp não é possível atribuir a um intervalo.
                        continue

                    # Snapshots repetidos são permitidos e inofensivos;
                    # serão escolhidos por timestamp/posição.
                    snapshots.append(Snapshot(ts=ts, usage=usage))
    except OSError:
        return None

    snapshots.sort(key=lambda s: s.ts)
    return Rollout(
        session_id=sid,
        path=str(path),
        cwd=cwd,
        model=model,
        snapshots=snapshots,
    )


def discover_rollouts(codex_home: Path) -> dict[str, Rollout]:
    roots = [codex_home / "sessions"]
    archived = codex_home / "archived_sessions"
    if archived.exists():
        roots.append(archived)

    candidates: list[Path] = []
    for root in roots:
        if root.exists():
            candidates.extend(root.rglob("rollout-*.jsonl"))

    grouped: dict[str, list[Rollout]] = defaultdict(list)

    for path in candidates:
        rollout = load_rollout(path)
        if rollout:
            grouped[rollout.session_id].append(rollout)

    # Se houver múltiplos rollouts do mesmo ID, prefira o que contém
    # mais snapshots e maior total cumulativo final.
    selected: dict[str, Rollout] = {}
    for sid, items in grouped.items():
        items.sort(
            key=lambda r: (
                len(r.snapshots),
                r.final_usage.get("total_tokens", 0),
            ),
            reverse=True,
        )
        selected[sid] = items[0]

    return selected


def usage_at_or_before(snapshots: list[Snapshot], ts: float) -> dict[str, int]:
    candidate: Optional[Snapshot] = None
    for snap in snapshots:
        if snap.ts <= ts:
            candidate = snap
        else:
            break
    return candidate.usage if candidate else zusage()


def usage_before(snapshots: list[Snapshot], ts: float) -> dict[str, int]:
    candidate: Optional[Snapshot] = None
    for snap in snapshots:
        if snap.ts < ts:
            candidate = snap
        else:
            break
    return candidate.usage if candidate else zusage()


def delta_usage(
    end: dict[str, int],
    start: dict[str, int],
) -> tuple[dict[str, int], bool]:
    out = zusage()
    reset = False

    for key in TOKEN_FIELDS:
        value = end.get(key, 0) - start.get(key, 0)
        if value < 0:
            reset = True
            value = 0
        out[key] = value

    # total_tokens deve refletir input + output.
    logical = out["input_tokens"] + out["output_tokens"]
    if out["total_tokens"] == 0 or abs(out["total_tokens"] - logical) > 2:
        out["total_tokens"] = logical

    return out, reset


def infer_task(text: str, command: str) -> str:
    tasks = sorted({t.upper() for t in TASK_RE.findall(text)})
    if tasks:
        return ",".join(tasks)

    lower = text.lower()
    if command == "$speckit-implement":
        if (
            "pending tasks" in lower
            or "tarefas pendentes" in lower
            or "one task at a time" in lower
            or "uma task" in lower
        ):
            return "ALL-PENDING"
    return "-"


def sum_runs(runs: list[Run]) -> dict[str, int]:
    out = defaultdict(int)
    fields = (
        "input_tokens",
        "cached_input_tokens",
        "uncached_input_tokens",
        "cache_write_input_tokens",
        "output_tokens",
        "reasoning_output_tokens",
        "visible_output_tokens",
        "total_tokens",
    )
    for run in runs:
        for field in fields:
            out[field] += getattr(run, field)
    return dict(out)


def sum_final_sessions(rollouts: list[Rollout]) -> dict[str, int]:
    out = defaultdict(int)
    for rollout in rollouts:
        u = rollout.final_usage
        for key in TOKEN_FIELDS:
            out[key] += u.get(key, 0)

    out["uncached_input_tokens"] = max(
        out["input_tokens"] - out["cached_input_tokens"], 0
    )
    out["visible_output_tokens"] = max(
        out["output_tokens"] - out["reasoning_output_tokens"], 0
    )
    return dict(out)


def print_table(runs: list[Run]) -> None:
    headers = [
        "#",
        "Comando",
        "Task",
        "INPUT",
        "Cached",
        "Uncached",
        "OUTPUT",
        "Reasoning",
        "Visível",
        "TOTAL",
    ]

    rows: list[list[str]] = []
    for run in runs:
        rows.append(
            [
                str(run.occurrence),
                run.command,
                run.task,
                str(run.input_tokens),
                str(run.cached_input_tokens),
                str(run.uncached_input_tokens),
                str(run.output_tokens),
                str(run.reasoning_output_tokens),
                str(run.visible_output_tokens),
                str(run.total_tokens),
            ]
        )

    if not rows:
        print("Nenhum comando $speckit-* encontrado.")
        return

    widths = [
        max(len(headers[i]), max(len(row[i]) for row in rows))
        for i in range(len(headers))
    ]

    def render(row: list[str]) -> str:
        return (
            f"{row[0]:>{widths[0]}} | "
            f"{row[1]:<{widths[1]}} | "
            f"{row[2]:<{widths[2]}} | "
            + " | ".join(f"{row[i]:>{widths[i]}}" for i in range(3, len(row)))
        )

    print(render(headers))
    print("-+-".join("-" * w for w in widths))
    for row in rows:
        print(render(row))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project",
        default=os.getcwd(),
        help="Raiz do projeto (default: diretório atual)",
    )
    parser.add_argument(
        "--codex-home",
        default=os.environ.get("CODEX_HOME", str(Path.home() / ".codex")),
    )
    parser.add_argument(
        "--out",
        default=".codex-usage-retro",
    )
    parser.add_argument(
        "--boundary",
        choices=("next-speckit", "next-user"),
        default="next-speckit",
        help=(
            "Limite de atribuição: next-speckit (default) mede o workflow "
            "até o próximo comando Spec Kit; next-user encerra na próxima "
            "mensagem do usuário."
        ),
    )
    args = parser.parse_args()

    project = os.path.realpath(os.path.expanduser(args.project))
    codex_home = Path(os.path.expanduser(args.codex_home))
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    history_path = codex_home / "history.jsonl"
    history = load_history(history_path)
    rollouts = discover_rollouts(codex_home)

    project_rollouts = {
        sid: rollout
        for sid, rollout in rollouts.items()
        if project_contains(rollout.cwd, project)
    }

    project_session_ids = set(project_rollouts)

    # Toda mensagem do usuário dessas sessões é usada como limite temporal,
    # mas somente mensagens contendo $speckit-* viram linhas do relatório.
    history_by_session: dict[str, list[HistoryEntry]] = defaultdict(list)
    for entry in history:
        if entry.session_id in project_session_ids:
            history_by_session[entry.session_id].append(entry)

    runs: list[Run] = []
    occurrence_counter: Counter[str] = Counter()

    for sid, entries in history_by_session.items():
        entries.sort(key=lambda e: e.ts)
        rollout = project_rollouts[sid]

        for index, entry in enumerate(entries):
            if not entry.command:
                continue

            occurrence_counter[entry.command] += 1
            occurrence = occurrence_counter[entry.command]

            start_usage = usage_at_or_before(rollout.snapshots, entry.ts)

            if args.boundary == "next-user":
                if index + 1 < len(entries):
                    boundary_ts = entries[index + 1].ts
                    end_usage = usage_before(rollout.snapshots, boundary_ts)
                else:
                    end_usage = rollout.final_usage
            else:
                # Mede o workflow associado ao comando Spec Kit:
                # encerra somente no próximo comando $speckit-* da mesma sessão.
                next_speckit_ts = None
                for later in entries[index + 1 :]:
                    if later.command:
                        next_speckit_ts = later.ts
                        break

                if next_speckit_ts is not None:
                    end_usage = usage_before(
                        rollout.snapshots,
                        next_speckit_ts,
                    )
                else:
                    end_usage = rollout.final_usage

            delta, reset = delta_usage(end_usage, start_usage)

            inp = delta["input_tokens"]
            cached = delta["cached_input_tokens"]
            out = delta["output_tokens"]
            reasoning = delta["reasoning_output_tokens"]

            warning_parts: list[str] = []
            if reset:
                warning_parts.append("cumulative-reset")
            if not rollout.snapshots:
                warning_parts.append("no-token-snapshots")

            # Se o comando ocorreu antes do primeiro snapshot, baseline=0 é
            # esperado para uma sessão nova. Se ocorreu depois e ainda assim
            # não há snapshot anterior, marque como possível imprecisão.
            if rollout.snapshots and entry.ts < rollout.snapshots[0].ts:
                pass

            runs.append(
                Run(
                    timestamp=fmt_time(entry.ts),
                    session_id=sid,
                    command=entry.command,
                    occurrence=occurrence,
                    task=infer_task(entry.text, entry.command),
                    model=rollout.model or "-",
                    input_tokens=inp,
                    cached_input_tokens=cached,
                    uncached_input_tokens=max(inp - cached, 0),
                    cache_write_input_tokens=delta["cache_write_input_tokens"],
                    output_tokens=out,
                    reasoning_output_tokens=reasoning,
                    visible_output_tokens=max(out - reasoning, 0),
                    total_tokens=delta["total_tokens"],
                    source_rollout=rollout.path,
                    warning=",".join(warning_parts),
                )
            )

    runs.sort(key=lambda r: r.timestamp)

    spec_totals = sum_runs(runs)
    project_totals = sum_final_sessions(list(project_rollouts.values()))

    # CSV
    csv_path = out_dir / "speckit-runs.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        fields = list(Run.__dataclass_fields__.keys())
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for run in runs:
            writer.writerow(asdict(run))

    # JSON
    json_path = out_dir / "report.json"
    report_obj = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project": project,
        "boundary_mode": args.boundary,
        "history_path": str(history_path),
        "project_sessions": len(project_rollouts),
        "project_sessions_with_token_snapshots": sum(
            1 for r in project_rollouts.values() if r.snapshots
        ),
        "speckit_commands": len(runs),
        "command_counts": dict(Counter(r.command for r in runs)),
        "speckit_totals": spec_totals,
        "project_codex_totals": project_totals,
        "runs": [asdict(r) for r in runs],
    }
    json_path.write_text(
        json.dumps(report_obj, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Markdown
    md_path = out_dir / "report.md"
    md: list[str] = []
    md.append("# Auditoria retroativa — GitHub Spec Kit + Codex")
    md.append("")
    md.append(f"- Projeto: `{project}`")
    md.append(f"- Modo de atribuição: **{args.boundary}**")
    md.append(f"- Sessões do projeto: **{len(project_rollouts)}**")
    md.append(
        "- Sessões com token snapshots: "
        f"**{sum(1 for r in project_rollouts.values() if r.snapshots)}/{len(project_rollouts)}**"
    )
    md.append(f"- Comandos `$speckit-*` explícitos: **{len(runs)}**")
    md.append("")

    md.append("## Spec Kit — INPUT")
    md.append("")
    md.append("| Métrica | Tokens |")
    md.append("|---|---:|")
    md.append(
        f"| **Input total** | **{fmt_int(spec_totals.get('input_tokens', 0))}** |"
    )
    md.append(
        f"| Cached input | {fmt_int(spec_totals.get('cached_input_tokens', 0))} |"
    )
    md.append(
        f"| Uncached input | {fmt_int(spec_totals.get('uncached_input_tokens', 0))} |"
    )
    md.append("")

    md.append("## Spec Kit — OUTPUT")
    md.append("")
    md.append("| Métrica | Tokens |")
    md.append("|---|---:|")
    md.append(
        f"| **Output total** | **{fmt_int(spec_totals.get('output_tokens', 0))}** |"
    )
    md.append(
        f"| Reasoning output | {fmt_int(spec_totals.get('reasoning_output_tokens', 0))} |"
    )
    md.append(
        f"| Visível/non-reasoning* | {fmt_int(spec_totals.get('visible_output_tokens', 0))} |"
    )
    md.append("")

    md.append("## Spec Kit — POR COMANDO/TASK")
    md.append("")
    md.append(
        "| # | Data | Comando | Task | INPUT | Cached | Uncached | OUTPUT | Reasoning | Visível | TOTAL |"
    )
    md.append("|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|")
    for run in runs:
        md.append(
            f"| {run.occurrence} | {run.timestamp} | `{run.command}` | {run.task} "
            f"| {run.input_tokens} | {run.cached_input_tokens} "
            f"| {run.uncached_input_tokens} | {run.output_tokens} "
            f"| {run.reasoning_output_tokens} | {run.visible_output_tokens} "
            f"| {run.total_tokens} |"
        )

    md.append("")
    md.append("## Codex total nas sessões do projeto")
    md.append("")
    md.append("| Métrica | Tokens |")
    md.append("|---|---:|")
    md.append(f"| Input total | {fmt_int(project_totals.get('input_tokens', 0))} |")
    md.append(
        f"| Cached input | {fmt_int(project_totals.get('cached_input_tokens', 0))} |"
    )
    md.append(
        f"| Uncached input | {fmt_int(project_totals.get('uncached_input_tokens', 0))} |"
    )
    md.append(f"| Output total | {fmt_int(project_totals.get('output_tokens', 0))} |")
    md.append(
        f"| Reasoning output | {fmt_int(project_totals.get('reasoning_output_tokens', 0))} |"
    )
    md.append(
        f"| **Input + Output** | **{fmt_int(project_totals.get('total_tokens', 0))}** |"
    )
    md.append("")

    md.append("## Notas")
    md.append("")
    md.append(
        "- Os comandos são identificados pelo `history.jsonl`, não por simples ocorrências de `speckit` nos rollouts."
    )
    md.append(
        "- O consumo é calculado por diferença entre snapshots cumulativos `total_token_usage`."
    )
    if args.boundary == "next-speckit":
        md.append(
            "- A atribuição termina no próximo comando `$speckit-*` da mesma sessão; "
            "quando não há outro, termina no snapshot final da sessão. "
            "Isso mede o workflow disparado pelo Spec Kit."
        )
    else:
        md.append(
            "- A atribuição termina na próxima mensagem do usuário; esse modo é "
            "mais estrito e pode subestimar execuções longas ou interrompidas."
        )
    md.append("- `cached_input_tokens` já está incluído em `input_tokens`.")
    md.append(
        "- `reasoning_output_tokens` é tratado como detalhamento de `output_tokens`; "
        "`Visível` = `output_tokens - reasoning_output_tokens`."
    )
    md.append(
        "- Uma única execução `$speckit-implement` pode cobrir várias tasks; "
        "sem marcadores de telemetria por task, o relatório não inventa uma divisão T001/T002/etc."
    )

    md_path.write_text("\n".join(md) + "\n", encoding="utf-8")

    # Terminal
    print()
    print("=== Auditoria retroativa GitHub Spec Kit + Codex ===")
    print(f"Projeto:                    {project}")
    print(f"Modo de atribuição:         {args.boundary}")
    print(f"Sessões do projeto:         {len(project_rollouts)}")
    print(
        "Sessões c/ token_count:     "
        f"{sum(1 for r in project_rollouts.values() if r.snapshots)}/{len(project_rollouts)}"
    )
    print(f"Comandos Spec Kit:          {len(runs)}")
    print()

    print("Contagem por comando:")
    counts = Counter(r.command for r in runs)
    for command, count in sorted(counts.items()):
        print(f"  {command:<24} {count:>3}")
    print()

    print("Spec Kit — INPUT:")
    print(f"  input total:              {fmt_int(spec_totals.get('input_tokens', 0))}")
    print(
        f"  cached input:             {fmt_int(spec_totals.get('cached_input_tokens', 0))}"
    )
    print(
        f"  uncached input:           {fmt_int(spec_totals.get('uncached_input_tokens', 0))}"
    )
    print()

    print("Spec Kit — OUTPUT:")
    print(f"  output total:             {fmt_int(spec_totals.get('output_tokens', 0))}")
    print(
        f"  reasoning output:         {fmt_int(spec_totals.get('reasoning_output_tokens', 0))}"
    )
    print(
        f"  visível/non-reasoning*:   {fmt_int(spec_totals.get('visible_output_tokens', 0))}"
    )
    print()

    print("Spec Kit — TOTAL ATRIBUÍDO:")
    print(f"  input + output:           {fmt_int(spec_totals.get('total_tokens', 0))}")
    print()

    print("Spec Kit — POR COMANDO/TASK:")
    print_table(runs)
    print()

    zero_runs = [r for r in runs if r.total_tokens == 0]
    if zero_runs:
        print("Comandos com 0 tokens atribuídos:")
        for r in zero_runs:
            print(
                f"  {r.command} #{r.occurrence} ({r.timestamp}) "
                "- não houve crescimento de total_token_usage no intervalo."
            )
        print()

    print("Codex total nas sessões do projeto:")
    print(
        f"  input total:              {fmt_int(project_totals.get('input_tokens', 0))}"
    )
    print(
        f"  output total:             {fmt_int(project_totals.get('output_tokens', 0))}"
    )
    print(
        f"  input + output:           {fmt_int(project_totals.get('total_tokens', 0))}"
    )
    print()

    print(f"Markdown: {md_path}")
    print(f"CSV:      {csv_path}")
    print(f"JSON:     {json_path}")

    if not runs:
        print()
        print(
            "AVISO: nenhuma invocação $speckit-* foi encontrada nas sessões do projeto."
        )

    missing = [r for r in project_rollouts.values() if not r.snapshots]
    if missing:
        print()
        print(f"AVISO: {len(missing)} sessão(ões) do projeto sem snapshots de token.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
