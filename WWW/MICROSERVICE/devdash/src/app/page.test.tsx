import React from "react";

import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/app/_actions/tenant", () => ({
  setSelectedTenantAction: vi.fn(),
}));

vi.mock("@/lib/mockend/tenants", () => ({
  listTenants: vi.fn(async () => ["tenant-a", "tenant-b"]),
}));

vi.mock("@/lib/tenant", () => ({
  getSelectedTenant: vi.fn(() => "tenant-a"),
}));

describe("Home", () => {
  it("renderiza a home com links principais", async () => {
    const { default: Home } = await import("./page");

    const element = await Home();
    render(element);

    expect(screen.getByRole("heading", { name: "DEVDASH" })).toBeInTheDocument();
    expect(screen.getByText("Mock-End")).toBeInTheDocument();
    expect(screen.getByText("Builder")).toBeInTheDocument();
    expect(screen.getByText("Seeding/Jobs")).toBeInTheDocument();
    expect(screen.getByText("Verificações")).toBeInTheDocument();
    expect(screen.getAllByText("tenant-a").length).toBeGreaterThan(0);
  });
});
