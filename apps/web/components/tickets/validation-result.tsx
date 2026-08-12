export type ValidationResultKind =
  | "VALID"
  | "INVALID"
  | "ALREADY_USED"
  | "WRONG_EVENT"
  | "BACKEND_UNAVAILABLE";

type ValidationResultProps = {
  result: ValidationResultKind;
  attemptedAt?: string;
};

const content: Record<
  ValidationResultKind,
  { symbol: string; eyebrow: string; title: string; description: string }
> = {
  VALID: {
    symbol: "✓",
    eyebrow: "Resultado válido",
    title: "Entrada autorizada",
    description: "O ingresso foi confirmado online e consumido para este evento.",
  },
  INVALID: {
    symbol: "×",
    eyebrow: "Resultado inválido",
    title: "Entrada recusada",
    description: "O código não representa um ingresso elegível. Confira o código e tente novamente.",
  },
  ALREADY_USED: {
    symbol: "!",
    eyebrow: "Ingresso utilizado",
    title: "Entrada já registrada",
    description: "Este ingresso já foi consumido e não pode registrar uma segunda entrada.",
  },
  WRONG_EVENT: {
    symbol: "↔",
    eyebrow: "Evento incorreto",
    title: "Selecione o evento do ingresso",
    description: "O ingresso é de outro evento e não foi consumido nesta tentativa.",
  },
  BACKEND_UNAVAILABLE: {
    symbol: "—",
    eyebrow: "Sem resposta online",
    title: "Entrada não autorizada",
    description: "Não houve confirmação do backend. Não admita o ingresso offline; reconecte e tente novamente.",
  },
};

const attemptedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "medium",
});

export function ValidationResult({ result, attemptedAt }: ValidationResultProps) {
  const message = content[result];
  const time = attemptedAt ? new Date(attemptedAt) : null;
  const formattedTime = time && !Number.isNaN(time.getTime()) ? attemptedAtFormatter.format(time) : null;

  return (
    <section
      role="alert"
      aria-atomic="true"
      data-validation-result={result}
      className="validation-result"
    >
      <p aria-hidden="true" className="validation-result__symbol code-data">
        {message.symbol}
      </p>
      <p className="label-caps">{message.eyebrow}</p>
      <h2 className="headline-md">{message.title}</h2>
      <p>{message.description}</p>
      {formattedTime ? <p className="code-data">Tentativa: {formattedTime}</p> : null}
    </section>
  );
}
