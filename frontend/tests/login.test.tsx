import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { api, ApiError } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: vi.fn() };
});

it("shows an error message when sign in fails", async () => {
  vi.mocked(api).mockRejectedValueOnce(
    new ApiError(401, { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } })
  );

  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alice@coffeeninja.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Invalid email or password.");
});