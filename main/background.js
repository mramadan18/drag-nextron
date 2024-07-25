import path from "path";
import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import fs from "node:fs";
import https from "node:https";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  const iconName = path.join(__dirname, "iconForDragAndDrop.png");
  const icon = fs.createWriteStream(iconName);

  // Create a new file to copy - you can also copy existing files.
  fs.writeFileSync(
    path.join(__dirname, "drag-and-drop-1.md"),
    "# First file to test drag and drop"
  );
  fs.writeFileSync(
    path.join(__dirname, "drag-and-drop-2.md"),
    "# Second file to test drag and drop"
  );

  https.get("https://img.icons8.com/ios/452/drag-and-drop.png", (response) => {
    response.pipe(icon);
  });

  ipcMain.on("ondragstart", (event, filePath) => {
    event.sender.startDrag({
      file: path.join(__dirname, filePath),
      icon: iconName,
    });
  });
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});
