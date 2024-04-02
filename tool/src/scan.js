import fs from "fs";
import path from "path";
import os from "os";

export function scan(folder) {
  console.log("Found Folder: \n\n");
  let repositories = recursiveScanFolder(folder);
  const filePath = getDotFilePath();
  addNewSliceElementsToFile(filePath, repositories);
  console.log("Succesfully Added", filePath);
}

function recursiveScanFolder(folder) {
  return scanGitFolders([], folder);
}

function scanGitFolders(folders, folder) {
  folder = folder.replace(/\/$/, ""); // trim the last '/'
  const files = fs.readdirSync(folder);

  for (const file of files) {
    const filePath = path.join(folder, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (file === ".git") {
        folders.push(path.join(folder, file));
      } else if (file !== "vendor" && file !== "node_modules") {
        folders = scanGitFolders(folders, filePath);
      }
    }
  }

  return folders;
}

export function getDotFilePath() {
  const homeDir = os.homedir();
  const dotFile = path.join(homeDir, ".gogitlocalstats");
  return dotFile;
}

function addNewSliceElementsToFile(filePath, newRepos) {
  const existingRepos = parseFileLinesToSlice(filePath);
  const repos = joinSlices(newRepos, existingRepos);
  dumpStringsSliceToFile(repos, filePath);
}

export function parseFileLinesToSlice(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n").filter(Boolean);
  return lines;
}

function joinSlices(newSlice, existingSlice) {
  for (const newItem of newSlice) {
    if (!existingSlice.includes(newItem)) {
      existingSlice.push(newItem);
    }
  }
  return existingSlice;
}

function dumpStringsSliceToFile(repos, filePath) {
  const content = repos.join("\n");
  fs.writeFileSync(filePath, content, { mode: 0o755 });
}
