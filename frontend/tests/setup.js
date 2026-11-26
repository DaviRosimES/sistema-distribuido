import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpa o DOM depois de cada teste, assim um teste não enxerga o que o outro renderizou
afterEach(cleanup);
