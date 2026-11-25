// Mensagem de erro (role="alert", lida na hora) ou de sucesso (role="status")
export function Aviso({ tipo = "erro", children }) {
  if (!children) return null;
  if (tipo === "sucesso") {
    return (
      <p
        role="status"
        className="rounded border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-2 text-sm text-green-800 dark:text-green-300"
      >
        {children}
      </p>
    );
  }
  return (
    <p
      role="alert"
      className="rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-2 text-sm text-red-700 dark:text-red-300"
    >
      {children}
    </p>
  );
}
