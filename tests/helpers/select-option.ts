import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

export async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  control: HTMLElement,
  value: string,
) {
  if (control.getAttribute("role") === "radiogroup") {
    const choice = Array.from(
      control.querySelectorAll<HTMLElement>('[role="radio"]'),
    ).find((choice) => choice.dataset.value === value);
    if (!choice) throw new Error(`Missing choice ${value}`);
    await user.click(choice);
    return;
  }
  await user.click(control);
  if (control.getAttribute("aria-expanded") !== "true")
    await user.keyboard("{ArrowDown}");
  const option = (await screen.findAllByRole("option")).find(
    (option) => option.dataset.value === value,
  );
  if (!option) throw new Error(`Missing Select option ${value}`);
  await user.click(option);
}
