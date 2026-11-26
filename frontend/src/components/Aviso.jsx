import { CircleAlert, CircleCheck } from "lucide-react";

// Mensagem de erro (role="alert", lida na hora) ou de sucesso (role="status")
export function Aviso({ tipo = "erro", children }) {
  if (!children) return null;
  const sucesso = tipo === "sucesso";
  const Icone = sucesso ? CircleCheck : CircleAlert;
  return (
    <p
      role={sucesso ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
        sucesso
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      }`}
    >
      <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
