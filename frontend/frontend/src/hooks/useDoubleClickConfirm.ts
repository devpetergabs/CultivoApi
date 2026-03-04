import { useRef } from "react";

type Options = {
  windowMs?: number; // janela de tempo para considerar "clique duplo"
  message?: string;
};

export function useDoubleClickConfirm(options: Options = {}) {
  const { windowMs = 2000, message = "Você acabou de executar essa ação. Quer repetir mesmo?" } = options;
  const lastClickRef = useRef<number>(0);

  /**
   * Retorna true se pode executar a ação.
   * - 1º clique: libera
   * - 2º clique dentro da janela: pede confirmação (alert/confirm)
   */
  function canProceed(): boolean {
    const now = Date.now();
    const delta = now - lastClickRef.current;

    // primeiro clique (ou já passou a janela)
    if (delta > windowMs) {
      lastClickRef.current = now;
      return true;
    }

    // clique repetido dentro da janela → pede confirmação
    const ok = window.confirm(message);
    lastClickRef.current = now; // atualiza mesmo assim
    return ok;
  }

  return { canProceed };
}