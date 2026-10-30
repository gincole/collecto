import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

export async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  control: HTMLElement,
  value: string,
) {
  await user.click(control);
  if (control.getAttribute("aria-expanded") !== "true")
    await user.keyboard("{ArrowDown}");
  const option = (await screen.findAllByRole("option")).find(
    (option) => option.dataset.value === value,
  );
  if (!option) throw new Error(`Missing Select option ${value}`);
  await user.click(option);
}
