// Mensagem de erro (role="alert", lida na hora) ou de sucesso (role="status")
export function Aviso({ tipo = "erro", children }) {
  if (!children) return null;
  if (tipo === "sucesso") {
    return (
      <p
        role="status"
        className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-800"
      >
        {children}
      </p>
    );
  }
  return (
    <p
      role="alert"
      className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700"
    >
      {children}
    </p>
  );
}
