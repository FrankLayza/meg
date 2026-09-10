const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

const BG_RED = "\x1b[41m";
const BG_GREEN = "\x1b[42m";
const BG_YELLOW = "\x1b[43m";
const BG_BLUE = "\x1b[44m";
const BG_MAGENTA = "\x1b[45m";
const BG_CYAN = "\x1b[46m";

export type BadgeColor = "green" | "yellow" | "red" | "blue" | "magenta" | "cyan";

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function bold(text: string): string {
  return `${BOLD}${text}${RESET}`;
}

export function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

export function colored(text: string, color: BadgeColor): string {
  switch (color) {
    case "green":
      return `${GREEN}${text}${RESET}`;
    case "yellow":
      return `${YELLOW}${text}${RESET}`;
    case "red":
      return `${RED}${text}${RESET}`;
    case "blue":
      return `${BLUE}${text}${RESET}`;
    case "magenta":
      return `${MAGENTA}${text}${RESET}`;
    case "cyan":
      return `${CYAN}${text}${RESET}`;
  }
}

export function badge(text: string, color: BadgeColor): string {
  let bg = BG_BLUE;
  switch (color) {
    case "green":
      bg = BG_GREEN;
      break;
    case "yellow":
      bg = BG_YELLOW;
      break;
    case "red":
      bg = BG_RED;
      break;
    case "blue":
      bg = BG_BLUE;
      break;
    case "magenta":
      bg = BG_MAGENTA;
      break;
    case "cyan":
      bg = BG_CYAN;
      break;
  }
  return `${bg}${WHITE}${BOLD} ${text} ${RESET}`;
}

export function outcomeBadge(outcome: string): string {
  switch (outcome) {
    case "approve":
      return badge("APPROVED", "green");
    case "request_revision":
      return badge("REVISION REQUIRED", "yellow");
    case "escalate":
      return badge("HUMAN ESCALATION", "red");
    default:
      return badge(outcome.toUpperCase(), "blue");
  }
}

export function tag(id: string): string {
  return `${CYAN}[${id}]${RESET}`;
}

export function bullet(label: string, value: string): string {
  return `  ${BOLD}${label}:${RESET} ${value}`;
}

export function checkmark(passed: boolean): string {
  return passed ? `${GREEN}${BOLD}[PASS]${RESET}` : `${RED}${BOLD}[FAIL]${RESET}`;
}

export function divider(title?: string, char = "━"): string {
  const lineLength = 76;
  if (!title) {
    return `${DIM}${char.repeat(lineLength)}${RESET}`;
  }
  const prefix = ` ${title} `;
  const remain = Math.max(0, lineLength - prefix.length - 4);
  const left = Math.floor(remain / 2);
  const right = remain - left;
  return `${DIM}${char.repeat(left + 2)}${RESET}${BOLD}${WHITE}${prefix}${RESET}${DIM}${char.repeat(right + 2)}${RESET}`;
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (stripAnsi(text).length <= maxWidth) {
    return [text];
  }
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (stripAnsi(testLine).length <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function panel(title: string, lines: string[], color: BadgeColor = "cyan"): string {
  const lineLength = 76;
  const innerWidth = lineLength - 4;
  const borderCol = colored("│", color);
  const titlePad = Math.max(0, innerWidth - title.length - 3);
  const topBorder = colored(`┌─[ ${BOLD}${title}${RESET}${colored(" ]", color)}${charPad("─", titlePad)}┐`, color);
  const bottomBorder = colored(`└${charPad("─", innerWidth + 2)}┘`, color);

  const flattened: string[] = [];
  for (const item of lines) {
    const subLines = item.split("\n");
    for (const sub of subLines) {
      const wrapped = wrapText(sub, innerWidth - 2);
      flattened.push(...wrapped);
    }
  }

  const formattedLines = flattened.map((line) => {
    const rawLen = stripAnsi(line).length;
    const pad = Math.max(0, innerWidth - rawLen);
    return `${borderCol}  ${line}${" ".repeat(pad)}${borderCol}`;
  });

  return [topBorder, ...formattedLines, bottomBorder].join("\n");
}

function charPad(char: string, count: number): string {
  return count > 0 ? char.repeat(count) : "";
}

export function formatTable(rows: Array<[string, string]>, leftWidth = 26): string {
  return rows
    .map(([key, val]) => {
      const pad = Math.max(0, leftWidth - stripAnsi(key).length);
      return `${key}${" ".repeat(pad)}${val}`;
    })
    .join("\n");
}

