import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "../../model/defaults";
import { RESULTS_FIXTURE } from "../../test/fixtures";
import { HealthPanel } from "./HealthPanel";

const inputs = { ...DEFAULT_INPUTS, horizonYears: 2 };

describe("HealthPanel", () => {
  it("shows the net life-expectancy change and its parts", () => {
    render(<HealthPanel results={RESULTS_FIXTURE} inputs={inputs} />);
    expect(screen.getByText("+20 days")).toBeInTheDocument();
    expect(screen.getByText("+25 days")).toBeInTheDocument();
    expect(screen.getByText("−5 days")).toBeInTheDocument();
    expect(screen.getByText("24%")).toBeInTheDocument();
    expect(screen.queryByText(/outside ages 20–64/)).not.toBeInTheDocument();
  });

  it("explains the HEAT age range when relevant", () => {
    const results = {
      ...RESULTS_FIXTURE,
      lifeExpectancy: {
        ...RESULTS_FIXTURE.lifeExpectancy,
        outsideHeatAgeRange: true,
      },
    };
    render(<HealthPanel results={results} inputs={inputs} />);
    expect(screen.getByText(/outside ages 20–64/)).toBeInTheDocument();
  });

  it("has no VO₂max card", () => {
    render(<HealthPanel results={RESULTS_FIXTURE} inputs={inputs} />);
    expect(screen.queryByText(/VO₂max/)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(["Life expectancy", "Well-being"]);
  });

  it("shows well-being figures and three evidence cards", () => {
    const { container } = render(
      <HealthPanel results={RESULTS_FIXTURE} inputs={inputs} />,
    );
    expect(screen.getByText(/236 minutes a week/)).toBeInTheDocument();
    expect(screen.getByText(/157% of the WHO minimum/)).toBeInTheDocument();
    expect(screen.getByText(/70,700 extra kcal a year/)).toBeInTheDocument();
    expect(container.querySelectorAll(".evidence li")).toHaveLength(3);
  });
});
