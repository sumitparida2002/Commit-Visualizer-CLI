import { getDotFilePath, parseFileLinesToSlice } from "./scan.js";

import { parse, differenceInDays, parseISO } from "date-fns";

import { gitlogPromise } from "gitlog";

const daysInLastSixMonths = 183;
const outOfRange = 99999;

const weeksInLastSixMonths = 26;

export function stat(email) {
  let commits = processRepositories(email);
  printCommitsStats(commits);
}

function processRepositories(email) {
  const filePath = getDotFilePath();
  let repos = parseFileLinesToSlice(filePath);

  const daysInMap = daysInLastSixMonths;

  const commits = new Map();
  for (let i = daysInMap; i > 0; i--) {
    commits.set(i, 0);
  }

  for (const path of repos) {
    fillCommits(email, path, commits);
  }

  return commits;
}

async function fillCommits(email, path, commits) {
  const cleanedPath = path.replace(/\/\.git$/, "");

  const options = {
    repo: cleanedPath,
    number: 10, // Retrieve all commits
    fields: ["authorDate", "committerDateRel"],
    all: true,
  };
  try {
    const commitLogs = await gitlogPromise(options);

    const offset = calcOffset();

    commitLogs.forEach((commit) => {
      const daysAgo = daysAgoFromCommitterDate(commit.authorDate);
      console.log(daysAgo);
      if (daysAgo !== outOfRange) {
        commits[daysAgo]++;
      }
    });
  } catch (error) {
    console.error(error);
  }

  return commits;
}

function daysAgoFromCommitterDate(committerDateStr) {
  const formatString = "yyyy-MM-dd HH:mm:ss XX";

  const committerDate = parse(committerDateStr, formatString, new Date());

  const currentDate = new Date();
  const daysAgo = differenceInDays(currentDate, committerDate);

  return daysAgo;
}

function calcOffset() {
  const weekday = new Date().getDay();

  switch (weekday) {
    case 0: // Sunday
      return 7;
    case 1: // Monday
      return 6;
    case 2: // Tuesday
      return 5;
    case 3: // Wednesday
      return 4;
    case 4: // Thursday
      return 3;
    case 5: // Friday
      return 2;
    case 6: // Saturday
      return 1;
    default:
      return 0; // Shouldn't reach here, but returning 0 as a fallback
  }
}

function printCommitsStats(commits) {
  const keys = Array.from(commits.keys()).sort((a, b) => a - b);
  console.log(keys);
  const cols = buildCols(keys, commits);
  printCells(cols);
}

function buildCols(keys, commits) {
  const cols = new Map();
  let col = [];

  for (const k of keys) {
    const week = Math.floor(k / 7); // 26, 25, ..., 1
    const dayInWeek = k % 7; // 0, 1, 2, 3, 4, 5, 6

    if (dayInWeek === 0) {
      // Reset on Sunday
      col = [];
    }

    col.push(commits.get(k));

    if (dayInWeek === 6) {
      // Saturday
      cols.set(week, col.slice()); // Add a copy of col to cols
    }
  }

  return cols;
}

function printCells(cols) {
  printMonths();
  for (let j = 6; j >= 0; j--) {
    for (let i = weeksInLastSixMonths + 1; i >= 0; i--) {
      if (i === weeksInLastSixMonths + 1) {
        printDayCol(j);
      }
      const col = cols.get(i);
      if (col) {
        // Special case for today
        if (i === 0 && j === calcOffset() - 1) {
          printCell(col[j], true);
          continue;
        } else {
          if (col.length > j) {
            printCell(col[j], false);
            continue;
          }
        }
      }
      printCell(0, false);
    }
    console.log(""); // Newline for each row
  }
}

function printMonths() {
  const week = new Date();
  week.setHours(0, 0, 0, 0);
  week.setDate(week.getDate() - daysInLastSixMonths);

  const months = new Set();
  let month = week.getMonth();

  process.stdout.write("         ");

  while (week <= new Date()) {
    if (week.getMonth() !== month) {
      process.stdout.write(
        week.toLocaleString("default", { month: "short" }).slice(0, 3) + " "
      );
      months.add(week.getMonth());
      month = week.getMonth();
    } else {
      process.stdout.write("    ");
    }

    week.setDate(week.getDate() + 7);
  }

  console.log(""); // Newline after printing months
}

function printDayCol(day) {
  let out = "     ";
  switch (day) {
    case 1:
      out = " Mon ";
      break;
    case 3:
      out = " Wed ";
      break;
    case 5:
      out = " Fri ";
      break;
  }
  console.log(out);
}

function printCell(val, today) {
  let escape = "\x1b[0;37;30m";
  switch (true) {
    case val > 0 && val < 5:
      escape = "\x1b[1;30;47m";
      break;
    case val >= 5 && val < 10:
      escape = "\x1b[1;30;43m";
      break;
    case val >= 10:
      escape = "\x1b[1;30;42m";
      break;
  }

  if (today) {
    escape = "\x1b[1;37;45m";
  }

  if (val === 0) {
    process.stdout.write(escape + "  - " + "\x1b[0m");
    return;
  }

  let str = "  %d ";
  if (val >= 10) {
    str = " %d ";
  } else if (val >= 100) {
    str = "%d ";
  }

  process.stdout.write(escape + str + "\x1b[0m", val);
}
